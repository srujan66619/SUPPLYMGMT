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

class SimulateRequest(BaseModel):
    disruption_id: int
    scenario: str
    order_id: Optional[int] = None

from scenario_engine import simulate_scenario

@router.post("/simulate")
def simulate_disruption(req: SimulateRequest, db: Session = Depends(get_db)):
    result = simulate_scenario(db, req.disruption_id, req.scenario, req.order_id)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result

from resolver import resolve_entities

@router.post("/disruptions/{disruption_id}/verify")
def verify_disruption_entities(disruption_id: int, req: VerifyRequest, db: Session = Depends(get_db)):
    results = resolve_entities(db, req.extracted_data)
    return results

@router.post("/disruptions/{disruption_id}/confirm")
def confirm_disruption_entities(disruption_id: int, req: VerifyRequest, db: Session = Depends(get_db)):
    disruption = db.query(models.Disruption).filter(models.Disruption.id == disruption_id).first()
    if not disruption:
        raise HTTPException(status_code=404, detail="Disruption not found")
    disruption.extracted_entities = req.extracted_data
    disruption.status = "analyzed"
    db.commit()
    return {"status": "success", "id": disruption.id}

from impact_engine import calculate_impact

@router.get("/impact/{disruption_id}")
def get_disruption_impact(disruption_id: int, db: Session = Depends(get_db)):
    result = calculate_impact(db, disruption_id)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result

@router.get("/disruptions/{disruption_id}/affected-orders")
def get_affected_orders(disruption_id: int, db: Session = Depends(get_db)):
    result = calculate_impact(db, disruption_id)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result.get("affected_orders", [])

from recommendation import generate_recommendation

@router.get("/disruptions/{disruption_id}/recommendation")
def get_recommendation(disruption_id: int, db: Session = Depends(get_db)):
    result = generate_recommendation(db, disruption_id)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result

from evidence import generate_evidence_for_disruption

@router.get("/impact/{disruption_id}/evidence")
def get_evidence(disruption_id: int, db: Session = Depends(get_db)):
    result = generate_evidence_for_disruption(db, disruption_id)
    if isinstance(result, dict) and "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result

from confidence import calculate_system_confidence

@router.get("/impact/{disruption_id}/confidence")
def get_confidence(disruption_id: int, db: Session = Depends(get_db)):
    result = calculate_system_confidence(db, disruption_id)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result

from pydantic import BaseModel

class DecisionCreate(BaseModel):
    disruption_id: int
    order_id: str
    recommended_action: str
    selected_action: str
    operator_notes: str = ""

@router.post("/decisions")
def create_decision(decision: DecisionCreate, db: Session = Depends(get_db)):
    db_decision = models.Decision(
        disruption_id=decision.disruption_id,
        order_id=decision.order_id,
        recommended_action=decision.recommended_action,
        selected_action=decision.selected_action,
        operator_notes=decision.operator_notes
    )
    db.add(db_decision)
    db.commit()
    db.refresh(db_decision)
    return db_decision

@router.get("/disruptions/{disruption_id}/decisions")
def get_decisions(disruption_id: int, db: Session = Depends(get_db)):
    decisions = db.query(models.Decision).filter(models.Decision.disruption_id == disruption_id).all()
    return decisions

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
