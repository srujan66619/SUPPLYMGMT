import uuid
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import datetime
from backend.models import Base, Supplier, Product, Warehouse, Inventory, Shipment, Customer, Order, Disruption
from backend.recommendation import generate_recommendation

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
    
    oa = Order(id='ORD-' + str(uuid.uuid4())[:8], customer_id=1, product_id=1, quantity=100, status="pending", promise_date=datetime.datetime.now())
    session.add(oa)
    
    d = Disruption(source_text="T", extracted_entities={"Product": {"matched_record": {"id": 1, "name": "Prod"}}})
    session.add(d)
    session.commit()
    
    yield session
    session.close()

def test_generate_recommendation(db_session):
    res = generate_recommendation(db_session, 1)
    assert res is not None
    assert "recommended_action" in res
    assert "tradeoff_score" in res
    assert len(res["why_this_option"]) > 0
    assert len(res["why_not_alternatives"]) == 3
    # EXPEDITE should win because it protects the order and has no secondary ripple (since there is no inventory to steal anyway)
    assert res["recommended_action"] == "EXPEDITE"
