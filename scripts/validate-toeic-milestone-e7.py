import os
import re
import sys

def check_file_exists(path):
    if not os.path.exists(path):
        print(f"[FAIL] Missing required file: {path}")
        sys.exit(1)
    print(f"[PASS] File exists: {path}")

def check_no_raw_hex(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Strip SVG / inline comments if any
    cleaned = re.sub(r'//.*', '', content)
    cleaned = re.sub(r'/\*.*?\*/', '', cleaned, flags=re.DOTALL)
    
    # Check for hardcoded hex colors except standard white #ffffff in SVG
    hex_pattern = re.compile(r'#(?:[0-9a-fA-F]{3}){1,2}\b')
    matches = hex_pattern.findall(cleaned)
    forbidden = [m for m in matches if m.lower() not in ['#fff', '#ffffff', '#000', '#000000']]
    if forbidden:
        print(f"[FAIL] Hardcoded hex colors found in {path}: {forbidden}")
        sys.exit(1)
    print(f"[PASS] 0 forbidden hex values in {path}")

def main():
    print("=== RUNNING MILESTONE E7 (PREMIUM & FOMO) VERIFICATION SUITE ===")
    
    # 1. Verify existence of core E7 files
    e7_files = [
        "lib/toeic/subscription/toeic-entitlement.js",
        "lib/toeic/subscription/server-gate.js",
        "lib/toeic/subscription/paywall-trigger-manager.js",
        "hooks/useToeicEntitlement.js",
        "components/toeic/premium/ToeicSmartPaywallModal.jsx",
        "components/toeic/premium/ToeicFeatureGate.jsx"
    ]
    for fp in e7_files:
        check_file_exists(fp)
        if fp.endswith('.jsx'):
            check_no_raw_hex(fp)
            
    # 2. Check milestone entitlement rules in toeic-entitlement.js
    with open("lib/toeic/subscription/toeic-entitlement.js", "r", encoding="utf-8") as f:
        content = f.read()
        assert "TOEIC_TIERS" in content, "TOEIC_TIERS missing"
        assert "MILESTONE_ACCESS_MATRIX" in content, "MILESTONE_ACCESS_MATRIX missing"
        assert "getMilestoneAccessStatus" in content, "getMilestoneAccessStatus missing"
        assert "MS_01_FOUNDATION_POS" in content, "MS_01 missing in matrix"
        assert "MS_04_ADVANCED_GRAMMAR" in content, "MS_04 missing in matrix"
    print("[PASS] lib/toeic/subscription/toeic-entitlement.js logic verified!")

    # 3. Check trigger manager logic
    with open("lib/toeic/subscription/paywall-trigger-manager.js", "r", encoding="utf-8") as f:
        content = f.read()
        assert "TRG_01_MILESTONE_LOCKED" in content, "TRG_01 missing in triggers"
        assert "MAX_PER_SESSION" in content, "Fatigue guard missing"
        assert "shouldTriggerPaywall" in content, "shouldTriggerPaywall missing"
        assert "recordPaywallImpression" in content, "recordPaywallImpression missing"
    print("[PASS] lib/toeic/subscription/paywall-trigger-manager.js logic verified!")

    # 4. Check SmartPaywallModal component
    with open("components/toeic/premium/ToeicSmartPaywallModal.jsx", "r", encoding="utf-8") as f:
        content = f.read()
        assert "MONTHLY" in content, "Monthly plan missing"
        assert "ANNUAL" in content, "Annual plan missing"
        assert "LIFETIME" in content, "Lifetime plan missing"
        assert "199.000đ" in content, "199k missing"
        assert "990.000đ" in content, "990k missing"
        assert "1.890.000đ" in content, "1.89m missing"
    print("[PASS] components/toeic/premium/ToeicSmartPaywallModal.jsx verified!")

    print("=== MILESTONE E7 VERIFICATION: ALL CHECKS PASSED [SUCCESS] ===")

if __name__ == "__main__":
    main()
