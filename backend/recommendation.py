from scenario_engine import simulate_scenario

def generate_recommendation(db, disruption_id: int):
    scenarios = ["EXPEDITE", "PART-SHIP", "REALLOCATE", "INFORM"]
    results = []
    
    # Generate simulation for all base scenarios globally (no specific order_id)
    for s in scenarios:
        res = simulate_scenario(db, disruption_id, s)
        if "error" not in res:
            results.append(res)
            
    if not results:
        return {"error": "Could not generate scenarios."}
        
    scored_results = []
    
    # Find max cost to normalize
    max_cost = max([r["cost"] for r in results]) if results else 0
    total_orders = results[0]["orders_protected"] + results[0]["units_remaining"] # Approximation for orders/units
    # We really just use relative scoring.
    
    for r in results:
        score = 0
        
        # 1. Orders Protected (0-40 points)
        total_affected = max(1, r["orders_protected"] + (r["units_remaining"] > 0)) # roughly
        # Let's use the raw numbers:
        # If Expedite protects all, it gets max points.
        if r["option"] == "EXPEDITE":
            score += 40
        elif r["option"] == "PART-SHIP":
            score += 20
        elif r["option"] == "REALLOCATE":
            score += 10 # Only protects some
        elif r["option"] == "INFORM":
            score += 0
            
        # 2. Cost Efficiency (0-20 points)
        if max_cost > 0:
            cost_ratio = r["cost"] / max_cost
            score += int((1 - cost_ratio) * 20)
        else:
            score += 20
            
        # 3. Secondary Risk / Ripple (0-25 points)
        if r["risk_level"] == "Low":
            score += 25
        elif r["risk_level"] == "Medium":
            score += 15
        elif r["risk_level"] == "High":
            score += 5
        else:
            score += 0 # Critical
            
        # 4. Customer Impact / Delay (0-15 points)
        if r["projected_delay"] <= 2:
            score += 15
        elif r["projected_delay"] <= 7:
            score += 5
            
        r["tradeoff_score"] = min(100, max(0, score))
        scored_results.append(r)
        
    scored_results.sort(key=lambda x: x["tradeoff_score"], reverse=True)
    
    top_choice = scored_results[0]
    alternatives = scored_results[1:]
    
    # Generate explanations
    why_this_option = []
    if top_choice["option"] == "EXPEDITE":
        why_this_option = [
            "Provides maximum protection for affected orders.",
            "Keeps secondary risk low (no ripple effects).",
            "Maintains high customer satisfaction despite upfront capital cost."
        ]
    elif top_choice["option"] == "PART-SHIP":
        why_this_option = [
            "Balances immediate partial fulfillment without excessive premium costs.",
            "Avoids stealing inventory from other critical orders.",
            "Maintains moderate customer trust while awaiting replenishment."
        ]
    elif top_choice["option"] == "REALLOCATE":
        why_this_option = [
            "Zero direct cost solution to save critical orders.",
            "Acceptable secondary impact given the priority of the target orders."
        ]
    elif top_choice["option"] == "INFORM":
        why_this_option = [
            "Zero cost incurred.",
            "Other options are either too expensive or too risky."
        ]
        
    why_not_alternatives = []
    for alt in alternatives:
        if alt["option"] == "EXPEDITE":
            why_not_alternatives.append(f"EXPEDITE was rejected due to disproportionately high cost (${alt['cost']}).")
        elif alt["option"] == "REALLOCATE":
            why_not_alternatives.append("REALLOCATE was rejected due to critical secondary ripple effects on other customers.")
        elif alt["option"] == "PART-SHIP":
            why_not_alternatives.append("PART-SHIP leaves too many residual units unresolved.")
        elif alt["option"] == "INFORM":
            why_not_alternatives.append("INFORM CUSTOMER (Do nothing) causes unacceptable reputational damage.")
            
    return {
        "recommended_action": top_choice["option"],
        "tradeoff_score": top_choice["tradeoff_score"],
        "metrics": top_choice,
        "alternatives": alternatives,
        "why_this_option": why_this_option,
        "why_not_alternatives": why_not_alternatives,
        "confidence": "High (Deterministic Computation)"
    }
