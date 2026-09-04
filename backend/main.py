from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base, get_db
import models
import api
from ai_engine import analyze_disruption_notice, ExtractedEntities

# Create all tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="NEXUSFLOW AI API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api.router)

class NoticeRequest(BaseModel):
    text: str

@app.get("/")
def read_root():
    return {"message": "NEXUSFLOW AI Backend is running"}

@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    return {"status": "ok", "database": "connected"}

@app.post("/api/analyze-notice", response_model=ExtractedEntities)
def analyze_notice(request: NoticeRequest):
    try:
        extracted = analyze_disruption_notice(request.text)
        return extracted
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
