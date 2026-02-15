"""
Security utilities — JWT verification, RBAC, and rate limiting
Sprint 3: Added role-based access control, Redis rate limiting,
token revocation check, and structured logging.
"""

from fastapi import HTTPException, Security, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from typing import Optional, Dict, Any, Tuple, List
from functools import wraps
import time
import structlog

from app.core.config import settings

logger = structlog.get_logger(__name__)
security = HTTPBearer()


# ── JWT Token Cache ──────────────────────────────────────────────────────────
_token_cache: Dict[str, Tuple[Dict[str, Any], float]] = {}
_CACHE_TTL_SECONDS = 300
_CACHE_MAX_SIZE = 1000

# Revoked token set (populated from DB on startup or via webhook)
_revoked_tokens: set = set()


def _cache_cleanup():
    """Remove expired entries when cache exceeds max size"""
    global _token_cache
    now = time.time()
    if len(_token_cache) > _CACHE_MAX_SIZE:
        _token_cache = {k: v for k, v in _token_cache.items() if v[1] > now}


def _get_cached_claims(token: str) -> Optional[Dict[str, Any]]:
    entry = _token_cache.get(token)
    if entry and entry[1] > time.time():
        return entry[0]
    _token_cache.pop(token, None)
    return None


def _set_cached_claims(token: str, claims: Dict[str, Any]):
    _cache_cleanup()
    _token_cache[token] = (claims, time.time() + _CACHE_TTL_SECONDS)


def revoke_token(token: str):
    """Add a token to the revocation set."""
    _revoked_tokens.add(token)
    _token_cache.pop(token, None)


def is_token_revoked(token: str) -> bool:
    return token in _revoked_tokens


# ── Local JWT Verification ───────────────────────────────────────────────────

def _verify_jwt_locally(token: str) -> Dict[str, Any]:
    """Verify JWT signature locally using the JWT secret."""
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
            audience="authenticated",
            options={
                "verify_exp": True,
                "verify_aud": True,
                "verify_iss": False,
            }
        )

        user_id = payload.get("sub")
        if not user_id:
            raise JWTError("Missing 'sub' claim")

        # Extract role from app_metadata (Supabase standard)
        app_metadata = payload.get("app_metadata", {})
        user_role = app_metadata.get("role", "user")

        return {
            "user_id": user_id,
            "email": payload.get("email"),
            "role": payload.get("role", "authenticated"),
            "app_role": user_role,  # Application-level role (user, admin, super_admin)
            "metadata": payload.get("user_metadata", {}),
            "exp": payload.get("exp"),
        }

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except JWTError as e:
        logger.warning("jwt.verification_failed", error=str(e))
        raise HTTPException(status_code=401, detail="Invalid token")


async def verify_supabase_jwt(
    credentials: HTTPAuthorizationCredentials = Security(security)
) -> Dict[str, Any]:
    """Verify JWT token locally with cache and revocation check."""
    token = credentials.credentials

    # 0. Check revocation
    if is_token_revoked(token):
        raise HTTPException(status_code=401, detail="Token has been revoked")

    # 1. Check cache
    cached = _get_cached_claims(token)
    if cached:
        return cached

    # 2. Local verification (preferred)
    if settings.JWT_SECRET:
        claims = _verify_jwt_locally(token)
        _set_cached_claims(token, claims)
        return claims

    # 3. Fallback: network call
    logger.warning("jwt.fallback_network", reason="JWT_SECRET not set")
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
                "app_role": user_data.get("app_metadata", {}).get("role", "user"),
                "metadata": user_data.get("user_metadata", {}),
            }
            _set_cached_claims(token, claims)
            return claims

    except httpx.RequestError as e:
        logger.error("auth.service_unavailable", error=str(e))
        raise HTTPException(status_code=503, detail="Authentication service unavailable")


# ── User extractors ──────────────────────────────────────────────────────────

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


# ── RBAC (Role-Based Access Control) ─────────────────────────────────────────

ROLE_HIERARCHY = {
    "super_admin": 100,
    "admin": 50,
    "user": 10,
    "viewer": 1,
}


def require_role(minimum_role: str):
    """
    Dependency that enforces a minimum role level.
    
    Usage:
        @router.get("/admin/users", dependencies=[Depends(require_role("admin"))])
        async def list_users(): ...
    """
    min_level = ROLE_HIERARCHY.get(minimum_role, 0)

    async def _check(claims: Dict[str, Any] = Depends(verify_supabase_jwt)):
        user_role = claims.get("app_role", "user")
        user_level = ROLE_HIERARCHY.get(user_role, 0)

        if user_level < min_level:
            logger.warning(
                "rbac.access_denied",
                user_id=claims.get("user_id"),
                user_role=user_role,
                required_role=minimum_role,
            )
            raise HTTPException(
                status_code=403,
                detail=f"Insufficient permissions. Required role: {minimum_role}"
            )
        return claims

    return _check


def require_any_role(roles: List[str]):
    """Dependency that allows any of the specified roles."""
    async def _check(claims: Dict[str, Any] = Depends(verify_supabase_jwt)):
        user_role = claims.get("app_role", "user")
        if user_role not in roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return claims
    return _check


# ── Rate Limiter (Redis-backed with in-memory fallback) ──────────────────────

class RateLimiter:
    """
    Sliding window rate limiter.
    Uses Redis when available (multi-instance safe), falls back to in-memory.
    """

    def __init__(self, requests_per_minute: int = 60):
        self.requests_per_minute = requests_per_minute
        self._memory_requests: Dict[str, list] = {}
        self._redis = None

    def _get_redis(self):
        """Lazy Redis connection for rate limiting."""
        if self._redis is None:
            try:
                import redis
                self._redis = redis.from_url(
                    settings.REDIS_URL,
                    decode_responses=True,
                    socket_connect_timeout=2,
                )
                self._redis.ping()
            except Exception:
                self._redis = False  # Mark as unavailable
        return self._redis if self._redis is not False else None

    async def check_rate_limit(self, user_id: str) -> bool:
        """Check if user is within rate limits."""
        r = self._get_redis()

        if r:
            return self._check_redis(r, user_id)
        return self._check_memory(user_id)

    def _check_redis(self, r, user_id: str) -> bool:
        """Redis sliding window counter."""
        key = f"rate_limit:api:{user_id}"
        try:
            pipe = r.pipeline()
            pipe.incr(key)
            pipe.expire(key, 60)
            results = pipe.execute()
            current = results[0]
            return current <= self.requests_per_minute
        except Exception:
            return self._check_memory(user_id)

    def _check_memory(self, user_id: str) -> bool:
        """In-memory fallback rate limiter."""
        current_time = time.time()
        window_start = current_time - 60

        if user_id not in self._memory_requests:
            self._memory_requests[user_id] = []

        self._memory_requests[user_id] = [
            t for t in self._memory_requests[user_id] if t > window_start
        ]

        if len(self._memory_requests[user_id]) >= self.requests_per_minute:
            return False

        self._memory_requests[user_id].append(current_time)
        return True

    def get_status(self, user_id: str) -> Dict[str, Any]:
        """Get current rate limit status for user."""
        r = self._get_redis()
        if r:
            key = f"rate_limit:api:{user_id}"
            current = int(r.get(key) or 0)
            ttl = max(0, r.ttl(key))
        else:
            reqs = self._memory_requests.get(user_id, [])
            current = len([t for t in reqs if t > time.time() - 60])
            ttl = 60

        return {
            "current": current,
            "limit": self.requests_per_minute,
            "remaining": max(0, self.requests_per_minute - current),
            "reset_in": ttl,
        }


rate_limiter = RateLimiter(settings.RATE_LIMIT_PER_MINUTE)


# ── Rate limit dependency ────────────────────────────────────────────────────

async def enforce_rate_limit(
    request: Request,
    claims: Dict[str, Any] = Depends(verify_supabase_jwt),
):
    """FastAPI dependency to enforce rate limits on protected endpoints."""
    user_id = claims.get("user_id", "anonymous")
    allowed = await rate_limiter.check_rate_limit(user_id)

    if not allowed:
        status = rate_limiter.get_status(user_id)
        logger.warning("rate_limit.exceeded", user_id=user_id, **status)
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded",
            headers={"Retry-After": str(status["reset_in"])},
        )

    return claims
