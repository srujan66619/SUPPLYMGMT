from thefuzz import fuzz
print("Token set ratio Apex Component vs Apex Components Ltd.:", fuzz.token_set_ratio("Apex Component", "Apex Components Ltd."))
print("WRatio Apex Component vs Apex Components Ltd.:", fuzz.WRatio("Apex Component", "Apex Components Ltd."))

print("Token set ratio AX units vs AX-100:", fuzz.token_set_ratio("AX units", "AX-100"))
print("WRatio AX units vs AX-100:", fuzz.WRatio("AX units", "AX-100"))

print("Token set ratio Random Company vs Apex:", fuzz.token_set_ratio("Random Company", "Apex Components Ltd."))
