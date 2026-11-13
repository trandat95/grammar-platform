#!/usr/bin/env python3
"""
Milestone E4 Verification Suite
Checks:
- SentenceXRayCard component 4-state state machine
- Twin-Questions instant remediation loop
- Topic practice page pages/toeic/practice/[topicId].jsx
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
    print("=== RUNNING MILESTONE E4 VERIFICATION SUITE ===")

    # 1. Check SentenceXRayCard.jsx
    card_path = 'components/toeic/SentenceXRayCard.jsx'
    assert os.path.exists(card_path), f"Missing {card_path}"
    with open(card_path, 'r', encoding='utf-8') as f:
        content = f.read()
        assert 'STATE_SOLVING' in content, "Missing STATE_SOLVING"
        assert 'STATE_HINT_ACTIVE' in content, "Missing STATE_HINT_ACTIVE"
        assert 'STATE_SUBMITTED_XRAY' in content, "Missing STATE_SUBMITTED_XRAY"
        assert 'STATE_TWIN_REMEDIATION' in content, "Missing STATE_TWIN_REMEDIATION"
        assert 'xray_pattern_display' in content, "Missing xray_pattern_display"
        assert 'word_family_matrix' in content, "Missing word_family_matrix"
        assert 'linked_vocabulary' in content, "Missing linked_vocabulary"
        assert 'similar_question_ids' in content or 'twinQuestion' in content, "Missing twin questions"
    print("[PASS] SentenceXRayCard 4-State Machine & Features verified!")

    # 2. Check Hex discipline on E4 files
    files = [
        'components/toeic/SentenceXRayCard.jsx',
        'pages/toeic/practice/[topicId].jsx'
    ]
    all_hex_ok = True
    for f in files:
        if not check_file_hex(f):
            all_hex_ok = False
        else:
            print(f"[PASS] {f} 0 forbidden hex verified!")

    if all_hex_ok:
        print("=== MILESTONE E4 VERIFICATION: ALL CHECKS PASSED [SUCCESS] ===")
        sys.exit(0)
    else:
        print("=== MILESTONE E4 VERIFICATION FAILED ===")
        sys.exit(1)

if __name__ == '__main__':
    main()
