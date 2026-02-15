"""
Sprint 5: Production deployment tests
Validates quota system, production config, and health endpoints.
"""
import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from datetime import datetime


class TestProductionConfig:
    """Production config validation tests."""

    def test_config_defaults(self):
        from app.core.production_config import ProductionConfig
        assert ProductionConfig.APP_VERSION == "2.0.0"
        assert ProductionConfig.WORKERS >= 1
        assert ProductionConfig.DB_POOL_MAX >= ProductionConfig.DB_POOL_MIN
        assert ProductionConfig.RATE_LIMIT_DEFAULT > 0

    def test_config_validate_missing(self):
        from app.core.production_config import ProductionConfig
        with patch.dict("os.environ", {"DATABASE_URL": "", "SUPABASE_URL": "", "SUPABASE_SERVICE_ROLE_KEY": ""}):
            # Force re-read
            missing = ProductionConfig.validate()
            assert len(missing) >= 1  # At least DATABASE_URL

    def test_config_summary_no_secrets(self):
        from app.core.production_config import ProductionConfig
        summary = ProductionConfig.summary()
        assert "version" in summary
        assert "SUPABASE_SERVICE_ROLE_KEY" not in str(summary)
        assert "DATABASE_URL" not in str(summary)


class TestQuotaGuard:
    """Quota enforcement logic tests."""

    def test_remaining_unlimited(self):
        from app.core.quota import QuotaGuard
        guard = QuotaGuard("user1", "ai:generate", "pro", -1, 0, None)
        assert guard.remaining == -1

    def test_remaining_within_limit(self):
        from app.core.quota import QuotaGuard
        guard = QuotaGuard("user1", "ai:generate", "starter", 100, 42, "row1")
        assert guard.remaining == 58

    def test_remaining_at_limit(self):
        from app.core.quota import QuotaGuard
        guard = QuotaGuard("user1", "ai:generate", "free", 10, 10, "row1")
        assert guard.remaining == 0

    def test_remaining_over_limit(self):
        from app.core.quota import QuotaGuard
        guard = QuotaGuard("user1", "ai:generate", "free", 10, 15, "row1")
        assert guard.remaining == 0  # max(0, ...)

    def test_action_map_completeness(self):
        from app.core.quota import ACTION_MAP
        expected_actions = [
            "products:import", "products:create",
            "ai:generate", "ai:enrich",
            "seo:audit", "seo:generate", "seo:apply",
            "orders:create",
            "imports:csv", "imports:url",
        ]
        for action in expected_actions:
            assert action in ACTION_MAP, f"Missing action: {action}"
            assert "quota_key" in ACTION_MAP[action]
            assert "limit_key" in ACTION_MAP[action]

    def test_plan_order(self):
        from app.core.quota import PLAN_ORDER
        assert PLAN_ORDER[0] == "free"
        assert "enterprise" in PLAN_ORDER
        assert PLAN_ORDER.index("pro") > PLAN_ORDER.index("starter")


class TestHealthEndpoints:
    """Health and readiness endpoint contract tests."""

    def test_health_returns_status(self):
        from main import app
        from fastapi.testclient import TestClient
        client = TestClient(app)
        response = client.get("/health")
        body = response.json()
        assert "status" in body
        assert "uptime_seconds" in body
        assert "checks" in body

    def test_ready_returns_status(self):
        from main import app
        from fastapi.testclient import TestClient
        client = TestClient(app)
        response = client.get("/ready")
        body = response.json()
        assert "ready" in body
