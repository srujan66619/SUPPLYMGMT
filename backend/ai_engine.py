import os
from pydantic import BaseModel, Field
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

# Client initialized lazily
client = None

def get_gemini_client():
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        return None

    return genai.Client(api_key=api_key)

class ExtractedEntities(BaseModel):
    suppliers: list[str] = Field(description="List of supplier names mentioned.")
    products_or_skus: list[str] = Field(description="List of product names or SKUs mentioned.")
    is_delay: bool = Field(description="True if the notice indicates a delay.")
    delay_days: int = Field(default=0, description="Number of days delayed, if specified. Use 0 if not found.")
    is_shortage: bool = Field(description="True if the notice indicates a stock shortage or reduction.")
    shortage_quantity: int = Field(default=0, description="The exact quantity short, if specified. Use 0 if not found.")

def analyze_disruption_notice(notice_text: str) -> ExtractedEntities:
    prompt = f"""
    You are an expert supply chain disruption analyst.
    Read the following unstructured disruption notice and extract the key entities.
    DO NOT invent or hallucinate any facts. Only extract what is explicitly stated.
    If a specific quantity or delay is not mentioned, return null.
    
    Notice:
    {notice_text}
    """
    
    active_client = client if client is not None else get_gemini_client()
    if not active_client:
        raise Exception("Gemini API key is missing")
        
    response = active_client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=ExtractedEntities,
            temperature=0.0
        ),
    )
    
    return ExtractedEntities.model_validate_json(response.text)
