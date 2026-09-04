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
    
    # Base setup
    s = Supplier(name="Apex Components")
    p = Product(name="AX-500", sku="AX-500", supplier_id=1)
    w = Warehouse(name="WH1", location="City")
    session.add_all([s, p, w])
    session.commit()
    
    yield session
    session.close()

def test_zero_impact_known_supplier_no_pending_shipment(db_session):
    d = Disruption(source_text="Test", extracted_entities={"Supplier": {"matched_record": {"id": 1, "name": "Apex Components"}}})
    db_session.add(d)
    db_session.commit()
    
    res = calculate_impact(db_session, d.id)
    assert res["summary"]["impact_level"] == "ZERO"
    assert res["summary"]["pending_shipments_count"] == 0

def test_zero_impact_known_product_no_open_orders(db_session):
    # Has shipment, but no open orders
    ship = Shipment(product_id=1, warehouse_id=1, quantity=100, status="delayed")
    d = Disruption(source_text="Test", extracted_entities={"Product": {"matched_record": {"id": 1, "name": "AX-500"}}})
    db_session.add_all([ship, d])
    db_session.commit()
    
    res = calculate_impact(db_session, d.id)
    assert res["summary"]["impact_level"] == "ZERO"
    assert res["summary"]["total_orders_affected"] == 0

def test_zero_impact_old_completed_shipment(db_session):
    # Shipment is received
    ship = Shipment(product_id=1, warehouse_id=1, quantity=100, status="received")
    # Even if there are open orders, if the shipment is received it shouldn't cause disruption?
    # Wait, the impact engine traces product, and just calculates available inventory. 
    # If there are open orders but NO SHORTAGE, it's ZERO impact.
    inv = Inventory(product_id=1, warehouse_id=1, stock_level=500, reserved_quantity=0)
    c = Customer(name="Customer", priority_level=3)
    db_session.add_all([ship, inv, c])
    db_session.commit()
    
    o = Order(customer_id=c.id, product_id=1, quantity=100, status="pending", promise_date=datetime.datetime.now())
    d = Disruption(source_text="Test", extracted_entities={"Shipment": {"matched_record": {"id": f"SHP-{ship.id}"}}})
    db_session.add_all([o, d])
    db_session.commit()
    
    res = calculate_impact(db_session, d.id)
    assert res["summary"]["impact_level"] == "ZERO"

def test_zero_impact_unrelated_inventory(db_session):
    inv = Inventory(product_id=1, warehouse_id=1, stock_level=1000, reserved_quantity=0)
    c = Customer(name="Customer", priority_level=3)
    db_session.add_all([inv, c])
    db_session.commit()
    
    o = Order(customer_id=c.id, product_id=1, quantity=50, status="pending", promise_date=datetime.datetime.now())
    d = Disruption(source_text="Test", extracted_entities={"Supplier": {"matched_record": {"id": 1, "name": "Apex"}}})
    db_session.add_all([o, d])
    db_session.commit()
    
    res = calculate_impact(db_session, d.id)
    # Order can be fulfilled by inventory -> ZERO impact
    assert res["summary"]["impact_level"] == "ZERO"
