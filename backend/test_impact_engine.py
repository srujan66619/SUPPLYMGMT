import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import datetime
from models import Base, Supplier, Product, Warehouse, Inventory, Shipment, Customer, Order, Disruption
from impact_engine import calculate_impact

@pytest.fixture
def db_session():
    engine = create_engine('sqlite:///:memory:')
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    
    # Setup mock data
    s = Supplier(name="Test Supplier")
    session.add(s)
    session.commit()
    
    p = Product(name="Test Product", sku="TEST-1", supplier_id=s.id)
    session.add(p)
    session.commit()
    
    w = Warehouse(name="Test WH", location="City")
    session.add(w)
    
    # 50 total stock, 10 reserved = 40 available
    inv = Inventory(product_id=p.id, warehouse_id=w.id, stock_level=50, reserved_quantity=10)
    session.add(inv)
    
    c1 = Customer(name="Customer 1", priority_level=1)
    c2 = Customer(name="Customer 2", priority_level=3)
    session.add_all([c1, c2])
    session.commit()
    
    now = datetime.datetime.now()
    # Order 1 wants 30. Available is 40. Fulfilled. Available becomes 10.
    o1 = Order(customer_id=c1.id, product_id=p.id, quantity=30, status="pending", promise_date=now + datetime.timedelta(days=2))
    
    # Order 2 wants 20. Available is 10. Shortage of 10.
    o2 = Order(customer_id=c2.id, product_id=p.id, quantity=20, status="pending", promise_date=now + datetime.timedelta(days=5))
    
    session.add_all([o1, o2])
    
    # Disruption
    d = Disruption(source_text="Test", extracted_entities={"Product": {"matched_record": {"id": p.id, "name": "Test Product"}}})
    session.add(d)
    session.commit()
    
    yield session
    session.close()

def test_impact_engine_shortage(db_session):
    d = db_session.query(Disruption).first()
    res = calculate_impact(db_session, d.id)
    
    assert "summary" in res
    assert res["summary"]["total_orders_affected"] == 1
    assert res["summary"]["total_shortage"] == 10
    
    assert len(res["affected_orders"]) == 1
    order = res["affected_orders"][0]
    assert order["shortage"] == 10
    assert order["quantity_available"] == 10
    assert order["risk"] == "Medium" or order["risk"] == "High" or order["risk"] == "Critical"
    
def test_missing_disruption(db_session):
    res = calculate_impact(db_session, 999)
    assert "error" in res
