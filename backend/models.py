from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean, JSON
from sqlalchemy.orm import relationship
from database import Base
import datetime

class Supplier(Base):
    __tablename__ = "suppliers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    aliases = Column(String) # Comma separated
    contact_email = Column(String)
    
    products = relationship("Product", back_populates="supplier")

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    sku = Column(String, unique=True, index=True)
    aliases = Column(String) # Comma separated
    supplier_id = Column(Integer, ForeignKey("suppliers.id"))
    lead_time_days = Column(Integer)
    
    supplier = relationship("Supplier", back_populates="products")
    inventories = relationship("Inventory", back_populates="product")
    shipments = relationship("Shipment", back_populates="product")
    orders = relationship("Order", back_populates="product")

class Warehouse(Base):
    __tablename__ = "warehouses"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    location = Column(String)
    
    inventories = relationship("Inventory", back_populates="warehouse")
    shipments = relationship("Shipment", back_populates="warehouse")

class Inventory(Base):
    __tablename__ = "inventory"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"))
    stock_level = Column(Integer, default=0)
    reserved_quantity = Column(Integer, default=0)
    
    product = relationship("Product", back_populates="inventories")
    warehouse = relationship("Warehouse", back_populates="inventories")

class Shipment(Base):
    __tablename__ = "shipments"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"))
    quantity = Column(Integer)
    status = Column(String) # in_transit, delayed, received
    eta = Column(DateTime)
    
    product = relationship("Product", back_populates="shipments")
    warehouse = relationship("Warehouse", back_populates="shipments")

class Customer(Base):
    __tablename__ = "customers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    priority_level = Column(Integer) # 1 (Highest) to 3 (Lowest)
    
    orders = relationship("Order", back_populates="customer")

class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Integer)
    status = Column(String, default="pending")
    promise_date = Column(DateTime)
    
    customer = relationship("Customer", back_populates="orders")
    product = relationship("Product", back_populates="orders")

class Disruption(Base):
    __tablename__ = "disruptions"
    id = Column(Integer, primary_key=True, index=True)
    source_text = Column(String)
    extracted_entities = Column(JSON)
    status = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Evidence(Base):
    __tablename__ = "evidence"
    id = Column(Integer, primary_key=True, index=True)
    disruption_id = Column(Integer, ForeignKey("disruptions.id"))
    evidence_text = Column(String)
    confidence = Column(Float)

class Decision(Base):
    __tablename__ = "decisions"
    id = Column(Integer, primary_key=True, index=True)
    disruption_id = Column(Integer, ForeignKey("disruptions.id"))
    action_taken = Column(String)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
