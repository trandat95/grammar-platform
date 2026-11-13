#!/usr/bin/env python3
"""
Full TOEIC Engine Verification Suite (Milestones E1 - E6)
Runs all sub-suite checks:
1. Milestone E1: Database V3.0 content, 4000 questions, 540 tracks, 6 user state tables, repository
2. Milestone E2: IRT 3PL ability estimation, score conversion, adaptive branching, roadmap generator, 8 API routes
3. Milestone E3: Diagnostic UI, Radar 6-axis chart, Top 3 Focus cards, 7-Milestone Skill Tree
4. Milestone E4: Sentence X-Ray Card 4-state machine, Twin-Questions remediation, guided drill
5. Milestone E5: Split Passage Reader multi-passage, tables, evidence auto-highlight, Boss Gate Checkpoint
6. Milestone E6: Dictation Studio 540 tracks, SRS flashcards, Grounded AI Tutor Drawer, AppShell2026 integration
7. Design Tokens: Zero hardcoded hex colors outside #ffffff
"""

import subprocess
import sys
import os

def run_suite(script_name):
    print(f"\n=======================================================")
    print(f"RUNNING: {script_name}")
    print(f"=======================================================")
    ret = subprocess.run([sys.executable, script_name])
    if ret.returncode != 0:
        print(f"[FAIL] {script_name} failed with code {ret.returncode}")
        return False
    return True

def main():
    print("=================================================================")
    print("STARTING FULL TOEIC AI ADAPTIVE SUITE VERIFICATION (E1 - E6)")
    print("=================================================================")

    scripts = [
        'scripts/validate-toeic-milestone-e1.py',
        'scripts/validate-toeic-milestone-e2.py',
        'scripts/validate-toeic-milestone-e3.py',
        'scripts/validate-toeic-milestone-e4.py',
        'scripts/validate-toeic-milestone-e5.py',
        'scripts/validate-toeic-milestone-e6.py',
        'scripts/validate-toeic-milestone-e7.py'
    ]

    for s in scripts:
        if not run_suite(s):
            print("\n❌ FULL TOEIC VERIFICATION SUITE FAILED!")
            sys.exit(1)

    print("\n=================================================================")
    print("🎉 ALL 7 TOEIC MILESTONES (E1 - E7) VERIFIED SUCCESSFULLY [PASS]!")
    print("=================================================================")
    sys.exit(0)

if __name__ == '__main__':
    main()
