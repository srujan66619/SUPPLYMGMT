import pytest
from unittest.mock import patch, MagicMock
from backend.ai_extractor import extract_disruption_info

def mock_generate_content(mock_response_text):
    mock_client_instance = MagicMock()
    mock_models = MagicMock()
    mock_response = MagicMock()
    mock_response.text = mock_response_text
    mock_models.generate_content.return_value = mock_response
    mock_client_instance.models = mock_models
    return mock_client_instance

@patch('backend.ai_extractor.client')
def test_supplier_notice(mock_client):
    mock_client.models.generate_content.return_value = MagicMock(text='{"disruption_type": "supplier_production_halt", "supplier_reference": "Apex", "confidence": 0.9}')
    res = extract_disruption_info("Apex production stopped")
    assert res["disruption_type"] == "supplier_production_halt"
    assert res["supplier_reference"] == "Apex"

@patch('backend.ai_extractor.client')
def test_carrier_notice(mock_client):
    mock_client.models.generate_content.return_value = MagicMock(text='{"disruption_type": "carrier_delay", "carrier_reference": "FedEx", "confidence": 0.95}')
    res = extract_disruption_info("FedEx shipment delayed")
    assert res["disruption_type"] == "carrier_delay"
    assert res["carrier_reference"] == "FedEx"

@patch('backend.ai_extractor.client')
def test_warehouse_notice(mock_client):
    mock_client.models.generate_content.return_value = MagicMock(text='{"disruption_type": "warehouse_incident", "warehouse_reference": "Texas WH", "confidence": 0.8}')
    res = extract_disruption_info("Fire at Texas WH")
    assert res["disruption_type"] == "warehouse_incident"
    assert res["warehouse_reference"] == "Texas WH"

@patch('backend.ai_extractor.client')
def test_incomplete_notice(mock_client):
    mock_client.models.generate_content.return_value = MagicMock(text='{"disruption_type": "unknown", "confidence": 0.1}')
    res = extract_disruption_info("Something happened")
    assert res["disruption_type"] == "unknown"
    assert "supplier_reference" not in res or res.get("supplier_reference") is None

@patch('backend.ai_extractor.client')
def test_malformed_ai_response(mock_client):
    mock_client.models.generate_content.return_value = MagicMock(text='invalid json')
    res = extract_disruption_info("Supplier: Apex Components halted production")
    # Should fall back to deterministic parsing and find "Apex Components"
    assert res.get("disruption_type") == "supplier_production_halt"
    assert res.get("supplier_reference") == "Apex Components halted production"

@patch('backend.ai_extractor.client')
def test_gemini_timeout(mock_client):
    mock_client.models.generate_content.side_effect = Exception("Timeout waiting for response")
    res = extract_disruption_info("Warehouse: WH flooded incident")
    # Should fall back to deterministic parsing
    assert res.get("disruption_type") == "warehouse_incident"
    assert res.get("warehouse_reference") == "WH flooded incident"
