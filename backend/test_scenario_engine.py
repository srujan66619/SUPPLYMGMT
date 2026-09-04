import uuid
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import datetime
from models import Base, Supplier, Product, Warehouse, Inventory, Shipment, Customer, Order, Disruption
from scenario_engine import simulate_scenario

@pytest.fixture
def db_session():
    engine = create_engine('sqlite:///:memory:')
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    
    s = Supplier(name="Test")
    p = Product(name="Prod", sku="PRD", supplier_id=1)
    c = Customer(name="Cust", priority_level=1)
    session.add_all([s, p, c])
    session.commit()
    
    inv = Inventory(product_id=1, warehouse_id=1, stock_level=10, reserved_quantity=0)
    session.add(inv)
    
    o = Order(id='ORD-' + str(uuid.uuid4())[:8], customer_id=1, product_id=1, quantity=100, status="pending", promise_date=datetime.datetime.now())
    session.add(o)
    
    d = Disruption(source_text="T", extracted_entities={"Product": {"matched_record": {"id": 1, "name": "Prod"}}})
    session.add(d)
    session.commit()
    
    yield session
    session.close()

def test_scenario_expedite(db_session):
    res = simulate_scenario(db_session, 1, "EXPEDITE")
    assert res["cost"] > 0
    assert res["units_remaining"] == 0
    assert res["risk_level"] == "Low"
    
def test_scenario_inform(db_session):
    res = simulate_scenario(db_session, 1, "INFORM")
    assert res["cost"] == 0
    assert res["customer_impact"] == "High Dissatisfaction"
    assert res["risk_level"] == "Critical"
    
def test_invalid_scenario(db_session):
    res = simulate_scenario(db_session, 1, "FAKE")
    assert "error" in res
