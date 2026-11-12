#!/usr/bin/env python3
"""
Non-destructive Academic Theory Normalizer for data/ui/preview_data.json.
Preserves all 12 chapters, 53 lessons, 2,939 quiz questions, and Mai Lan Huong
pedagogical content while repairing OCR/extraction defects:
  1. Removes duplicate leading numbering ("08 8.") and fixes cut-off section titles.
  2. Consolidates Mạo từ micro-sections (3..24) into 2 textbook reference tables.
  3. Fixes broken markdown asterisks (***, **, *), PUA Wingdings symbols, and OCR typos.
  4. Merges mid-sentence line wraps in paragraphs and removes floating lone POS tokens.
  5. Repairs malformed tables (Conditionals, Reported Speech, Articles, Adjective Order).
  6. Deduplicates formulas and clears fake boilerplate Vietnamese placeholder translations.
"""
import copy
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PREVIEW_PATH = os.path.join(ROOT, "data", "ui", "preview_data.json")


def clean_pua_and_whitespace(s: str) -> str:
    if not isinstance(s, str):
        return ""
    s = s.replace("\uf0ae", "→").replace("\uf03d\uf03e", "⇔").replace("\uf03e", "⇔").replace("\uf03d", "⇔")
    s = s.replace("(Xem phần Relative Clause trang 83)", "(Xem thêm bài Mệnh đề quan hệ)")
    s = re.sub(r"[ \t]{2,}", " ", s)
    return s.strip()


def clean_markdown(s: str, strip_all_stars: bool = False) -> str:
    s = clean_pua_and_whitespace(s)
    if not s:
        return ""
    # Fix ***1.* TOO** -> **1. TOO**
    s = re.sub(r"\*\*\*([^*]+?)\.\*\s*([^*]+?)\*\*", r"**\1. \2**", s)
    # Fix ***word*** inside titles/sentences -> **word**
    s = re.sub(r"\*\*\*([^*\n]+?)\*\*\*", r"**\1**", s)
    # Fix *(có* *thật...)* -> *(có thật...)*
    s = re.sub(r"\*([^*\n]+?)\*\s+\*([^*\n]+?)\*", r"*\1 \2*", s)
    # Fix Adj** **N -> Adj + N
    s = re.sub(r"\*\*\s+\*\*", " ", s)
    # Fix broken leading "*** text" or "** text"
    s = re.sub(r"^\*{1,3}\s+(?=\S)", "", s)
    # Fix trailing orphan "*" or "**" after punctuation or word like "Provided* (that)" or "that*)"
    s = re.sub(r"(\w)\*\s+\(", r"\1 (", s)
    s = re.sub(r"\)\*", ")", s)
    # Fix "2. SUCH ... THAT* (quá ... đến nỗi)*"
    s = re.sub(r"\*\*\s*([^*]+?)\*\s*\(([^)]+)\)\*", r"**\1** *(\2)*", s)
    s = re.sub(r"([^*\s])\*\s*\(([^)]+)\)\*", r"\1 *(\2)*", s)
    # Fix "**text*" mismatched end
    s = re.sub(r"\*\*([^*\n]+?)\*(?!\*)", r"**\1**", s)

    if strip_all_stars:
        s = s.replace("*", "")
    else:
        # Remove obviously unpaired trailing/leading asterisks on short spans
        if s.endswith("***") and s.count("***") == 1:
            s = s[:-3]
        if s.count("*") % 2 == 1:
            # Remove single lone '*' before space or at start/end
            s = re.sub(r"(^|\s)\*(?=\s|$)", r"\1", s)
            if s.count("*") % 2 == 1:
                # Remove an unmatched single '*' (not part of **)
                s = re.sub(r"(?<!\*)\*(?!\*)", "", s, count=1)

    return re.sub(r"\s{2,}", " ", s).strip()


def strip_leading_number(title: str) -> str:
    t = clean_markdown(title, strip_all_stars=True)
    # Remove leading "1.", "12.", "08." and stray symbols like ♦, •
    t = re.sub(r"^\d+[\.\)\:]\s*", "", t).strip()
    t = re.sub(r"^[♦•■\*]+\s*", "", t).strip()
    return t


def is_fake_vi(vi: str, en: str = "") -> bool:
    if not vi or not isinstance(vi, str):
        return True
    v = vi.strip()
    if "Ví dụ minh họa chuẩn mực" in v:
        return True
    if v.startswith("Bản dịch minh họa:"):
        return True
    if en and v.lower() == en.strip().lower():
        return True
    return False


def is_fragment_example(en: str) -> bool:
    if not en or not isinstance(en, str):
        return True
    s = en.strip()
    if len(s) < 4:
        return True
    if re.match(r"^(N|Adj|Adv|V|Prep|Conj|Pron|O|S)(\s*[,/+]*\s*(N|Adj|Adv|V|Prep|Conj|Pron|O|S))*\.?$", s):
        return True
    return False


def fix_known_section_titles(lesson_title: str, sec_title: str, sec: dict) -> str:
    t = strip_leading_number(sec_title)

    # Fix cut-off word typos from OCR
    t = t.replace("Phrases of purpese", "Phrases of purpose")
    t = t.replace("Adverbial clauses off result", "Adverbial clauses of result")
    t = t.replace("Simple Preseent", "Simple Present")

    # Targeted fixes for known cut-off / cryptic titles per lesson
    exact_map = {
        ("Mệnh đề chỉ điều kiện", "Ta cũng có thể diễn tả câu điều kiện mà không cần dùng IF hay UNLESS bằng cách đảo chủ ngữ"):
            "Đảo ngữ trong câu điều kiện (không dùng IF / UNLESS)",
        ("Mệnh đề sau Wish, If Only", "If only"):
            "Cấu trúc & Cách dùng với WISH / IF ONLY",
        ("Cụm từ và mệnh đề chỉ mục đích", "so as to"):
            "Cụm từ chỉ mục đích khẳng định & phủ định (to / in order to / so as to)",
        ("Cụm từ và mệnh đề chỉ mục đích", "in order that +"):
            "Cấu trúc mệnh đề chỉ mục đích (so that / in order that)",
        ("Cụm từ và mệnh đề chỉ mục đích", "Cấu trúc nguyên mẫu V(bare)"):
            "Mệnh đề với will / would / can / could + V(bare)",
        ("Cụm từ và mệnh đề chỉ sự nhượng bộ", "despite"):
            "Cụm từ chỉ sự nhượng bộ (In spite of / Despite)",
        ("Mệnh đề sau As If, As Though, It's Time, Would Rather", "as if"):
            "Mệnh đề sau AS IF / AS THOUGH",
        ("Mệnh đề sau As If, As Though, It's Time, Would Rather", "as though"):
            "Cấu trúc giả định với AS IF / AS THOUGH",
        ("Mệnh đề sau As If, As Though, It's Time, Would Rather", "Cấu trúc bổ sung"):
            "Giả định trái thực tế ở hiện tại (Past Simple / Subjunctive)",
        ("Mệnh đề sau As If, As Though, It's Time, Would Rather", "It’s time"):
            "Cấu trúc It's time / It's high time + S + V(past simple)",
        ("Mệnh đề sau As If, As Though, It's Time, Would Rather", "It's high time"):
            "Các mẫu câu với It's time / It's high time",
        ("Các cách diễn đạt câu văn", "V + O + Adv"):
            "Chuyển đổi cấu trúc Danh từ, Động từ, Tính từ & Trạng từ",
        ("Danh từ", "về một cái hay nhiều cái."):
            "Danh từ đếm được số ít và số nhiều (Singular & Plural)",
        ("Danh từ", "Neither"):
            "Đại từ & Từ hạn định đi với động từ số ít (Each, Every, Either, Neither)",
        ("Danh từ", "Some"):
            "Danh từ hình thức số nhiều nhưng mang nghĩa số ít",
        ("Đại từ", "Singular Plural"):
            "Đại từ nhân xưng chủ ngữ (Subjective Pronouns)",
        ("Đại từ", "Đại từ sở hữu (possessive pronouns) là hình thức sở hữu của đại từ nhân xưng. Đại từ sở hữu"):
            "Đại từ sở hữu & Đại từ phản thân (Possessive & Reflexive Pronouns)",
        ("Đại từ", "Some => somebody, someone (ai đó), something (cái gì đó)"):
            "Đại từ bất định với SOME (somebody, someone, something)",
        ("Đại từ", "No => nobody, no one, nothing (không ai không cái gì ...)"):
            "Đại từ bất định mang nghĩa phủ định với NO (nobody, no one, nothing)",
        ("Đại từ", "Có thể dùng some of/ none of... + us/you/ them."):
            "Quy tắc dùng lượng từ (some, most, none, both, neither, either) với OF",
        ("Đại từ", "Không dùng all để chỉ everybody, everyone."):
            "Phân biệt Everybody/Everyone với All, Little và Much",
        ("Các mức độ so sánh của tính từ và trạng từ", "Adj N"):
            "Chuyển đổi cặp Tính từ ⇔ Danh từ (Adj ⇔ N)",
        ("Các mức độ so sánh của tính từ và trạng từ", "less + adj (adv)"):
            "So sánh kém hơn (less + adj/adv) & nhấn mạnh (much / far)",
        ("Các mức độ so sánh của tính từ và trạng từ", "of + plural noun"):
            "So sánh nhất (Superlative) & các trường hợp bất quy tắc",
        ("Cách thành lập từ", "V N V N"):
            "Hậu tố thành lập Danh từ từ Động từ (V → N)",
        ("Cách thành lập từ", "khác."):
            "Tiền tố tạo Danh từ mới (super-, under-, sur-, sub-)",
        ("Cách thành lập từ", "N Adj N Adj"):
            "Hậu tố thành lập Tính từ từ Danh từ (N → Adj)",
        ("Cách thành lập từ", "tính từ."):
            "Tiền tố phủ định của Tính từ (un-, in-, im-, il-, ir-)",
        ("Cách thành lập từ", "khứ phân từ."):
            "Tính từ ghép kết hợp Quá khứ phân từ (Adv + V3/ed)",
        ("Hình thức của từ", "Sau enough"):
            "Danh từ đứng sau enough (enough + N)",
        ("Hình thức của từ", "trúc a/ an/ the + adj + noun)"):
            "Danh từ sau mạo từ & tính từ (a/an/the + Adj + N)",
        ("Hình thức của từ", "Sau giới từ (in, on, of, with,...)"):
            "Danh từ đứng sau giới từ (in, on, of, with...)",
        ("Hình thức của từ", "Cuối câu."):
            "Trạng từ đứng cuối câu (S + V (+ O) + Adv)",
        ("Hình thức của từ", "của câu bằng dấu phẩy (,)."):
            "Trạng từ đứng đầu hoặc giữa câu (ngăn cách bởi dấu phẩy)",
        ("Quy tắc chuyển câu chủ động sang câu bị động", "WAS, WERE"):
            "Chuyển đổi Bị động với thì Đơn & thì Tiếp diễn",
        ("Quy tắc chuyển câu chủ động sang câu bị động", "HAD"):
            "Chuyển đổi Bị động với thì Hoàn thành & Động từ khuyết thiếu",
        ("Các mẫu câu cơ bản", "a."):
            "Mẫu câu 1–2: S + V và S + V + A",
        ("Các mẫu câu cơ bản", "c."):
            "Mẫu câu 3: S + V + C (Bổ ngữ)",
        ("Các mẫu câu cơ bản", "d."):
            "Mẫu câu 4: S + V + O (Tân ngữ)",
        ("Các mẫu câu cơ bản", "e."):
            "Mẫu câu 5–6: Hai tân ngữ (Oi + Od) & Bổ ngữ tân ngữ (O + Co)",
        ("Các mẫu câu cơ bản", "g."):
            "Mẫu câu 7–8: S + V + Prep + O và S + V + O + A",
    }

    if (lesson_title, t) in exact_map:
        return exact_map[(lesson_title, t)]

    # If still starts with "Lưu ý:" and paragraph explains something, keep clean "Lưu ý:"
    if t.lower().startswith("lưu ý"):
        return "Lưu ý quan trọng"

    # Special cleanup for Mệnh đề sau Wish, If Only duplicate "If only"
    if lesson_title == "Mệnh đề sau Wish, If Only" and t == "If only":
        return "Cấu trúc giả định với WISH / IF ONLY"

    # Special cleanup for Đại từ sec 5 truncated sentence
    if t.startswith("Đại từ sở hữu (possessive pronouns) là hình thức"):
        return "Đại từ sở hữu & Đại từ phản thân (Possessive & Reflexive Pronouns)"

    # Special cleanup for Mệnh đề điều kiện sec 2 truncated sentence
    if "Ta cũng có thể diễn tả câu điều kiện" in t:
        return "Đảo ngữ trong câu điều kiện (không dùng IF / UNLESS)"

    # Capitalize first character cleanly if sentence fragment
    if t and t[0].islower() and not re.match(r"^(to|in|on|at|of|for|by|with|so|as|if|a|an|the|would|adj|adv|be|keep)\b", t):
        t = t[0].upper() + t[1:]

    return t


def repair_tables(lesson_title: str, sec: dict):
    tables = sec.get("tables", [])
    if not tables:
        return

    if lesson_title == "Mệnh đề chỉ điều kiện":
        sec["tables"] = [
            {
                "headers": ["LOẠI CÂU ĐIỀU KIỆN", "MỆNH ĐỀ CHÍNH (MAIN CLAUSE)", "MỆNH ĐỀ IF (IF-CLAUSE)"],
                "rows": [
                    [
                        "**Loại 0: Sự thật hiển nhiên / Quy luật**\n*(General truth / Habit)*",
                        "Simple Present",
                        "Simple Present",
                    ],
                    [
                        "**Loại I: Có thật ở hiện tại hoặc tương lai**\n*(Real in the present or future)*",
                        "will / can / shall / may + V(bare-inf.)",
                        "Simple Present",
                    ],
                    [
                        "**Loại II: Không có thật ở hiện tại**\n*(Unreal in the present)*",
                        "would / could / should / might + V(bare-inf.)",
                        "Past Simple / Past Subjunctive\n*(V2/ed; be → were)*",
                    ],
                    [
                        "**Loại III: Không có thật ở quá khứ**\n*(Unreal in the past)*",
                        "would / could / should / might + have + V3/ed",
                        "Past Perfect\n*(had + V3/ed)*",
                    ],
                ],
            }
        ]
        return

    if lesson_title == "Thay đổi thì, tính từ và trạng từ":
        new_tables = []
        for tbl in tables:
            first_row_txt = " ".join(str(x) for x in tbl.get("rows", [[]])[0])
            if "Simple Present" in first_row_txt:
                new_tables.append(
                    {
                        "headers": ["Câu trực tiếp (Direct)", "Câu gián tiếp (Indirect)", "Ví dụ minh họa"],
                        "rows": [
                            ["Simple Present", "Simple Past", "“I feel sick.” → He said he felt sick."],
                            ["Present Continuous", "Past Continuous", "“I’m writing a letter.” → He said he was writing a letter."],
                            ["Simple Past", "Past Perfect", "“I arrived at 5 p.m.” → He said he had arrived at 5 p.m."],
                            ["Present Perfect", "Past Perfect", "“I have seen that film.” → He said he had seen that film."],
                            ["Past Continuous / Perfect Continuous", "Past Perfect Continuous", "“I was living in Vienna then.” → He said he had been living in Vienna then."],
                            ["Simple Future", "Future in the Past", "“I shall go to Japan in July.” → He said he would go to Japan in July."],
                        ],
                    }
                )
            elif "This" in first_row_txt:
                new_tables.append(
                    {
                        "headers": ["Trực tiếp (Direct)", "Gián tiếp (Indirect)", "Ví dụ minh họa"],
                        "rows": [
                            ["This", "That", "“I need this book.” → He said he needed that book."],
                            ["These", "Those", "“I’ll take these with me.” → He said he would take those with him."],
                            ["Here", "There", "“I’ll return here at 3 o’clock.” → He said he would return there..."],
                            ["Now", "Then", "“I’m going now.” → He said he was going then."],
                            ["Today", "That day", "“I’ll do it today.” → He said he would do it that day."],
                            ["Yesterday", "The day before / The previous day", "“I was in Hue yesterday.” → He said he had been in Hue the day before."],
                            ["Tomorrow", "The day after / The following day", "“We’ll wait until tomorrow.” → They said they would wait until the day after."],
                            ["Ago", "Before", "“I was in Dalat three weeks ago.” → He said he had been in Dalat three weeks before."],
                            ["Next week", "The week after / The following week", "“I’ll come to see her next week.” → He said he would come to see her the week after."],
                        ],
                    }
                )
            else:
                new_tables.append(tbl)
        sec["tables"] = new_tables
        return

    if lesson_title == "Mạo từ":
        sec["tables"] = [
            {
                "headers": ["Nhóm từ đặc biệt", "Ví dụ chuẩn xác", "Ghi chú phát âm"],
                "rows": [
                    ["Luôn dùng **a** *(bắt đầu bằng âm phụ âm)*", "a European, a house, a uniform, a eulogy, a home, a university, a euphemism, a heavy..., a universal..., a eucalyptus, a half, a union", "Chữ *u/eu* đọc là /juː/ dùng **a**; chữ *h* bật hơi dùng **a**"],
                    ["Luôn dùng **an** *(bắt đầu bằng âm nguyên âm)*", "an hour, an uncle, an heir, an umbrella, an herbal..., an unnatural..., an honor, an understanding", "Chữ *h* câm (hour, heir, honor) dùng **an**; nếu có tính từ phụ âm đứng trước đổi lại dùng **a** (*an hour* ↔ *a whole hour*; *an umbrella* ↔ *a white umbrella*)"],
                ],
            }
        ]
        return

    # Generic clean pass on all other tables
    for tbl in tables:
        tbl["headers"] = [clean_markdown(str(h), strip_all_stars=True) for h in tbl.get("headers", [])]
        cleaned_rows = []
        hlen = len(tbl["headers"])
        for row in tbl.get("rows", []):
            crow = [clean_markdown(str(c)) for c in row]
            while len(crow) < hlen:
                crow.append("")
            cleaned_rows.append(crow[:hlen])
        tbl["rows"] = cleaned_rows


def consolidate_articles_lesson(les: dict):
    """Consolidate Mạo từ micro-sections (3..24) into two crisp academic reference tables."""
    secs = les.get("sections", [])
    if len(secs) < 10:
        return

    keep = secs[:2]
    use_the_rows = []
    no_the_rows = []

    for idx, s in enumerate(secs[2:], start=3):
        cat = strip_leading_number(s.get("title", ""))
        exs = []
        for b in s.get("bullets", []):
            exs.append(re.sub(r"^Ví dụ:\s*", "", clean_markdown(b, strip_all_stars=True)))
        for p in s.get("paragraphs", []):
            exs.append(clean_markdown(p, strip_all_stars=True))
        ex_str = "; ".join([e for e in exs if e])
        if idx <= 11:
            use_the_rows.append([cat, ex_str])
        else:
            no_the_rows.append([cat, ex_str])

    keep.append(
        {
            "id": "sec-use-the",
            "order": 3,
            "title": "Bảng tổng hợp: Các trường hợp DÙNG mạo từ xác định (THE)",
            "badge": "BẢNG TỔNG HỢP",
            "formulas": [],
            "rules": [],
            "paragraphs": [
                "Tổng hợp có hệ thống các nhóm danh từ riêng, địa danh và đối tượng bắt buộc dùng mạo từ **the**:"
            ],
            "bullets": [],
            "notes": [],
            "tables": [
                {
                    "headers": ["Nhóm đối tượng", "Ví dụ chuẩn xác"],
                    "rows": use_the_rows,
                }
            ],
        }
    )
    keep.append(
        {
            "id": "sec-no-the",
            "order": 4,
            "title": "Bảng tổng hợp: Các trường hợp KHÔNG DÙNG mạo từ (Zero Article)",
            "badge": "BẢNG TỔNG HỢP",
            "formulas": [],
            "rules": [],
            "paragraphs": [
                "Tổng hợp các nhóm danh từ riêng, môn học, thể thao và ngày lễ không đi kèm mạo từ:"
            ],
            "bullets": [],
            "notes": [],
            "tables": [
                {
                    "headers": ["Nhóm đối tượng", "Ví dụ chuẩn xác"],
                    "rows": no_the_rows,
                }
            ],
        }
    )
    les["sections"] = keep


def repair_split_sentences(lesson_title: str, sec: dict):
    """Merge mid-sentence continuations between title/paragraphs and adjacent paragraphs."""
    paras = [clean_markdown(p) for p in sec.get("paragraphs", []) if clean_markdown(p)]
    if not paras:
        sec["paragraphs"] = []
        return

    # Specific continuation prepends lost from truncated section titles
    if lesson_title == "Mệnh đề chỉ điều kiện" and paras and paras[0].startswith("**ra sau"):
        paras[0] = "Ta cũng có thể diễn tả câu điều kiện mà không cần dùng *IF* hay *UNLESS* bằng cách đảo chủ ngữ " + paras[0].lstrip("* ")
    if lesson_title == "Đại từ" and paras and paras[0].startswith("**không đứng trước"):
        paras[0] = "**Đại từ sở hữu (Possessive Pronouns)** là hình thức sở hữu của đại từ nhân xưng; nó " + paras[0].lstrip("* ")
    if lesson_title == "Đại từ" and paras and paras[0].startswith("có thể đi với động từ"):
        paras[0] = "**Some of / Most of / None of... + the / this / that / these / those / my / his...** " + paras[0]
    if lesson_title == "Cụm từ và mệnh đề chỉ mục đích" and any(p == "trúc sau:" for p in paras):
        paras = [
            "Mệnh đề chỉ mục đích thường được bắt đầu bằng *so that* hoặc *in order that* theo cấu trúc: **Mệnh đề chính + so that / in order that + S + will / would / can / could + V(bare-inf.)**"
            if "Mệnh đề chỉ mục đích thường được bắt đầu" in p
            else p
            for p in paras
            if p not in ("trúc sau:", "+", "mệnh đề chính (main clause)")
        ]
    if lesson_title == "Cụm từ và mệnh đề chỉ kết quả":
        paras = [p for p in paras if p not in ("+", "main clause", "adverbial clause of result")]

    # Merge consecutive paragraphs if p1 ends mid-sentence (no terminal punctuation) & p2 begins lowercase Vietnamese/parenthetical
    merged = []
    pos_only_re = re.compile(r"^(N|Adj|Adv|V|Prep|Conj|Pron|O|S|O adj|S V)(\s+(N|Adj|Adv|V|Prep|Conj|Pron|O|S))*$")
    for p in paras:
        p = p.replace("Simple Preseent", "Simple Present")
        # Drop pure isolated POS-tag noise paragraphs that add zero explanation (except keep meaningful arrows)
        if pos_only_re.match(p):
            continue
        # Strip inline trailing " S V S V" or " S V" OCR diagram artifacts
        p = re.sub(r"\.\s+S\s+V(\s+S\s+V)*$", ".", p)

        if merged:
            prev = merged[-1]
            p_clean_lead = re.sub(r"^[\*\s]+", "", p)
            prev_ends_clean = prev.endswith((".", "!", "?", ":", ")", "”", '"'))
            is_continuation = (
                not prev_ends_clean
                and bool(p_clean_lead)
                and (p_clean_lead[0].islower() or p_clean_lead.startswith(("(", "sang ", "với ", "của ", "nhưng ", "hoặc ")))
                and not re.match(r"^(Ví dụ|Example|Ex)[:\s]", p_clean_lead)
            )
            if is_continuation:
                merged[-1] = prev.rstrip() + " " + p.lstrip()
                continue
        merged.append(p)

    # Normalize broken leftover book numbers inside paragraphs like "**3.** Có thể dùng..."
    # If there are >=2 numbered markers like "**3.** ..." "**4.** ...", re-index sequentially 1, 2, 3...
    num_pat = re.compile(r"^\*{0,3}(\d+)\.\*{0,3}\s+(.+)$")
    num_hits = [i for i, x in enumerate(merged) if num_pat.match(x)]
    if num_hits:
        seq = 1
        for i in num_hits:
            m = num_pat.match(merged[i])
            body = m.group(2).strip()
            # Ensure balanced bold if broken
            body = clean_markdown(body)
            merged[i] = f"**{seq}.** {body}"
            seq += 1

    # Also drop tiny dangling fragments in Đại từ sec 4 like "ở trước." / "khoảng cách, đo lường."
    dangling_fragments = {
        "ở trước.",
        "khoảng cách, đo lường.",
        "danh từ được bổ nghĩa bởi cụm từ hay mệnh đề.",
        "tương đương với ‘If ... not’.",
        "là:",
    }
    merged = [p for p in merged if p not in dangling_fragments]

    sec["paragraphs"] = merged


def clean_lesson(les: dict):
    lesson_title = les.get("title_vi") or les.get("title_en") or ""
    if lesson_title == "Mạo từ":
        consolidate_articles_lesson(les)

    # Clean lesson examples
    clean_examples = []
    seen_ex = set()
    for ex in les.get("examples", []):
        if isinstance(ex, dict):
            en = clean_markdown(re.sub(r"^(Ex|Ví dụ|Example)\s*:\s*", "", str(ex.get("en", ""))), strip_all_stars=True)
            vi = "" if is_fake_vi(ex.get("vi", ""), en) else clean_markdown(ex.get("vi", ""), strip_all_stars=True)
        else:
            en = clean_markdown(str(ex), strip_all_stars=True)
            vi = ""
        if is_fragment_example(en):
            continue
        key = en.lower()
        if key in seen_ex:
            continue
        seen_ex.add(key)
        clean_examples.append({"en": en, "vi": vi})
    les["examples"] = clean_examples

    # Clean cheatSheet if present
    cs = les.get("cheatSheet")
    if isinstance(cs, dict):
        for k in ("timeline", "concept", "examTip"):
            if cs.get(k):
                cs[k] = clean_markdown(cs[k])
        if isinstance(cs.get("formulas"), list):
            for f in cs["formulas"]:
                if isinstance(f, dict):
                    f["text"] = clean_pua_and_whitespace(f.get("text", ""))
                    if f.get("example"):
                        f["example"] = clean_markdown(f["example"], strip_all_stars=True)

    # Clean all sections
    for si, sec in enumerate(les.get("sections", [])):
        sec["order"] = si + 1
        sec["title"] = fix_known_section_titles(lesson_title, sec.get("title", ""), sec)

        # Deduplicate formulas & fix PUA
        dedup_formulas = []
        seen_f = set()
        for f in sec.get("formulas", []):
            if isinstance(f, dict):
                ft = clean_pua_and_whitespace(f.get("text", ""))
                if not ft or ft.lower() in seen_f:
                    continue
                seen_f.add(ft.lower())
                dedup_formulas.append({"text": ft, "type": f.get("type", "Khẳng định (+)")})
        sec["formulas"] = dedup_formulas

        # Clean & re-number rules sequentially 1..N
        cleaned_rules = []
        for ri, r in enumerate(sec.get("rules", [])):
            r_title = clean_markdown(r.get("title", ""), strip_all_stars=True)
            r_title = re.sub(r"^\d+[\.\)]\s*", "", r_title).strip()
            r_content = clean_markdown(r.get("content", ""))
            # Fix rule.title ending with cut-off "Ex"
            r_title = re.sub(r"\.\s*Ex$", ".", r_title)
            r_exs = []
            for rex in r.get("examples", []):
                if isinstance(rex, dict):
                    ren = clean_markdown(re.sub(r"^(Ex|Ví dụ|Example)\s*:\s*", "", str(rex.get("en", ""))), strip_all_stars=True)
                    rvi = "" if is_fake_vi(rex.get("vi", ""), ren) else clean_markdown(rex.get("vi", ""), strip_all_stars=True)
                    if not is_fragment_example(ren):
                        r_exs.append({"en": ren, "vi": rvi})
            # If rule content == rule title verbatim, avoid repeating identical text twice!
            if r_content and r_title and r_content.lower() == r_title.lower():
                r_content = ""
            cleaned_rules.append({
                "num": str(ri + 1),
                "title": r_title,
                "content": r_content,
                "examples": r_exs,
            })
        sec["rules"] = cleaned_rules

        # Repair split paragraphs & remove floating fragments
        repair_split_sentences(lesson_title, sec)

        # Clean bullets
        clean_bullets = []
        for b in sec.get("bullets", []):
            cb = clean_markdown(b)
            if cb:
                clean_bullets.append(cb)
        sec["bullets"] = clean_bullets

        # Clean notes
        sec["notes"] = [clean_markdown(n) for n in sec.get("notes", []) if clean_markdown(n)]

        # Repair tables
        repair_tables(lesson_title, sec)


def main():
    with open(PREVIEW_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    out = copy.deepcopy(data)
    for ch in out.get("chapters", []):
        for les in ch.get("lessons", []):
            clean_lesson(les)

    # Update stats
    total_lessons = sum(len(c.get("lessons", [])) for c in out.get("chapters", []))
    assert len(out.get("chapters", [])) == 12, "Must keep 12 chapters"
    assert total_lessons == 53, "Must keep 53 lessons"

    with open(PREVIEW_PATH, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)

    print(f"Normalized preview_data.json cleanly across {len(out['chapters'])} chapters / {total_lessons} lessons.")


if __name__ == "__main__":
    main()
