"""
Authentication utilities for FastAPI
"""

import jwt
import httpx
from typing import Optional, Dict, Any
import structlog
import os

logger = structlog.get_logger()

async def verify_supabase_token(token: str) -> Optional[Dict[str, Any]]:
    """Verify Supabase JWT token and return user info"""
    try:
        # Get Supabase JWT secret
        jwt_secret = os.getenv("SUPABASE_JWT_SECRET")
        
        if not jwt_secret:
            # Fallback: verify with Supabase API
            return await verify_token_with_supabase_api(token)
        
        # Decode JWT token
        payload = jwt.decode(
            token, 
            jwt_secret, 
            algorithms=["HS256"],
            audience="authenticated"
        )
        
        return {
            "id": payload.get("sub"),
            "email": payload.get("email"),
            "role": payload.get("role", "user"),
            "aud": payload.get("aud"),
            "exp": payload.get("exp")
        }
        
    except jwt.ExpiredSignatureError:
        logger.warning("Token expired")
        return None
    except jwt.InvalidTokenError as e:
        logger.warning(f"Invalid token: {str(e)}")
        return None
    except Exception as e:
        logger.error(f"Token verification error: {str(e)}")
        return None

async def verify_token_with_supabase_api(token: str) -> Optional[Dict[str, Any]]:
    """Verify token by calling Supabase API"""
    try:
        supabase_url = os.getenv("SUPABASE_URL")
        
        if not supabase_url:
            return None
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{supabase_url}/auth/v1/user",
                headers={"Authorization": f"Bearer {token}"}
            )
            
            if response.status_code == 200:
                user_data = response.json()
                return {
                    "id": user_data.get("id"),
                    "email": user_data.get("email"),
                    "role": user_data.get("role", "user")
                }
            else:
                return None
                
    except Exception as e:
        logger.error(f"Supabase API verification error: {str(e)}")
        return None

def check_user_permission(user: Dict[str, Any], required_role: str = "user") -> bool:
    """Check if user has required permission level"""
    user_role = user.get("role", "user")
    
    role_hierarchy = {
        "user": 1,
        "admin": 2,
        "super_admin": 3
    }
    
    user_level = role_hierarchy.get(user_role, 0)
    required_level = role_hierarchy.get(required_role, 1)
    
    return user_level >= required_level