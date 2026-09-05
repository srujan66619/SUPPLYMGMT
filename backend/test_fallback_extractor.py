import pytest
from backend.fallback_extractor import extract_entities_deterministic
from backend import ai_extractor
from unittest.mock import patch

def test_deterministic_extraction():
    text = "Supplier: Apex Components. Delay due to incident. Shipment SHP-1042."
    res = extract_entities_deterministic(text)
    
    assert res["_fallback_used"] == True
    assert "Apex Components" in res["supplier_reference"]
    assert res["shipment_reference"] == "SHP-1042"
    assert res["disruption_type"] == "carrier_delay"

@patch('backend.ai_extractor.client')
def test_fallback_called_on_failure(mock_client):
    mock_client.models.generate_content.side_effect = Exception("API Timeout")
    
    res = ai_extractor.extract_disruption_info("Test Product AX-500 delayed.")
    assert res["_fallback_used"] == True
    assert res["product_reference"] == "AX-500"
