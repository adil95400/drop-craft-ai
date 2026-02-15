"""
Sprint 3 — Security module tests
Tests: JWT verification, RBAC, rate limiting, token revocation.
"""

import pytest
from unittest.mock import MagicMock, patch
from fastapi import HTTPException


class TestJWTVerification:
    def test_missing_sub_claim_raises(self):
        from app.core.security import _verify_jwt_locally
        with patch("app.core.security.jwt.decode", return_value={"email": "test@x.com"}):
            with pytest.raises(HTTPException) as exc:
                _verify_jwt_locally("fake-token")
            assert exc.value.status_code == 401

    def test_valid_token_returns_claims(self):
        from app.core.security import _verify_jwt_locally
        mock_payload = {
            "sub": "user-123",
            "email": "test@example.com",
            "role": "authenticated",
            "app_metadata": {"role": "admin"},
            "user_metadata": {"name": "Test"},
            "exp": 9999999999,
        }
        with patch("app.core.security.jwt.decode", return_value=mock_payload):
            claims = _verify_jwt_locally("valid-token")
            assert claims["user_id"] == "user-123"
            assert claims["app_role"] == "admin"
            assert claims["email"] == "test@example.com"

    def test_expired_token_raises_401(self):
        from app.core.security import _verify_jwt_locally
        from jose import jwt as jose_jwt
        with patch("app.core.security.jwt.decode", side_effect=jose_jwt.ExpiredSignatureError()):
            with pytest.raises(HTTPException) as exc:
                _verify_jwt_locally("expired-token")
            assert exc.value.status_code == 401
            assert "expired" in exc.value.detail.lower()


class TestTokenRevocation:
    def test_revoke_and_check(self):
        from app.core.security import revoke_token, is_token_revoked, _revoked_tokens
        token = "test-revoke-token"
        _revoked_tokens.discard(token)  # cleanup

        assert is_token_revoked(token) is False
        revoke_token(token)
        assert is_token_revoked(token) is True

        _revoked_tokens.discard(token)  # cleanup


class TestTokenCache:
    def test_cache_hit(self):
        from app.core.security import _set_cached_claims, _get_cached_claims
        claims = {"user_id": "u1", "email": "a@b.com"}
        _set_cached_claims("cache-test-token", claims)
        result = _get_cached_claims("cache-test-token")
        assert result == claims

    def test_cache_miss(self):
        from app.core.security import _get_cached_claims
        assert _get_cached_claims("nonexistent-token-xyz") is None


class TestRBAC:
    def test_role_hierarchy(self):
        from app.core.security import ROLE_HIERARCHY
        assert ROLE_HIERARCHY["super_admin"] > ROLE_HIERARCHY["admin"]
        assert ROLE_HIERARCHY["admin"] > ROLE_HIERARCHY["user"]
        assert ROLE_HIERARCHY["user"] > ROLE_HIERARCHY["viewer"]

    @pytest.mark.asyncio
    async def test_require_role_allows_higher(self):
        from app.core.security import require_role
        checker = require_role("user")
        claims = {"user_id": "u1", "app_role": "admin"}
        result = await checker(claims)
        assert result == claims

    @pytest.mark.asyncio
    async def test_require_role_blocks_lower(self):
        from app.core.security import require_role
        checker = require_role("admin")
        claims = {"user_id": "u1", "app_role": "user"}
        with pytest.raises(HTTPException) as exc:
            await checker(claims)
        assert exc.value.status_code == 403

    @pytest.mark.asyncio
    async def test_require_any_role(self):
        from app.core.security import require_any_role
        checker = require_any_role(["admin", "super_admin"])
        # Allowed
        result = await checker({"user_id": "u1", "app_role": "admin"})
        assert result["app_role"] == "admin"
        # Denied
        with pytest.raises(HTTPException):
            await checker({"user_id": "u2", "app_role": "user"})


class TestRateLimiter:
    @pytest.mark.asyncio
    async def test_allows_under_limit(self):
        from app.core.security import RateLimiter
        limiter = RateLimiter(requests_per_minute=5)
        limiter._redis = False  # force in-memory
        for _ in range(5):
            assert await limiter.check_rate_limit("test-user") is True

    @pytest.mark.asyncio
    async def test_blocks_over_limit(self):
        from app.core.security import RateLimiter
        limiter = RateLimiter(requests_per_minute=3)
        limiter._redis = False
        for _ in range(3):
            await limiter.check_rate_limit("blocked-user")
        assert await limiter.check_rate_limit("blocked-user") is False

    def test_get_status(self):
        from app.core.security import RateLimiter
        limiter = RateLimiter(requests_per_minute=10)
        limiter._redis = False
        status = limiter.get_status("status-user")
        assert status["limit"] == 10
        assert status["remaining"] == 10
