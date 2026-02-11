"""
Retry utilities with exponential backoff.
"""

import asyncio
import logging
from functools import wraps
from typing import TypeVar, Callable, Any

logger = logging.getLogger(__name__)

T = TypeVar('T')


def retry_with_backoff(
    max_retries: int = 3,
    backoff: float = 1.0,
    backoff_multiplier: float = 2.0
):
    """
    Decorator for retrying async functions with exponential backoff.
    
    Args:
        max_retries: Maximum number of retry attempts
        backoff: Initial backoff delay in seconds
        backoff_multiplier: Multiplier for exponential backoff
    
    Example:
        @retry_with_backoff(max_retries=3, backoff=1.0)
        async def my_function():
            # Function code
            pass
    """
    def decorator(func: Callable[..., Any]) -> Callable[..., Any]:
        @wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            current_backoff = backoff
            last_exception = None
            
            for attempt in range(max_retries + 1):
                try:
                    return await func(*args, **kwargs)
                except Exception as e:
                    last_exception = e
                    
                    if attempt < max_retries:
                        logger.warning(
                            f"{func.__name__} failed (attempt {attempt + 1}/{max_retries}): {e}. "
                            f"Retrying in {current_backoff}s..."
                        )
                        await asyncio.sleep(current_backoff)
                        current_backoff *= backoff_multiplier
                    else:
                        logger.error(
                            f"{func.__name__} failed after {max_retries} retries: {e}"
                        )
            
            # Raise the last exception if all retries failed
            raise last_exception
        
        return wrapper
    return decorator
