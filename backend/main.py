from fastapi import FastAPI, Depends, HTTPException
from fastapi import FastAPI, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base, get_db
from fastapi.responses import JSONResponse
import models
import api
from ai_engine import analyze_disruption_notice, ExtractedEntities

# Create all tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="NEXUSFLOW AI API")

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Log the real exception for developers
    print(f"CRITICAL UNHANDLED ERROR: {exc}")
    # Return a sanitized error state for the UI
    return JSONResponse(
        status_code=500,
        content={"detail": "ANALYSIS FAILED", "message": "An internal system error occurred. Please retry."}
    )

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
