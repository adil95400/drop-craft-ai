"""
Authentication utilities for FastAPI
P1.3: Local JWT verification with cache — no network call per request
"""

import jwt
from typing import Optional, Dict, Any
import time
import logging
import os

logger = logging.getLogger(__name__)

# ── Token Cache ──────────────────────────────────────────────────────────────
_token_cache: Dict[str, tuple] = {}
_CACHE_TTL = 300  # 5 min


def _get_cached(token: str) -> Optional[Dict[str, Any]]:
    entry = _token_cache.get(token)
    if entry and entry[1] > time.time():
        return entry[0]
    _token_cache.pop(token, None)
    return None


def _set_cached(token: str, claims: Dict[str, Any]):
    if len(_token_cache) > 500:
        now = time.time()
        expired = [k for k, v in _token_cache.items() if v[1] <= now]
        for k in expired:
            del _token_cache[k]
    _token_cache[token] = (claims, time.time() + _CACHE_TTL)


# ── Main verification ────────────────────────────────────────────────────────

async def verify_supabase_token(token: str) -> Optional[Dict[str, Any]]:
    """Verify Supabase JWT token — local first, network fallback"""
    try:
        # 1. Cache hit
        cached = _get_cached(token)
        if cached:
            return cached

        # 2. Local JWT verification (preferred)
        jwt_secret = os.getenv("SUPABASE_JWT_SECRET") or os.getenv("JWT_SECRET")

        if jwt_secret:
            payload = jwt.decode(
                token,
                jwt_secret,
                algorithms=["HS256"],
                audience="authenticated"
            )

            claims = {
                "id": payload.get("sub"),
                "email": payload.get("email"),
                "role": payload.get("role", "user"),
                "aud": payload.get("aud"),
                "exp": payload.get("exp")
            }
            _set_cached(token, claims)
            return claims

        # 3. Fallback: network call (slow, avoid in prod)
        logger.warning("No JWT secret configured — falling back to network verification")
        return await verify_token_with_supabase_api(token)

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
    """Verify token by calling Supabase API (fallback only)"""
    try:
        import httpx
        supabase_url = os.getenv("SUPABASE_URL")
        if not supabase_url:
            return None

        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(
                f"{supabase_url}/auth/v1/user",
                headers={"Authorization": f"Bearer {token}"}
            )

            if response.status_code == 200:
                user_data = response.json()
                claims = {
                    "id": user_data.get("id"),
                    "email": user_data.get("email"),
                    "role": user_data.get("role", "user")
                }
                _set_cached(token, claims)
                return claims
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
