"""
API dependencies
Reusable dependency functions for FastAPI endpoints
"""

from fastapi import Header, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt

from app.config import settings

security = HTTPBearer()


async def get_current_user_address(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> str:
    """
    Extract wallet address from JWT token.
    
    Use in protected endpoints:
    ```python
    user_address: str = Depends(get_current_user_address)
    ```
    
    Returns:
        Wallet address from JWT subject
        
    Raises:
        HTTPException: If token is invalid or expired
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
                status_code=401,
                detail="Invalid token"
            )
            
        return wallet_address
        
    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_private_key_from_header(
    x_private_key: str = Header(None, description="User's private key for signing transactions (optional for demo)")
) -> str | None:
    """
    Extract private key from request header.
    
    SECURITY NOTE: This is for hackathon/development only.
    In production, use Pera Wallet signing or WalletConnect.
    
    When using Pera Wallet, private keys are never exposed.
    The backend will skip on-chain signing if no key is provided
    but still record the operation in the database.
    
    Returns:
        Private key string or None if not provided
    """
    if not x_private_key:
        return None
    
    # Basic validation (25-word mnemonic or base64 key)
    if len(x_private_key) < 20:
        return None
    
    return x_private_key


async def get_optional_private_key(
    x_private_key: str = Header(None, description="Optional private key for signing")
) -> str | None:
    """
    Extract optional private key from header.
    
    Returns None if header is not provided.
    """
    return x_private_key
