import random
import datetime
from .database import engine, SessionLocal, Base
from .models import Supplier, Product, Warehouse, Inventory, Shipment, Customer, Order

def seed_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    # Warehouses
    warehouses = [
        Warehouse(name="Central Distribution Hub", location="Chicago, IL"),
        Warehouse(name="West Coast Facility", location="Los Angeles, CA"),
        Warehouse(name="East Coast Depot", location="Newark, NJ"),
        Warehouse(name="Southern Logistics Center", location="Atlanta, GA")
    ]
    db.add_all(warehouses)
    db.commit()
    
    # Suppliers
    supplier_names = [
        "Global Electronics", "Stellar Logistics", "Alpha Components", "Nexus Tech", 
        "Quantum Parts", "Zenith Supply", "Omega Logistics", "Prime Materials",
        "Pinnacle Components", "Vertex Technologies", "Summit Electronics", "Horizon Supply"
    ]
    suppliers = []
    
    # Must include Apex
    apex = Supplier(name="Apex Components Ltd.", aliases="Apex Components,Apex Comp.,APEX", contact_email="sales@apexcomp.com")
    suppliers.append(apex)
    
    for name in supplier_names:
        suppliers.append(Supplier(name=name, aliases=name.lower().replace(" ", ""), contact_email=f"contact@{name.lower().replace(' ', '')}.com"))
    
    db.add_all(suppliers)
    db.commit()
    
    # Products
    products = []
    
    # Must include AX-500
    ax500 = Product(name="AX-500 Control Unit", sku="AX-500", aliases="AX-500,AX500,AX 500", supplier_id=apex.id, lead_time_days=14)
    products.append(ax500)
    
    for i in range(1, 40):
        supp = random.choice(suppliers)
        prod = Product(
            name=f"Component Type {i}",
            sku=f"COMP-{i:03d}",
            aliases=f"comp{i}, comp-{i}",
            supplier_id=supp.id,
            lead_time_days=random.randint(5, 30)
        )
        products.append(prod)
    
    db.add_all(products)
    db.commit()
    
    # Inventory
    inventories = []
    for prod in products:
        for wh in warehouses:
            if random.random() > 0.3: # 70% chance a warehouse stocks this product
                inv = Inventory(
                    product_id=prod.id,
                    warehouse_id=wh.id,
                    stock_level=random.randint(50, 1000),
                    reserved_quantity=random.randint(0, 50)
                )
                inventories.append(inv)
    
    db.add_all(inventories)
    db.commit()
    
    # Customers
    customers = []
    for i in range(1, 50):
        cust = Customer(
            name=f"Enterprise Client {i}",
            priority_level=random.choices([1, 2, 3], weights=[0.2, 0.5, 0.3])[0]
        )
        customers.append(cust)
    
    db.add_all(customers)
    db.commit()
    
    # Shipments
    now = datetime.datetime.now()
    shipments = []
    for i in range(70):
        prod = random.choice(products)
        wh = random.choice(warehouses)
        eta_days = random.randint(-5, 20)
        status = "received" if eta_days < 0 else ("in_transit" if random.random() > 0.1 else "delayed")
        
        ship = Shipment(
            product_id=prod.id,
            warehouse_id=wh.id,
            quantity=random.randint(100, 500),
            status=status,
            eta=now + datetime.timedelta(days=eta_days)
        )
        shipments.append(ship)
        
    db.add_all(shipments)
    db.commit()
    
    # Orders
    orders = []
    for i in range(200):
        cust = random.choice(customers)
        prod = random.choice(products)
        promise_days = random.randint(1, 30)
        
        order = Order(
            customer_id=cust.id,
            product_id=prod.id,
            quantity=random.randint(10, 200),
            status="pending",
            promise_date=now + datetime.timedelta(days=promise_days)
        )
        orders.append(order)
        
    db.add_all(orders)
    db.commit()
    
    print(f"Seeded {len(suppliers)} suppliers, {len(products)} products, {len(warehouses)} warehouses, {len(inventories)} inventory records, {len(shipments)} shipments, {len(customers)} customers, {len(orders)} orders.")
    db.close()

if __name__ == "__main__":
    seed_db()
