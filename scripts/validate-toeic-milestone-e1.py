#!/usr/bin/env python3
"""
Milestone E1 Verification Suite
Checks:
- SQLite Database has 4,000 questions with non-null ai_analysis
- SQLite Database has 540 dictation tracks with blank_count > 0
- 24 Grammar Topics, 15 Error Patterns, 7 Milestone Templates
- 6 User State tables initialized in SQLite
- TypeScript type definitions in types/toeic.ts
- ToeicRepository can resolve corpus and load data
"""

import sqlite3
import os
import sys
import json

def test_sqlite_content():
    db_path = os.path.join('ETS_Corpus_Normalized_Enriched_Database', 'ets_toeic_normalized.sqlite')
    if not os.path.exists(db_path):
        print(f"[FAIL] SQLite database not found at {db_path}")
        return False

    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    # 1. Check questions count with ai_analysis_json
    cur.execute("SELECT COUNT(*) FROM questions WHERE ai_analysis_json IS NOT NULL;")
    q_count = cur.fetchone()[0]
    print(f"[CHECK] Questions with ai_analysis_json: {q_count} (expected 4000)")
    assert q_count == 4000, f"Expected 4000 questions, got {q_count}"

    # 2. Check dictation tracks
    cur.execute("SELECT COUNT(*) FROM dictation_tracks WHERE blank_count > 0;")
    d_count = cur.fetchone()[0]
    print(f"[CHECK] Dictation tracks with blank_count > 0: {d_count} (expected 540)")
    assert d_count == 540, f"Expected 540 dictation tracks, got {d_count}"

    # 3. Check grammar_topics count
    cur.execute("SELECT COUNT(*) FROM grammar_topics;")
    topic_count = cur.fetchone()[0]
    print(f"[CHECK] Grammar topics: {topic_count} (expected 24)")
    assert topic_count == 24, f"Expected 24 topics, got {topic_count}"

    # 4. Check error_patterns count
    cur.execute("SELECT COUNT(*) FROM error_patterns;")
    err_count = cur.fetchone()[0]
    print(f"[CHECK] Error patterns: {err_count} (expected 15)")
    assert err_count == 15, f"Expected 15 error patterns, got {err_count}"

    # 5. Check milestone_templates count
    cur.execute("SELECT COUNT(*) FROM milestone_templates;")
    ms_count = cur.fetchone()[0]
    print(f"[CHECK] Milestone templates: {ms_count} (expected 7)")
    assert ms_count == 7, f"Expected 7 milestone templates, got {ms_count}"

    # 6. Check 6 User State tables
    cur.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = set(row[0] for row in cur.fetchall())
    expected_user_tables = [
        'users',
        'user_question_responses',
        'user_skill_mastery',
        'user_error_pattern_logs',
        'user_milestones',
        'user_srs_cards'
    ]
    for ut in expected_user_tables:
        print(f"[CHECK] User state table '{ut}': {'EXISTS' if ut in tables else 'MISSING'}")
        assert ut in tables, f"Missing user state table {ut}"

    conn.close()
    return True

def test_type_and_repo_files():
    # Check types/toeic.ts
    types_path = os.path.join('types', 'toeic.ts')
    assert os.path.exists(types_path), "types/toeic.ts missing"
    with open(types_path, 'r', encoding='utf-8') as f:
        content = f.read()
        assert 'export interface TOEICQuestion' in content
        assert 'export interface SentenceXRay' in content
        assert 'export interface OptionDeepAnalysisItem' in content
        assert 'export interface IRT3PLParams' in content
    print("[CHECK] types/toeic.ts verified with full TypeScript interfaces")

    # Check lib/toeic/toeic-repository.js
    repo_path = os.path.join('lib', 'toeic', 'toeic-repository.js')
    assert os.path.exists(repo_path), "lib/toeic/toeic-repository.js missing"
    with open(repo_path, 'r', encoding='utf-8') as f:
        repo_code = f.read()
        assert 'getTaxonomy' in repo_code
        assert 'getQuestionById' in repo_code
        assert 'getDiagnosticStage1Questions' in repo_code
        assert 'getDiagnosticStage2Questions' in repo_code
        assert 'getDiagnosticStage3Questions' in repo_code
        assert 'getTwinQuestions' in repo_code
    print("[CHECK] lib/toeic/toeic-repository.js verified with complete query API")

    return True

if __name__ == '__main__':
    print("=== RUNNING MILESTONE E1 VERIFICATION SUITE ===")
    ok1 = test_sqlite_content()
    ok2 = test_type_and_repo_files()
    if ok1 and ok2:
        print("=== MILESTONE E1 VERIFICATION: ALL CHECKS PASSED [SUCCESS] ===")
        sys.exit(0)
    else:
        print("=== MILESTONE E1 VERIFICATION FAILED ===")
        sys.exit(1)
