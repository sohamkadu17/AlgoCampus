"""
Expense Service - Business logic for expense management
"""

import logging
from typing import List, Optional, Dict, Any
from datetime import datetime

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.database import Expense, ExpenseSplit, Transaction, Group, User
from app.services.algorand_service import get_algorand_service, TransactionResult
from app.utils.errors import (
    ValidationError,
    SmartContractError,
    ResourceNotFoundError,
    AuthorizationError
)

logger = logging.getLogger(__name__)


class ExpenseService:
    """Service for managing expenses"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.algo_service = get_algorand_service()
    
    async def create_expense(
        self,
        group_id: int,
        payer_address: str,
        payer_private_key: str,
        amount: int,
        description: str,
        split_with: List[str],
        split_type: str = "equal"
    ) -> Expense:
        """
        Create a new expense and record it on-chain.
        
        Args:
            group_id: Database group ID
            payer_address: Who paid the expense
            payer_private_key: Payer's private key for signing
            amount: Amount in microAlgos
            description: Expense description
            split_with: List of member addresses to split with (includes payer)
            split_type: "equal" or "custom"
        
        Returns:
            Created Expense model
        
        Raises:
            ValidationError: If validation fails
            SmartContractError: If on-chain transaction fails
        """
        try:
            # Validate group exists
            group = await self._get_group(group_id)
            if not group:
                raise ResourceNotFoundError(f"Group {group_id} not found")
            
            # Validate payer is a member
            if not await self._is_member(group_id, payer_address):
                raise AuthorizationError(
                    f"Address {payer_address} is not a member of group {group_id}"
                )
            
            # Validate amount
            if amount <= 0:
                raise ValidationError("Amount must be greater than 0")
            
            # Validate split_with list
            if not split_with or payer_address not in split_with:
                raise ValidationError(
                    "split_with must include the payer and at least one other member"
                )
            
            # Add expense on-chain
            logger.info(
                f"Adding expense: group_id={group.chain_group_id}, "
                f"amount={amount}, split_with={len(split_with)} members"
            )
            
            tx_result = await self.algo_service.add_expense(
                payer_address=payer_address,
                payer_private_key=payer_private_key,
                group_id=group.chain_group_id,
                amount=amount,
                note=description,
                split_with=split_with
            )
            
            # Extract expense_id from logs
            chain_expense_id = tx_result.decode_log(0)
            if not chain_expense_id:
                raise SmartContractError("Failed to extract expense_id from transaction")
            
            logger.info(
                f"Expense added on-chain: expense_id={chain_expense_id}, "
                f"tx_id={tx_result.tx_id}"
            )
            
            # Create transaction record
            transaction = Transaction(
                transaction_id=tx_result.tx_id,
                block_number=tx_result.confirmed_round,
                transaction_type="add_expense",
                metadata={
                    "expense_id": chain_expense_id,
                    "group_id": group.chain_group_id,
                    "amount": amount,
                    "split_count": len(split_with)
                }
            )
            self.db.add(transaction)
            await self.db.flush()
            
            # Create expense record
            expense = Expense(
                chain_expense_id=chain_expense_id,
                group_id=group_id,
                amount=amount,
                description=description,
                payer_address=payer_address,
                split_type=split_type,
                settled=False,
                transaction_id=transaction.id
            )
            self.db.add(expense)
            await self.db.flush()
            
            # Calculate and create splits
            split_amount = amount // len(split_with)
            remainder = amount % len(split_with)
            
            for idx, member_address in enumerate(split_with):
                # Give remainder to first person (payer)
                member_split = split_amount + (remainder if idx == 0 else 0)
                
                split = ExpenseSplit(
                    expense_id=expense.id,
                    wallet_address=member_address,
                    amount=member_split,
                    settled=False
                )
                self.db.add(split)
            
            await self.db.commit()
            await self.db.refresh(expense)
            
            logger.info(f"Expense {expense.id} created successfully in database")
            
            return expense
            
        except (ValidationError, AuthorizationError, ResourceNotFoundError):
            await self.db.rollback()
            raise
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Failed to create expense: {e}")
            raise SmartContractError(f"Failed to create expense: {str(e)}")
    
    async def get_expense(self, expense_id: int) -> Optional[Expense]:
        """Get expense by ID with splits"""
        stmt = (
            select(Expense)
            .options(selectinload(Expense.splits))
            .where(Expense.id == expense_id)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()
    
    async def get_group_expenses(
        self,
        group_id: int,
        include_settled: bool = True,
        limit: int = 50,
        offset: int = 0
    ) -> List[Expense]:
        """
        Get all expenses for a group.
        
        Args:
            group_id: Database group ID
            include_settled: Include settled expenses
            limit: Max number of expenses to return
            offset: Pagination offset
        
        Returns:
            List of Expense models
        """
        conditions = [Expense.group_id == group_id]
        
        if not include_settled:
            conditions.append(Expense.settled is False)
        
        stmt = (
            select(Expense)
            .where(and_(*conditions))
            .options(selectinload(Expense.splits))
            .order_by(Expense.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
    
    async def get_user_expenses(
        self,
        wallet_address: str,
        group_id: Optional[int] = None,
        limit: int = 50
    ) -> List[Expense]:
        """
        Get expenses involving a specific user.
        
        Args:
            wallet_address: User's wallet address
            group_id: Optional group filter
            limit: Max number of expenses
        
        Returns:
            List of Expense models
        """
        # Query via ExpenseSplit join
        stmt = (
            select(Expense)
            .join(ExpenseSplit)
            .where(ExpenseSplit.wallet_address == wallet_address)
            .options(selectinload(Expense.splits))
        )
        
        if group_id:
            stmt = stmt.where(Expense.group_id == group_id)
        
        stmt = stmt.order_by(Expense.created_at.desc()).limit(limit)
        
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
    
    async def get_user_balance(
        self,
        group_id: int,
        user_address: str
    ) -> Dict[str, Any]:
        """
        Get user's balance in a group from the smart contract.
        
        Args:
            group_id: Database group ID
            user_address: User's wallet address
        
        Returns:
            Dict with balance information
        """
        try:
            group = await self._get_group(group_id)
            if not group:
                raise ResourceNotFoundError(f"Group {group_id} not found")
            
            # Get balance from contract
            balance = await self.algo_service.get_user_balance(
                group_id=group.chain_group_id,
                user_address=user_address
            )
            
            return {
                "group_id": group_id,
                "wallet_address": user_address,
                "balance": balance,
                "balance_algos": balance / 1_000_000,
                "status": "owed" if balance > 0 else "owes" if balance < 0 else "settled"
            }
            
        except Exception as e:
            logger.error(f"Failed to get user balance: {e}")
            raise
    
    async def mark_expense_settled(
        self,
        expense_id: int,
        settled_by_address: str
    ) -> Expense:
        """
        Mark an expense as settled.
        
        Args:
            expense_id: Expense ID to settle
            settled_by_address: Address that confirmed settlement
        
        Returns:
            Updated Expense model
        """
        expense = await self.get_expense(expense_id)
        if not expense:
            raise ResourceNotFoundError(f"Expense {expense_id} not found")
        
        expense.settled = True
        
        # Mark all splits as settled
        for split in expense.splits:
            split.settled = True
        
        await self.db.commit()
        await self.db.refresh(expense)
        
        logger.info(f"Expense {expense_id} marked as settled by {settled_by_address}")
        
        return expense
    
    # Helper methods
    
    async def _get_group(self, group_id: int) -> Optional[Group]:
        """Get group by ID"""
        result = await self.db.execute(
            select(Group).where(Group.id == group_id)
        )
        return result.scalar_one_or_none()
    
    async def _is_member(self, group_id: int, wallet_address: str) -> bool:
        """Check if user is a member of the group"""
        from app.models.database import GroupMember
        
        stmt = select(GroupMember).where(
            and_(
                GroupMember.group_id == group_id,
                GroupMember.wallet_address == wallet_address
            )
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none() is not None
