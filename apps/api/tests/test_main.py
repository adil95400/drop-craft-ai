import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    """Test the health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    assert "status" in response.json()
    
def test_root_endpoint():
    """Test the root endpoint"""
    response = client.get("/")
    assert response.status_code == 200
    
def test_unauthorized_access():
    """Test unauthorized access to protected endpoints"""
    response = client.get("/api/v1/products")
    assert response.status_code in [401, 403]
    
@pytest.mark.integration
def test_integration_endpoint():
    """Example integration test"""
    # This would test actual integrations
    pass
    
@pytest.mark.security  
def test_sql_injection_protection():
    """Test SQL injection protection"""
    malicious_input = "'; DROP TABLE users; --"
    response = client.get(f"/api/v1/search?q={malicious_input}")
    # Should not cause server error
    assert response.status_code != 500