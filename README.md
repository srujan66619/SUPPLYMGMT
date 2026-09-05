# NEXUSFLOW AI

## From disruption to decision — with evidence at every step.

NEXUSFLOW AI is an intelligent **Supply Chain Disruption Response Assistant** that transforms unstructured disruption notices into verified business impact assessments, recovery scenarios, explainable recommendations, and human-guided decisions.

> **AI understands. Data proves. Humans decide.**

---

# 1. Problem Statement

Supply-chain disruptions rarely remain isolated.

A supplier production shutdown or shipment delay can quickly result in:

```text
Supplier Disruption
        ↓
Shipment Delay
        ↓
Product Availability Risk
        ↓
Inventory Shortage
        ↓
Affected Orders
        ↓
Exposed Customers
        ↓
Business Impact
```

The challenge is not simply detecting that a disruption has occurred.

The real challenge is determining:

- What exactly happened?
- Which supplier, product, shipment, or warehouse is affected?
- Does the disruption actually affect the business?
- Which inventory will become unavailable?
- Which orders are at risk?
- Which customers are exposed?
- Which orders should be prioritized?
- What recovery options are available?
- What are the trade-offs of each option?
- Which action should the operator consider?

Traditional workflows often require operators to manually search through multiple systems and connect these relationships themselves.

NEXUSFLOW AI automates this reasoning process while keeping the final decision with the human operator.

# 2. Solution

NEXUSFLOW AI takes an unstructured disruption notice and processes it through a complete decision-support pipeline:

```text
NOTICE
   ↓
UNDERSTAND
   ↓
VERIFY
   ↓
TRACE
   ↓
CHALLENGE
   ↓
SIMULATE
   ↓
RECOMMEND
   ↓
HUMAN DECISION
```

The platform combines AI-powered notice understanding with deterministic business logic and internal supply-chain data.

The result is an evidence-first workflow from disruption signal to operational decision.

# 3. Core Philosophy

**AI Understands**

Gemini interprets unstructured disruption notices and extracts relevant information.

**Data Proves**

The system verifies extracted entities against internal supply-chain records and calculates the actual business impact using deterministic logic.

**Humans Decide**

NEXUSFLOW recommends recovery actions but does not automatically execute them.

```text
AI UNDERSTANDS
      ↓
DATA PROVES
      ↓
SYSTEM RECOMMENDS
      ↓
HUMAN DECIDES
```

# 4. Core Workflow

**NOTICE**

NEXUSFLOW accepts unstructured disruption information such as:

- Supplier emails
- Carrier delay notices
- Warehouse incident reports
- Operational notifications

Example:

> Due to an unexpected production shutdown at Apex Components, production of AX-500 has stopped. Shipment SHP-1042 originally expected on September 8 will now arrive on September 18.

**UNDERSTAND**

Gemini 3.5 Flash-Lite interprets the notice.

The system identifies information such as:

- Supplier: Apex Components
- Product: AX-500
- Shipment: SHP-1042
- Original ETA: September 8
- Updated ETA: September 18
- Disruption: Production Shutdown

AI interpretation is not automatically treated as business truth.

# 5. Entity Verification

NEXUSFLOW verifies extracted entities against internal data.

```text
Notice Entity
      ↓
Candidate Match
      ↓
Internal Database Record
      ↓
Verified Entity
```

For example:

```text
Apex Components
        ↓
SUP-001

AX-500
        ↓
Product Record

SHP-1042
        ↓
Shipment Record
```

This prevents AI-generated assumptions from directly becoming operational decisions.

# 6. Impact Trace

Once entities are verified, NEXUSFLOW traces the disruption through the supply-chain network.

```text
Supplier
   ↓
Shipment
   ↓
Product
   ↓
Inventory
   ↓
Orders
   ↓
Customers
```

This allows the system to determine the actual downstream consequences.

For example:

```text
Apex Components
       ↓
SHP-1042
       ↓
AX-500
       ↓
Inventory Shortage
       ↓
14 Orders At Risk
       ↓
3 Customers Exposed
```

# 7. Evidence Chain

Every major impact claim is traceable to underlying data.

Example:

```text
CLAIM
14 orders are at risk

        ↓

SOURCE
Orders Table

        ↓

RECORDS
ORD-1041
ORD-1048
ORD-1053
...

        ↓

CALCULATION
Projected Available Quantity
<
Required Quantity

        ↓

RESULT
Affected Orders

        ↓

CONFIDENCE
HIGH
```

NEXUSFLOW does not simply provide an answer.

It provides the reasoning and evidence behind that answer.

# 8. Inventory Impact

The system compares available inventory with expected demand.

Example:

- On Hand: 100 units
- Reserved: 90 units
- Available: 10 units
- Required: 60 units

Projected shortage:

60 - 10 = 50 units

This shortage is then traced to affected orders.

# 9. Order and Customer Impact

The system identifies:

- Orders affected
- Customers affected
- Priority levels
- Promise dates
- Projected delays
- Customer exposure

Orders can then be ranked according to urgency and business priority.

# 10. Scenario Lab

NEXUSFLOW evaluates multiple recovery strategies before a final decision is made.

**EXPEDITE**

Accelerate the delayed shipment.

- Advantages: Reduces delay, Protects customer commitments
- Trade-off: Higher recovery cost

**PART-SHIP**

Fulfil part of an order using available inventory.

- Advantages: Provides partial customer fulfilment, Can protect urgent requirements
- Trade-off: Full order remains incomplete

**REALLOCATE**

Move inventory from another warehouse or supply location.

- Advantages: Can reduce immediate delay
- Trade-off: May create secondary inventory risk elsewhere

**INFORM CUSTOMER**

Communicate the expected delay to the customer.

- Advantages: Avoids additional recovery cost
- Trade-off: Creates higher customer-service impact

# 11. Trade-Off Analysis

NEXUSFLOW does not select an option based only on cost.

Recovery strategies are evaluated across:

```text
Cost
+
Delivery Delay
+
Customer Impact
+
Order Priority
+
Operational Risk
+
Ripple Effects
+
Uncertainty
```

This provides a more realistic decision-support model.

# 12. Ripple Analysis

A recovery action can create a secondary problem.

For example:

```text
Warehouse A
      ↓
Inventory Reallocation
      ↓
Order Protected
      ↓
Warehouse A Safety Stock Reduced
      ↓
Another Order Becomes Exposed
```

NEXUSFLOW evaluates these secondary effects before recommending an action.

# 13. Recommendation

After evaluating the available recovery scenarios, NEXUSFLOW produces an explainable recommendation.

Example:

**RECOMMENDED ACTION**

EXPEDITE SHP-1042

The recommendation includes:

- Why it was selected
- Why alternatives were rejected
- Cost implications
- Customer impact
- Operational risk
- Supporting evidence

# 14. Human-in-the-Loop

NEXUSFLOW is a decision-support system.

It does not automatically:

- Expedite shipments
- Reallocate inventory
- Cancel orders
- Contact customers
- Execute operational changes

Instead:

```text
SYSTEM ANALYZES
       ↓
SYSTEM RECOMMENDS
       ↓
HUMAN REVIEWS
       ↓
HUMAN DECIDES
```

The operator can:

- APPROVE
- REJECT
- MODIFY

and record decision notes.

# 15. Zero-Impact Intelligence

Not every disruption creates a business impact.

If a disruption maps to a known entity but has no pending dependency:

```text
No Pending Shipment
        +
No Inventory Dependency
        +
No Affected Orders
        +
No Exposed Customers
```

NEXUSFLOW returns:

**NO BUSINESS IMPACT**

No pending dependencies found.
No action required.

This prevents unnecessary escalation.

# 16. Ambiguous Entity Handling

If multiple internal records could match an extracted entity, NEXUSFLOW does not guess.

Example:

**AMBIGUOUS MATCH**

Multiple possible records found.
Human verification required.

This allows the operator to resolve uncertainty safely.

# 17. Unknown Entity Handling

If an important entity cannot be mapped to internal records:

**UNKNOWN ENTITY**

Impact analysis cannot be safely completed.

The system avoids inventing downstream business impact.

# 18. AI Fallback

NEXUSFLOW uses Gemini for unstructured notice understanding.

The deterministic backend remains independently usable for supported patterns.

If the Gemini path is unavailable, the system can use deterministic fallback extraction where supported.

This ensures that the entire application does not depend on a single external AI call for every business calculation.

# 19. Architecture

```text
                         USER
                           │
                           ▼
                   NEXUSFLOW AI UI
                           │
                           ▼
                    React Frontend
                           │
                           ▼
                      FastAPI API
                           │
             ┌─────────────┼─────────────┐
             ▼             ▼             ▼
          SQLite      Impact Engine    Gemini
             │             │          3.5 Flash-Lite
             │             │             │
             └─────────────┼─────────────┘
                           ▼
                    Evidence + Audit
                           │
                           ▼
                    Human Decision
```

# 20. Technology Stack

**Frontend**
- React
- Vite
- Tailwind CSS
- Recharts
- Lucide React

**Backend**
- Python
- FastAPI
- Uvicorn
- Pydantic
- SQLAlchemy

**AI**
- Google Gemini 3.5 Flash-Lite

**Database**
- SQLite

**Testing**
- Pytest
- HTTPX
- TheFuzz

# 21. Project Structure

```text
SUPPLYMGMT-main/
│
├── backend/
│   ├── api.py
│   ├── database.py
│   ├── models.py
│   ├── ai_extractor.py
│   ├── ai_engine.py
│   ├── fallback_extractor.py
│   ├── impact_engine.py
│   └── ...
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── Dashboard.jsx
│   │   ├── DisruptionAnalyzer.jsx
│   │   ├── ImpactTrace.jsx
│   │   ├── ScenarioLab.jsx
│   │   ├── DecisionCenter.jsx
│   │   ├── DataTable.jsx
│   │   └── ...
│   │
│   └── dist/
│
├── data/
│   └── nexusflow.db
│
├── app.py
├── requirements.txt
├── .env
├── .gitignore
└── README.md
```

# 22. Quick Start

The application is designed so that the evaluator can run it with only two commands.

**Step 1 — Install Dependencies**

From the project root:

```bash
pip install -r requirements.txt
```

**Step 2 — Start the Application**

```bash
py app.py
```

The application will start on:

http://localhost:8000

# 23. Environment Configuration

If Gemini-powered notice understanding is enabled, configure the Gemini API key in the environment.

Create a `.env` file:

```env
GEMINI_API_KEY=your_gemini_api_key
```

Never commit the `.env` file or API credentials to Git.

The deterministic fallback path remains available for supported notice patterns.

# 24. API

Health endpoint:

```http
GET /api/health
```

Expected response:

```json
{
  "status": "ok"
}
```

Interactive API documentation:

http://localhost:8000/docs

The application uses a single-origin architecture:

```text
http://localhost:8000
        │
        ├── React Frontend
        │
        └── /api/*
              ↓
           FastAPI
```

# 25. User Interface

NEXUSFLOW AI provides an enterprise mission-control interface containing:

- CONTROL TOWER
- DISRUPTION ANALYZER
- IMPACT MAP
- SCENARIO LAB
- DECISION CENTER

Data views:
- SUPPLIERS
- INVENTORY
- SHIPMENTS
- CUSTOMERS
- ORDERS

System views:
- EVIDENCE
- AUDIT LOG
- PROFILE

# 26. Dynamic Network Backdrop

NEXUSFLOW includes a lightweight SVG-based dynamic network backdrop representing supply-chain connectivity.

```text
Supplier
   ↓
Shipment
   ↓
Warehouse
   ↓
Inventory
   ↓
Order
   ↓
Customer
```

The network environment can visually respond to operational states such as:

```text
NORMAL
   ↓
WARNING
   ↓
CRITICAL
   ↓
RECOVERY
```

The backdrop uses lightweight SVG and CSS animation and remains behind the primary operational interface.

# 27. Complete Demonstration Flow

The recommended demonstration sequence is:

```text
Control Tower
      ↓
Disruption Analyzer
      ↓
Analyze Notice
      ↓
Entity Verification
      ↓
Impact Trace
      ↓
Evidence Chain
      ↓
Impact Map
      ↓
Scenario Lab
      ↓
Recommendation
      ↓
Decision Center
      ↓
Human Decision
```

# 28. Demonstration Scenario

NEXUSFLOW can demonstrate the following disruption:

> Due to an unexpected production shutdown at Apex Components, production of AX-500 has stopped. Shipment SHP-1042 originally expected on September 8 will now arrive on September 18.

The system traces:

```text
Apex Components
      ↓
AX-500
      ↓
SHP-1042
      ↓
Inventory
      ↓
Affected Orders
      ↓
Affected Customers
      ↓
Business Impact
      ↓
Recovery Scenarios
      ↓
Recommendation
      ↓
Human Decision
```

# 29. Testing

The backend contains automated tests covering deterministic functionality such as:

- Entity resolution
- Entity verification
- Impact calculation
- Inventory analysis
- Order impact
- Customer impact
- Scenario generation
- Ripple analysis
- Evidence generation
- Recommendation logic
- Zero-impact handling
- Ambiguous entity handling
- Unknown entity handling
- API behavior

Run the test suite with:

```bash
pytest -q
```

Gemini-dependent tests may require a valid `GEMINI_API_KEY`.

# 30. Performance

The architecture is designed for fast local execution.

Target constraints:

- Application Startup ≤ 90 seconds
- Individual Request ≤ 60 seconds

Deterministic business calculations are performed locally to avoid unnecessary external processing.

# 31. Security

NEXUSFLOW follows secure development practices including:

- API keys stored outside source code
- `.env` excluded from Git
- No credentials embedded in frontend code
- No secrets included in production bundles
- Safe handling of unresolved entities
- No automatic execution of recommendations
- Human approval for operational decisions

# 32. Trust Model

NEXUSFLOW separates three critical concepts:

```text
SIGNAL ≠ IMPACT
IMPACT ≠ ACTION
ACTION ≠ RECOMMENDATION
```

A disruption notice is only a signal.

The system must determine whether it creates an actual business impact.

An impact does not automatically determine the correct recovery strategy.

A recommended action is not automatically executed.

# 33. Why NEXUSFLOW AI?

Modern supply-chain platforms increasingly provide visibility into disruptions.

NEXUSFLOW focuses on the reasoning layer that follows the disruption signal:

```text
What happened?
      ↓
What does it mean?
      ↓
What does it actually affect?
      ↓
Can we prove the impact?
      ↓
What are our options?
      ↓
What are the trade-offs?
      ↓
What should we recommend?
      ↓
What does the human decide?
```

The focus is:

**Evidence-first disruption reasoning and decision support.**

# 34. Key Differentiators

**Evidence-First Impact Analysis**
Every major impact claim is connected to source data and calculations.

**Verified Entity Resolution**
AI-extracted entities are verified against internal records.

**Deterministic Business Reasoning**
Critical impact calculations do not rely on LLM hallucination.

**Scenario Simulation**
Multiple recovery strategies are compared before recommendation.

**Ripple Analysis**
Secondary effects of recovery actions are considered.

**Zero-Impact Intelligence**
Known disruptions with no actual business dependency are correctly classified as no-impact events.

**Human-in-the-Loop**
The system recommends but never automatically executes operational decisions.

**Resilient AI**
Deterministic fallback supports supported patterns when AI services are unavailable.

# 35. Product Philosophy

AI understands.
Data proves.
Humans decide.

# 36. Final Product Flow

```text
UNSTRUCTURED DISRUPTION
          ↓
AI UNDERSTANDING
          ↓
ENTITY VERIFICATION
          ↓
IMPACT TRACE
          ↓
EVIDENCE
          ↓
SCENARIO SIMULATION
          ↓
TRADE-OFF ANALYSIS
          ↓
EXPLAINABLE RECOMMENDATION
          ↓
HUMAN DECISION
```

# 37. Hackathon Track

Track: PS08 — Supply Chain: Disruption Response Assistant

Project: NEXUSFLOW AI

Focus:
Evidence-first supply-chain disruption reasoning, impact tracing, scenario simulation, explainable recommendations, and human-guided decision support.

# 38. Final Statement

NEXUSFLOW AI transforms:

```text
UNSTRUCTURED DISRUPTION
          ↓
VERIFIED BUSINESS IMPACT
          ↓
RECOVERY OPTIONS
          ↓
EXPLAINABLE RECOMMENDATION
          ↓
HUMAN DECISION
```

Because knowing that something went wrong is not enough.

Supply-chain teams need to know:
- WHAT happened
- WHY it matters
- WHAT it affects
- HOW severe the impact is
- WHAT options are available
- WHAT the trade-offs are
- WHY an option is recommended

And most importantly:
**Every important impact should be traceable to evidence.**

NEXUSFLOW AI
From disruption to decision — with evidence at every step.

*AI understands. Data proves. Humans decide.*
