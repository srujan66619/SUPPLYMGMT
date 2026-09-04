from fastapi.testclient import TestClient
from main import app
from database import Base, engine

# Re-create tables for testing if necessary
Base.metadata.create_all(bind=engine)

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_create_disruption_success():
    notice_text = "This is a valid disruption notice with more than 10 characters."
    response = client.post("/api/disruptions", json={"notice": notice_text})
    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    assert data["raw_notice"] == notice_text
    assert data["status"] == "pending_analysis"

def test_create_disruption_empty():
    response = client.post("/api/disruptions", json={"notice": ""})
    assert response.status_code == 422 # Pydantic validation error for missing/empty min_length

def test_create_disruption_too_short():
    response = client.post("/api/disruptions", json={"notice": "short"})
    assert response.status_code == 422 # Pydantic min_length=10

def test_create_disruption_too_long():
    long_notice = "A" * 5001
    response = client.post("/api/disruptions", json={"notice": long_notice})
    assert response.status_code == 422 # Pydantic max_length=5000
