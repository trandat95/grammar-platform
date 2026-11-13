-- Migration 016: TOEIC User State, Skill Mastery & SRS Cards
-- Supports Milestone 2.13 (E1-E6) for TOEIC AI Adaptive Engine

-- 1. TOEIC USER PROFILE EXTENSION / STATE
CREATE TABLE IF NOT EXISTS public.toeic_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    display_name TEXT,
    current_theta NUMERIC(6,3) DEFAULT -0.5,
    predicted_toeic_score INTEGER DEFAULT 400,
    target_toeic_score INTEGER DEFAULT 650,
    daily_goal_questions INTEGER DEFAULT 30,
    streak_days INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. USER QUESTION RESPONSES (Telemetry & Adaptive Logging)
CREATE TABLE IF NOT EXISTS public.toeic_question_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL,
    session_type TEXT NOT NULL, -- 'DIAGNOSTIC' | 'MILESTONE_DRILL' | 'BOSS_GATE' | 'TWIN_REMEDIATION' | 'FULL_TEST'
    question_id TEXT NOT NULL,
    selected_option VARCHAR(2), -- 'A', 'B', 'C', 'D' or NULL
    is_correct BOOLEAN NOT NULL,
    time_spent_sec NUMERIC(6,2) NOT NULL,
    used_xray_hint BOOLEAN DEFAULT FALSE,
    triggered_error_code TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. USER SKILL MASTERY (24 Grammar & Reading/Listening Topics)
CREATE TABLE IF NOT EXISTS public.toeic_skill_mastery (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    grammar_topic_id TEXT NOT NULL,
    mastery_score NUMERIC(5,2) DEFAULT 0.0,
    accuracy_pct NUMERIC(5,2) DEFAULT 0.0,
    avg_time_sec NUMERIC(6,2) DEFAULT 0.0,
    speed_status TEXT DEFAULT 'UNRATED', -- 'FAST_ACCURATE' | 'SLOW_ACCURATE' | 'FAST_GUESSING' | 'WEAK'
    focus_priority_index NUMERIC(7,2) DEFAULT 0.0,
    questions_attempted INTEGER DEFAULT 0,
    questions_correct INTEGER DEFAULT 0,
    recent_error_streak INTEGER DEFAULT 0,
    last_practiced_at TIMESTAMPTZ,
    PRIMARY KEY (user_id, grammar_topic_id)
);

-- 4. USER ERROR PATTERN LOGS (15 Cognitive Errors)
CREATE TABLE IF NOT EXISTS public.toeic_error_pattern_logs (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    error_pattern_code TEXT NOT NULL,
    occurrence_count INTEGER DEFAULT 0,
    resolved_count INTEGER DEFAULT 0,
    last_question_id TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, error_pattern_code)
);

-- 5. USER MILESTONES (Personalized 7-Milestone Roadmap)
CREATE TABLE IF NOT EXISTS public.toeic_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    milestone_id TEXT NOT NULL,
    milestone_order INTEGER NOT NULL,
    status TEXT DEFAULT 'LOCKED', -- 'LOCKED' | 'IN_PROGRESS' | 'COMPLETED'
    injected_weak_topic_ids_json JSONB DEFAULT '[]'::jsonb,
    completed_drill_questions INTEGER DEFAULT 0,
    required_drill_questions INTEGER DEFAULT 48,
    best_boss_gate_accuracy NUMERIC(5,2) DEFAULT 0.0,
    boss_gate_passed BOOLEAN DEFAULT FALSE,
    unlocked_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    UNIQUE (user_id, milestone_id)
);

-- 6. USER SRS CARDS (Spaced Repetition Mistakes & Vocab)
CREATE TABLE IF NOT EXISTS public.toeic_srs_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    card_type TEXT NOT NULL, -- 'MISTAKE_QUESTION' | 'VOCABULARY'
    target_ref_id TEXT NOT NULL,
    error_pattern_code TEXT,
    ease_factor NUMERIC(4,2) DEFAULT 2.5,
    interval_days INTEGER DEFAULT 1,
    repetitions INTEGER DEFAULT 0,
    next_review_at TIMESTAMPTZ NOT NULL,
    UNIQUE (user_id, card_type, target_ref_id)
);

-- INDEXES FOR HOT PATHS
CREATE INDEX IF NOT EXISTS idx_toeic_resp_user_q ON public.toeic_question_responses(user_id, question_id);
CREATE INDEX IF NOT EXISTS idx_toeic_resp_session ON public.toeic_question_responses(session_id);
CREATE INDEX IF NOT EXISTS idx_toeic_mastery_fpi ON public.toeic_skill_mastery(user_id, focus_priority_index DESC);
CREATE INDEX IF NOT EXISTS idx_toeic_srs_due ON public.toeic_srs_cards(user_id, next_review_at);
CREATE INDEX IF NOT EXISTS idx_toeic_milestones_user ON public.toeic_milestones(user_id, milestone_order);

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE public.toeic_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.toeic_question_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.toeic_skill_mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.toeic_error_pattern_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.toeic_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.toeic_srs_cards ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES (Users manage only their own records)
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view their own toeic profile" ON public.toeic_users;
    CREATE POLICY "Users can view their own toeic profile" ON public.toeic_users
        FOR SELECT USING (auth.uid() = id);

    DROP POLICY IF EXISTS "Users can update their own toeic profile" ON public.toeic_users;
    CREATE POLICY "Users can update their own toeic profile" ON public.toeic_users
        FOR ALL USING (auth.uid() = id);

    DROP POLICY IF EXISTS "Users can view own toeic responses" ON public.toeic_question_responses;
    CREATE POLICY "Users can view own toeic responses" ON public.toeic_question_responses
        FOR SELECT USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can insert own toeic responses" ON public.toeic_question_responses;
    CREATE POLICY "Users can insert own toeic responses" ON public.toeic_question_responses
        FOR INSERT WITH CHECK (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can manage own toeic mastery" ON public.toeic_skill_mastery;
    CREATE POLICY "Users can manage own toeic mastery" ON public.toeic_skill_mastery
        FOR ALL USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can manage own toeic error logs" ON public.toeic_error_pattern_logs;
    CREATE POLICY "Users can manage own toeic error logs" ON public.toeic_error_pattern_logs
        FOR ALL USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can manage own toeic milestones" ON public.toeic_milestones;
    CREATE POLICY "Users can manage own toeic milestones" ON public.toeic_milestones
        FOR ALL USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can manage own toeic srs cards" ON public.toeic_srs_cards;
    CREATE POLICY "Users can manage own toeic srs cards" ON public.toeic_srs_cards
        FOR ALL USING (auth.uid() = user_id);
END $$;
