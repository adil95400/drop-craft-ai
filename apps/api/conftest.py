"""
Test conftest — aligned with production security & database architecture
Overrides auth dependency to simulate an authenticated user without real JWT.
Uses mock Supabase client for isolated testing.
"""

import pytest
import asyncio
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, MagicMock, patch

from main import app
from app.core.security import get_current_user_id, verify_supabase_jwt

# ── Auth override ────────────────────────────────────────────────────────────

TEST_USER_ID = "test-user-00000000-0000-0000-0000-000000000001"
TEST_USER_EMAIL = "test@shopopti.io"


def override_get_current_user_id() -> str:
    return TEST_USER_ID


def override_verify_jwt():
    return {
        "user_id": TEST_USER_ID,
        "email": TEST_USER_EMAIL,
        "role": "authenticated",
        "metadata": {},
    }


app.dependency_overrides[get_current_user_id] = override_get_current_user_id
app.dependency_overrides[verify_supabase_jwt] = override_verify_jwt


# ── Fixtures ─────────────────────────────────────────────────────────────────

@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture
def auth_headers():
    """Headers simulating a valid Authorization bearer (override skips real JWT)"""
    return {"Authorization": "Bearer fake-test-token"}


@pytest.fixture
def sample_product():
    return {
        "title": "Smoke Test Product",
        "description": "Created by smoke test suite",
        "price": 29.99,
        "cost_price": 12.50,
        "sku": "SMOKE-TEST-001",
        "stock_quantity": 100,
        "status": "draft",
        "currency": "EUR",
    }
