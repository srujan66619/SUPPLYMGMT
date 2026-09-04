from thefuzz import fuzz, process
import re

def fuzzy_match(query: str, candidates: dict, threshold=45, ambiguity_margin=5):
    """
    candidates is a dict mapping a unique ID (or record object) to a string or list of strings to search against.
    Returns: (status, best_match_id, confidence, all_candidates)
    status: 'VERIFIED', 'NEEDS VERIFICATION', or 'NOT FOUND'
    """
    if not query:
        return "NOT FOUND", None, 0.0, []

    # Flatten candidates for searching: we want a map of { string_to_match : id }
    # Since multiple strings can map to the same id (e.g. aliases), we do:
    search_dict = {}
    for cid, texts in candidates.items():
        if isinstance(texts, str):
            texts = [texts]
        for t in texts:
            if t and t.strip():
                # Append cid to key to avoid duplicate string overwriting different IDs
                search_dict[f"{t.strip()}__ID__{cid}"] = cid

    if not search_dict:
        return "NOT FOUND", None, 0.0, []

    # Get top 3 matches
    choices = list(search_dict.keys())
    results = process.extract(query, choices, limit=3, scorer=fuzz.token_set_ratio)
    
    if not results:
        return "NOT FOUND", None, 0.0, []

    # Group results by ID and find the max score per ID
    best_scores_by_id = {}
    candidate_list = []
    
    for match_str, score in results:
        actual_id = search_dict[match_str]
        display_name = match_str.split("__ID__")[0]
        if actual_id not in best_scores_by_id or score > best_scores_by_id[actual_id]['score']:
            best_scores_by_id[actual_id] = {'id': actual_id, 'score': score, 'matched_term': display_name}
    
    # Sort IDs by score descending
    sorted_ids = sorted(best_scores_by_id.values(), key=lambda x: x['score'], reverse=True)
    
    if not sorted_ids:
         return "NOT FOUND", None, 0.0, []
         
    best = sorted_ids[0]
    
    if best['score'] < threshold:
        return "NOT FOUND", None, best['score'] / 100.0, sorted_ids
        
    if len(sorted_ids) > 1:
        runner_up = sorted_ids[1]
        if (best['score'] - runner_up['score']) <= ambiguity_margin:
            # Ambiguous
            return "NEEDS VERIFICATION", None, best['score'] / 100.0, sorted_ids
            
    return "VERIFIED", best['id'], best['score'] / 100.0, sorted_ids

def parse_shipment_id(reference: str):
    if not reference:
        return None
    # For Phase 17 we changed Shipment.id to String like "SHP-1042"
    # If the user passed "1042", we could format it, but the DB expects the exact string.
    # We will just return the cleaned uppercase string.
    return reference.strip().upper()

def resolve_entities(db, extracted_data: dict) -> dict:
    import models
    results = {}
    
    # Resolve Supplier
    supp_ref = extracted_data.get('supplier_reference')
    if supp_ref:
        suppliers = db.query(models.Supplier).all()
        candidates = {}
        for s in suppliers:
            cands = [s.name]
            if s.aliases:
                cands.extend(s.aliases.split(','))
            candidates[s.id] = cands
        
        status, best_id, conf, cands = fuzzy_match(supp_ref, candidates)
        matched_record = None
        if best_id:
            db_rec = db.query(models.Supplier).filter(models.Supplier.id == best_id).first()
            if db_rec:
                matched_record = {"id": db_rec.id, "name": db_rec.name}
        
        results['Supplier'] = {
            "query": supp_ref,
            "status": status,
            "confidence": f"{int(conf * 100)}%",
            "matched_record": matched_record,
            "candidates": cands
        }
    
    # Resolve Product
    prod_ref = extracted_data.get('product_reference')
    if prod_ref:
        products = db.query(models.Product).all()
        candidates = {}
        for p in products:
            cands = [p.name, p.sku]
            if p.aliases:
                cands.extend(p.aliases.split(','))
            candidates[p.id] = cands
            
        status, best_id, conf, cands = fuzzy_match(prod_ref, candidates)
        matched_record = None
        if best_id:
            db_rec = db.query(models.Product).filter(models.Product.id == best_id).first()
            if db_rec:
                matched_record = {"id": db_rec.id, "name": db_rec.name, "sku": db_rec.sku}
        
        results['Product'] = {
            "query": prod_ref,
            "status": status,
            "confidence": f"{int(conf * 100)}%",
            "matched_record": matched_record,
            "candidates": cands
        }

    # Resolve Shipment
    ship_ref = extracted_data.get('shipment_reference')
    if ship_ref:
        ship_id = parse_shipment_id(ship_ref)
        if ship_id:
            db_ship = db.query(models.Shipment).filter(models.Shipment.id.ilike(f"%{ship_id}%")).first()
            if db_ship:
                results['Shipment'] = {
                    "query": ship_ref,
                    "status": "VERIFIED",
                    "confidence": "100%",
                    "matched_record": {"id": db_ship.id, "status": db_ship.status}
                }
            else:
                results['Shipment'] = {
                    "query": ship_ref,
                    "status": "NOT FOUND",
                    "confidence": "0%",
                    "matched_record": None
                }
        else:
            results['Shipment'] = {
                "query": ship_ref,
                "status": "NOT FOUND",
                "confidence": "0%",
                "matched_record": None
            }

    # Resolve Warehouse
    wh_ref = extracted_data.get('warehouse_reference')
    if wh_ref:
        warehouses = db.query(models.Warehouse).all()
        candidates = {w.id: [w.name, w.location] for w in warehouses}
        status, best_id, conf, cands = fuzzy_match(wh_ref, candidates)
        matched_record = None
        if best_id:
            db_rec = db.query(models.Warehouse).filter(models.Warehouse.id == best_id).first()
            if db_rec:
                matched_record = {"id": db_rec.id, "name": db_rec.name}
        
        results['Warehouse'] = {
            "query": wh_ref,
            "status": status,
            "confidence": f"{int(conf * 100)}%",
            "matched_record": matched_record,
            "candidates": cands
        }
        
    return results
