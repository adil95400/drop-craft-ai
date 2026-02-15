"""
Smoke tests — 5 critical API paths
Tests run against mock-overridden dependencies (no real DB required).
These validate: health, auth gating, products, jobs, request_id correlation.
"""

import pytest
from fastapi.testclient import TestClient
from main import app


client = TestClient(app)


# ── 1. Health & Ready ────────────────────────────────────────────────────────

class TestHealthEndpoints:
    def test_health_returns_status(self):
        """Health endpoint should always return a status object"""
        response = client.get("/health")
        body = response.json()
        assert "status" in body
        assert "checks" in body
        assert "version" in body
        assert body["version"] == "2.0.0"

    def test_ready_returns_json(self):
        """Ready endpoint should return a ready flag"""
        response = client.get("/ready")
        body = response.json()
        assert "ready" in body


# ── 2. Auth Gating ───────────────────────────────────────────────────────────

class TestAuthGating:
    def test_products_requires_auth(self):
        """Protected endpoints must reject unauthenticated requests"""
        response = client.get("/api/v1/products/")
        assert response.status_code in [401, 403]

    def test_jobs_requires_auth(self):
        """Jobs endpoint must reject unauthenticated requests"""
        response = client.get("/api/v1/jobs/")
        assert response.status_code in [401, 403]

    def test_orders_requires_auth(self):
        """Orders endpoint must reject unauthenticated requests"""
        response = client.get("/api/v1/orders/")
        assert response.status_code in [401, 403]


# ── 3. Request ID Correlation ────────────────────────────────────────────────

class TestRequestIdCorrelation:
    def test_response_has_request_id(self):
        """Every response must include X-Request-ID header"""
        response = client.get("/health")
        assert "x-request-id" in response.headers

    def test_response_has_response_time(self):
        """Every response must include X-Response-Time header"""
        response = client.get("/health")
        assert "x-response-time" in response.headers

    def test_custom_request_id_echoed(self):
        """If client sends X-Request-ID, server echoes it back"""
        custom_id = "test-correlation-id-12345"
        response = client.get("/health", headers={"X-Request-ID": custom_id})
        assert response.headers.get("x-request-id") == custom_id


# ── 4. Products CRUD (auth-overridden) ───────────────────────────────────────

class TestProductsEndpoint:
    def test_list_products_authenticated(self):
        """Authenticated user should be able to list products"""
        response = client.get(
            "/api/v1/products/",
            headers={"Authorization": "Bearer fake-test-token"},
        )
        # Should succeed or return empty list (not auth error)
        assert response.status_code == 200
        body = response.json()
        assert "success" in body

    def test_list_products_with_pagination(self):
        """Pagination params should be accepted"""
        response = client.get(
            "/api/v1/products/?page=1&limit=5",
            headers={"Authorization": "Bearer fake-test-token"},
        )
        assert response.status_code == 200


# ── 5. Jobs Endpoint (auth-overridden) ───────────────────────────────────────

class TestJobsEndpoint:
    def test_list_jobs_authenticated(self):
        """Authenticated user should be able to list jobs"""
        response = client.get(
            "/api/v1/jobs/",
            headers={"Authorization": "Bearer fake-test-token"},
        )
        assert response.status_code == 200
        body = response.json()
        assert "success" in body

    def test_list_jobs_with_filters(self):
        """Job filters (status, type) should be accepted"""
        response = client.get(
            "/api/v1/jobs/?status=pending&job_type=import",
            headers={"Authorization": "Bearer fake-test-token"},
        )
        assert response.status_code == 200


# ── 6. SQL Injection Protection ──────────────────────────────────────────────

class TestSecurityBasics:
    def test_sql_injection_does_not_crash(self):
        """Malicious input should not cause a 500"""
        malicious = "'; DROP TABLE users; --"
        response = client.get(
            f"/api/v1/products/?search={malicious}",
            headers={"Authorization": "Bearer fake-test-token"},
        )
        assert response.status_code != 500
