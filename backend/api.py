from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from .database import get_db
from . import models

router = APIRouter(prefix="/api")

@router.get("/health")
def health_check():
    return {"status": "ok"}

@router.get("/dashboard")
def dashboard(db: Session = Depends(get_db)):
    active_disruptions = db.query(models.Disruption).filter(models.Disruption.status == "active").count()
    at_risk_orders = db.query(models.Order).filter(models.Order.status == "delayed").count()
    critical_orders = db.query(models.Order).join(models.Customer).filter(models.Customer.priority_level == 1).count()
    customers_exposed = db.query(models.Customer).count()
    
    return {
        "active_disruptions": active_disruptions,
        "at_risk_orders": at_risk_orders,
        "critical_orders": critical_orders,
        "customers_exposed": customers_exposed,
        "recent_disruptions": [],
        "supply_chain_overview": {
            "total_suppliers": db.query(models.Supplier).count(),
            "total_products": db.query(models.Product).count()
        }
    }

@router.get("/orders")
def get_orders(db: Session = Depends(get_db)):
    return db.query(models.Order).limit(50).all()

@router.get("/suppliers")
def get_suppliers(db: Session = Depends(get_db)):
    return db.query(models.Supplier).limit(50).all()

@router.get("/inventory")
def get_inventory(db: Session = Depends(get_db)):
    return db.query(models.Inventory).limit(50).all()

@router.get("/shipments")
def get_shipments(db: Session = Depends(get_db)):
    return db.query(models.Shipment).limit(50).all()
