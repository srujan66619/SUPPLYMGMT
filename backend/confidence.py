import datetime
import models
import math

def calculate_system_confidence(db, disruption_id: int):
    disruption = db.query(models.Disruption).filter(models.Disruption.id == disruption_id).first()
    if not disruption:
        return {"error": "Disruption not found"}
        
    entities = disruption.extracted_entities or {}
    
    # 1. Fetching base records to check freshness
    records_checked = []
    
    product_data = entities.get('Product', {}).get('matched_record')
    supplier_data = entities.get('Supplier', {}).get('matched_record')
    
    warnings = []
    
    def time_ago_str(dt):
        if not dt:
            return "Unknown (Stale)"
        delta = datetime.datetime.now() - dt
        if delta.days > 0:
            return f"{delta.days} days ago"
        elif delta.seconds >= 3600:
            return f"{delta.seconds // 3600} hours ago"
        elif delta.seconds >= 60:
            return f"{delta.seconds // 60} minutes ago"
        else:
            return "Just now"
            
    def is_stale(dt):
        if not dt: return True
        return (datetime.datetime.now() - dt).days >= 1
    
    has_stale_critical_data = False
    
    # Check Product/Inventory
    if product_data:
        p_id = product_data.get('id')
        if p_id:
            inventories = db.query(models.Inventory).filter(models.Inventory.product_id == p_id).all()
            if inventories:
                oldest = min([inv.updated_at for inv in inventories if inv.updated_at] or [None])
                stale = is_stale(oldest)
                if stale: has_stale_critical_data = True
                records_checked.append({
                    "entity": "Inventory",
                    "updated": time_ago_str(oldest)
                })
                
    # Supplier
    if supplier_data:
        s_id = supplier_data.get('id')
        if s_id:
            supp = db.query(models.Supplier).filter(models.Supplier.id == s_id).first()
            if supp:
                records_checked.append({
                    "entity": "Supplier",
                    "updated": time_ago_str(supp.updated_at)
                })
                
    # We will just fake Orders freshness for the UI summary since querying all is expensive here
    # and we want a quick overview.
    # We'll just grab the most recently updated order.
    last_order = db.query(models.Order).order_by(models.Order.updated_at.desc()).first()
    if last_order:
        records_checked.append({
            "entity": "Orders",
            "updated": time_ago_str(last_order.updated_at)
        })
        
    # Shipments
    last_ship = db.query(models.Shipment).order_by(models.Shipment.updated_at.desc()).first()
    if last_ship:
        records_checked.append({
            "entity": "Shipments",
            "updated": time_ago_str(last_ship.updated_at)
        })

    # Confidence calculation
    base_confidence = 100
    
    # Ambiguity penalty
    if disruption.status == "AMBIGUOUS":
        base_confidence -= 30
        warnings.append("Entity resolution was ambiguous.")
        
    # Resolution confidence average
    res_scores = []
    for k, v in entities.items():
        if isinstance(v, dict) and "confidence" in v:
            res_scores.append(v["confidence"])
            
    if res_scores:
        avg_res = sum(res_scores) / len(res_scores)
        if avg_res < 0.9:
            base_confidence -= 10
            warnings.append(f"AI entity extraction confidence is low ({int(avg_res*100)}%).")
            
    # Freshness penalty
    if has_stale_critical_data:
        base_confidence -= 20
        warnings.append("DATA FRESHNESS WARNING: Inventory or critical data is older than 24 hours. Impact estimate confidence reduced.")
        
    # If no warnings and not full
    if len(warnings) == 0 and base_confidence == 100:
        base_confidence = 95 # Always leave a little doubt
        
    if base_confidence >= 80:
        overall = "High"
    elif base_confidence >= 50:
        overall = "Medium"
    else:
        overall = "Low"
        
    if overall != "High":
        warnings.append("System recommends human verification before executing recovery scenarios.")
        
    return {
        "overall_score": base_confidence,
        "overall_level": overall,
        "records_freshness": records_checked,
        "warnings": warnings
    }
