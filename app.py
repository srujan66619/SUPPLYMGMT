import sys
import os

# Backend is now treated as a regular package

import uvicorn
from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import time

from backend.database import engine, Base, get_db
from sqlalchemy.orm import Session
from backend import models
from backend import api
from backend.ai_engine import analyze_disruption_notice, ExtractedEntities

# ── Resolve paths relative to this file, not cwd ──────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend", "dist")

# ── Create all DB tables ──────────────────────────────────────────────
Base.metadata.create_all(bind=engine)

# ── FastAPI App ───────────────────────────────────────────────────────
app = FastAPI(title="NEXUSFLOW AI API")

# ── Global error handler (Phase 18 reliability) ──────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"CRITICAL UNHANDLED ERROR: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "ANALYSIS FAILED", "message": "An internal system error occurred. Please retry."}
    )

# ── Performance tracing middleware (Phase 19) ─────────────────────────
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    ms = round((time.time() - start_time) * 1000, 2)
    response.headers["X-Process-Time"] = str(ms)
    print(f"[PERF] {request.method} {request.url.path} executed in {ms}ms")
    return response

# ── CORS (still useful for dev mode where Vite runs on :5173) ─────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*", "X-Process-Time"],
    expose_headers=["X-Process-Time"]
)

# ── Mount all /api/* routes from api.py ───────────────────────────────
app.include_router(api.router)

# ── Additional root-level API routes from original main.py ────────────
class NoticeRequest(BaseModel):
    text: str

@app.post("/api/analyze-notice", response_model=ExtractedEntities)
def analyze_notice(request: NoticeRequest):
    try:
        extracted = analyze_disruption_notice(request.text)
        return extracted
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── Serve React production build ──────────────────────────────────────
# Mount static assets (JS, CSS, images) under /assets
if os.path.isdir(FRONTEND_DIR):
    assets_dir = os.path.join(FRONTEND_DIR, "assets")
    if os.path.isdir(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    # Serve any other static files from dist root (favicon, etc.)
    @app.get("/favicon.svg")
    async def favicon():
        fav = os.path.join(FRONTEND_DIR, "favicon.svg")
        if os.path.isfile(fav):
            return FileResponse(fav)
        return JSONResponse(status_code=404, content={"detail": "Not found"})

    # SPA fallback: any non-API, non-asset route returns index.html
    # This must be registered LAST so it doesn't shadow /api/* routes
    @app.get("/{full_path:path}")
    async def spa_fallback(full_path: str):
        # If the request is for a real file in dist, serve it
        file_path = os.path.join(FRONTEND_DIR, full_path)
        if full_path and os.path.isfile(file_path):
            return FileResponse(file_path)
        # Otherwise return index.html for React Router
        index = os.path.join(FRONTEND_DIR, "index.html")
        if os.path.isfile(index):
            return FileResponse(index)
        return JSONResponse(status_code=404, content={"detail": "Frontend not built. Run: cd frontend && npm run build"})
else:
    @app.get("/")
    def no_frontend():
        return {"message": "NEXUSFLOW AI Backend is running. Frontend not built. Run: cd frontend && npm run build"}

# ── Startup ───────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("=" * 60)
    print("  NEXUSFLOW AI — Starting on http://localhost:8000")
    print("=" * 60)
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=False)
