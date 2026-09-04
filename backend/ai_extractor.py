import os
from pydantic import BaseModel, Field
from typing import Literal, Optional
from google import genai
from google.genai import types
from google.genai.errors import APIError
from dotenv import load_dotenv

load_dotenv()

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
        # Bounded request with timeout (timeout parameter can be passed in config if supported, otherwise we rely on standard timeouts)
        response = client.models.generate_content(
            model='gemini-3.5-flash-lite',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=NoticeInterpretation,
                temperature=0.0,
            ),
        )
        return NoticeInterpretation.model_validate_json(response.text).model_dump()
    except Exception as e:
        # Return a controlled error that the fallback extractor can handle later
        return {
            "error": "gemini_extraction_failed",
            "message": str(e)
        }
