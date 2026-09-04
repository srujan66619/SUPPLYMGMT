# NEXUSFLOW AI — PS08 Hackathon Submission

NEXUSFLOW AI is an advanced, deterministic supply-chain disruption management system. It interprets unstructured supply-chain notices (emails, supplier alerts) via a lightweight LLM and deterministically maps them to downstream ERP/inventory consequences, identifying the exact orders and customers impacted.

It then programmatically calculates recovery scenarios and provides deterministic, traceable AI recommendations for operations teams to explicitly approve.

## Core Architecture

- **Backend**: Python, FastAPI, SQLite (SQLAlchemy)
- **Frontend**: React, TailwindCSS, Vite
- **AI Engine**: Google Gemini 3.5 Flash-Lite (bounded single-shot extraction)
- **Design Philosophy**: No hallucinations, no automatic execution, strict data tracing, explicit fallback mechanisms, and absolute execution speed.

## PS08 Guideline Compliance

We have successfully implemented every strict requirement outlined in the PS08 problem statement:

1. **Extraction over Hallucination**: Gemini is bounded to extract ONLY structured JSON. All math and business logic (impact, urgency, recommendations) runs in pure, deterministic Python.
2. **Four Explicit Recovery Options**: The Scenario Engine explicitly models (1) Expedite, (2) Part-Ship, (3) Reallocate, (4) Inform Customer.
3. **Ripple Effect Detection**: The engine analyzes secondary impacts and successfully warns the user if protecting one order creates a shortage for another.
4. **Data Traceability (Evidence Drawer)**: Every calculation exposes an explicit Evidence Chain linking the calculated delay/shortage back to the original source database records.
5. **No Automatic Execution**: The system culminates in a "Decision Center" where recommendations must be explicitly accepted, modified, or rejected by a human operator, leaving an immutable audit trail.
6. **Graceful Fallback**: If the Gemini API times out, fails, or is missing an API key, the system automatically falls back to a deterministic regex parser, flashing a warning to the user but keeping the application fully online.
7. **Performance**: System latency is actively logged and visualized in the UI. Startup is immediate, and analysis is comfortably bounded below 2 seconds.

## How to Run

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

# Create .env file with GEMINI_API_KEY=your_key
# Seed the database
python seed_data.py

# Run the server
fastapi dev main.py
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Demo Scenarios
Navigate to the **Disruption Analyzer** in the frontend. We have provided four built-in demo buttons that explicitly trigger the four requested PS08 edge cases:
- **Scenario A**: Triggers a deep business impact, rippling through a shipment delay to a warehouse shortage affecting multiple orders.
- **Scenario B**: Simulates a zero-impact halt where the supplier exists, but no active orders or shipments are tied to them, short-circuiting the trace pipeline elegantly.
- **Scenario C**: Triggers an ambiguous product match, forcing the UI to demand human verification.
- **Scenario D**: Explores the Ripple Effect in the Scenario Lab.
