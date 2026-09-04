import models
import datetime

def generate_evidence_for_disruption(db, disruption_id: int):
    # Retrieve the disruption
    disruption = db.query(models.Disruption).filter(models.Disruption.id == disruption_id).first()
    if not disruption or not disruption.extracted_entities:
        return {"error": "Disruption not found"}
        
    entities = disruption.extracted_entities
    
    # Easiest case: specific shipment delayed
    shipment_data = entities.get('Shipment', {}).get('matched_record')
    product_data = entities.get('Product', {}).get('matched_record')
    supplier_data = entities.get('Supplier', {}).get('matched_record')
    
    products_to_trace = []
    shipment_id_str = None
    if shipment_data:
        shipment_id_str = shipment_data['id']
        s_id = int(str(shipment_data['id']).replace('SHP-', ''))
        shipment = db.query(models.Shipment).filter(models.Shipment.id == s_id).first()
        if shipment: products_to_trace.append(shipment.product_id)
        
    if not products_to_trace and product_data:
        products_to_trace.append(product_data['id'])
        
    if not products_to_trace and supplier_data:
        products = db.query(models.Product).filter(models.Product.supplier_id == supplier_data['id']).all()
        products_to_trace.extend([p.id for p in products])
        
    if not products_to_trace:
        return {"error": "Could not determine affected products"}
        
    delay_days_incurred = 10
    
    # We clear old evidence for this disruption to regenerate
    db.query(models.Evidence).filter(models.Evidence.disruption_id == disruption_id).delete()
    
    evidence_list = []
    
    for product_id in products_to_trace:
        product = db.query(models.Product).filter(models.Product.id == product_id).first()
        inventories = db.query(models.Inventory).filter(models.Inventory.product_id == product_id).all()
        available_qty = sum([(inv.stock_level - inv.reserved_quantity) for inv in inventories])
        inv_ids = [f"INV-{inv.id}" for inv in inventories]
        
        orders = db.query(models.Order).filter(models.Order.product_id == product_id, models.Order.status == "pending").order_by(models.Order.promise_date).all()
        
        for order in orders:
            if available_qty >= order.quantity:
                available_qty -= order.quantity
                continue
                
            shortage = order.quantity - max(0, available_qty)
            available_qty = 0
            
            projected_date = order.promise_date + datetime.timedelta(days=delay_days_incurred)
            delay_days = delay_days_incurred
            
            ord_id_str = f"ORD-{order.id}"
            claim_text = f"{ord_id_str} is delayed by {delay_days} days due to a {shortage} unit shortage."
            
            source_records = {
                "Order": ord_id_str,
                "Product": product.sku
            }
            if shipment_id_str:
                source_records["Shipment"] = shipment_id_str
            if inv_ids:
                source_records["Inventory"] = ", ".join(inv_ids)
                
            calculation = {
                "Required Quantity": order.quantity,
                "Available Inventory": order.quantity - shortage,
                "Shortage": shortage,
                "Promise Date": order.promise_date.strftime("%Y-%m-%d"),
                "Delay Incurred": f"{delay_days} days",
                "Projected Fulfillment": projected_date.strftime("%Y-%m-%d")
            }
            
            impact_text = f"Customer '{order.customer.name}' will experience a {delay_days} day delay."
            
            ev = models.Evidence(
                disruption_id=disruption_id,
                order_id=ord_id_str,
                claim=claim_text,
                source_records=source_records,
                calculation=calculation,
                impact=impact_text
            )
            db.add(ev)
            evidence_list.append(ev)
            
    db.commit()
    
    return [
        {
            "id": e.id,
            "disruption_id": e.disruption_id,
            "order_id": e.order_id,
            "claim": e.claim,
            "source_records": e.source_records,
            "calculation": e.calculation,
            "impact": e.impact
        }
        for e in evidence_list
    ]
