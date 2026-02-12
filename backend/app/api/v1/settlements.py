"""
Settlements API endpoints
Execute and track debt settlements
"""

import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request

from sqlalchemy.ext.asyncio import AsyncSession
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.models.schemas import (
    SettlementInitiate,
    Settlement,
    SettlementPlan
)
from app.services.settlement import SettlementService
from app.db.session import get_db
from app.api.dependencies import get_current_user_address, get_private_key_from_header
from app.utils.errors import (
    ValidationError,
    ResourceNotFoundError,
    AuthorizationError,
    SmartContractError,
    InsufficientFundsError
)

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)
logger = logging.getLogger(__name__)


@router.post("/initiate", response_model=Settlement)
@limiter.limit("10/minute")
async def initiate_settlement(
    request: Request,
    settlement_data: SettlementInitiate,
    db: AsyncSession = Depends(get_db),
    user_address: str = Depends(get_current_user_address),
    private_key: str = Depends(get_private_key_from_header)
):
    """
    Initiate a settlement intent on-chain.
    
    This creates a settlement record but does NOT execute the payment.
    Use the /execute endpoint to actually send funds.
    
    Requires:
    - Bearer token (JWT) in Authorization header
    - X-Private-Key header with debtor's private key
    
    The debtor must match the authenticated user.
    """
    try:
        # Verify user is the debtor
        if settlement_data.from_address != user_address:
            raise HTTPException(
                status_code=403,
                detail="Can only initiate settlements from your own address"
            )
        
        settlement_service = SettlementService(db)
        
        settlement = await settlement_service.initiate_settlement(
            debtor_address=settlement_data.from_address,
            debtor_private_key=private_key,
            creditor_address=settlement_data.to_address,
            amount=settlement_data.amount,
            note=f"Settlement from {user_address[:8]}... to {settlement_data.to_address[:8]}...",
            expense_id=settlement_data.expense_id
        )
        
        return settlement
        
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except SmartContractError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to initiate settlement: {e}")
        raise HTTPException(status_code=500, detail="Failed to initiate settlement")


@router.post("/execute/{settlement_id}", response_model=Settlement)
@limiter.limit("5/minute")
async def execute_settlement(
    request: Request,
    settlement_id: int,
    db: AsyncSession = Depends(get_db),
    user_address: str = Depends(get_current_user_address),
    private_key: str = Depends(get_private_key_from_header)
):
    """
    Execute a settlement via atomic transaction [Payment, AppCall].
    
    CRITICAL: This actually sends funds on-chain.
    
    Requirements:
    - Settlement must be in "pending" status
    - User must be the debtor
    - Account must have sufficient balance
    
    The atomic group ensures either both transactions succeed or both fail.
    """
    try:
        settlement_service = SettlementService(db)
        
        settlement = await settlement_service.execute_settlement(
            settlement_id=settlement_id,
            debtor_address=user_address,
            debtor_private_key=private_key
        )
        
        return settlement
        
    except ResourceNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except AuthorizationError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except InsufficientFundsError as e:
        raise HTTPException(status_code=402, detail=str(e))
    except SmartContractError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to execute settlement: {e}")
        raise HTTPException(status_code=500, detail="Failed to execute settlement")


@router.get("/calculate/{group_id}", response_model=SettlementPlan)
async def calculate_optimal_settlements(
    group_id: int,
    db: AsyncSession = Depends(get_db),
    user_address: str = Depends(get_current_user_address)
):
    """
    Calculate optimal settlement plan for a group.
    
    Uses balance simplification algorithm to minimize
    the number of transactions needed to settle all debts.
    
    Returns a list of settlements that will fully settle
    all balances in the group.
    """
    settlement_service = SettlementService(db)
    
    try:
        settlements = await settlement_service.calculate_optimal_settlements(
            group_id=group_id
        )
        
        total_amount = sum(s["amount"] for s in settlements)
        
        return SettlementPlan(
            settlements=[
                SettlementInitiate(
                    from_address=s["from_address"],
                    to_address=s["to_address"],
                    amount=s["amount"]
                )
                for s in settlements
            ],
            total_transactions=len(settlements),
            total_amount=total_amount
        )
        
    except ResourceNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to calculate settlements: {e}")
        raise HTTPException(status_code=500, detail="Failed to calculate settlements")


@router.get("", response_model=List[Settlement])
async def list_settlements(
    group_id: Optional[int] = Query(None, description="Filter by group"),
    status: Optional[str] = Query(None, description="Filter by status (pending/completed/failed)"),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    user_address: str = Depends(get_current_user_address)
):
    """
    List settlements for the authenticated user.
    
    Returns settlements where the user is either the debtor or creditor.
    
    Filters:
    - group_id: Filter by group
    - status: Filter by settlement status
    - limit: Max number of results (default: 50, max: 100)
    """
    settlement_service = SettlementService(db)
    
    settlements = await settlement_service.get_user_settlements(
        wallet_address=user_address,
        group_id=group_id,
        status=status,
        limit=limit
    )
    
    return settlements


@router.get("/{settlement_id}")
async def get_settlement_status(
    settlement_id: int,
    db: AsyncSession = Depends(get_db),
    user_address: str = Depends(get_current_user_address)
):
    """
    Get settlement status from both database and blockchain.
    
    Returns detailed information about a settlement including:
    - Database status
    - On-chain execution status
    - Amount and parties
    - Timestamps
    """
    settlement_service = SettlementService(db)
    
    try:
        status_info = await settlement_service.get_settlement_status(
            settlement_id=settlement_id
        )
        return status_info
        
    except ResourceNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to get settlement status: {e}")
        raise HTTPException(status_code=500, detail="Failed to get settlement status")

