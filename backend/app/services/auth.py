"""
Authentication Service
Handles wallet signature verification and JWT generation
"""

import secrets
import base64
from datetime import datetime, timedelta
from typing import Tuple, Optional

from jose import jwt
from algosdk import encoding
from algosdk.error import WrongChecksumError
import nacl.signing
import nacl.encoding

from app.config import settings


class AuthService:
    """Service for wallet-based authentication"""
    
    def __init__(self):
        self.challenges = {}  # In-memory storage for development
        # In production, use Redis: self.redis = redis.Redis(...)
        
    async def generate_challenge(
        self, 
        wallet_address: str
    ) -> Tuple[str, str, datetime]:
        """
        Generate authentication challenge
        
        Args:
            wallet_address: Algorand wallet address
            
        Returns:
            Tuple of (nonce, message, expiration_time)
        """
        # Generate random nonce
        nonce = secrets.token_hex(32)
        
        # Create message to sign
        message = f"AlgoCampus Login\nAddress: {wallet_address}\nNonce: {nonce}\nTimestamp: {datetime.utcnow().isoformat()}"
        
        # Set expiration (5 minutes)
        expires_at = datetime.utcnow() + timedelta(minutes=5)
        
        # Store challenge (use Redis in production)
        self.challenges[wallet_address] = {
            "nonce": nonce,
            "message": message,
            "expires_at": expires_at
        }
        
        return nonce, message, expires_at
        
    async def verify_signature(
        self,
        wallet_address: str,
        signature: str,
        nonce: str
    ) -> bool:
        """
        Verify wallet signature
        
        Args:
            wallet_address: Algorand wallet address
            signature: Base64 encoded signature
            nonce: Challenge nonce
            
        Returns:
            True if signature is valid
        """
        # Check if challenge exists
        challenge = self.challenges.get(wallet_address)
        if not challenge:
            return False
            
        # Check nonce matches
        if challenge["nonce"] != nonce:
            return False
            
        # Check not expired
        if datetime.utcnow() > challenge["expires_at"]:
            del self.challenges[wallet_address]
            return False
            
        # Verify signature
        try:
            # Decode signature
            sig_bytes = base64.b64decode(signature)
            
            # Get message bytes
            message_bytes = challenge["message"].encode('utf-8')
            
            # Decode address to get public key
            # Algorand addresses are base32 encoded public keys with checksum
            public_key = encoding.decode_address(wallet_address)
            
            # Verify using NaCl (Ed25519)
            verify_key = nacl.signing.VerifyKey(public_key)
            verify_key.verify(message_bytes, sig_bytes)
            
            # Signature valid, delete challenge
            del self.challenges[wallet_address]
            
            return True
            
        except Exception as e:
            print(f"Signature verification failed: {e}")
            return False
            
    def create_access_token(self, wallet_address: str) -> str:
        """
        Create JWT access token
        
        Args:
            wallet_address: Algorand wallet address
            
        Returns:
            JWT access token
        """
        expires_delta = timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
        expire = datetime.utcnow() + expires_delta
        
        to_encode = {
            "sub": wallet_address,
            "exp": expire,
            "iat": datetime.utcnow(),
            "type": "access"
        }
        
        encoded_jwt = jwt.encode(
            to_encode,
            settings.JWT_SECRET_KEY,
            algorithm=settings.JWT_ALGORITHM
        )
        
        return encoded_jwt
        
    def create_refresh_token(self, wallet_address: str) -> str:
        """
        Create JWT refresh token
        
        Args:
            wallet_address: Algorand wallet address
            
        Returns:
            JWT refresh token
        """
        expires_delta = timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS)
        expire = datetime.utcnow() + expires_delta
        
        to_encode = {
            "sub": wallet_address,
            "exp": expire,
            "iat": datetime.utcnow(),
            "type": "refresh"
        }
        
        encoded_jwt = jwt.encode(
            to_encode,
            settings.JWT_SECRET_KEY,
            algorithm=settings.JWT_ALGORITHM
        )
        
        return encoded_jwt
