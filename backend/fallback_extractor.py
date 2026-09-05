import re

def extract_entities_deterministic(text: str) -> dict:
    result = {
        "disruption_type": "unknown",
        "supplier_reference": None,
        "product_reference": None,
        "shipment_reference": None,
        "warehouse_reference": None,
        "carrier_reference": None,
        "original_eta": None,
        "revised_eta": None,
        "quantity": None,
        "location": None,
        "confidence": 1.0,
        "_fallback_used": True
    }
    
    # Supplier extraction
    supplier_match = re.search(r'(?i)supplier:\s*([a-zA-Z0-9\s]+)', text)
    if supplier_match:
        result["supplier_reference"] = supplier_match.group(1).strip()
    else:
        # Fallback for the test notice format
        shutdown_match = re.search(r'(?i)at ([A-Z][a-zA-Z\s]+(?:Components|Ltd|Inc|Corp))', text)
        if shutdown_match:
            result["supplier_reference"] = shutdown_match.group(1).strip()
        
    product_match = re.search(r'(?i)(?:SKU|Product|Component):\s*([A-Z0-9-]+)', text)
    if product_match:
        result["product_reference"] = product_match.group(1).strip()
    else:
        # Generic SKU pattern fallback
        sku_match = re.search(r'[A-Z]{2,4}-\d{3,4}', text)
        if sku_match:
            result["product_reference"] = sku_match.group(0)
            
    shipment_match = re.search(r'(?i)(?:Shipment|SHP)\s*(?:ID|#)?\s*[:\-]?\s*(SHP-\d+)', text)
    if shipment_match:
        result["shipment_reference"] = shipment_match.group(1).strip()
        
    warehouse_match = re.search(r'(?i)warehouse:\s*([a-zA-Z\s]+)', text)
    if warehouse_match:
        result["warehouse_reference"] = warehouse_match.group(1).strip()
        
    qty_match = re.search(r'(?i)(?:quantity|qty)\s*[:\-]?\s*(\d+)', text)
    if qty_match:
        try:
            result["quantity"] = int(qty_match.group(1))
        except ValueError:
            pass
            
    # ETA extraction
    eta_matches = re.findall(r'(?i)(?:on|arrive)\s*([A-Z][a-z]+\s+\d{1,2})', text)
    if len(eta_matches) >= 2:
        result["original_eta"] = eta_matches[0]
        result["revised_eta"] = eta_matches[1]
    elif len(eta_matches) == 1:
        result["original_eta"] = eta_matches[0]

    if "delay" in text.lower():
        result["disruption_type"] = "carrier_delay"
    elif "incident" in text.lower() or "fire" in text.lower():
        result["disruption_type"] = "warehouse_incident"
    elif "halt" in text.lower() or "production" in text.lower() or "shutdown" in text.lower():
        result["disruption_type"] = "supplier_production_halt"
        
    return result
