-- =============================================================================
-- Migration 001: Initial Schema & Automated Audit Triggers
-- Target: PostgreSQL 15+ / Supabase
-- =============================================================================

\i ../schema.sql

-- Attach updated_at triggers to all mutable tables
DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOREACH tbl IN ARRAY ARRAY[
        'books', 'book_chapters', 'book_sections',
        'grammar_categories', 'grammar_topics', 'lessons', 'lesson_sections',
        'grammar_rules', 'examples', 'lesson_tables',
        'exercise_groups', 'exercises', 'questions', 'question_options',
        'question_answers', 'answer_explanations',
        'users', 'user_lesson_progress', 'user_exercise_results',
        'user_bookmarks', 'review_schedule'
    ]
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at ON %I;', tbl);
        EXECUTE format(
            'CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();',
            tbl
        );
    END LOOP;
END $$;
