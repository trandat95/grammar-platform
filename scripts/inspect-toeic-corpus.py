import sqlite3
import json
import os

db_path = os.path.join('ETS_Corpus_Normalized_Enriched_Database', 'ets_toeic_normalized.sqlite')
print(f"Checking SQLite at: {db_path} (exists: {os.path.exists(db_path)})")
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [row[0] for row in cur.fetchall()]
    print("Tables in sqlite:", tables)
    for t in tables:
        cur.execute(f"SELECT COUNT(*) FROM {t}")
        cnt = cur.fetchone()[0]
        print(f"  {t}: {cnt} rows")
    conn.close()

# Also check JSON files
for jf in ['ets_toeic_ai_grammar_master.json', 'grammar_taxonomy.json', 'error_pattern_catalog.json', 'milestone_templates.json', 'database_audit_report.json']:
    p = os.path.join('ETS_Corpus_Normalized_Enriched_Database', jf)
    if os.path.exists(p):
        print(f"JSON {jf}: {os.path.getsize(p)} bytes")
        with open(p, 'r', encoding='utf-8') as f:
            data = json.load(f)
            if isinstance(data, list):
                print(f"  List of {len(data)} items")
            elif isinstance(data, dict):
                print(f"  Dict with keys: {list(data.keys())[:8]}")
