"""
Settlement Service - Business logic for debt settlements
"""

import logging
from typing import List, Optional, Dict, Any
from datetime import datetime

from sqlalchemy import select, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.database import Settlement, Transaction, Group, Expense
from app.services.algorand_service import get_algorand_service
from app.utils.errors import (
    ValidationError,
    SmartContractError,
    ResourceNotFoundError,
    AuthorizationError,
    InsufficientFundsError
)

logger = logging.getLogger(__name__)


class SettlementService:
    """Service for managing settlements"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.algo_service = get_algorand_service()
    
    async def initiate_settlement(
        self,
        debtor_address: str,
        debtor_private_key: str,
        creditor_address: str,
        amount: int,
        note: str = "",
        expense_id: Optional[int] = None,
        group_id: Optional[int] = None
    ) -> Settlement:
        """
        Initiate a settlement intent on-chain.
        
        Args:
            debtor_address: Who owes money
            debtor_private_key: Debtor's private key for signing
            creditor_address: Who is owed money
            amount: Amount in microAlgos
            note: Settlement description
            expense_id: Related expense (optional)
            group_id: Related group (optional)
        
        Returns:
            Created Settlement model
        
        Raises:
            ValidationError: If validation fails
            SmartContractError: If on-chain transaction fails
        """
        try:
            # Validate amount
            if amount <= 0:
                raise ValidationError("Amount must be greater than 0")
            
            # Validate addresses
            if debtor_address == creditor_address:
                raise ValidationError("Debtor and creditor cannot be the same")
            
            # Get chain IDs
            chain_expense_id = 0
            chain_group_id = 0
            
            if expense_id:
                expense = await self._get_expense(expense_id)
                if expense:
                    chain_expense_id = expense.chain_expense_id
            
            if group_id:
                group = await self._get_group(group_id)
                if group:
                    chain_group_id = group.chain_group_id
            
            # Initiate settlement on-chain
            logger.info(
                f"Initiating settlement: debtor={debtor_address}, "
                f"creditor={creditor_address}, amount={amount}"
            )
            
            tx_result = await self.algo_service.initiate_settlement(
                debtor_address=debtor_address,
                debtor_private_key=debtor_private_key,
                expense_id=chain_expense_id,
                group_id=chain_group_id,
                creditor_address=creditor_address,
                amount=amount,
                note=note
            )
            
            # Extract settlement_id from logs
            chain_settlement_id = tx_result.decode_log(0)
            if not chain_settlement_id:
                raise SmartContractError("Failed to extract settlement_id from transaction")
            
            logger.info(
                f"Settlement initiated on-chain: settlement_id={chain_settlement_id}, "
                f"tx_id={tx_result.tx_id}"
            )
            
            # Create transaction record
            transaction = Transaction(
                transaction_id=tx_result.tx_id,
                block_number=tx_result.confirmed_round,
                transaction_type="initiate_settlement",
                metadata={
                    "settlement_id": chain_settlement_id,
                    "debtor": debtor_address,
                    "creditor": creditor_address,
                    "amount": amount,
                    "expense_id": chain_expense_id,
                    "group_id": chain_group_id
                }
            )
            self.db.add(transaction)
            await self.db.flush()
            
            # Create settlement record
            settlement = Settlement(
                chain_settlement_id=chain_settlement_id,
                from_address=debtor_address,
                to_address=creditor_address,
                amount=amount,
                status="pending",
                group_id=group_id,
                transaction_id=transaction.id
            )
            self.db.add(settlement)
            
            await self.db.commit()
            await self.db.refresh(settlement)
            
            logger.info(f"Settlement {settlement.id} created successfully in database")
            
            return settlement
            
        except (ValidationError, ResourceNotFoundError):
            await self.db.rollback()
            raise
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Failed to initiate settlement: {e}")
            raise SmartContractError(f"Failed to initiate settlement: {str(e)}")
    
    async def execute_settlement(
        self,
        settlement_id: int,
        debtor_address: str,
        debtor_private_key: str
    ) -> Settlement:
        """
        Execute a settlement via atomic transaction group [Payment, AppCall].
        
        Args:
            settlement_id: Database settlement ID
            debtor_address: Debtor's wallet address
            debtor_private_key: Debtor's private key for signing
        
        Returns:
            Updated Settlement model
        
        Raises:
            ResourceNotFoundError: If settlement not found
            AuthorizationError: If caller is not the debtor
            SmartContractError: If execution fails
        """
        try:
            # Get settlement
            settlement = await self.get_settlement(settlement_id)
            if not settlement:
                raise ResourceNotFoundError(f"Settlement {settlement_id} not found")
            
            # Verify caller is the debtor
            if settlement.from_address != debtor_address:
                raise AuthorizationError("Only the debtor can execute this settlement")
            
            # Check if already executed
            if settlement.status == "completed":
                raise ValidationError("Settlement already completed")
            
            # Check account balance
            balance = await self.algo_service.check_account_balance(debtor_address)
            min_required = settlement.amount + 1000  # Add fee buffer (1000 microAlgos)
            
            if balance < min_required:
                raise InsufficientFundsError(
                    f"Insufficient balance. Required: {min_required}, Available: {balance}",
                    details={
                        "required": min_required,
                        "available": balance,
                        "settlement_amount": settlement.amount
                    }
                )
            
            # Execute atomic transaction group on-chain
            logger.info(
                f"Executing settlement {settlement.id}: "
                f"from={settlement.from_address}, to={settlement.to_address}, "
                f"amount={settlement.amount}"
            )
            
            tx_result = await self.algo_service.execute_settlement(
                debtor_address=debtor_address,
                debtor_private_key=debtor_private_key,
                settlement_id=settlement.chain_settlement_id,
                creditor_address=settlement.to_address,
                amount=settlement.amount
            )
            
            logger.info(
                f"Settlement executed on-chain: "
                f"settlement_id={settlement.chain_settlement_id}, tx_id={tx_result.tx_id}"
            )
            
            # Create transaction record
            transaction = Transaction(
                transaction_id=tx_result.tx_id,
                block_number=tx_result.confirmed_round,
                transaction_type="execute_settlement",
                metadata={
                    "settlement_id": settlement.chain_settlement_id,
                    "amount": settlement.amount,
                    "debtor": settlement.from_address,
                    "creditor": settlement.to_address
                }
            )
            self.db.add(transaction)
            await self.db.flush()
            
            # Update settlement status
            settlement.status = "completed"
            settlement.executed_at = datetime.utcnow()
            settlement.execution_transaction_id = transaction.id
            
            await self.db.commit()
            await self.db.refresh(settlement)
            
            logger.info(f"Settlement {settlement.id} marked as completed")
            
            return settlement
            
        except (ValidationError, AuthorizationError, ResourceNotFoundError, InsufficientFundsError):
            await self.db.rollback()
            raise
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Failed to execute settlement: {e}")
            
            # Mark settlement as failed
            if settlement:
                settlement.status = "failed"
                await self.db.commit()
            
            raise SmartContractError(f"Failed to execute settlement: {str(e)}")
    
    async def get_settlement(self, settlement_id: int) -> Optional[Settlement]:
        """Get settlement by ID"""
        stmt = select(Settlement).where(Settlement.id == settlement_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()
    
    async def get_settlement_status(
        self,
        settlement_id: int
    ) -> Dict[str, Any]:
        """
        Get settlement status from both database and blockchain.
        
        Args:
            settlement_id: Database settlement ID
        
        Returns:
            Dict with status information
        """
        settlement = await self.get_settlement(settlement_id)
        if not settlement:
            raise ResourceNotFoundError(f"Settlement {settlement_id} not found")
        
        # Check on-chain status
        chain_executed = await self.algo_service.get_settlement_status(
            settlement.chain_settlement_id
        )
        
        return {
            "settlement_id": settlement.id,
            "chain_settlement_id": settlement.chain_settlement_id,
            "from_address": settlement.from_address,
            "to_address": settlement.to_address,
            "amount": settlement.amount,
            "amount_algos": settlement.amount / 1_000_000,
            "status": settlement.status,
            "chain_executed": chain_executed,
            "created_at": settlement.created_at.isoformat(),
            "executed_at": settlement.executed_at.isoformat() if settlement.executed_at else None
        }
    
    async def get_user_settlements(
        self,
        wallet_address: str,
        group_id: Optional[int] = None,
        status: Optional[str] = None,
        limit: int = 50
    ) -> List[Settlement]:
        """
        Get settlements involving a user.
        
        Args:
            wallet_address: User's wallet address
            group_id: Optional group filter
            status: Optional status filter (pending, completed, failed)
            limit: Max number of settlements
        
        Returns:
            List of Settlement models
        """
        conditions = [
            or_(
                Settlement.from_address == wallet_address,
                Settlement.to_address == wallet_address
            )
        ]
        
        if group_id:
            conditions.append(Settlement.group_id == group_id)
        
        if status:
            conditions.append(Settlement.status == status)
        
        stmt = (
            select(Settlement)
            .where(and_(*conditions))
            .order_by(Settlement.created_at.desc())
            .limit(limit)
        )
        
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
    
    async def calculate_optimal_settlements(
        self,
        group_id: int
    ) -> List[Dict[str, Any]]:
        """
        Calculate optimal settlement plan to minimize transactions.
        
        Uses balance simplification algorithm:
        1. Get all user balances
        2. Separate creditors (owed) and debtors (owe)
        3. Match largest creditor with largest debtor iteratively
        
        Args:
            group_id: Database group ID
        
        Returns:
            List of optimal settlement transactions
        """
        try:
            group = await self._get_group(group_id)
            if not group:
                raise ResourceNotFoundError(f"Group {group_id} not found")
            
            # Get all members
            from app.models.database import GroupMember
            
            stmt = select(GroupMember).where(GroupMember.group_id == group_id)
            result = await self.db.execute(stmt)
            members = result.scalars().all()
            
            # Get balances for all members
            balances = {}
            for member in members:
                balance = await self.algo_service.get_user_balance(
                    group_id=group.chain_group_id,
                    user_address=member.wallet_address
                )
                if balance != 0:
                    balances[member.wallet_address] = balance
            
            # Separate creditors and debtors
            creditors = {addr: bal for addr, bal in balances.items() if bal > 0}
            debtors = {addr: -bal for addr, bal in balances.items() if bal < 0}
            
            # Calculate optimal settlements
            settlements = []
            
            while creditors and debtors:
                # Get largest creditor and debtor
                max_creditor = max(creditors, key=creditors.get)
                max_debtor = max(debtors, key=debtors.get)
                
                max_credit = creditors[max_creditor]
                max_debt = debtors[max_debtor]
                
                # Settlement amount is minimum of the two
                settlement_amount = min(max_credit, max_debt)
                
                settlements.append({
                    "from_address": max_debtor,
                    "to_address": max_creditor,
                    "amount": settlement_amount,
                    "amount_algos": settlement_amount / 1_000_000
                })
                
                # Update balances
                creditors[max_creditor] -= settlement_amount
                debtors[max_debtor] -= settlement_amount
                
                # Remove if settled
                if creditors[max_creditor] == 0:
                    del creditors[max_creditor]
                if debtors[max_debtor] == 0:
                    del debtors[max_debtor]
            
            logger.info(
                f"Calculated {len(settlements)} optimal settlements for group {group_id}"
            )
            
            return settlements
            
        except Exception as e:
            logger.error(f"Failed to calculate optimal settlements: {e}")
            raise
    
    # Helper methods
    
    async def _get_group(self, group_id: int) -> Optional[Group]:
        """Get group by ID"""
        result = await self.db.execute(
            select(Group).where(Group.id == group_id)
        )
        return result.scalar_one_or_none()
    
    async def _get_expense(self, expense_id: int) -> Optional[Expense]:
        """Get expense by ID"""
        result = await self.db.execute(
            select(Expense).where(Expense.id == expense_id)
        )
        return result.scalar_one_or_none()
