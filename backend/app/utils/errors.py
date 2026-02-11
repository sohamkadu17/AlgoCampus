"""
Custom exception classes for the application.
"""

from typing import Optional, Any, Dict


class BaseAppException(Exception):
    """Base exception for application errors"""
    
    def __init__(
        self,
        message: str,
        status_code: int = 500,
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)


class AlgorandTransactionError(BaseAppException):
    """Raised when an Algorand transaction fails"""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=502, details=details)


class SmartContractError(BaseAppException):
    """Raised when a smart contract interaction fails"""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=422, details=details)


class InsufficientFundsError(BaseAppException):
    """Raised when an account has insufficient balance"""
    
    def __init__(self, message: str = "Insufficient funds", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=402, details=details)


class ValidationError(BaseAppException):
    """Raised when input validation fails"""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=400, details=details)


class AuthenticationError(BaseAppException):
    """Raised when authentication fails"""
    
    def __init__(self, message: str = "Authentication failed", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=401, details=details)


class AuthorizationError(BaseAppException):
    """Raised when authorization check fails"""
    
    def __init__(self, message: str = "Not authorized", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=403, details=details)


class ResourceNotFoundError(BaseAppException):
    """Raised when a requested resource is not found"""
    
    def __init__(self, message: str = "Resource not found", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=404, details=details)


class DatabaseError(BaseAppException):
    """Raised when a database operation fails"""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=500, details=details)
