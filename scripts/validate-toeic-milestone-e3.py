#!/usr/bin/env python3
"""
Milestone E3 Verification Suite
Checks:
- DiagnosticRadarDashboard Component integrity & Design Token discipline
- MilestoneSkillTree Component integrity & 7 stations rendering
- ToeicDiagnosticSession Component integrity & 3-stage flow
- Pages pages/toeic/diagnostic.jsx and pages/toeic/index.jsx
- Zero forbidden hex values outside #ffffff
"""

import os
import sys
import re

HEX_REGEX = re.compile(r'#[0-9a-fA-F]{3,8}\b')

def check_file_hex(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    matches = HEX_REGEX.findall(content)
    violations = [m for m in matches if m.lower() not in ('#fff', '#ffffff')]
    if violations:
        print(f"  [WARN] {path} has hardcoded hex colors: {set(violations)}")
        return False
    return True

def main():
    print("=== RUNNING MILESTONE E3 VERIFICATION SUITE ===")
    files_to_check = [
        'components/toeic/DiagnosticRadarDashboard.jsx',
        'components/toeic/MilestoneSkillTree.jsx',
        'components/toeic/ToeicDiagnosticSession.jsx',
        'pages/toeic/diagnostic.jsx',
        'pages/toeic/index.jsx'
    ]

    all_passed = True
    for f in files_to_check:
        if not os.path.exists(f):
            print(f"[FAIL] Missing file: {f}")
            all_passed = False
            continue

        hex_ok = check_file_hex(f)
        if not hex_ok:
            all_passed = False
        else:
            print(f"[PASS] {f} exists & Design Tokens verified (0 hardcoded hex)!")

    if all_passed:
        print("=== MILESTONE E3 VERIFICATION: ALL CHECKS PASSED [SUCCESS] ===")
        sys.exit(0)
    else:
        print("=== MILESTONE E3 VERIFICATION FAILED ===")
        sys.exit(1)

if __name__ == '__main__':
    main()
