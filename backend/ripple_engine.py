from backend import models
import datetime

def calculate_ripple_effects(db, disruption_id: int, target_order_id: int):
    # This evaluates what happens if we force-allocate inventory to target_order_id
    disruption = db.query(models.Disruption).filter(models.Disruption.id == disruption_id).first()
    if not disruption or not disruption.extracted_entities:
        return None
        
    entities = disruption.extracted_entities
    
    product_data = entities.get('Product', {}).get('matched_record')
    shipment_data = entities.get('Shipment', {}).get('matched_record')
    supplier_data = entities.get('Supplier', {}).get('matched_record')
    
    products_to_trace = []
    if shipment_data:
        s_id = int(str(shipment_data['id']).replace('SHP-', ''))
        shipment = db.query(models.Shipment).filter(models.Shipment.id == s_id).first()
        if shipment: products_to_trace.append(shipment.product_id)
    if not products_to_trace and product_data:
        products_to_trace.append(product_data['id'])
    if not products_to_trace and supplier_data:
        products = db.query(models.Product).filter(models.Product.supplier_id == supplier_data['id']).all()
        products_to_trace.extend([p.id for p in products])
        
    if not products_to_trace:
        return None

    # For simplicity, look at the first product
    product_id = products_to_trace[0]
    
    inventories = db.query(models.Inventory).filter(models.Inventory.product_id == product_id).all()
    total_available_qty = sum([(inv.stock_level - inv.reserved_quantity) for inv in inventories])
    
    orders = db.query(models.Order).filter(models.Order.product_id == product_id, models.Order.status == "pending").order_by(models.Order.promise_date).all()
    
    target_order = None
    for o in orders:
        if o.id == target_order_id:
            target_order = o
            break
            
    if not target_order:
        return None
        
    # Baseline logic (what normally happens)
    baseline_available = total_available_qty
    baseline_status = {}
    for o in orders:
        if baseline_available >= o.quantity:
            baseline_status[o.id] = {"shortage": 0}
            baseline_available -= o.quantity
        else:
            baseline_status[o.id] = {"shortage": o.quantity - max(0, baseline_available)}
            baseline_available = 0
            
    # Reallocation logic (force fulfill target first)
    realloc_available = total_available_qty
    realloc_status = {}
    
    # We strip stock from the total specifically for target order
    target_stolen_qty = min(realloc_available, target_order.quantity)
    realloc_available -= target_stolen_qty
    realloc_status[target_order.id] = {"shortage": target_order.quantity - target_stolen_qty}
    
    # Now fulfill the rest with remaining stock
    for o in orders:
        if o.id == target_order.id:
            continue
        if realloc_available >= o.quantity:
            realloc_status[o.id] = {"shortage": 0}
            realloc_available -= o.quantity
        else:
            realloc_status[o.id] = {"shortage": o.quantity - max(0, realloc_available)}
            realloc_available = 0
            
    # Diffing
    newly_protected = []
    newly_exposed = []
    
    for o in orders:
        base_shortage = baseline_status[o.id]["shortage"]
        new_shortage = realloc_status[o.id]["shortage"]
        
        ord_id_str = str(o.id) if str(o.id).startswith("ORD-") else f"ORD-{o.id}"
        
        if base_shortage > 0 and new_shortage == 0:
            newly_protected.append(ord_id_str)
        elif base_shortage == 0 and new_shortage > 0:
            newly_exposed.append({
                "order_id": ord_id_str,
                "customer": o.customer.name,
                "new_shortage": new_shortage
            })
            
    return {
        "newly_protected_orders": newly_protected,
        "newly_exposed_orders": newly_exposed,
        "ripple_effect_detected": len(newly_exposed) > 0
    }
