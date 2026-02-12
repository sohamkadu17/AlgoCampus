"""
Group Management Service
Business logic for group operations
"""

from typing import Optional
from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession
from algosdk.v2client import algod
from algosdk import transaction, account, encoding

from app.config import settings
from app.models import database as db_models


class GroupService:
    """Service for managing groups"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        
        # Initialize Algorand client
        self.algod_client = algod.AlgodClient(
            settings.ALGORAND_ALGOD_TOKEN,
            settings.ALGORAND_ALGOD_URL
        )
        
    async def create_group(
        self,
        name: str,
        description: str,
        admin_address: str
    ) -> db_models.Group:
        """
        Create a new group
        
        Steps:
        1. Call smart contract to create on-chain group
        2. Store in database with chain_group_id
        3. Add creator as admin member
        """
        # TODO: Implement smart contract call
        # For now, using auto-incremented chain_group_id
        # In production, this would call GroupManager.create_group()
        
        max_id_result = await self.db.execute(
            select(func.coalesce(func.max(db_models.Group.chain_group_id), 0))
        )
        chain_group_id = max_id_result.scalar() + 1
        
        # Create database record
        group = db_models.Group(
            chain_group_id=chain_group_id,
            name=name,
            description=description,
            admin_address=admin_address,
            active=True
        )
        
        self.db.add(group)
        await self.db.flush()  # Get group.id
        
        # Add creator as admin member
        member = db_models.GroupMember(
            group_id=group.id,
            wallet_address=admin_address,
            role="admin"
        )
        
        self.db.add(member)
        
        # Initialize balance for creator
        balance = db_models.Balance(
            group_id=group.id,
            wallet_address=admin_address,
            balance=0
        )
        
        self.db.add(balance)
        
        await self.db.commit()
        await self.db.refresh(group)
        
        return group
        
    async def add_member(
        self,
        group_id: int,
        member_address: str,
        admin_address: str
    ) -> None:
        """
        Add a member to a group
        
        Requires:
        - admin_address must be group admin
        - member_address not already in group
        """
        # Get group
        group_query = select(db_models.Group).where(db_models.Group.id == group_id)
        group_result = await self.db.execute(group_query)
        group = group_result.scalar_one_or_none()
        
        if not group:
            raise ValueError("Group not found")
            
        # Check admin permission
        if group.admin_address != admin_address:
            raise PermissionError("Only group admin can add members")
            
        # Check if already a member
        member_query = select(db_models.GroupMember).where(
            and_(
                db_models.GroupMember.group_id == group_id,
                db_models.GroupMember.wallet_address == member_address
            )
        )
        existing_result = await self.db.execute(member_query)
        if existing_result.scalar_one_or_none():
            raise ValueError("Already a member")
            
        # TODO: Call smart contract GroupManager.add_member()
        
        # Add to database
        member = db_models.GroupMember(
            group_id=group_id,
            wallet_address=member_address,
            role="member"
        )
        
        self.db.add(member)
        
        # Initialize balance
        balance = db_models.Balance(
            group_id=group_id,
            wallet_address=member_address,
            balance=0
        )
        
        self.db.add(balance)
        
        await self.db.commit()
        
    async def remove_member(
        self,
        group_id: int,
        member_address: str,
        admin_address: str
    ) -> None:
        """
        Remove a member from a group
        
        Requires:
        - admin_address must be group admin
        - member_address cannot be admin
        """
        # Get group
        group_query = select(db_models.Group).where(db_models.Group.id == group_id)
        group_result = await self.db.execute(group_query)
        group = group_result.scalar_one_or_none()
        
        if not group:
            raise ValueError("Group not found")
            
        # Check admin permission
        if group.admin_address != admin_address:
            raise PermissionError("Only group admin can remove members")
            
        # Cannot remove admin
        if member_address == group.admin_address:
            raise ValueError("Cannot remove group admin")
            
        # Get member
        member_query = select(db_models.GroupMember).where(
            and_(
                db_models.GroupMember.group_id == group_id,
                db_models.GroupMember.wallet_address == member_address
            )
        )
        member_result = await self.db.execute(member_query)
        member = member_result.scalar_one_or_none()
        
        if not member:
            raise ValueError("Not a member")
            
        # TODO: Call smart contract GroupManager.remove_member()
        
        # Remove from database
        await self.db.delete(member)
        await self.db.commit()
        
    async def get_balances(self, group_id: int) -> dict:
        """
        Get all member balances for a group
        
        Returns dict of {wallet_address: balance}
        """
        balances_query = select(db_models.Balance).where(
            db_models.Balance.group_id == group_id
        )
        balances_result = await self.db.execute(balances_query)
        balances = balances_result.scalars().all()
        
        return {
            balance.wallet_address: balance.balance
            for balance in balances
        }
