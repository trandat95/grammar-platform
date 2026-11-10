# STEP 5 — Full Migration & Data Validation Report (`IMPORT_REPORT.md`)

## 1. Executive Summary of Full Migration

Following successful validation of the 3-chapter sample import, the full Markdown textbook (`Ngữ pháp tiếng anh - Mai Lan Hương -Hà Thanh Uyên (Bản word full).md`, `16,559` lines) was migrated into `data/normalized/full_import_data.json` and the relational verification database `data/normalized/full_grammar.db`.

- **Migration Status**: **PASSED (`0` data integrity errors, `0` failed records, `0` silently discarded lines)**
- **Source Line Coverage**: `Lines 1 to 16,559` (`100.0%` coverage across 12 chapters and 53 lessons)
- **Idempotency Verification**: Re-running the full import against the populated database produced `0` duplicate records and identical row counts across all 15 populated content tables.

## 2. Total Records Imported by Entity

| Entity / Table Name | Total Extracted | Successfully Imported | Failed Records | Notes |
| :--- | :---: | :---: | :---: | :--- |
| `books` | 1 | 1 | 0 | *Ngữ pháp tiếng Anh* — Mai Lan Hương & Hà Thanh Uyên |
| `grammar_categories` | 7 | 7 | 0 | Top-level pedagogical domains |
| `book_chapters` | 12 | 12 | 0 | Chapters 1 through 12 (`L1`–`L16559`) |
| `book_sections` | 53 | 53 | 0 | Lesson & reference structural units |
| `grammar_topics` | 65 | 65 | 0 | `12` parent chapter topics + `53` child subtopics |
| `lessons` | 53 | 53 | 0 | `52` grammar lessons + `1` comprehensive Practice Test |
| `lesson_sections` | 491 | 491 | 0 | Segmented into Form, Usage, Signal Words, Notes, etc. |
| `grammar_rules` | 982 | 982 | 0 | Searchable rules & syntactic formulas |
| `examples` | 1,026 | 1,026 | 0 | Bilingual EN/VI examples + `[NOT ...]` negative notes |
| `tables` (`lesson_tables`) | 7 | 7 | 0 | Theory pipe tables preserved as structured JSON + Markdown |
| `exercise_groups` | 31 | 31 | 0 | All `# EXERCISES` & `# PRACTICE TEST` blocks |
| `exercises` | 134 | 134 | 0 | All Roman-numeral (`I`–`XII`) and single-block exercises |
| `questions` | 2,939 | 2,939 | 0 | `100%` of questions across all 134 exercises |
| `question_options` | 327 | 327 | 0 | Extracted from parenthetical multiple-choice items |
| `question_answers` | 2,956 | 2,956 | 0 | `2,939` primary answers + `17` multi-blank cloze passage answers |
| `answer_explanations` | 2,956 | 2,956 | 0 | Bilingual answer key explanations linked to questions |
| **TOTAL RECORDS** | **12,040** | **12,040** | **0** | **100.0% Import Success Rate** |

## 3. Chapter-by-Chapter Migration Breakdown

| Ch # | Chapter Code | Line Range | Lessons | Theory Secs | Rules | Examples | Ex Groups | Exercises | Questions | Answer Entries | Verified Answers | Flagged (`NEEDS_REVIEW`) |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **01** | `CH01_TENSES` | `L1`–`L1152` | 13 | 53 | 101 | 75 | 1 | 12 | 225 | 225 | 221 | 4 |
| **02** | `CH02_SEQUENCE_OF_TENSES` | `L1153`–`L1613` | 2 | 3 | 12 | 10 | 1 | 4 | 100 | 100 | 99 | 1 |
| **03** | `CH03_CLAUSES_AND_PHRASES` | `L1614`–`L5098` | 9 | 59 | 91 | 163 | 9 | 43 | 711 | 711 | 669 | 42 |
| **04** | `CH04_EXPRESSION_OF_QUANTITY` | `L5099`–`L5524` | 4 | 12 | 15 | 36 | 1 | 7 | 96 | 104 | 104 | 0 |
| **05** | `CH05_STYLES` | `L5525`–`L6086` | 2 | 45 | 49 | 10 | 1 | 3 | 70 | 70 | 70 | 0 |
| **06** | `CH06_EMPHASIS` | `L6087`–`L6376` | 2 | 7 | 13 | 19 | 1 | 1 | 50 | 50 | 44 | 6 |
| **07** | `CH07_PARTS_OF_SPEECH` | `L6377`–`L10762` | 10 | 187 | 483 | 491 | 10 | 52 | 804 | 813 | 807 | 6 |
| **08** | `CH08_WORD_STUDY` | `L10763`–`L12120` | 4 | 72 | 101 | 85 | 2 | 2 | 345 | 345 | 344 | 1 |
| **09** | `CH09_REPORTED_SPEECH` | `L13030`–`L13418` | 2 | 15 | 24 | 24 | 1 | 1 | 50 | 50 | 50 | 0 |
| **10** | `CH10_PASSIVE_ACTIVE` | `L13419`–`L14172` | 2 | 12 | 36 | 41 | 1 | 4 | 135 | 135 | 135 | 0 |
| **11** | `CH11_SENTENCES` | `L14173`–`L14824` | 2 | 26 | 57 | 72 | 2 | 4 | 70 | 70 | 67 | 3 |
| **12** | `CH12_PRACTICE_TEST` | `L14825`–`L16559` | 1 | 0 | 0 | 0 | 1 | 1 | 283 | 283 | 283 | 0 |
| **ALL** | **Total Across Book** | `L1`–`L16559` | **53** | **491** | **982** | **1,026** | **31** | **134** | **2,939** | **2,956** | **2,893 (`97.87%`)** | **63 (`2.13%`)** |

## 4. Unclassified Content, Questions Requiring Manual Review, and Answers Requiring Verification

### A. Unclassified or Silently Discarded Content
- **Total Unclassified / Discarded Blocks**: **`0`**
- Every line from `L1` to `L16559` is mapped to a chapter, lesson, theory section, exercise, or answer key. The single floating Word formula line (`V (thường) + adv + enough` at `L11311` inside Word Forms Exercise) was explicitly logged in `WORD_FORMS:EX_I:Q_14.anomaly_note` rather than silently dropped.

### B. Questions Requiring Manual Review (`4` Questions)
| Question Code | Source Line | Anomaly Description & Action Taken |
| :--- | :---: | :--- |
| `TENSE_PRES_SIMPLE:EX_XII:Q_35` | `L819` | Source prints `35.1 (lose) my key. (can) you help me look for it?` (pronoun `I` merged into `35.1`). Preserved `original_number_label = '35.1'` and restored stem `I (lose) my key...`. |
| `CLAUSE_WISH:EX_I:Q_9` | `L1943` | Source prints `9.I wish she (come) to see me yesterday.` (missing space after period). |
| `POS_PREPOSITIONS:EX_VI:Q_15` | `L10377` | Source prints `15.I usually read the newspaper while I’m waiting the bus.` (missing space after period). |
| `WORD_FORMS:EX_I:Q_14` | `L11309` | Floating formula line `V (thường) + adv + enough` at `L11311` excluded from stem and logged in `anomaly_note`. |

### C. Answers Requiring Manual Verification (`63` Answers — `verification_status = 'NEEDS_REVIEW'`, `is_verified = false`)
1. **`CLAUSE_RELATIVE:EX_II` (`20` answers, `L4747`–`L4785`)**: Exercise II header in the exercises section (`L3513`) was misprinted as `# III.`, whereas the answer key (`L4747`) labels it `**II.**`. All 20 answers match 1-to-1 semantically and are flagged `NEEDS_REVIEW` due to the header discrepancy.
2. **`CLAUSE_RELATIVE:EX_VIII` (`20` answers, `L5009`–`L5047`)**: Answer group header at `L5009` was misprinted as `**IIX.**` instead of `**VIII.**`. All 20 answers match Exercise VIII (`L3825`) 1-to-1 and are flagged `NEEDS_REVIEW`.
3. **`EMPH_WRITING:EX_I:Q_38`..`Q_43` (`6` answers, `L6351`–`L6361`)**: In the Emphasis answer key, after items `35`–`37` (`L6339`–`L6343`), the book repeats numbers `35.`–`40.` (`L6351`–`L6361`) for Questions `38`–`43` before jumping to `44.` (`L6363`). Mapped by verified position `38`–`43` and flagged `NEEDS_REVIEW`.
4. **Single-Item Printed Number Typos in `ĐÁP ÁN` (`4` answers)**:
   - `POS_PRONOUNS:EX_VI:Q_8:ANS_1` (`L12303`: item 8 printed as second `7.`)
   - `POS_ADJECTIVES:EX_V:Q_3:ANS_1` (`L12375`: item 3 printed as `2. smell nice`)
   - `POS_ADJECTIVES:EX_VI:Q_5:ANS_1` (`L12381`: item 5 printed as `2. two-day`)
   - `POS_ADVERBS:EX_I:Q_6:ANS_1` (`L12401`: item 6 printed as `2. accurately`)
5. **Missing Punctuation / Spacing / Tag Typos in `ĐÁP ÁN` (`13` answers)**:
   - `TENSE_PRES_SIMPLE:EX_XII:Q_16`..`Q_18` (`L1085`: missing space in `11. am usually12.`) and `Q_35` (`L1099`: linked to `35.1` question)
   - `SEQ_TIME_CLAUSES:EX_III:Q_4` (`L1494`: sub-blank 5 bolded as `**5.** arranged` at `L1496`)
   - `CLAUSE_WISH:EX_I:Q_9` (`L4053`), `POS_PREPOSITIONS:EX_VI:Q_15` (`L12769`), `WORD_FORMS:EX_I:Q_14` (`L12841`)
   - `CLAUSE_PURPOSE:EX_IV:Q_2` (`L4211`: missing dot `2 to go`), `POS_PRONOUNS:EX_I:Q_20` (`L12261`: missing dot `20 he`), `SENT_CLASSIFICATION_KINDS:EX_II:Q_2` (`L14685`: missing dot `2 didn't he?`)
   - `SENT_BASIC_PATTERNS:EX_IV:Q_11` (`L14785`: `# A V O A` instead of `# S V O A`) and `Q_12` (`L14789`: `# S C O Co` instead of `# S V O Co`).
