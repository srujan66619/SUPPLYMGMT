import datetime
from typing import List, Dict, Any

def calculate_impact(db, disruption_id: int) -> Dict[str, Any]:
    import models
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
        # Extract int ID from SHP-1042
        s_id = int(str(shipment_data['id']).replace('SHP-', ''))
        shipment = db.query(models.Shipment).filter(models.Shipment.id == s_id).first()
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
    revised_eta_str = entities.get('revised_eta') # This comes from AI extraction, assuming ISO format or parsed
    revised_eta = None
    if revised_eta_str and isinstance(revised_eta_str, str):
         # Try to parse string or just fallback to 14 days delay
         pass
    
    # For now, if no revised ETA, simulate a 10 day delay.
    delay_days_incurred = 10 
    
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
            
            risk = "Medium"
            if delay_days > 7 or customer.priority_level == 1:
                risk = "Critical"
                critical_orders_count += 1
            elif delay_days > 3 or customer.priority_level == 2:
                risk = "High"
                
            max_delay = max(max_delay, delay_days)
            
            affected_orders.append({
                "order_id": f"ORD-{order.id}",
                "customer_name": customer.name,
                "product_sku": product.sku,
                "quantity_required": order.quantity,
                "quantity_available": order.quantity - shortage,
                "shortage": shortage,
                "promise_date": order.promise_date.strftime("%b %d, %Y"),
                "projected_fulfillment_date": projected_fulfillment_date.strftime("%b %d, %Y"),
                "delay_days": delay_days,
                "risk": risk
            })
            
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
        "affected_orders": affected_orders
    }
