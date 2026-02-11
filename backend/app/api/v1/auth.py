"""
Authentication API endpoints
Wallet-based authentication with signature verification
"""

import secrets
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from jose import JWTError, jwt
from algosdk import encoding, mnemonic
from algosdk.error import WrongChecksumError

from app.config import settings
from app.services.auth import AuthService
from app.models.schemas import User, UserCreate


router = APIRouter()
security = HTTPBearer()
auth_service = AuthService()


# Request/Response Models

class ChallengeRequest(BaseModel):
    wallet_address: str = Field(..., description="Algorand wallet address")


class ChallengeResponse(BaseModel):
    nonce: str = Field(..., description="Random nonce to sign")
    message: str = Field(..., description="Message to sign with wallet")
    expires_at: datetime = Field(..., description="Challenge expiration time")


class VerifyRequest(BaseModel):
    wallet_address: str = Field(..., description="Algorand wallet address")
    signature: str = Field(..., description="Base64 encoded signature")
    nonce: str = Field(..., description="Nonce from challenge")


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class RefreshRequest(BaseModel):
    refresh_token: str


# Endpoints

@router.post("/challenge", response_model=ChallengeResponse)
async def get_challenge(request: ChallengeRequest):
    """
    Get authentication challenge for wallet
    
    Returns a nonce that must be signed by the wallet's private key
    """
    try:
        # Validate Algorand address format
        encoding.decode_address(request.wallet_address)
    except (ValueError, WrongChecksumError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Algorand address"
        )
    
    # Generate challenge
    nonce, message, expires_at = await auth_service.generate_challenge(
        request.wallet_address
    )
    
    return ChallengeResponse(
        nonce=nonce,
        message=message,
        expires_at=expires_at
    )


@router.post("/verify", response_model=TokenResponse)
async def verify_signature(request: VerifyRequest):
    """
    Verify wallet signature and return JWT tokens
    
    The signature must be created by signing the challenge message
    with the wallet's private key
    """
    try:
        # Validate address
        encoding.decode_address(request.wallet_address)
    except (ValueError, WrongChecksumError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Algorand address"
        )
    
    # Verify signature
    is_valid = await auth_service.verify_signature(
        wallet_address=request.wallet_address,
        signature=request.signature,
        nonce=request.nonce
    )
    
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid signature or expired challenge"
        )
    
    # Generate tokens
    access_token = auth_service.create_access_token(request.wallet_address)
    refresh_token = auth_service.create_refresh_token(request.wallet_address)
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(request: RefreshRequest):
    """
    Refresh access token using refresh token
    """
    try:
        # Decode refresh token
        payload = jwt.decode(
            request.refresh_token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        wallet_address: str = payload.get("sub")
        token_type: str = payload.get("type")
        
        if wallet_address is None or token_type != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
            
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )
    
    # Generate new tokens
    access_token = auth_service.create_access_token(wallet_address)
    refresh_token = auth_service.create_refresh_token(wallet_address)
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )


@router.get("/me", response_model=User)
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Get current authenticated user info
    """
    try:
        # Decode JWT
        payload = jwt.decode(
            credentials.credentials,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        wallet_address: str = payload.get("sub")
        token_type: str = payload.get("type")
        
        if wallet_address is None or token_type != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
            
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    return User(
        wallet_address=wallet_address,
        created_at=datetime.utcnow(),
        last_login=datetime.utcnow()
    )


# Dependency for protected routes
async def get_current_user_address(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> str:
    """
    Dependency to extract wallet address from JWT
    Use in protected endpoints: user: str = Depends(get_current_user_address)
    """
    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        wallet_address: str = payload.get("sub")
        token_type: str = payload.get("type")
        
        if wallet_address is None or token_type != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
            
        return wallet_address
        
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
