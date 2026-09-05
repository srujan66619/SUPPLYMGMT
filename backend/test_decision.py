import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import datetime
from backend.main import app, get_db
from backend.models import Base, Supplier, Product, Warehouse, Inventory, Shipment, Customer, Order, Disruption, Decision

from sqlalchemy.pool import StaticPool

engine = create_engine(
    'sqlite:///:memory:',
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    app.dependency_overrides[get_db] = override_get_db
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    
    # We add a disruption and some fake data to make sure no operational data is overwritten
    d = Disruption(id=1, source_text="test")
    p = Product(id=1, name="Test Product", sku="TP-1")
    i = Inventory(id=1, product_id=1, stock_level=100, reserved_quantity=0)
    db.add_all([d, p, i])
    db.commit()
    
    yield
    db.close()
    Base.metadata.drop_all(bind=engine)
    app.dependency_overrides.clear()

def test_submit_decision_creates_audit_trail_and_does_not_modify_inventory():
    # Submit decision
    payload = {
        "disruption_id": 1,
        "order_id": "ORD-123",
        "recommended_action": "EXPEDITE",
        "selected_action": "REJECT",
        "operator_notes": "We cannot afford this."
    }
    
    response = client.post("/api/decisions", json=payload)
    assert response.status_code == 200
    
    # Verify decision is saved
    db = TestingSessionLocal()
    decision = db.query(Decision).filter_by(order_id="ORD-123").first()
    assert decision is not None
    assert decision.selected_action == "REJECT"
    
    # Verify Operational Data is UNCHANGED
    inv = db.query(Inventory).filter_by(id=1).first()
    assert inv.stock_level == 100
    
    # Test GET endpoint
    response = client.get("/api/disruptions/1/decisions")
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["operator_notes"] == "We cannot afford this."
