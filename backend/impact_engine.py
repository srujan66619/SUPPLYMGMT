import datetime
from typing import List, Dict, Any

def calculate_impact(db, disruption_id: int) -> Dict[str, Any]:
    from backend import models
    disruption = db.query(models.Disruption).filter(models.Disruption.id == disruption_id).first()
    
    if not disruption or not disruption.extracted_entities:
        return {"error": "Disruption not found or unverified"}
        
    entities = disruption.extracted_entities
    
    # We prioritize tracing in this order based on what's available in the notice
    # Shipment -> Product -> Warehouse -> Orders
    
    # Easiest case: specific shipment delayed
    shipment_data = entities.get('Shipment', {}).get('matched_record')
    product_data = entities.get('Product', {}).get('matched_record')
    supplier_data = entities.get('Supplier', {}).get('matched_record')
    
    products_to_trace = []
    shipment = None
    
    if shipment_data:
        s_id = shipment_data['id']
        # Search by string instead of casting to int
        shipment = db.query(models.Shipment).filter(models.Shipment.id == s_id).first()
        if not shipment:
            # Fallback to try without SHP- if they stored it that way
            s_id_clean = str(s_id).replace('SHP-', '')
            shipment = db.query(models.Shipment).filter(models.Shipment.id == s_id_clean).first()
            # Also try partial
            if not shipment:
                 shipment = db.query(models.Shipment).filter(models.Shipment.id.ilike(f"%{s_id_clean}%")).first()
        if shipment:
            products_to_trace.append(shipment.product_id)
            
    if not products_to_trace and product_data:
        products_to_trace.append(product_data['id'])
        
    if not products_to_trace and supplier_data:
        products = db.query(models.Product).filter(models.Product.supplier_id == supplier_data['id']).all()
        products_to_trace.extend([p.id for p in products])
        
    if not products_to_trace:
        return {"error": "Could not determine affected products from the disruption notice"}
        
    # Analyze impact across all affected products
    affected_orders = []
    total_shortage = 0
    customers_impacted = set()
    critical_orders_count = 0
    max_delay = 0
    
    # Determine the revised ETA for this disruption
    revised_eta_str = entities.get('revised_eta')
    original_eta_str = entities.get('original_eta')
    
    delay_days_incurred = 10 
    
    if revised_eta_str and original_eta_str:
        try:
            rev_date = datetime.datetime.strptime(revised_eta_str, "%Y-%m-%d")
            orig_date = datetime.datetime.strptime(original_eta_str, "%Y-%m-%d")
            calc_delay = (rev_date - orig_date).days
            if calc_delay > 0:
                delay_days_incurred = calc_delay
        except ValueError:
            pass
    elif revised_eta_str:
        try:
            rev_date = datetime.datetime.strptime(revised_eta_str, "%Y-%m-%d")
            calc_delay = (rev_date - datetime.datetime.now()).days
            if calc_delay > 0:
                delay_days_incurred = calc_delay
        except ValueError:
            pass 
    
    for product_id in products_to_trace:
        product = db.query(models.Product).filter(models.Product.id == product_id).first()
        
        # Available Inventory across all warehouses
        inventories = db.query(models.Inventory).filter(models.Inventory.product_id == product_id).all()
        available_qty = sum([(inv.stock_level - inv.reserved_quantity) for inv in inventories])
        
        # Find pending orders
        orders = db.query(models.Order).filter(models.Order.product_id == product_id, models.Order.status == "pending").order_by(models.Order.promise_date).all()
        
        for order in orders:
            # We fulfill orders sequentially. If available_qty drops below order.quantity, we have a shortage
            if available_qty >= order.quantity:
                available_qty -= order.quantity
                # Fulfilled from existing stock. No impact.
                continue
                
            shortage = order.quantity - max(0, available_qty)
            available_qty = 0 # Depleted
            
            total_shortage += shortage
            
            # Since there is a shortage, this order relies on incoming delayed shipments
            projected_fulfillment_date = order.promise_date + datetime.timedelta(days=delay_days_incurred)
            delay_days = delay_days_incurred
            
            customer = order.customer
            customers_impacted.add(customer.id)
            
            shortage_percentage = (shortage / order.quantity) * 100 if order.quantity > 0 else 0
            
            score = 0
            reasons = []
            
            # Customer Priority
            if customer.priority_level == 1:
                score += 30
                reasons.append("Customer priority is critical (Level 1).")
            elif customer.priority_level == 2:
                score += 15
                reasons.append("Customer priority is high (Level 2).")
            else:
                reasons.append("Customer priority is normal (Level 3).")
                
            # Shortage Percentage
            if shortage_percentage > 0:
                shortage_score = min(30, int(shortage_percentage * 0.3))
                score += shortage_score
                reasons.append(f"{int(shortage_percentage)}% shortage ({shortage} units missing).")
                
            # Delay Severity
            delay_score = min(30, delay_days * 5)
            score += delay_score
            reasons.append(f"Projected delay is {delay_days} days.")
            
            # Promise Date Proximity
            days_to_promise = (order.promise_date - datetime.datetime.now()).days
            if days_to_promise <= 3:
                score += 20
                reasons.append("Promise date is within 3 days.")
            elif days_to_promise <= 7:
                score += 10
                reasons.append("Promise date is within 7 days.")
                
            # Classification
            if score >= 75:
                risk = "Critical"
                critical_orders_count += 1
            elif score >= 50:
                risk = "High"
            elif score >= 25:
                risk = "Medium"
            else:
                risk = "Low"
                
            max_delay = max(max_delay, delay_days)
            
            affected_orders.append({
                "order_id": order.id if str(order.id).startswith("ORD-") else f"ORD-{order.id}",
                "customer_name": customer.name,
                "product_sku": product.sku,
                "quantity_required": order.quantity,
                "quantity_available": order.quantity - shortage,
                "shortage": shortage,
                "promise_date": order.promise_date.strftime("%b %d, %Y"),
                "projected_fulfillment_date": projected_fulfillment_date.strftime("%b %d, %Y"),
                "delay_days": delay_days,
                "priority": customer.priority_level,
                "risk": risk,
                "score": score,
                "reasons": reasons
            })
            
    # Sort orders by score descending
    affected_orders.sort(key=lambda x: x["score"], reverse=True)
            
    # Trace path for visual
    trace_path = []
    if supplier_data: trace_path.append(supplier_data['name'])
    if shipment_data: trace_path.append(f"Shipment {shipment_data['id']}")
    if product_data: trace_path.append(product_data['name'])
    if not trace_path: trace_path.append("Multiple Products")
            
    # Zero Impact Intelligence
    pending_shipments = 0
    if shipment and shipment.status != 'received':
        pending_shipments = 1
    elif supplier_data or product_data:
        # Just roughly estimate if there are pending shipments
        s_query = db.query(models.Shipment).filter(models.Shipment.product_id.in_(products_to_trace), models.Shipment.status != 'received')
        pending_shipments = s_query.count()

    impact_level = "CRITICAL" if critical_orders_count > 0 else "HIGH" if len(affected_orders) > 0 else "ZERO"
    
    if len(affected_orders) == 0 and total_shortage == 0:
        impact_level = "ZERO"

    inventory_info = None
    if products_to_trace:
        first_product_id = products_to_trace[0]
        prod_model = db.query(models.Product).filter(models.Product.id == first_product_id).first()
        inventories = db.query(models.Inventory).filter(models.Inventory.product_id == first_product_id).all()
        avail = sum([(inv.stock_level - inv.reserved_quantity) for inv in inventories])
        res = sum([inv.reserved_quantity for inv in inventories])
        inventory_info = {
            "product": prod_model.sku if prod_model else "Unknown",
            "available": avail,
            "reserved": res,
            "shortage": total_shortage > 0,
            "shortage_amount": total_shortage
        }
        
    supplier_info = None
    if supplier_data:
        supplier_info = {"name": supplier_data.get('name', 'Unknown Supplier')}
    elif shipment and shipment.product:
        supplier_info = {"name": shipment.product.supplier.name}

    shipment_info = None
    if shipment:
        shipment_info = {
            "id": shipment.id if str(shipment.id).startswith("SHP-") else f"SHP-{shipment.id}",
            "original_eta": original_eta_str or (shipment.eta.strftime("%Y-%m-%d") if shipment.eta else "Unknown"),
            "revised_eta": revised_eta_str or "Unknown"
        }
    elif shipment_data:
        shipment_info = {
            "id": shipment_data.get("id"),
            "original_eta": original_eta_str or "Unknown",
            "revised_eta": revised_eta_str or "Unknown"
        }

    return {
        "summary": {
            "total_orders_affected": len(affected_orders),
            "critical_orders": critical_orders_count,
            "total_shortage": total_shortage,
            "customers_impacted": len(customers_impacted),
            "estimated_delay_days": max_delay,
            "impact_level": impact_level,
            "pending_shipments_count": pending_shipments
        },
        "trace_path": trace_path,
        "affected_orders": affected_orders,
        "orders": affected_orders,
        "supplier": supplier_info,
        "shipment": shipment_info,
        "inventory": inventory_info
    }
