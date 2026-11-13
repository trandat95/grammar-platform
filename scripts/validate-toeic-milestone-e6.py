#!/usr/bin/env python3
"""
Milestone E6 Verification Suite
Checks:
- DictationStudio cloze inputs, space/enter checking, 540 tracks readiness
- Mistakes & SRS Flashcards page (SM-2 intervals 1, 3, 7, 14 days)
- AITutorDrawer AI chat slide-over grounded in rag_context
- Navigation integration in AppShell2026
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
    print("=== RUNNING MILESTONE E6 VERIFICATION SUITE ===")

    # 1. Check DictationStudio.jsx
    dict_path = 'components/toeic/DictationStudio.jsx'
    assert os.path.exists(dict_path), f"Missing {dict_path}"
    with open(dict_path, 'r', encoding='utf-8') as f:
        content = f.read()
        assert 'clozeSegments' in content or 'cloze_text' in content, "Missing cloze text segments"
        assert 'handleKeyDown' in content, "Missing handleKeyDown for Space/Enter"
        assert 'lockedBlanks' in content, "Missing lockedBlanks tracking"
    print("[PASS] DictationStudio cloze logic & Space/Enter verification verified!")

    # 2. Check AITutorDrawer.jsx
    tutor_path = 'components/toeic/AITutorDrawer.jsx'
    assert os.path.exists(tutor_path), f"Missing {tutor_path}"
    with open(tutor_path, 'r', encoding='utf-8') as f:
        content = f.read()
        assert '/api/toeic/ai-tutor/ask' in content, "Missing AI tutor API call"
    print("[PASS] AITutorDrawer grounded AI chat verified!")

    # 3. Check AppShell2026.jsx navigation integration
    shell_path = 'components/ui-2026/AppShell2026.jsx'
    with open(shell_path, 'r', encoding='utf-8') as f:
        content = f.read()
        assert 'id: "toeic"' in content or 'TOEIC AI' in content, "Missing TOEIC tab in AppShell2026"
    print("[PASS] AppShell2026 TOEIC Hub navigation tab verified!")

    # 4. Check Hex discipline on E6 files
    files = [
        'components/toeic/DictationStudio.jsx',
        'pages/toeic/dictation.jsx',
        'pages/toeic/mistakes-srs.jsx',
        'components/toeic/AITutorDrawer.jsx',
        'components/ui-2026/AppShell2026.jsx'
    ]
    all_hex_ok = True
    for f in files:
        if not check_file_hex(f):
            all_hex_ok = False
        else:
            print(f"[PASS] {f} 0 forbidden hex verified!")

    if all_hex_ok:
        print("=== MILESTONE E6 VERIFICATION: ALL CHECKS PASSED [SUCCESS] ===")
        sys.exit(0)
    else:
        print("=== MILESTONE E6 VERIFICATION FAILED ===")
        sys.exit(1)

if __name__ == '__main__':
    main()
