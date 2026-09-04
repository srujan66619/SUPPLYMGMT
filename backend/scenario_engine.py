import datetime
import models
from impact_engine import calculate_impact

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
        "option": scenario,
        "cost": 0,
        "units_fulfilled": 0,
        "units_remaining": 0,
        "orders_protected": 0,
        "customer_impact": "None",
        "projected_delay": 0,
        "secondary_impact": "None",
        "risk_level": "Low"
    }
    
    if scenario == "EXPEDITE":
        # Assumes we can source the shortage immediately at premium cost
        result["cost"] = total_shortage * EXPEDITE_COST_PER_UNIT
        result["units_fulfilled"] = total_required
        result["units_remaining"] = 0
        result["orders_protected"] = len(affected_orders)
        result["customer_impact"] = "High Satisfaction (On Time)"
        result["projected_delay"] = 1 # Accelerated from max_delay
        result["secondary_impact"] = "Low (Capital Expenditure)"
        result["risk_level"] = "Low"
        
    elif scenario == "PART-SHIP":
        # Ship what we have now (available), and the rest later.
        # Cost is double shipping roughly.
        units_available = total_required - total_shortage
        result["cost"] = len(affected_orders) * STANDARD_SHIPPING_COST * 2
        result["units_fulfilled"] = units_available
        result["units_remaining"] = total_shortage
        result["orders_protected"] = 0 # No order is FULLY protected, but partially.
        result["customer_impact"] = "Moderate (Partial Delivery)"
        result["projected_delay"] = max_delay
        result["secondary_impact"] = "None"
        result["risk_level"] = "Medium"
        
    elif scenario == "REALLOCATE":
        # Strips stock from other lower priority orders.
        result["cost"] = 0
        result["units_fulfilled"] = total_required
        result["units_remaining"] = 0
        result["orders_protected"] = len(affected_orders)
        result["customer_impact"] = "Protected"
        result["projected_delay"] = 0
        result["secondary_impact"] = "Critical"
        result["risk_level"] = "High"
        
        if order_id:
            from ripple_engine import calculate_ripple_effects
            ripple = calculate_ripple_effects(db, disruption_id, order_id)
            if ripple:
                result["ripple"] = ripple
                if ripple["ripple_effect_detected"]:
                    exposed = ripple["newly_exposed_orders"]
                    exp_names = ", ".join([f"{e['order_id']} ({e['customer']})" for e in exposed])
                    result["secondary_impact"] = f"RIPPLE EFFECT DETECTED: Protecting ORD-{order_id} causes {exp_names} to become at risk."
                else:
                    result["secondary_impact"] = "No significant ripple effects."
        
    elif scenario == "INFORM":
        # Do nothing, accept delay.
        result["cost"] = 0
        result["units_fulfilled"] = total_required - total_shortage
        result["units_remaining"] = total_shortage
        result["orders_protected"] = 0
        result["customer_impact"] = "High Dissatisfaction"
        result["projected_delay"] = max_delay
        result["secondary_impact"] = "Reputational Damage"
        result["risk_level"] = "Critical"
        
    else:
        return {"error": "Invalid scenario"}
        
    return result
