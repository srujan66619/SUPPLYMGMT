import os
from pydantic import BaseModel, Field
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

# Client will automatically pick up GEMINI_API_KEY from environment
client = genai.Client()

class ExtractedEntities(BaseModel):
    suppliers: list[str] = Field(description="List of supplier names mentioned.")
    products_or_skus: list[str] = Field(description="List of product names or SKUs mentioned.")
    is_delay: bool = Field(description="True if the notice indicates a delay.")
    delay_days: int | None = Field(description="Number of days delayed, if specified.")
    is_shortage: bool = Field(description="True if the notice indicates a stock shortage or reduction.")
    shortage_quantity: int | None = Field(description="The exact quantity short, if specified.")

def analyze_disruption_notice(notice_text: str) -> ExtractedEntities:
    prompt = f"""
    You are an expert supply chain disruption analyst.
    Read the following unstructured disruption notice and extract the key entities.
    DO NOT invent or hallucinate any facts. Only extract what is explicitly stated.
    If a specific quantity or delay is not mentioned, return null.
    
    Notice:
    {notice_text}
    """
    
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=ExtractedEntities,
            temperature=0.0
        ),
    )
    
    return ExtractedEntities.model_validate_json(response.text)
