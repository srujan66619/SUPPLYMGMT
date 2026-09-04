from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from database import get_db
import models

router = APIRouter(prefix="/api")

class DisruptionCreate(BaseModel):
    notice: str = Field(..., min_length=10, max_length=5000)

@router.post("/disruptions")
def create_disruption(disruption: DisruptionCreate, db: Session = Depends(get_db)):
    if not disruption.notice or len(disruption.notice.strip()) < 10:
        raise HTTPException(status_code=400, detail="Notice must contain valid text")
        
    db_disruption = models.Disruption(
        source_text=disruption.notice,
        status="pending_analysis"
    )
    db.add(db_disruption)
    db.commit()
    db.refresh(db_disruption)
    
    return {
        "id": db_disruption.id,
        "raw_notice": db_disruption.source_text,
        "status": db_disruption.status
    }

from .ai_extractor import extract_disruption_info

class AnalyzeRequest(BaseModel):
    notice: str

@router.post("/disruptions/analyze")
def analyze_disruption_endpoint(req: AnalyzeRequest):
    result = extract_disruption_info(req.notice)
    return result

class VerifyRequest(BaseModel):
    extracted_data: dict

from resolver import resolve_entities

@router.post("/disruptions/{disruption_id}/verify")
def verify_disruption_entities(disruption_id: int, req: VerifyRequest, db: Session = Depends(get_db)):
    results = resolve_entities(db, req.extracted_data)
    return results

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
