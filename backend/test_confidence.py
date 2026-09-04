import uuid
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import datetime
from models import Base, Supplier, Product, Warehouse, Inventory, Shipment, Customer, Order, Disruption
from confidence import calculate_system_confidence

@pytest.fixture
def db_session():
    engine = create_engine('sqlite:///:memory:')
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    
    s = Supplier(name="Test", updated_at=datetime.datetime.now())
    p = Product(name="Prod", sku="PRD", supplier_id=1, updated_at=datetime.datetime.now())
    c1 = Customer(name="Cust 1", priority_level=1, updated_at=datetime.datetime.now())
    session.add_all([s, p, c1])
    session.commit()
    
    # Stale inventory (2 days old)
    inv = Inventory(product_id=1, warehouse_id=1, stock_level=0, reserved_quantity=0, updated_at=datetime.datetime.now() - datetime.timedelta(days=2))
    session.add(inv)
    
    # Fresh shipment and order
    ship = Shipment(id='SHP-' + str(uuid.uuid4())[:8], product_id=1, warehouse_id=1, quantity=100, status="in_transit", eta=datetime.datetime.now(), updated_at=datetime.datetime.now())
    session.add(ship)
    
    oa = Order(id='ORD-' + str(uuid.uuid4())[:8], customer_id=1, product_id=1, quantity=100, status="pending", promise_date=datetime.datetime.now(), updated_at=datetime.datetime.now())
    session.add(oa)
    
    d = Disruption(status="AMBIGUOUS", source_text="T", extracted_entities={"Product": {"matched_record": {"id": 1, "name": "Prod"}, "confidence": 0.8}})
    session.add(d)
    session.commit()
    
    yield session
    session.close()

def test_calculate_confidence(db_session):
    res = calculate_system_confidence(db_session, 1)
    assert res is not None
    assert "warnings" in res
    assert len(res["warnings"]) > 0
    # Should penalize for Ambiguous, low extraction confidence, and stale inventory
    assert res["overall_level"] in ["Low", "Medium"]
    assert any("DATA FRESHNESS WARNING" in w for w in res["warnings"])
