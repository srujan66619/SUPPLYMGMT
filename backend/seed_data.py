import random
import datetime
from database import engine, SessionLocal, Base
from models import Supplier, Product, Warehouse, Inventory, Shipment, Customer, Order

def seed_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    # Warehouses
    warehouses = [
        Warehouse(name="Central Distribution Hub", location="Chicago, IL"),
        Warehouse(id=101, name="WH-01", location="New York, NY")
    ]
    db.add_all(warehouses)
    db.commit()
    
    # Suppliers
    apex = Supplier(id=1, name="Apex Components Ltd.", aliases="Apex Components,Apex Comp.,APEX", contact_email="sales@apexcomp.com")
    zenith = Supplier(id=2, name="Zenith Supply", aliases="Zenith,Zenith Supply", contact_email="contact@zenith.com")
    db.add_all([apex, zenith])
    db.commit()
    
    # Products
    ax500 = Product(id=1, name="AX-500 Control Unit", sku="AX-500", aliases="AX-500,AX500", supplier_id=apex.id, lead_time_days=14)
    ax100 = Product(id=2, name="AX-100 Basic Unit", sku="AX-100", aliases="AX-100,AX100", supplier_id=apex.id, lead_time_days=7)
    ax200 = Product(id=3, name="AX-200 Advanced Unit", sku="AX-200", aliases="AX-200,AX200", supplier_id=apex.id, lead_time_days=10)
    zenith_prod = Product(id=4, name="Zenith Widget", sku="ZEN-01", aliases="Widget", supplier_id=zenith.id, lead_time_days=5)
    db.add_all([ax500, ax100, ax200, zenith_prod])
    db.commit()
    
    # Customers
    acme = Customer(id=1, name="Acme Retail", priority_level=1)
    globex = Customer(id=2, name="Globex Corp", priority_level=2)
    db.add_all([acme, globex])
    db.commit()
    
    # Inventory for AX-500 (Available 180, Reserved 60)
    # Total stock_level = available + reserved = 240
    inv = Inventory(product_id=ax500.id, warehouse_id=101, stock_level=240, reserved_quantity=60, updated_at=datetime.datetime.now())
    db.add(inv)
    db.commit()
    
    # Shipments
    now = datetime.datetime.now()
    sep8 = datetime.datetime(now.year, 9, 8) if now.month < 9 else datetime.datetime(now.year + 1, 9, 8)
    
    shp1042 = Shipment(
        id="SHP-1042",
        product_id=ax500.id,
        warehouse_id=101,
        quantity=500,
        status="in_transit",
        eta=sep8
    )
    db.add(shp1042)
    db.commit()
    
    # Orders (Shortage for Acme, Normal for Globex to show ripple effect)
    # Acme needs 120, we have 180 available. Wait, if we have 180 available, and Acme needs 120, there's no shortage yet?
    # To create a shortage, Acme + Globex demand must exceed available.
    # Acme (P1) needs 200. Globex (P2) needs 100.
    # Total demand = 300. Available = 180.
    # Acme gets 180, shortage 20.
    # If we reallocate, Acme gets full 200 (stealing from somewhere?), Globex gets 0 (shortage 100). 
    ord1 = Order(
        id="ORD-2081",
        customer_id=acme.id,
        product_id=ax500.id,
        quantity=200,
        status="pending",
        promise_date=sep8 + datetime.timedelta(days=4)
    )
    ord2 = Order(
        id="ORD-2082",
        customer_id=globex.id,
        product_id=ax500.id,
        quantity=100,
        status="pending",
        promise_date=sep8 + datetime.timedelta(days=6)
    )
    db.add_all([ord1, ord2])
    db.commit()
    
    print("Database seeded with explicit PS08 Demo Scenarios.")
    db.close()

if __name__ == "__main__":
    seed_db()
