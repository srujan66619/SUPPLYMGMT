import pytest
from resolver import fuzzy_match, parse_shipment_id

def test_exact_match():
    candidates = {1: ["Apex Components Ltd.", "apex"]}
    status, best_id, conf, cands = fuzzy_match("Apex Components Ltd.", candidates)
    assert status == "VERIFIED"
    assert best_id == 1
    assert conf == 1.0

def test_alias_match():
    candidates = {1: ["Apex Components Ltd.", "apex"]}
    status, best_id, conf, cands = fuzzy_match("apex", candidates)
    assert status == "VERIFIED"
    assert best_id == 1
    assert conf == 1.0

def test_fuzzy_match():
    candidates = {1: ["Apex Components Ltd.", "apex"]}
    status, best_id, conf, cands = fuzzy_match("Apex Component", candidates)
    assert status == "VERIFIED"
    assert best_id == 1

def test_no_match():
    candidates = {1: ["Apex Components Ltd.", "apex"]}
    status, best_id, conf, cands = fuzzy_match("Totally Random Company", candidates)
    assert status == "NOT FOUND"

def test_ambiguity():
    candidates = {
        1: ["AX-100 Control Unit", "ax100"],
        2: ["AX-200 Control Unit", "ax200"],
        3: ["AX-500 Control Unit", "ax500"]
    }
    status, best_id, conf, cands = fuzzy_match("AX Control", candidates)
    assert status == "NEEDS VERIFICATION"
    assert len(cands) >= 2

def test_case_and_punctuation():
    candidates = {1: ["Apex Components Ltd.", "apex"]}
    status, best_id, conf, cands = fuzzy_match("aPeX CoMpOnEnTs, lTd!", candidates)
    assert status == "VERIFIED"
    assert best_id == 1

def test_shipment_parsing():
    assert parse_shipment_id("SHP-1042") == 1042
    assert parse_shipment_id("1042") == 1042
    assert parse_shipment_id("No Shipment ID") == None
