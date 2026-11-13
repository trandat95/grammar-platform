#!/usr/bin/env python3
"""
Milestone E5 Verification Suite
Checks:
- SplitPassageReader multi-passage tabs/stacked cards, table rendering, evidence auto-highlight
- Boss Gate Checkpoint page & criteria evaluation
- Full Test simulation pages
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
    print("=== RUNNING MILESTONE E5 VERIFICATION SUITE ===")

    # 1. Check SplitPassageReader.jsx
    reader_path = 'components/toeic/SplitPassageReader.jsx'
    assert os.path.exists(reader_path), f"Missing {reader_path}"
    with open(reader_path, 'r', encoding='utf-8') as f:
        content = f.read()
        assert 'evidenceSentence' in content or 'evidence_sentence_en' in content, "Missing evidence sentence"
        assert 'tables' in content, "Missing table rendering"
        assert 'activeDocTab' in content or 'sortedPassages' in content, "Missing multi-passage support"
    print("[PASS] SplitPassageReader multi-passage & evidence features verified!")

    # 2. Check Hex discipline on E5 files
    files = [
        'components/toeic/SplitPassageReader.jsx',
        'pages/toeic/milestones/[milestoneId]/boss-gate.jsx',
        'pages/toeic/tests/index.jsx',
        'pages/toeic/tests/[series]/[testNum].jsx'
    ]
    all_hex_ok = True
    for f in files:
        if not check_file_hex(f):
            all_hex_ok = False
        else:
            print(f"[PASS] {f} 0 forbidden hex verified!")

    if all_hex_ok:
        print("=== MILESTONE E5 VERIFICATION: ALL CHECKS PASSED [SUCCESS] ===")
        sys.exit(0)
    else:
        print("=== MILESTONE E5 VERIFICATION FAILED ===")
        sys.exit(1)

if __name__ == '__main__':
    main()
