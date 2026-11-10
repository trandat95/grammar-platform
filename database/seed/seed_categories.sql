-- =============================================================================
-- Seed Script: Core Book & Grammar Categories (Deterministic UUIDv5)
-- Idempotent via ON CONFLICT (code) DO UPDATE
-- =============================================================================

INSERT INTO books (id, title, authors, edition_note, source_file, total_lines, checksum)
VALUES (
    '9a75f785-49f1-51c9-9431-5b57c1623640',
    'Ngữ pháp tiếng Anh (English Grammar)',
    '["Mai Lan Hương", "Hà Thanh Uyên"]'::jsonb,
    'Bản Word Full (Markdown Migration)',
    'Ngữ pháp tiếng anh - Mai Lan Hương -Hà Thanh Uyên (Bản word full).md',
    16559,
    'verified-sha256-source-book'
)
ON CONFLICT (source_file) DO UPDATE SET
    title = EXCLUDED.title,
    total_lines = EXCLUDED.total_lines,
    updated_at = NOW();

INSERT INTO grammar_categories (code, name_en, name_vi, display_order)
VALUES
    ('CAT_VERBS_TENSES', 'Verbs & Tenses', 'Động từ và Các thì', 1),
    ('CAT_CLAUSES_PHRASES', 'Clauses & Phrases', 'Mệnh đề và Cụm từ', 2),
    ('CAT_DETERMINERS_QUANTIFIERS', 'Determiners & Quantifiers', 'Từ hạn định và Lượng từ', 3),
    ('CAT_SENTENCE_TRANSFORM_STYLE', 'Sentence Structure, Voice & Style', 'Cấu trúc câu, Thể và Văn phong', 4),
    ('CAT_PARTS_OF_SPEECH', 'Parts of Speech', 'Từ loại', 5),
    ('CAT_WORD_STUDY', 'Word Study, Formation & Idioms', 'Từ vựng học, Cấu tạo từ và Thành ngữ', 6),
    ('CAT_COMPREHENSIVE_PRACTICE', 'Comprehensive Assessment & Practice', 'Kiểm tra và Luyện tập tổng hợp', 7)
ON CONFLICT (code) DO UPDATE SET
    name_en = EXCLUDED.name_en,
    name_vi = EXCLUDED.name_vi,
    display_order = EXCLUDED.display_order,
    updated_at = NOW();
