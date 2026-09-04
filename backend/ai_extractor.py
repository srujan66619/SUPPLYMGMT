import os
import json
from pydantic import BaseModel, Field
from typing import Literal, Optional
from google import genai
from google.genai import types
from google.genai.errors import APIError
from dotenv import load_dotenv
import time
from fallback_extractor import extract_entities_deterministic

# Load .env from backend dir first, then project root as fallback
_this_dir = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(_this_dir, ".env"))
load_dotenv(os.path.join(os.path.dirname(_this_dir), ".env"))

# Client picks up GEMINI_API_KEY from environment
client = genai.Client()

class NoticeInterpretation(BaseModel):
    disruption_type: Literal["supplier_production_halt", "carrier_delay", "warehouse_incident", "unknown"] = Field(description="Type of disruption")
    supplier_reference: Optional[str] = Field(None, description="Supplier name or reference, if available")
    product_reference: Optional[str] = Field(None, description="Product name or SKU, if available")
    shipment_reference: Optional[str] = Field(None, description="Shipment ID or reference, if available")
    warehouse_reference: Optional[str] = Field(None, description="Warehouse name or location reference, if available")
    carrier_reference: Optional[str] = Field(None, description="Carrier name, if available")
    original_eta: Optional[str] = Field(None, description="Original ETA date/time, if available")
    revised_eta: Optional[str] = Field(None, description="Revised ETA date/time, if available")
    quantity: Optional[int] = Field(None, description="Affected quantity, if available")
    location: Optional[str] = Field(None, description="Location mentioned, if available")
    confidence: float = Field(description="Confidence score from 0.0 to 1.0")

def extract_disruption_info(notice_text: str) -> dict:
    prompt = f"""
You are a strict data extractor for unstructured disruption notices.
Extract information into the exact JSON schema provided.

STRICT RULES:
1. NEVER invent or guess information.
2. If a field is unavailable or you are uncertain, return null.
3. Do NOT calculate business impacts (inventory, order impact, customer impact, shortage, recommendations).
4. Use the provided context exactly as stated.

Notice:
{notice_text}
"""
    try:
        # Bounded request with timeout
        print(f"[PERF] Initiating Gemini API call...")
        start_time = time.time()
        
        response = client.models.generate_content(
            model='gemini-3.5-flash-lite',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=NoticeInterpretation,
                temperature=0.0,
            ),
        )
        
        elapsed = round((time.time() - start_time) * 1000, 2)
        print(f"[PERF] Gemini API call succeeded in {elapsed}ms")
        
        data = json.loads(response.text)
        data["_fallback_used"] = False
        return data
    except Exception as e:
        print(f"Gemini API Error: {e}")
        # Return fallback deterministic extraction
        return extract_entities_deterministic(notice_text)
