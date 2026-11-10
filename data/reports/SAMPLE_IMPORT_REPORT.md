# STEP 6 — Sample Import & Quality Review Report (`SAMPLE_IMPORT_REPORT.md`)

## 1. Representative Sample Selection Rationale

Before running the full migration across all 16,559 lines, we selected **3 representative chapters** (`Lines 1–5098`) that exercise every structural pattern and edge case identified in `CONTENT_AUDIT.md`:

1. **Chapter 1: `CH01_TENSES` (*Các thì*, `L1`–`L1152`)** — Theory-heavy chapter with 13 distinct lessons (Present Simple through Future Perfect Continuous), formulas, negative/interrogative forms, usage bullets, strikethrough negative examples (`[NOT ...~~am-being~~]`), 12 Roman-numeral exercises (`I`–`XII`), and an immediate chapter-end `# ĐÁP ÁN` block (`L959`–`L1152`).
2. **Chapter 2: `CH02_SEQUENCE_OF_TENSES` (*Sự phối hợp các thì*, `L1153`–`L1613`)** — Contains `2` Markdown pipe tables (`L1163`, `L1181`), inline binary multiple-choice questions (`Exercise II`), `30` multi-blank narrative cloze paragraphs (`Exercise III`, with 4 to 11 numbered blanks per paragraph), and open-ended clause completion (`Exercise IV`).
3. **Chapter 3: `CH03_CLAUSES_AND_PHRASES` (*Mệnh đề và Cụm từ*, `L1614`–`L5098`)** — Multi-subtopic chapter containing `9` distinct lessons (Conditionals, Wish/If Only, Purpose, Result, Reason, Concession, As If/It's Time/Would Rather, Noun Clauses, Relative Clauses), `43` exercises across transformation, rewrite, fill-in-the-blank, and sentence completion, and a **consolidated end-of-chapter `# ĐÁP ÁN` block** (`L3921`–`L5098`) containing column-major answer tables and Roman numeral header typos (`# III.` for `II` at `L3513`; `**IIX.**` for `VIII` at `L5009`).

## 2. Sample Import Metrics & Database Verification

The sample dataset was extracted to `data/normalized/sample_import_data.json` and loaded into the relational test database `data/normalized/sample_grammar.db`.

| Relational Entity (`Table`) | Extracted in Memory | Imported in SQLite DB | Failed / Rejected | Idempotency Check (Run 2 Count) |
| :--- | :---: | :---: | :---: | :---: |
| `books` | 1 | 1 | 0 | 1 |
| `grammar_categories` | 2 | 2 | 0 | 2 |
| `book_chapters` | 3 | 3 | 0 | 3 |
| `book_sections` | 24 | 24 | 0 | 24 |
| `grammar_topics` | 27 | 27 | 0 | 27 |
| `lessons` | 24 | 24 | 0 | 24 |
| `lesson_sections` | 115 | 115 | 0 | 115 |
| `grammar_rules` | 204 | 204 | 0 | 204 |
| `examples` | 248 | 248 | 0 | 248 |
| `tables` (`lesson_tables`) | 3 | 3 | 0 | 3 |
| `exercise_groups` | 11 | 11 | 0 | 11 |
| `exercises` | 59 | 59 | 0 | 59 |
| `questions` | 1,036 | 1,036 | 0 | 1,036 |
| `question_options` | 40 | 40 | 0 | 40 |
| `question_answers` | 1,036 | 1,036 | 0 | 1,036 |
| `answer_explanations` | 1,036 | 1,036 | 0 | 1,036 |

## 3. Sample Comparison Against Original Markdown & Anomaly Audit

| Audit Dimension | Verification Result | Concrete Sample Verification Details |
| :--- | :---: | :--- |
| **Question-to-Answer Reconciliation** | **100% (`1,036 / 1,036`)** | `0` unanswered questions, `0` unmapped answer entries across all 59 exercises in Chapters 1–3. |
| **Multi-Blank Cloze Paragraphs** | **Verified (`30 / 30`)** | Sequence of Tenses Exercise III (`L1354`–`L1427`) extracted all 30 multi-blank paragraphs and reconciled all sub-answers (`1..N`) from `L1482`–`L1593`, including the bolded sub-blank typo `**5.** arranged` in Paragraph 4 (`L1496`). |
| **Multi-Column Answer Keys** | **Verified (`2 / 2`)** | Clauses of Condition Exercise III (`L3959`–`L3965`) and Clauses after Wish Exercise I (`L4049`–`L4053`) were accurately re-ordered from 3-column row-flattened text (`1, 5, 9 / 2, 6, 10...`) into exact `Q1`–`Q10` mappings. |
| **Questions Flagged for Manual Review** | **`2` Questions** | (1) `TENSE_PRES_SIMPLE:EX_XII:Q_35` (`L819`: OCR merge `35.1 (lose)` -> preserved `original_number_label = '35.1'`); (2) `CLAUSE_WISH:EX_I:Q_9` (`L1943`: missing space `9.I wish`). |
| **Answers Flagged for Verification** | **`47` Answers (`4.54%`)** | Includes 20 answers in `CLAUSE_RELATIVE:EX_II` (where Exercise header was misprinted `# III.` at `L3513`), 20 answers in `CLAUSE_RELATIVE:EX_VIII` (where Answer header was misprinted `**IIX.**` at `L5009`), 3 answers in `TENSE_PRES_SIMPLE:EX_XII` (`L1085` missing space around `11. am usually12.`), and 1 answer in `CLAUSE_PURPOSE:EX_IV:Q_2` (`L4211` missing dot in `2 to go`). |
| **Verified Answers** | **`989` Answers (`95.46%`)** | Automatically verified with exact number, group, and count correspondence. |
