from database import engine, SessionLocal, Base
from models import Supplier, Product, Warehouse, Inventory, Customer, Order
import datetime

def seed_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    # Suppliers
    s1 = Supplier(name="Global Electronics", contact_email="sales@globalelectronics.com")
    s2 = Supplier(name="Stellar Logistics", contact_email="dispatch@stellarlogistics.com")
    s3 = Supplier(name="Alpha Components", contact_email="orders@alphacomponents.com")
    
    db.add_all([s1, s2, s3])
    db.commit()

    # Products
    p1 = Product(name="Semiconductor Chip XYZ", sku="CHIP-XYZ", supplier_id=s3.id, lead_time_days=14)
    p2 = Product(name="Display Panel 15in", sku="DISP-15", supplier_id=s1.id, lead_time_days=7)
    p3 = Product(name="Battery Pack 5000mAh", sku="BATT-5000", supplier_id=s1.id, lead_time_days=10)

    db.add_all([p1, p2, p3])
    db.commit()

    # Warehouses
    w1 = Warehouse(name="Central Hub", location="Chicago, IL")
    w2 = Warehouse(name="West Coast Facility", location="Los Angeles, CA")
    
    db.add_all([w1, w2])
    db.commit()

    # Inventory
    i1 = Inventory(product_id=p1.id, warehouse_id=w1.id, stock_level=500)
    i2 = Inventory(product_id=p2.id, warehouse_id=w1.id, stock_level=200)
    i3 = Inventory(product_id=p3.id, warehouse_id=w2.id, stock_level=100)

    db.add_all([i1, i2, i3])
    db.commit()

    # Customers
    c1 = Customer(name="TechCorp Solutions", priority_level=1)
    c2 = Customer(name="NextGen Gadgets", priority_level=2)
    c3 = Customer(name="Innovate LLC", priority_level=3)

    db.add_all([c1, c2, c3])
    db.commit()

    # Orders
    now = datetime.datetime.now()
    o1 = Order(customer_id=c1.id, product_id=p1.id, quantity=100, status="pending", expected_date=now + datetime.timedelta(days=5))
    o2 = Order(customer_id=c2.id, product_id=p2.id, quantity=50, status="pending", expected_date=now + datetime.timedelta(days=3))
    o3 = Order(customer_id=c3.id, product_id=p1.id, quantity=450, status="pending", expected_date=now + datetime.timedelta(days=7))

    db.add_all([o1, o2, o3])
    db.commit()

    db.close()
    print("Database seeded successfully.")

if __name__ == "__main__":
    seed_db()
