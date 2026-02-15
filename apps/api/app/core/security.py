"""
Security utilities - JWT verification with local validation + cache
P1.3: No network call per request — verify JWT locally, cache results
"""

from fastapi import HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from typing import Optional, Dict, Any, Tuple
import time
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)
security = HTTPBearer()

# ── JWT Token Cache ──────────────────────────────────────────────────────────
# TTL-based cache: { token_hash -> (claims, expires_at) }
_token_cache: Dict[str, Tuple[Dict[str, Any], float]] = {}
_CACHE_TTL_SECONDS = 300  # 5 minutes
_CACHE_MAX_SIZE = 1000


def _cache_cleanup():
    """Remove expired entries when cache exceeds max size"""
    global _token_cache
    now = time.time()
    if len(_token_cache) > _CACHE_MAX_SIZE:
        _token_cache = {
            k: v for k, v in _token_cache.items() if v[1] > now
        }


def _get_cached_claims(token: str) -> Optional[Dict[str, Any]]:
    """Get claims from cache if still valid"""
    entry = _token_cache.get(token)
    if entry and entry[1] > time.time():
        return entry[0]
    # Remove stale entry
    _token_cache.pop(token, None)
    return None


def _set_cached_claims(token: str, claims: Dict[str, Any]):
    """Cache verified claims with TTL"""
    _cache_cleanup()
    _token_cache[token] = (claims, time.time() + _CACHE_TTL_SECONDS)


# ── Local JWT Verification ───────────────────────────────────────────────────

def _verify_jwt_locally(token: str) -> Dict[str, Any]:
    """
    Verify JWT signature locally using the JWT secret.
    No network call required.
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
            audience="authenticated",
            options={
                "verify_exp": True,
                "verify_aud": True,
                "verify_iss": False,  # Supabase issuer varies
            }
        )

        user_id = payload.get("sub")
        if not user_id:
            raise JWTError("Missing 'sub' claim")

        return {
            "user_id": user_id,
            "email": payload.get("email"),
            "role": payload.get("role", "authenticated"),
            "metadata": payload.get("user_metadata", {}),
            "exp": payload.get("exp"),
        }

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except JWTError as e:
        logger.warning(f"JWT verification failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid token")


async def verify_supabase_jwt(
    credentials: HTTPAuthorizationCredentials = Security(security)
) -> Dict[str, Any]:
    """
    Verify JWT token locally (no network call).
    Uses in-memory cache to avoid repeated decode operations.
    Falls back to Supabase API only if JWT_SECRET is not configured.
    """
    token = credentials.credentials

    # 1. Check cache first
    cached = _get_cached_claims(token)
    if cached:
        return cached

    # 2. Local verification (preferred — no network call)
    if settings.JWT_SECRET:
        claims = _verify_jwt_locally(token)
        _set_cached_claims(token, claims)
        return claims

    # 3. Fallback: network call to Supabase (legacy, slow)
    logger.warning("JWT_SECRET not set — falling back to network verification")
    import httpx
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(
                f"{settings.SUPABASE_URL}/auth/v1/user",
                headers={
                    "Authorization": f"Bearer {token}",
                    "apikey": settings.SUPABASE_KEY
                }
            )

            if response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid or expired token")

            user_data = response.json()
            claims = {
                "user_id": user_data.get("id"),
                "email": user_data.get("email"),
                "role": user_data.get("role"),
                "metadata": user_data.get("user_metadata", {}),
            }
            _set_cached_claims(token, claims)
            return claims

    except httpx.RequestError as e:
        logger.error(f"Auth verification failed: {e}")
        raise HTTPException(status_code=503, detail="Authentication service unavailable")


def get_current_user_id(
    claims: Dict[str, Any] = Depends(verify_supabase_jwt)
) -> str:
    """Extract user ID from verified JWT claims"""
    user_id = claims.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found in token")
    return user_id


def get_current_user(
    claims: Dict[str, Any] = Depends(verify_supabase_jwt)
) -> Dict[str, Any]:
    """Return full user claims from verified JWT"""
    return claims


# ── Rate Limiter ─────────────────────────────────────────────────────────────

class RateLimiter:
    """
    In-memory rate limiter with sliding window.
    TODO P2: Replace with Redis for multi-instance support.
    """

    def __init__(self, requests_per_minute: int = 60):
        self.requests_per_minute = requests_per_minute
        self.requests: Dict[str, list] = {}

    async def check_rate_limit(self, user_id: str) -> bool:
        """Check if user is within rate limits"""
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
