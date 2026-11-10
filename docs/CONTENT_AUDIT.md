# STEP 1 — Full Markdown Content Audit Report (`CONTENT_AUDIT.md`)

## 1. Executive Summary & Source File Metadata

This document presents the complete line-by-line structural and quantitative audit of the source textbook `Ngữ pháp tiếng anh - Mai Lan Hương -Hà Thanh Uyên (Bản word full).md` prior to relational database schema design and automated Python migration.

| Metric / Attribute | Verified Value | Notes & Source Traceability |
| :--- | :--- | :--- |
| **Source File Name** | `Ngữ pháp tiếng anh - Mai Lan Hương -Hà Thanh Uyên (Bản word full).md` | Unmodified original Word-to-Markdown conversion |
| **Original Book Title** | *Ngữ pháp tiếng Anh* (*English Grammar*) | Authors: Mai Lan Hương – Hà Thanh Uyên |
| **Total Lines / Characters** | `16,559` lines / `465,209` characters | 100% of lines (`L1`–`L16559`) accounted for |
| **Total Major Chapters (`book_chapters`)** | `12` major chapters | Spanning Tenses through Comprehensive Practice Test |
| **Total Grammar Categories (`grammar_categories`)** | `7` top-level pedagogical categories | Verbs & Tenses, Clauses & Phrases, Determiners & Quantifiers, Parts of Speech, Word Study, Sentence Structure/Voice/Style, Comprehensive Practice |
| **Total Grammar Topics (`grammar_topics`)** | `65` hierarchical topics | `12` level-1 chapter topics + `53` level-2 subtopics |
| **Total Lessons (`lessons`)** | `53` distinct lessons (`book_sections`) | `52` theory/lesson units + `1` comprehensive test unit |
| **Total Theory Sections (`lesson_sections`)** | `491` structured theory sections | Segmented into Form, Usage, Signal Words, Notes, Classification, and Function |
| **Total Grammar Rules & Formulas (`grammar_rules`)** | `982` extracted rules & formulas | Includes explicit syntactic formulas, usage rules, and constraints |
| **Total Examples (`examples`)** | `1,026` example sentences | Extracted from `614` theory `Ex:` blocks (including multi-line continuation examples, Vietnamese translations, and `[NOT ...]` negative examples) |
| **Total Exercise Section Blocks (`exercise_groups`)** | `31` `# EXERCISES` / `# PRACTICE TEST` blocks | Mapped across the 12 major chapters |
| **Total Individual Exercises (`exercises`)** | `134` distinct exercises | Roman-numeral sub-exercises (`I`–`XII`) and single-block exercises |
| **Total Questions (`questions`)** | `2,939` individual questions | Contains `3,100+` individual fill-in/transformation blanks (including 30 multi-blank paragraphs in Sequence of Tenses Ex III) |
| **Total Multiple-Choice Options (`question_options`)** | `327` extracted option choices | Extracted from parenthetical inline choice exercises `(optA / optB)` |
| **Total Answer Entries (`question_answers`)** | `2,956` answer records | `2,939` question-level answers + `17` multi-blank cloze passage sub-answers (`0` unanswered questions, `0` unmapped answers) |
| **Verified vs. Flagged Answers** | `2,893` Verified (`97.87%`) / `63` Flagged (`2.13%`) | `63` answers flagged `NEEDS_REVIEW` due to source book numbering shifts or header typos |
| **Markdown Pipe Tables** | `8` pipe tables (`96` table lines) | `7` theory tables + `1` answer-key formatting table in Word Forms (`L12909`–`L12942`) |
| **Embedded Base64 Images** | `15` inline PNG equation images across `7` lines | Located in Numerals (`L9219`, `L9229`, `L9231`, `L9235`, `L9237`, `L9253`, `L9255`) representing fractions |

## 2. Comprehensive Breakdown of All 12 Major Chapters & 53 Subtopics

Unlike a uniform textbook where every chapter follows an identical `# Chapter -> ## Lesson -> ### Exercise -> ### Answer` hierarchy, this Markdown file exhibits **four distinct chapter-to-answer architectural patterns**:

1. **Immediate Chapter-End Answer Key Pattern** (Chapters 1, 2, 4, 5, 6, 9, 10, 12): Theory sections are followed by `# EXERCISES` (with Roman numerals `I`, `II`, ...) and immediately followed by `# ĐÁP ÁN` at the end of that chapter.
2. **Multi-Subtopic Chapter with Consolidated End-of-Chapter Answer Key Pattern** (Chapter 3: *Clauses and Phrases*): Contains 9 independent grammar subtopics, each with its own Theory and `# EXERCISES` inline (`L1614`–`L3920`), while all 9 Answer Keys are consolidated at the end of Chapter 3 (`L3921`–`L5098`) under subtopic headings.
3. **Cross-Chapter Mega-Consolidated Answer Key Pattern** (Chapters 7 & 8: *The Parts of Speech* and *Word Study*): Contains 14 subtopics across two major chapters (`L6377`–`L12120`) where exercises appear inline after each part of speech, but **all 12 corresponding Answer Keys** are deferred to a single consolidated block at `L12121`–`L13029` (starting with `**DANH TỪ (NOUNS)** **ĐÁP ÁN**`). Note that two subtopics in Chapter 8 (*Word Formations* `L10763`–`L11084` and *Acronyms* `L11841`–`L11914`) are pure theory/reference sections without exercises.
4. **Split-Exercise Interleaved Theory Pattern** (Chapter 11: *Sentences*): Theory Part I & II (`L14173`–`L14330`) are followed by `# EXERCISES` Groups `I`–`III` (`L14331`–`L14438`), then Theory Part III (*Basic Sentence Patterns*, `L14439`–`L14614`) intervenes before `# EXERCISES` Group `IV` (`L14615`–`L14658`), followed by the unified `# ĐÁP ÁN` (`L14659`–`L14824`) for Groups `I`–`IV`.

| Ch # | Chapter Code & Title | Line Range | Subtopics / Lessons | Theory Secs | Rules & Formulas | Examples | Ex Groups | Exercises | Questions | Answer Entries | Answer Key Location |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **01** | `CH01_TENSES` — Tenses (*Các thì*) | `L1`–`L1152` | 13 | 53 | 101 | 75 | 1 | 12 | 225 | 225 | `L959`–`L1152` (Immediate) |
| **02** | `CH02_SEQUENCE_OF_TENSES` — Sequence of Tenses (*Sự phối hợp các thì*) | `L1153`–`L1613` | 2 | 3 | 12 | 10 | 1 | 4 | 100 | 100 | `L1450`–`L1613` (Immediate) |
| **03** | `CH03_CLAUSES_AND_PHRASES` — Clauses and Phrases (*Mệnh đề và Cụm từ*) | `L1614`–`L5098` | 9 | 59 | 91 | 163 | 9 | 43 | 711 | 711 | `L3921`–`L5098` (Consolidated Ch3) |
| **04** | `CH04_EXPRESSION_OF_QUANTITY` — Expression of Quantity (*Sự diễn tả về số lượng*) | `L5099`–`L5524` | 4 | 12 | 15 | 36 | 1 | 7 | 96 | 104 | `L5449`–`L5524` (Immediate) |
| **05** | `CH05_STYLES` — Styles (*Văn phong*) | `L5525`–`L6086` | 2 | 45 | 49 | 10 | 1 | 3 | 70 | 70 | `L5945`–`L6086` (Immediate) |
| **06** | `CH06_EMPHASIS` — Emphasis (*Dạng nhấn mạnh*) | `L6087`–`L6376` | 2 | 7 | 13 | 19 | 1 | 1 | 50 | 50 | `L6275`–`L6376` (Immediate) |
| **07** | `CH07_PARTS_OF_SPEECH` — The Parts of Speech (*Từ loại*) | `L6377`–`L10762` | 10 | 187 | 483 | 491 | 10 | 52 | 804 | 813 | `L12121`–`L12832` (Deferred Mega-Block) |
| **08** | `CH08_WORD_STUDY` — Word Study (*Từ vựng học*) | `L10763`–`L12120` | 4 | 72 | 101 | 85 | 2 | 2 | 345 | 345 | `L12833`–`L13029` (Deferred Mega-Block) |
| **09** | `CH09_REPORTED_SPEECH` — Reported Speech (*Lời nói gián tiếp*) | `L13030`–`L13418` | 2 | 15 | 24 | 24 | 1 | 1 | 50 | 50 | `L13317`–`L13418` (Immediate) |
| **10** | `CH10_PASSIVE_ACTIVE` — The Passive and Active Sentences (*Câu chủ động – Câu bị động*) | `L13419`–`L14172` | 2 | 12 | 36 | 41 | 1 | 4 | 135 | 135 | `L13913`–`L14172` (Immediate) |
| **11** | `CH11_SENTENCES` — Sentences (*Câu*) | `L14173`–`L14824` | 2 | 26 | 57 | 72 | 2 | 4 | 70 | 70 | `L14659`–`L14824` (Split Exercises) |
| **12** | `CH12_PRACTICE_TEST` — Practice Test (*Bài tập tổng hợp*) | `L14825`–`L16559` | 1 | 0 | 0 | 0 | 1 | 1 | 283 | 283 | `L15957`–`L16559` (Immediate) |
| **TOTAL** | **All 12 Chapters** | `L1`–`L16559` | **53** | **491** | **982** | **1,026** | **31** | **134** | **2,939** | **2,956** | **100% Reconciled** |

### Complete Subtopic & Lesson Inventory (All 53 Units)

1. **Chapter 1 — Tenses (`CH01_TENSES`)**:
   - `1.1` The Present Simple Tense (*Thì hiện tại đơn*, `L3`–`L72`)
   - `1.2` The Present Continuous Tense (*Thì hiện tại tiếp diễn*, `L73`–`L116`)
   - `1.3` The Present Perfect Tense (*Thì hiện tại hoàn thành*, `L117`–`L184`)
   - `1.4` The Present Perfect Continuous Tense (*Thì hiện tại hoàn thành tiếp diễn*, `L185`–`L210`)
   - `1.5` The Past Simple Tense (*Thì quá khứ đơn*, `L211`–`L262`)
   - `1.6` The Past Continuous Tense (*Thì quá khứ tiếp diễn*, `L263`–`L310`)
   - `1.7` The Past Perfect Tense (*Thì quá khứ hoàn thành / Tiền quá khứ*, `L311`–`L330`)
   - `1.8` The Past Perfect Continuous Tense (*Thì quá khứ hoàn thành tiếp diễn*, `L331`–`L344`)
   - `1.9` The Simple Future Tense (*Thì tương lai đơn*, `L345`–`L380`)
   - `1.10` Near Future (*Tương lai gần: be going to / present continuous*, `L381`–`L414`)
   - `1.11` The Future Continuous Tense (*Thì tương lai tiếp diễn*, `L415`–`L432`)
   - `1.12` The Future Perfect Tense (*Thì tương lai hoàn thành*, `L433`–`L452`)
   - `1.13` The Future Perfect Continuous Tense (*Thì tương lai hoàn thành tiếp diễn & Ghi nhớ*, `L453`–`L474`)
2. **Chapter 2 — Sequence of Tenses (`CH02_SEQUENCE_OF_TENSES`)**:
   - `2.1` Main Clause and Subordinate Clause (*Sự phối hợp trong mệnh đề chính và mệnh đề phụ*, `L1159`–`L1178`)
   - `2.2` Main Clause and Adverbial Clause of Time (*Sự phối hợp trong mệnh đề chính và mệnh đề trạng ngữ chỉ thời gian*, `L1179`–`L1227`)
3. **Chapter 3 — Clauses and Phrases (`CH03_CLAUSES_AND_PHRASES`)**:
   - `3.1` Clauses of Condition (*Mệnh đề chỉ điều kiện: Types I, II, III, Unless, Inversion, Provided/In case*, `L1614`–`L1864`, Ans `L3921`–`L4046`)
   - `3.2` Clauses after Wish, If Only (*Mệnh đề sau Wish, If Only: Future, Present, Past wishes*, `L1865`–`L1998`, Ans `L4047`–`L4104`)
   - `3.3` Phrases and Clauses of Purpose (*Cụm từ và mệnh đề chỉ mục đích: to / in order to / so as to / so that / in order that*, `L1999`–`L2254`, Ans `L4105`–`L4226`)
   - `3.4` Phrases and Clauses of Result (*Cụm từ và mệnh đề chỉ kết quả: too...to, enough...to, so...that, such...that*, `L2255`–`L2626`, Ans `L4227`–`L4410`)
   - `3.5` Phrases and Clauses of Reason (*Cụm từ và mệnh đề chỉ lý do: because of / due to / owing to, because / since / as*, `L2627`–`L2758`, Ans `L4411`–`L4490`)
   - `3.6` Phrases and Clauses of Concession (*Cụm từ và mệnh đề chỉ sự nhượng bộ: in spite of / despite, although / though / even though / no matter / whatever*, `L2759`–`L2924`, Ans `L4491`–`L4614`)
   - `3.7` Clauses after As If, As Though, It's High Time, It's Time, Would Rather (`L2925`–`L3114`, Ans `L4615`–`L4668`)
   - `3.8` Noun Clauses (*Mệnh đề danh từ: Subject, Object, Complement, Object of Preposition*, `L3115`–`L3252`, Ans `L4669`–`L4712`)
   - `3.9` Relative Clauses (*Mệnh đề quan hệ: Pronouns, Adverbs, Defining/Non-defining, Prepositions, Reduced Participle/Infinitive Clauses*, `L3253`–`L3920`, Ans `L4713`–`L5098`)
4. **Chapter 4 — Expression of Quantity (`CH04_EXPRESSION_OF_QUANTITY`)**:
   - `4.1` Some / Any (`L5103`–`L5130`)
   - `4.2` Most / Most of (`L5131`–`L5162`)
   - `4.3` Much, Many, A great deal of, A large number of, A lot of, Lots of (`L5163`–`L5206`)
   - `4.4` Few, A Few, Little, A Little (`L5207`–`L5240`)
5. **Chapter 5 — Styles (`CH05_STYLES`)**:
   - `5.1` Stylistic Transformations (Noun/Adjective, Noun/Verb, Active/Passive, Adverb/Adjective shifts, `L5525`–`L5608`)
   - `5.2` 43 Canonical Verb–Noun Equivalence Expressions (`to look at = to have a look at`, etc., `L5609`–`L5696`)
6. **Chapter 6 — Emphasis (`CH06_EMPHASIS`)**:
   - `6.1` Emphasis in Pronunciation (`L6095`–`L6100`)
   - `6.2` Emphasis in Writing (Emphatic `do/does/did`, `It is/was...that` cleft sentences, Emphatic pronouns, Negative/Affirmative commands, `L6101`–`L6170`)
7. **Chapter 7 — The Parts of Speech (`CH07_PARTS_OF_SPEECH`)**:
   - `7.1` Nouns & Subject-Verb Agreement (*Danh từ: Classification, Functions, Plural Formation, Subject-Verb Agreement, Possessive Case*, `L6381`–`L6874`, Ans `L12121`–`L12252`)
   - `7.2` Pronouns (*Đại từ: Personal, Formal `it`, Possessive, Reflexive, Demonstrative, Indefinite, Relative, Predeterminers*, `L6875`–`L7366`, Ans `L12253`–`L12318`)
   - `7.3` Adjectives (*Tính từ: Descriptive, Limiting/Determiners, Participles `-ing/-ed`, Noun Adjuncts, Functions, OSASCOMP Word Order*, `L7367`–`L7814`, Ans `L12319`–`L12396`)
   - `7.4` Adverbs (*Trạng từ: Forms, Classification, Functions, `so`, Subject-Verb Inversion*, `L7815`–`L8130`, Ans `L12397`–`L12468`)
   - `7.5` Degrees of Comparison of Adjectives and Adverbs (*Các mức độ so sánh: Equal, Comparative, Double Comparative, Superlative, Irregulars*, `L8131`–`L8484`, Ans `L12469`–`L12548`)
   - `7.6` Verbs (*Động từ: Transitive/Intransitive/Linking, Infinitives, Gerunds, Participles, Notable Modals `would/used to/would rather/should/must/have to + perfective`*, `L8485`–`L9180`, Ans `L12549`–`L12652`)
   - `7.7` Numerals (*Số từ: Cardinal, Ordinal, Dates, Fractions*, `L9181`–`L9256`, Ans `L12653`–`L12672`)
   - `7.8` Prepositions (*Giới từ: Forms, Place/Time/Purpose, Detailed Uses of `at/in/on/by/to/into/out of/with/under`, Adjective+Prep, Verb+Prep*, `L9257`–`L10388`, Ans `L12673`–`L12772`)
   - `7.9` Conjunctions (*Liên từ: Forms, Coordinating `and/but/or/so`, Subordinating*, `L10389`–`L10506`, Ans `L12773`–`L12810`)
   - `7.10` Articles (*Mạo từ: Indefinite `a/an`, Definite `the` Mandatory vs. Zero-Article Rules*, `L10507`–`L10762`, Ans `L12811`–`L12832`)
8. **Chapter 8 — Word Study (`CH08_WORD_STUDY`)**:
   - `8.1` Word Formations (*Cách thành lập từ: Noun, Adjective, Verb, Adverb Prefixes & Suffixes*, `L10763`–`L11084` — Theory only)
   - `8.2` Word Forms (*Hình thức của từ: Syntactic Positions of Nouns, Adjectives, Adverbs, Verbs + 270-item Exercise*, `L11085`–`L11840`, Ans `L12833`–`L12947`)
   - `8.3` Acronyms (*27 Common International Acronyms with English expansions & Vietnamese translations*, `L11841`–`L11914` — Theory/Reference only)
   - `8.4` Idiomatic Expressions (*Thành ngữ `Verb + Noun + Preposition`: 36 core idioms + 75-item Exercise*, `L11915`–`L12120`, Ans `L12948`–`L13029`)
9. **Chapter 9 — Reported Speech (`CH09_REPORTED_SPEECH`)**:
   - `9.1` Tense, Modal, and Deictic Shifts in Reported Speech (`L13030`–`L13102`)
   - `9.2` Reporting Orders/Requests, Yes-No/Wh- Questions, Exclamations, Statements, and 5 Special Non-Backshift Cases (`L13103`–`L13418`)
10. **Chapter 10 — The Passive and Active Sentences (`CH10_PASSIVE_ACTIVE`)**:
    - `10.1` Core 4-Step Active-to-Passive Conversion Rules & Adverbial Placement (`L13419`–`L13536`)
    - `10.2` Special Passive Constructions (Causative `have/get`, Verbs of Perception, Verbs of Opinion/Reporting, Imperative `Let`, `L13537`–`L14172`)
11. **Chapter 11 — Sentences (`CH11_SENTENCES`)**:
    - `11.1` Classification & Kinds of Sentences (Declarative, Yes-No/Wh-/Tag Interrogative, Imperative, Exclamatory `How/What`, `L14173`–`L14438`, Ans `L14659`–`L14744`)
    - `11.2` Basic Sentence Patterns in English (Functional Roles `S, V, C, O, Od, OI, Co, Opre, A` & 8 Core Patterns `a`–`h`, `L14439`–`L14658`, Ans `L14745`–`L14824`)
12. **Chapter 12 — Practice Test (`CH12_PRACTICE_TEST`)**:
    - `12.1` Comprehensive Sentence Transformation Practice Test (283 exam-style sentence rewrite items covering all chapters of the book, `L14825`–`L16559`)

## 3. Distribution of Exercise Types Across All 134 Exercises & 2,939 Questions

The textbook contains a rich variety of exercises that go far beyond simple multiple-choice questions. Every exercise in the book has been classified into the platform's canonical taxonomy:

| Question Type Enum | Supported in Schema | Exercises Count | Questions Count | Representative Examples in Source Book |
| :--- | :---: | :---: | :---: | :--- |
| `FILL_IN_THE_BLANKS` | Yes | 56 | 1,180 | Tenses I–XII (verb conjugation in brackets), Sequence of Tenses III (30 multi-blank paragraphs), Prepositions I (`200` items), Articles (`40` items), Idioms (`75` items) |
| `REWRITE_SENTENCES` | Yes | 18 | 569 | Practice Test (`283` items with starter prompts), Clauses after Wish II (`25` items), Styles I–III (`70` items), Emphasis (`50` items), Adverbs VI (`20` inversions) |
| `SENTENCE_TRANSFORMATION` | Yes | 28 | 565 | Passive/Active Voice I–III (`125` items), Reported Speech (`50` items), Relative Clauses II–VI & VIII–X (`175` items), Clauses of Condition II–III & V (`50` items) |
| `WORD_FORMATION` | Yes | 1 | 270 | Word Forms Exercise (`L11279`–`L11840`: `270` sentences with root word in trailing parentheses, e.g., `(curiosity)` -> `curious`) |
| `MULTIPLE_CHOICE` | Yes | 11 | 151 | Inline binary/ternary choice in parentheses: Sequence of Tenses II (`20`), Quantifiers I & VII (`21`), Nouns V (`20`), Pronouns I, IV, VIII (`35`), Adjectives II (`10`), Adverbs I (`20`), Comparison I (`15`), Verbs II & III (`20`) |
| `COMPLETE_SENTENCES` | Yes | 8 | 115 | Open/semi-open clause completion: Sequence of Tenses IV (`10`), Condition IV (`10`), Purpose IV (`15`), Result VI (`20`), Noun Clauses II (`10`), Relative Clauses VII (`20`), Sentences II Question Tags (`20`), Comparison III (`10`) |
| `SHORT_ANSWER` | Yes | 4 | 40 | Clauses of Reason III (`Make questions with WHY`, `5` items), Numerals I–II (`Write dates/fractions in words`, `15` items), Sentences III (`Write questions for underlined words`, `20` items) |
| `MATCHING` | Yes | 5 | 28 | Passage/word-bank classification & syntactic tagging: Nouns I (`classify nouns`), Nouns II (`identify functions`), Nouns III (`group by -s/-es pronunciation`), Adverbs III (`two words from each group`), Sentences IV (`20` items identifying `S, V, O, C, A`) |
| `SENTENCE_ARRANGEMENT` | Yes | 1 | 15 | Adjectives IV (`L7671`–`L7702`: `Put the adjectives in brackets in the correct position`, `15` items) |
| `ERROR_CORRECTION` | Yes | 1 | 5 | Adverbs IV (`L8061`–`L8072`: `Are the underlined words right or wrong? Correct them where necessary`, `5` items) |
| `TRANSLATION` | Yes | 1 | 1 | Nouns IV (`L6795`–`L6798`: `Find the Vietnamese equivalents for singular and plural forms of the following nouns: Air, fruit, damage, pain, paper, work, salt`) |
| `TRUE_FALSE` | Yes (Schema ready) | 0 | 0 | Supported natively in `question_type` enum and `question_options` for online quizzes (Note: Adverbs IV combines Right/Wrong judgment with error correction) |

## 4. Content Structures Requiring Special Handling

1. **Multi-Blank Questions & Cloze Paragraphs**:
   - Many questions contain 2 to 11 blanks in a single item: e.g., Tenses Exercise XII Question 88 (`L927`–`L929`) is a 3-turn dialogue A/B/A with `6` verb blanks; Sequence of Tenses Exercise III (`L1354`–`L1427`) consists of `30` full biographical/narrative paragraphs each containing `4` to `11` numbered blanks `(1)`...`(11)`; Quantifiers VII (`L5445`) and Prepositions II (`L10227`) are single-paragraph cloze passages with `9` and `10` numbered blanks respectively.
   - **Handling**: The `questions` table includes `blank_count` and `metadata` JSONB, and `question_answers` includes `blank_index` so answers can be stored either as a composite sequence (`is running - wants`) or indexed per blank (`blank_index = 1..10`).
2. **Multiple Acceptable Answers & Optional Words**:
   - Answer keys frequently provide multiple valid answers separated by slashes `/` (e.g., `have you been studying/ have you studied` at `L969`, `Some/ many/ A large number of` at `L5491`) or parenthetical variations in full-sentence rewrites (e.g., `John suggested that Barry should put (to Barry that he should put) a better lock on door` at `L15959`).
   - In Articles (`L12811`) and Prepositions IV (`L12755`), zero-article or zero-preposition answers are denoted by `` or an empty blank between commas (`2. the, , the`).
   - **Handling**: `question_answers` stores `original_answer_text` verbatim alongside a normalized `correct_answer` and a `JSONB` array `alternative_answers` for automated grading. Empty/zero answers are normalized to `"∅ (No word needed)"` with `["", "∅"]` in `alternative_answers`.
3. **Markdown Pipe Tables in Both Theory and Answer Keys**:
   - There are `7` pipe tables in Theory sections (Sequence of Tenses `L1163`, `L1181`; Clauses of Condition `L1620`; Adjective Order `L7581`; Articles `L10527`; Reported Speech `L13052`, `L13088`) and `1` pipe table inside the Word-Form Answer Key (`L12909`–`L12942`, covering answers `149.` to `264.`).
   - **Handling**: Theory tables are extracted into structured JSONB blocks (`lesson_sections.structured_blocks`) as well as preserved in `raw_markdown`. The Word-Form answer key table is unwrapped cell-by-cell by `AnswerExtractor` so items `149`–`264` map cleanly to Questions `149`–`264`.
4. **Embedded Base64 Images for Fractions**:
   - In Chapter 7 (`NUMERALS`, `L9219`–`L9255`), 15 mathematical fractions (`1/6`, `2/5`, `13/47`, etc.) were exported from Word as inline `![](data:image/png;base64,...)` images across 7 lines (`5` lines in Theory + `2` lines in Exercise II).
   - **Handling**: Preserved verbatim in `raw_markdown` and `questions.stem` with `metadata.contains_base64_image = true`, while pairing each fraction in Exercise II with its exact spelled-out English fraction from the Answer Key (`five and two-sevenths`, etc.).
5. **Strikethrough Negative Examples**:
   - In 7 lines (`L113`, `L115`, `L309`, `L2999`, `L3383`, `L3395`, `L7167`), ungrammatical counter-examples use Markdown strikethrough syntax (`[NOT ...~~am-being~~]`).
   - **Handling**: Extracted into `examples.negative_example_note` while keeping the raw Markdown intact.
6. **Multi-Column Flattened Answer Keys**:
   - Five short answer keys (`Clauses of Condition III` at `L3959`, `Clauses after Wish I` at `L4049`, `Pronouns II` at `L12263`, `Pronouns VII` at `L12305`, and `Numerals II` at `L12663`) were originally formatted in 2 or 3 vertical columns in Word, so reading across each row yields numbers like `1. ... 5. ... 9. ...` on line 1 and `2. ... 6. ... 10. ...` on line 2.
   - **Handling**: Because the printed item numbers form the exact bijection `{1..N}`, `AnswerExtractor` detects complete column-major sets and sorts by printed number `1..N` rather than line position.

## 5. Catalogue of Data Quality Issues in the Source Markdown File

All data quality anomalies in the original Markdown file have been catalogued below with exact line references. Per engineering rules, the original Markdown file is **never modified**, and uncertain mappings are flagged in the database (`is_verified = false`, `verification_status = 'NEEDS_REVIEW'`).

| Issue ID | Category | Location (Line #) | Description of Source Data Quality Issue | Importer & Database Handling |
| :--- | :--- | :---: | :--- | :--- |
| **DQ-01** | Answer Numbering Shift | `L6339`–`L6361` | In **Emphasis (`ĐÁP ÁN`)**, after answers `35`–`37` (`L6339`–`L6343`), the source book accidentally repeats numbers `35.`–`40.` (`L6351`–`L6361`) for the answers to Questions `38`–`43`, before resuming at `44.` (`L6363`). Total answer lines = 50 (matching the 50 questions). | Reconciled by verified sequence position `38`–`43`; flagged all 6 answers (`EMPH_WRITING:EX_I:Q_38`..`Q_43`) as `NEEDS_REVIEW` (`is_verified = false`) with full audit note. |
| **DQ-02** | Exercise Header Typo | `L3513` | In **Relative Clauses (`EXERCISES`)**, Exercise II is misprinted as `# III. Use a Relative pronoun to combine...`, creating two `# III.` headers (`L3513` and `L3555`), whereas `# ĐÁP ÁN` (`L4747`) correctly labels it `**II.**`. | Mapped `L3513` to canonical `roman_numeral = 'II'` while preserving `original_label = 'III'`; flagged all 20 linked answers in `CLAUSE_RELATIVE:EX_II` as `NEEDS_REVIEW`. |
| **DQ-03** | Answer Header Typo | `L5009` | In **Relative Clauses (`ĐÁP ÁN`)**, Answer Group VIII is misprinted as `**IIX.**` instead of `**VIII.**`. | Mapped `**IIX.**` to canonical `VIII`; flagged all 20 linked answers in `CLAUSE_RELATIVE:EX_VIII` as `NEEDS_REVIEW`. |
| **DQ-04** | Question Number OCR Merge | `L819` | In **Tenses Exercise XII**, Question 35 is printed as `35.1 (lose) my key. (can) you help me look for it?` where the pronoun `I` was OCR-merged into `35.1`. | Parsed as Question `35` with `original_number_label = '35.1'`, restored stem `I (lose) my key...`, and flagged Question 35 and its answer as `NEEDS_REVIEW`. |
| **DQ-05** | Floating Formula Intrusion | `L11311` | In **Word Forms Exercise**, between Question 14 (`L11309`) and Question 15 (`L11313`), a stray formula line `V (thường) + adv + enough` from the Adverbs section appears due to a Word text-box anchor shift. | Excluded the stray formula line from Question 14's stem and recorded an anomaly note on `WORD_FORMS:EX_I:Q_14`. |
| **DQ-06** | Answer Key Single-Item Number Typos | `L12303`, `L12375`, `L12381`, `L12401` | Four individual answer items have a typo in their printed number: (1) **Pronouns VI** item 8 printed as second `7.` (`L12303`); (2) **Adjectives V** item 3 printed as `2. smell nice` (`L12375`); (3) **Adjectives VI** item 5 printed as `2. two-day` (`L12381`); (4) **Adverbs I** item 6 printed as `2. accurately` (`L12401`). | Matched to their verified positions (`Q8`, `Q3`, `Q5`, `Q6`) since group counts match 100%, and flagged all 4 answers as `NEEDS_REVIEW`. |
| **DQ-07** | Missing Period / Space on Numbers | `L1085`, `L1943`, `L4211`, `L10377`, `L12261`, `L12656`, `L14685` | Missing whitespace or periods around question/answer numbers: `11. am usually12.` (`L1085`), `9.I wish` (`L1943`), `2 to go to the cinema` (`L4211`), `15.I usually` (`L10377`), `20 he` (`L12261`), `3.13th January` (`L12656`), `2 didn't he?` (`L14685`). | Tokenized via context-aware regex in `ExerciseExtractor` and `AnswerExtractor`; flagged affected records as `NEEDS_REVIEW`. |
| **DQ-08** | Sub-Blank Bold Typo | `L1496` | In **Sequence of Tenses Exercise III (`ĐÁP ÁN`)**, blank 5 of Paragraph 4 is bolded at the start of a line as `**5.** arranged 6. have heard...` (`L1496`) right before real Paragraph `**5.** 1. had 2. missed` (`L1498`). | Detected by checking whether `1.` follows `**5.**`; attached `5. arranged...` to Paragraph 4 and flagged `SEQ_TIME_CLAUSES:EX_III:Q_4` as `NEEDS_REVIEW`. |
| **DQ-09** | Sentence Pattern Tag Typos in Answer Key | `L14787`, `L14791` | In **Sentences Exercise IV (`ĐÁP ÁN`)**, all 20 sentence pattern labels are formatted as `# S V O` Markdown H1 headings; additionally, Q11 prints `# A V O A` (instead of `S V O A`) and Q12 prints `# S C O Co` (instead of `S V O Co`). | Stripped spurious `#` heading markers, preserved original pattern strings verbatim, and flagged Q11 and Q12 answers as `NEEDS_REVIEW`. |
| **DQ-10** | Heading & Instruction OCR Typos | `L73`, `L2003`, `L3451`, `L4411`, `L8957` | Minor OCR typos in headings/instructions: `The Present eontinuous Tense` (`L73`), `Phrases of purpese` (`L2003`), `Put commas wheel they are needed` (`L3451`), `PHRASES AND CEAUSES OF REASON` (`L4411`), `SHOULD + PERFEGTIWE` (`L8957`). | Preserved original headings in `original_heading` / `raw_markdown` for auditability while providing clean normalized titles in `title_en` and `title_vi`. |
