"""
Security utilities - JWT verification and authentication
"""

from fastapi import HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from typing import Optional, Dict, Any
import httpx
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)
security = HTTPBearer()


async def verify_supabase_jwt(
    credentials: HTTPAuthorizationCredentials = Security(security)
) -> Dict[str, Any]:
    """
    Verify JWT token from Supabase Auth
    Returns decoded claims if valid
    """
    token = credentials.credentials
    
    try:
        # Verify with Supabase
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{settings.SUPABASE_URL}/auth/v1/user",
                headers={
                    "Authorization": f"Bearer {token}",
                    "apikey": settings.SUPABASE_KEY
                }
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=401,
                    detail="Invalid or expired token"
                )
            
            user_data = response.json()
            return {
                "user_id": user_data.get("id"),
                "email": user_data.get("email"),
                "role": user_data.get("role"),
                "metadata": user_data.get("user_metadata", {})
            }
            
    except httpx.RequestError as e:
        logger.error(f"Auth verification failed: {e}")
        raise HTTPException(
            status_code=503,
            detail="Authentication service unavailable"
        )
    except Exception as e:
        logger.error(f"JWT verification error: {e}")
        raise HTTPException(
            status_code=401,
            detail="Authentication failed"
        )


def get_current_user_id(
    claims: Dict[str, Any] = Depends(verify_supabase_jwt)
) -> str:
    """Extract user ID from verified JWT claims"""
    user_id = claims.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found in token")
    return user_id


class RateLimiter:
    """Simple in-memory rate limiter (use Redis in production)"""
    
    def __init__(self, requests_per_minute: int = 60):
        self.requests_per_minute = requests_per_minute
        self.requests: Dict[str, list] = {}
    
    async def check_rate_limit(self, user_id: str) -> bool:
        """Check if user is within rate limits"""
        import time
        current_time = time.time()
        window_start = current_time - 60
        
        if user_id not in self.requests:
            self.requests[user_id] = []
        
        # Clean old requests
        self.requests[user_id] = [
            t for t in self.requests[user_id] if t > window_start
        ]
        
        if len(self.requests[user_id]) >= self.requests_per_minute:
            return False
        
        self.requests[user_id].append(current_time)
        return True


rate_limiter = RateLimiter(settings.RATE_LIMIT_PER_MINUTE)
