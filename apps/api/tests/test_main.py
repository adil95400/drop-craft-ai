"""
Basic main tests — validates app bootstrapping
"""

import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_health_check():
    """Test the health check endpoint"""
    response = client.get("/health")
    assert "status" in response.json()


def test_ready_check():
    """Test the readiness endpoint"""
    response = client.get("/ready")
    body = response.json()
    assert "ready" in body


def test_unauthorized_access():
    """Test unauthorized access to protected endpoints"""
    response = client.get("/api/v1/products/")
    assert response.status_code in [401, 403]


@pytest.mark.security
def test_sql_injection_protection():
    """Test SQL injection protection"""
    malicious_input = "'; DROP TABLE users; --"
    response = client.get(f"/api/v1/products/?search={malicious_input}")
    assert response.status_code != 500
