import sqlite3
import os

db_path = os.path.join('ETS_Corpus_Normalized_Enriched_Database', 'ets_toeic_normalized.sqlite')
print(f"Connecting to {db_path}...")
conn = sqlite3.connect(db_path)
cur = conn.cursor()

ddl = """
-- 1. HỒ SƠ HỌC VIÊN (USERS)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    display_name TEXT,
    current_theta REAL DEFAULT -0.5,          -- Năng lực IRT hiện tại (-2.5 -> +2.5)
    predicted_toeic_score INTEGER DEFAULT 400,-- Điểm quy đổi (10 -> 990)
    target_toeic_score INTEGER DEFAULT 650,
    daily_goal_questions INTEGER DEFAULT 30,
    streak_days INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 2. LỊCH SỬ TRẢ LỜI TỪNG CÂU HỎI (USER QUESTION RESPONSES)
CREATE TABLE IF NOT EXISTS user_question_responses (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    session_id TEXT NOT NULL,                 -- ID của phiên Diagnostic, Milestone Drill hoặc Mock Test
    session_type TEXT NOT NULL,               -- 'DIAGNOSTIC' | 'MILESTONE_DRILL' | 'BOSS_GATE' | 'TWIN_REMEDIATION' | 'FULL_TEST'
    question_id TEXT NOT NULL REFERENCES questions(id),
    selected_option TEXT,                     -- 'A' | 'B' | 'C' | 'D' | NULL
    is_correct INTEGER NOT NULL,              -- 1 = Đúng, 0 = Sai
    time_spent_sec REAL NOT NULL,             -- Thời gian suy nghĩ thực tế (giây)
    used_xray_hint INTEGER DEFAULT 0,         -- 1 = Có bấm xem gợi ý X-Ray
    triggered_error_code TEXT REFERENCES error_patterns(code),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 3. MA TRẬN THÔNG THẠO 24 CHỦ ĐIỂM CỦA HỌC VIÊN (USER SKILL MASTERY)
CREATE TABLE IF NOT EXISTS user_skill_mastery (
    user_id TEXT NOT NULL REFERENCES users(id),
    grammar_topic_id TEXT NOT NULL REFERENCES grammar_topics(id),
    mastery_score REAL DEFAULT 0.0,           -- 0.0 -> 100.0 (%)
    accuracy_pct REAL DEFAULT 0.0,
    avg_time_sec REAL DEFAULT 0.0,
    speed_status TEXT DEFAULT 'UNRATED',      -- 'FAST_ACCURATE' | 'SLOW_ACCURATE' | 'FAST_GUESSING' | 'WEAK'
    focus_priority_index REAL DEFAULT 0.0,    -- Chỉ số FPI để xếp hạng ưu tiên trên Dashboard
    questions_attempted INTEGER DEFAULT 0,
    questions_correct INTEGER DEFAULT 0,
    recent_error_streak INTEGER DEFAULT 0,
    last_practiced_at TEXT,
    PRIMARY KEY (user_id, grammar_topic_id)
);

-- 4. THỐNG KÊ MẪU LỖI NHẬN THỨC CỦA HỌC VIÊN (USER ERROR PATTERN LOGS)
CREATE TABLE IF NOT EXISTS user_error_pattern_logs (
    user_id TEXT NOT NULL REFERENCES users(id),
    error_pattern_code TEXT NOT NULL REFERENCES error_patterns(code),
    occurrence_count INTEGER DEFAULT 0,
    resolved_count INTEGER DEFAULT 0,         -- Số lần đã sửa sai thành công qua Twin-Questions
    last_question_id TEXT REFERENCES questions(id),
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, error_pattern_code)
);

-- 5. LỘ TRÌNH MILESTONE CÁ NHÂN HÓA (USER MILESTONES)
CREATE TABLE IF NOT EXISTS user_milestones (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    milestone_id TEXT NOT NULL REFERENCES milestone_templates(milestone_id),
    milestone_order INTEGER NOT NULL,
    status TEXT DEFAULT 'LOCKED',             -- 'LOCKED' | 'IN_PROGRESS' | 'COMPLETED'
    injected_weak_topic_ids_json TEXT DEFAULT '[]', -- Các chủ điểm yếu của riêng cá nhân được chèn thêm
    completed_drill_questions INTEGER DEFAULT 0,
    required_drill_questions INTEGER DEFAULT 48,
    best_boss_gate_accuracy REAL DEFAULT 0.0,
    boss_gate_passed INTEGER DEFAULT 0,
    unlocked_at TEXT,
    completed_at TEXT,
    UNIQUE (user_id, milestone_id)
);

-- 6. SỔ TAY CÂU SAI & TỪ VỰNG ÔN TẬP NGẮT QUÃNG (USER SRS CARDS)
CREATE TABLE IF NOT EXISTS user_srs_cards (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    card_type TEXT NOT NULL,                  -- 'MISTAKE_QUESTION' | 'VOCABULARY'
    target_ref_id TEXT NOT NULL,              -- question.id hoặc vocabulary_items.id
    error_pattern_code TEXT,
    ease_factor REAL DEFAULT 2.5,
    interval_days INTEGER DEFAULT 1,
    repetitions INTEGER DEFAULT 0,
    next_review_at TEXT NOT NULL,
    UNIQUE (user_id, card_type, target_ref_id)
);

CREATE INDEX IF NOT EXISTS idx_resp_user_q ON user_question_responses(user_id, question_id);
CREATE INDEX IF NOT EXISTS idx_mastery_fpi ON user_skill_mastery(user_id, focus_priority_index DESC);
CREATE INDEX IF NOT EXISTS idx_srs_due ON user_srs_cards(user_id, next_review_at);
"""

cur.executescript(ddl)
conn.commit()

# Verify all tables in DB
cur.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = [row[0] for row in cur.fetchall()]
print("Tables now in SQLite:", sorted(tables))
assert "user_question_responses" in tables
assert "user_skill_mastery" in tables
assert "user_error_pattern_logs" in tables
assert "user_milestones" in tables
assert "user_srs_cards" in tables
assert "users" in tables
print("All 6 User State tables verified in SQLite!")
conn.close()
