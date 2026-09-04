import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import datetime
from models import Base, Supplier, Product, Warehouse, Inventory, Shipment, Customer, Order, Disruption, Evidence
from evidence import generate_evidence_for_disruption

@pytest.fixture
def db_session():
    engine = create_engine('sqlite:///:memory:')
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    
    s = Supplier(name="Test")
    p = Product(name="Prod", sku="PRD", supplier_id=1)
    c1 = Customer(name="Cust 1", priority_level=1)
    session.add_all([s, p, c1])
    session.commit()
    
    inv = Inventory(product_id=1, warehouse_id=1, stock_level=0, reserved_quantity=0)
    session.add(inv)
    
    oa = Order(customer_id=1, product_id=1, quantity=100, status="pending", promise_date=datetime.datetime.now())
    session.add(oa)
    
    d = Disruption(source_text="T", extracted_entities={"Product": {"matched_record": {"id": 1, "name": "Prod"}}})
    session.add(d)
    session.commit()
    
    yield session
    session.close()

def test_generate_evidence(db_session):
    res = generate_evidence_for_disruption(db_session, 1)
    assert isinstance(res, list)
    assert len(res) == 1
    ev = res[0]
    
    assert ev["order_id"] == "ORD-1"
    assert "claim" in ev
    assert "source_records" in ev
    assert ev["source_records"]["Product"] == "PRD"
    assert "calculation" in ev
    assert ev["calculation"]["Shortage"] == 100
    
    # Verify persistence
    db_ev = db_session.query(Evidence).first()
    assert db_ev is not None
    assert db_ev.claim == ev["claim"]
