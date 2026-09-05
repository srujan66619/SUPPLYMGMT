from fastapi import FastAPI, Depends, HTTPException
from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import time
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from backend.database import engine, Base, get_db
from fastapi.responses import JSONResponse
from backend import models
from backend import api
from backend.ai_engine import analyze_disruption_notice, ExtractedEntities

# Create all tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="NEXUSFLOW AI API")

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"CRITICAL UNHANDLED ERROR: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "ANALYSIS FAILED", "message": "An internal system error occurred. Please retry."}
    )

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    # Convert to milliseconds for clean logging
    ms = round(process_time * 1000, 2)
    response.headers["X-Process-Time"] = str(ms)
    print(f"[PERF] {request.method} {request.url.path} executed in {ms}ms")
    return response

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*", "X-Process-Time"],
    expose_headers=["X-Process-Time"]
)

app.include_router(api.router)

class NoticeRequest(BaseModel):
    text: str



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

import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

frontend_dist = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'dist')
if os.path.isdir(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")
    
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="Not Found")
        
        filepath = os.path.join(frontend_dist, full_path)
        if os.path.isfile(filepath):
            return FileResponse(filepath)
            
        return FileResponse(os.path.join(frontend_dist, "index.html"))
