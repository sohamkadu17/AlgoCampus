"""
Groups API endpoints
Create and manage expense split groups
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.auth import get_current_user_address
from app.db.session import get_db
from app.models import database as db_models
from app.models.schemas import (
    Group, GroupCreate, GroupUpdate, GroupWithMembers,
    GroupMemberAdd, GroupBalance
)
from app.services.group import GroupService
from slowapi import Limiter
from slowapi.util import get_remote_address

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.post("", response_model=Group, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
async def create_group(
    request: Request,
    group: GroupCreate,
    db: AsyncSession = Depends(get_db),
    user_address: str = Depends(get_current_user_address)
):
    """
    Create a new expense split group
    
    Creates both on-chain (smart contract) and off-chain (database) records.
    The user becomes the group admin.
    """
    group_service = GroupService(db)
    
    try:
        created_group = await group_service.create_group(
            name=group.name,
            description=group.description,
            admin_address=user_address
        )
        return created_group
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create group: {str(e)}"
        )


@router.get("", response_model=List[GroupWithMembers])
async def list_groups(
    db: AsyncSession = Depends(get_db),
    user_address: str = Depends(get_current_user_address),
    active_only: bool = Query(True, description="Filter to active groups only")
):
    """
    List all groups the user is a member of
    """
    # Query groups where user is a member
    query = select(db_models.Group).join(
        db_models.GroupMember
    ).where(
        db_models.GroupMember.wallet_address == user_address
    )
    
    if active_only:
        query = query.where(db_models.Group.active == True)
    
    result = await db.execute(query)
    groups = result.scalars().all()
    
    # Add members to each group
    groups_with_members = []
    for group in groups:
        members_query = select(db_models.GroupMember.wallet_address).where(
            db_models.GroupMember.group_id == group.id
        )
        members_result = await db.execute(members_query)
        members = [m[0] for m in members_result.all()]
        
        group_dict = {
            "id": group.id,
            "chain_group_id": group.chain_group_id,
            "name": group.name,
            "description": group.description,
            "admin_address": group.admin_address,
            "created_at": group.created_at,
            "updated_at": group.updated_at,
            "active": group.active,
            "members": members
        }
        groups_with_members.append(group_dict)
    
    return groups_with_members


@router.get("/{group_id}", response_model=GroupWithMembers)
async def get_group(
    group_id: int,
    db: AsyncSession = Depends(get_db),
    user_address: str = Depends(get_current_user_address)
):
    """
    Get details of a specific group
    """
    # Check if user is a member
    member_query = select(db_models.GroupMember).where(
        and_(
            db_models.GroupMember.group_id == group_id,
            db_models.GroupMember.wallet_address == user_address
        )
    )
    member_result = await db.execute(member_query)
    if not member_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this group"
        )
    
    # Get group
    group_query = select(db_models.Group).where(db_models.Group.id == group_id)
    group_result = await db.execute(group_query)
    group = group_result.scalar_one_or_none()
    
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )
    
    # Get members
    members_query = select(db_models.GroupMember.wallet_address).where(
        db_models.GroupMember.group_id == group_id
    )
    members_result = await db.execute(members_query)
    members = [m[0] for m in members_result.all()]
    
    return {
        "id": group.id,
        "chain_group_id": group.chain_group_id,
        "name": group.name,
        "description": group.description,
        "admin_address": group.admin_address,
        "created_at": group.created_at,
        "updated_at": group.updated_at,
        "active": group.active,
        "members": members
    }


@router.patch("/{group_id}", response_model=Group)
async def update_group(
    group_id: int,
    group_update: GroupUpdate,
    db: AsyncSession = Depends(get_db),
    user_address: str = Depends(get_current_user_address)
):
    """
    Update group metadata (admin only)
    """
    # Get group
    group_query = select(db_models.Group).where(db_models.Group.id == group_id)
    group_result = await db.execute(group_query)
    group = group_result.scalar_one_or_none()
    
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )
    
    # Check if user is admin
    if group.admin_address != user_address:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only group admin can update group"
        )
    
    # Update fields
    if group_update.name is not None:
        group.name = group_update.name
    if group_update.description is not None:
        group.description = group_update.description
    
    await db.commit()
    await db.refresh(group)
    
    return group


@router.post("/{group_id}/members", status_code=status.HTTP_201_CREATED)
@limiter.limit("20/minute")
async def add_member(
    request: Request,
    group_id: int,
    member: GroupMemberAdd,
    db: AsyncSession = Depends(get_db),
    user_address: str = Depends(get_current_user_address)
):
    """
    Add a member to the group (admin only)
    
    Executes both on-chain (smart contract) and off-chain (database) updates.
    """
    group_service = GroupService(db)
    
    try:
        await group_service.add_member(
            group_id=group_id,
            member_address=member.wallet_address,
            admin_address=user_address
        )
        return {"message": "Member added successfully"}
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


@router.delete("/{group_id}/members/{wallet_address}")
async def remove_member(
    group_id: int,
    wallet_address: str,
    db: AsyncSession = Depends(get_db),
    user_address: str = Depends(get_current_user_address)
):
    """
    Remove a member from the group (admin only)
    """
    group_service = GroupService(db)
    
    try:
        await group_service.remove_member(
            group_id=group_id,
            member_address=wallet_address,
            admin_address=user_address
        )
        return {"message": "Member removed successfully"}
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


@router.get("/{group_id}/balances", response_model=List[GroupBalance])
async def get_group_balances(
    group_id: int,
    db: AsyncSession = Depends(get_db),
    user_address: str = Depends(get_current_user_address)
):
    """
    Get current balances for all members in the group
    
    Returns who owes whom. Positive balance = owed to them, negative = they owe.
    """
    # Check if user is a member
    member_query = select(db_models.GroupMember).where(
        and_(
            db_models.GroupMember.group_id == group_id,
            db_models.GroupMember.wallet_address == user_address
        )
    )
    member_result = await db.execute(member_query)
    if not member_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this group"
        )
    
    # Get balances from cache
    balances_query = select(db_models.Balance).where(
        db_models.Balance.group_id == group_id
    )
    balances_result = await db.execute(balances_query)
    balances = balances_result.scalars().all()
    
    # Format response
    return [
        {
            "wallet_address": balance.wallet_address,
            "balance": balance.balance,
            "formatted_balance": f"{balance.balance / 1_000_000:.6f} ALGO"
        }
        for balance in balances
    ]


@router.delete("/{group_id}")
async def deactivate_group(
    group_id: int,
    db: AsyncSession = Depends(get_db),
    user_address: str = Depends(get_current_user_address)
):
    """
    Deactivate a group (admin only)
    
    Does not delete data, just marks as inactive.
    """
    # Get group
    group_query = select(db_models.Group).where(db_models.Group.id == group_id)
    group_result = await db.execute(group_query)
    group = group_result.scalar_one_or_none()
    
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )
    
    # Check if user is admin
    if group.admin_address != user_address:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only group admin can deactivate group"
        )
    
    # Deactivate
    group.active = False
    await db.commit()
    
    return {"message": "Group deactivated successfully"}
