"""
Application configuration
Environment variables and settings
"""

from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings"""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True
    )
    
    # Application
    APP_NAME: str = "AlgoCampus"
    DEBUG: bool = True
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]
    
    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./algocampus.db"
    # For PostgreSQL: "postgresql+asyncpg://user:pass@localhost/algocampus"
    
    # Redis (for caching)
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # JWT Authentication
    JWT_SECRET_KEY: str = "your-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Algorand Network Configuration
    ALGORAND_NETWORK: str = "testnet"  # testnet, mainnet, localnet
    ALGOD_ADDRESS: str = "https://testnet-api.algonode.cloud"
    ALGOD_TOKEN: str = ""  # Empty for public nodes
    INDEXER_ADDRESS: str = "https://testnet-idx.algonode.cloud"
    INDEXER_TOKEN: str = ""
    
    # Smart Contract App IDs (deployed contracts)
    GROUP_MANAGER_APP_ID: int = 0  # Set after deployment
    EXPENSE_TRACKER_APP_ID: int = 0
    SETTLEMENT_EXECUTOR_APP_ID: int = 0
    
    # Contract Creator (for deployment)
    CREATOR_MNEMONIC: str = ""  # Keep secure!
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    
    # Indexer Service
    INDEXER_START_ROUND: int = 0  # Start indexing from this round
    INDEXER_POLL_INTERVAL: int = 4  # Poll every 4 seconds (Algorand block time)
    
    # Logging
    LOG_LEVEL: str = "INFO"


settings = Settings()
