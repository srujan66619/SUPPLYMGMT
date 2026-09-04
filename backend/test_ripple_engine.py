import uuid
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import datetime
from models import Base, Supplier, Product, Warehouse, Inventory, Shipment, Customer, Order, Disruption
from ripple_engine import calculate_ripple_effects

@pytest.fixture
def db_session():
    engine = create_engine('sqlite:///:memory:')
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    
    s = Supplier(name="Test")
    p = Product(name="Prod", sku="PRD", supplier_id=1)
    # 2 Customers
    c1 = Customer(name="Cust 1", priority_level=1)
    c2 = Customer(name="Cust 2", priority_level=2)
    session.add_all([s, p, c1, c2])
    session.commit()
    
    # 120 Available units
    inv = Inventory(product_id=1, warehouse_id=1, stock_level=120, reserved_quantity=0)
    session.add(inv)
    
    # Order A needs 100
    oa = Order(id='ORD-' + str(uuid.uuid4())[:8], customer_id=1, product_id=1, quantity=100, status="pending", promise_date=datetime.datetime.now())
    # Order B needs 100
    ob = Order(id='ORD-' + str(uuid.uuid4())[:8], customer_id=2, product_id=1, quantity=100, status="pending", promise_date=datetime.datetime.now() + datetime.timedelta(days=2))
    session.add_all([oa, ob])
    
    d = Disruption(source_text="T", extracted_entities={"Product": {"matched_record": {"id": 1, "name": "Prod"}}})
    session.add(d)
    session.commit()
    
    yield session
    session.close()

def test_ripple_effect_reallocation(db_session):
    # If we force allocate to Order B (ID 2), Order A (ID 1) loses out.
    # Actually wait. Baseline: Available 120. Order A (ID 1) gets 100. Order B (ID 2) gets 20 (shortage 80).
    # If we target Order B, it gets 100. Order A gets 20 (shortage 80).
    # So Order A will be newly exposed.
    
    target_order_id = db_session.query(Order).filter_by(customer_id=2).first().id
    res = calculate_ripple_effects(db_session, 1, target_order_id)
    assert res is not None
    assert res["ripple_effect_detected"] is True
    assert len(res["newly_exposed_orders"]) == 1
    expected_exposed_id = db_session.query(Order).filter_by(customer_id=1).first().id
    assert res["newly_exposed_orders"][0]["order_id"] == expected_exposed_id
