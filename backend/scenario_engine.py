import datetime
from backend import models
from backend.impact_engine import calculate_impact

def simulate_scenario(db, disruption_id: int, scenario: str, order_id: int = None):
    # Base impact analysis
    base_impact = calculate_impact(db, disruption_id)
    if "error" in base_impact:
        return base_impact
        
    affected_orders = base_impact.get("affected_orders", [])
    if order_id:
        # Isolate the specific order
        order_str = f"ORD-{order_id}"
        affected_orders = [o for o in affected_orders if o["order_id"] == order_str]
        
    if not affected_orders:
        return {"error": "No orders affected to simulate."}
        
    # Aggregate base metrics for the target order(s)
    total_shortage = sum([o["shortage"] for o in affected_orders])
    total_required = sum([o["quantity_required"] for o in affected_orders])
    max_delay = max([o["delay_days"] for o in affected_orders]) if affected_orders else 0
    
    # We define assumed config costs
    EXPEDITE_COST_PER_UNIT = 25.0
    STANDARD_SHIPPING_COST = 5.0
    
    result = {
        "name": scenario,
        "cost": 0,
        "units_fulfilled": 0,
        "units_remaining": 0,
        "orders_protected": 0,
        "customer_impact": "low",
        "projected_delay": 0,
        "secondary_risk": "low",
        "risk_level": "Low"
    }
    
    if scenario == "EXPEDITE":
        # Assumes we can source the shortage immediately at premium cost
        result["cost"] = total_shortage * EXPEDITE_COST_PER_UNIT
        result["units_fulfilled"] = total_required
        result["units_remaining"] = 0
        result["orders_protected"] = len(affected_orders)
        result["customer_impact"] = "low"
        result["projected_delay"] = 1 # Accelerated from max_delay
        result["secondary_risk"] = "low"
        result["risk_level"] = "Low"
        
    elif scenario == "PART-SHIP":
        # Ship what we have now (available), and the rest later.
        # Cost is double shipping roughly.
        units_available = total_required - total_shortage
        result["cost"] = len(affected_orders) * STANDARD_SHIPPING_COST * 2
        result["units_fulfilled"] = units_available
        result["units_remaining"] = total_shortage
        result["orders_protected"] = 0 # No order is FULLY protected, but partially.
        result["customer_impact"] = "medium"
        result["projected_delay"] = max_delay
        result["secondary_risk"] = "low"
        result["risk_level"] = "Medium"
        
    elif scenario == "REALLOCATE":
        # Strips stock from other lower priority orders.
        result["cost"] = 0
        result["units_fulfilled"] = total_required
        result["units_remaining"] = 0
        result["orders_protected"] = len(affected_orders)
        result["customer_impact"] = "low"
        result["projected_delay"] = 0
        result["secondary_risk"] = "high"
        result["risk_level"] = "High"
        
        if order_id:
            from backend.ripple_engine import calculate_ripple_effects
            ripple = calculate_ripple_effects(db, disruption_id, order_id)
            if ripple:
                result["ripple"] = ripple
                if ripple["ripple_effect_detected"]:
                    result["secondary_risk"] = "high"
                else:
                    result["secondary_risk"] = "low"
        
    elif scenario == "INFORM":
        # Do nothing, accept delay.
        result["cost"] = 0
        result["units_fulfilled"] = total_required - total_shortage
        result["units_remaining"] = total_shortage
        result["orders_protected"] = 0
        result["customer_impact"] = "high"
        result["projected_delay"] = max_delay
        result["secondary_risk"] = "high"
        result["risk_level"] = "Critical"
        
    else:
        return {"error": "Invalid scenario"}
        
    return result
