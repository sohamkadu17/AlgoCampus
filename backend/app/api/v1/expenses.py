"""
Expenses API endpoints
Track and manage group expenses
"""

import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, Request

from sqlalchemy.ext.asyncio import AsyncSession
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.models.schemas import (
    ExpenseCreate,
    Expense,
    ExpenseWithSplits,
    ExpenseListResponse
)
from app.services.expense import ExpenseService
from app.db.session import get_db
from app.api.dependencies import get_current_user_address, get_private_key_from_header
from app.utils.errors import (
    ValidationError,
    ResourceNotFoundError,
    SmartContractError
)

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)
logger = logging.getLogger(__name__)


@router.post("", response_model=Expense)
@limiter.limit("20/minute")
async def create_expense(
    request: Request,
    expense_data: ExpenseCreate,
    db: AsyncSession = Depends(get_db),
    user_address: str = Depends(get_current_user_address),
    private_key: str = Depends(get_private_key_from_header)
):
    """
    Create a new expense and record it on-chain.
    
    Requires:
    - Bearer token (JWT) in Authorization header
    - X-Private-Key header with user's private key (for signing)
    
    The expense will be added to the ExpenseTracker smart contract
    and recorded in the database.
    """
    try:
        expense_service = ExpenseService(db)
        
        # Determine split participants
        if expense_data.split_type == "equal":
            # User must provide split_with addresses in description or separately
            # For now, we'll use all group members (implement logic to get members)
            split_with = [user_address]  # TODO: Get from group members
        else:
            # Custom split - extract addresses from splits
            split_with = [split.wallet_address for split in expense_data.splits]
        
        # Ensure payer is in split
        if user_address not in split_with:
            split_with.append(user_address)
        
        expense = await expense_service.create_expense(
            group_id=expense_data.group_id,
            payer_address=user_address,
            payer_private_key=private_key,
            amount=expense_data.amount,
            description=expense_data.description,
            split_with=split_with,
            split_type=expense_data.split_type
        )
        
        return expense
        
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except SmartContractError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to create expense: {e}")
        raise HTTPException(status_code=500, detail="Failed to create expense")


@router.get("", response_model=ExpenseListResponse)
async def list_expenses(
    group_id: int = Query(..., description="Group ID to filter expenses"),
    include_settled: bool = Query(True, description="Include settled expenses"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    user_address: str = Depends(get_current_user_address)
):
    """
    List expenses with filtering and pagination.
    
    Filters:
    - group_id: Filter by group (required)
    - include_settled: Include settled expenses (default: true)
    - page: Page number (1-indexed)
    - page_size: Items per page (max 100)
    """
    expense_service = ExpenseService(db)
    
    offset = (page - 1) * page_size
    
    expenses = await expense_service.get_group_expenses(
        group_id=group_id,
        include_settled=include_settled,
        limit=page_size,
        offset=offset
    )
    
    return ExpenseListResponse(
        expenses=expenses,
        total=len(expenses),  # TODO: Get actual count
        page=page,
        page_size=page_size
    )


@router.get("/{expense_id}", response_model=ExpenseWithSplits)
async def get_expense(
    expense_id: int,
    db: AsyncSession = Depends(get_db),
    user_address: str = Depends(get_current_user_address)
):
    """
    Get expense details including splits.
    
    Returns full expense information with all split details.
    """
    expense_service = ExpenseService(db)
    
    expense = await expense_service.get_expense(expense_id)
    if not expense:
        raise HTTPException(status_code=404, detail=f"Expense {expense_id} not found")
    
    return expense


@router.get("/group/{group_id}/balance")
async def get_user_balance_in_group(
    group_id: int,
    db: AsyncSession = Depends(get_db),
    user_address: str = Depends(get_current_user_address)
):
    """
    Get user's balance in a group.
    
    Returns:
    - balance: Net balance in microAlgos (positive = owed, negative = owes)
    - balance_algos: Balance in ALGO
    - status: "owed", "owes", or "settled"
    """
    expense_service = ExpenseService(db)
    
    try:
        balance_info = await expense_service.get_user_balance(
            group_id=group_id,
            user_address=user_address
        )
        return balance_info
        
    except ResourceNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to get user balance: {e}")
        raise HTTPException(status_code=500, detail="Failed to get balance")


@router.post("/{expense_id}/settle")
async def mark_expense_settled(
    expense_id: int,
    db: AsyncSession = Depends(get_db),
    user_address: str = Depends(get_current_user_address)
):
    """
    Mark an expense as settled.
    
    This is typically called after all settlements related to
    this expense have been executed on-chain.
    """
    expense_service = ExpenseService(db)
    
    try:
        expense = await expense_service.mark_expense_settled(
            expense_id=expense_id,
            settled_by_address=user_address
        )
        return {"status": "success", "expense": expense}
        
    except ResourceNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error (f"Failed to mark expense settled: {e}")
        raise HTTPException(status_code=500, detail="Failed to mark expense settled")

