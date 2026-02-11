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
    x_private_key: str = Header(..., description="User's private key for signing transactions")
) -> str:
    """
    Extract private key from request header.
    
    SECURITY NOTE: This is for hackathon/development only.
    In production, use a secure key management solution or wallet connect.
    
    The private key should be sent in the X-Private-Key header.
    
    Use in endpoints that require transaction signing:
    ```python
    private_key: str = Depends(get_private_key_from_header)
    ```
    
    Returns:
        Private key string
        
    Raises:
        HTTPException: If header is missing
    """
    if not x_private_key:
        raise HTTPException(
            status_code=400,
            detail="X-Private-Key header is required for transaction signing"
        )
    
    # Basic validation (25-word mnemonic or base64 key)
    if len(x_private_key) < 20:
        raise HTTPException(
            status_code=400,
            detail="Invalid private key format"
        )
    
    return x_private_key


async def get_optional_private_key(
    x_private_key: str = Header(None, description="Optional private key for signing")
) -> str | None:
    """
    Extract optional private key from header.
    
    Returns None if header is not provided.
    """
    return x_private_key
