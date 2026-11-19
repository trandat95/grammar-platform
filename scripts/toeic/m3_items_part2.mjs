/**
 * Milestone M3 Expansion — Part 2 (53 Curated Academic TOEIC X-Ray Items)
 * Topics:
 *   7.  GRM_VERB_TENSE          (+13 items: EXP2026_VERB_TENSE_Q001..Q013) -> 32 + 13 = 45
 *   8.  GRM_VERB_PARTICIPLE     (+4 items:  EXP2026_VERB_PART_Q001..Q004)  -> 53 + 4  = 57
 *   9.  GRM_CONN_PREP_VS_CONJ   (+6 items:  EXP2026_CONN_PVC_Q001..Q006)   -> 39 + 6  = 45
 *   10. GRM_CONN_PREP_MEANING   (+15 items: EXP2026_CONN_PM_Q001..Q015)    -> 30 + 15 = 45
 *   11. GRM_CONN_TRANSITION     (+15 items: EXP2026_CONN_TRANS_Q001..Q015) -> 30 + 15 = 45
 */

import { buildQuestionFromSpec } from "./m2_items_part1.mjs";

const KEYS = ["A", "B", "C", "D"];

function makeStandardGenerator({
  topicId,
  topicNameVi,
  idPrefix,
  skillCategory = "GRAMMAR",
  defaultTime = 12,
  commonTrapVi,
  errCode,
  errNameVi,
  similarIds,
  scenarios,
  diffFn,
}) {
  return function generate() {
    return scenarios.map((sc, idx) => {
      const qNum = idx + 1;
      const id = `${idPrefix}_Q${String(qNum).padStart(3, "0")}`;
      const diff = diffFn ? diffFn(idx) : idx % 2 === 0 ? 1 : 3;
      const band = sc.band || (diff === 1 ? 450 : diff === 2 ? 600 : 750);

      const correctIdx = idx % 4;
      const correctKey = KEYS[correctIdx];
      const options = {};
      let dPtr = 0;

      for (let kIdx = 0; kIdx < 4; kIdx++) {
        const k = KEYS[kIdx];
        if (kIdx === correctIdx) {
          options[k] = {
            text: sc.corr,
            role: sc.role,
            errCode: null,
            errNameVi: null,
            whyWrongVi: "",
          };
        } else {
          const dItem = sc.dist[dPtr++];
          const dText = typeof dItem === "object" ? dItem.t : dItem;
          const dRole = typeof dItem === "object" ? dItem.r : "Incorrect form / distractor";
          const dWhy =
            typeof dItem === "object" && dItem.w
              ? dItem.w
              : `Sai ngữ pháp/ngữ nghĩa: "${dText}" không thỏa mãn quy tắc "${sc.rule}" trong ngữ cảnh câu này.`;
          options[k] = {
            text: dText,
            role: dRole,
            errCode: sc.errCode || errCode,
            errNameVi: sc.errNameVi || errNameVi,
            whyWrongVi: dWhy,
          };
        }
      }

      return buildQuestionFromSpec({
        id,
        number: 101 + (idx % 30),
        part: 5,
        topicId,
        topicNameVi,
        skillCategory,
        difficultyLevel: diff,
        targetBand: band,
        recommendedTime: defaultTime,
        microFormulaVi: sc.rule,
        commonTrapVi: sc.trap || commonTrapVi,
        leftContext: sc.l,
        rightContext: sc.r,
        leftAnchor: sc.la,
        rightAnchor: sc.ra,
        requiredRole: sc.role,
        options,
        correctKey,
        explanationVi: `Chốt chặn ngữ pháp: Cụm từ khóa "${sc.la} ... ${sc.ra}" đòi hỏi ${sc.role} theo quy tắc "${sc.rule}". Vì vậy đáp án (${correctKey}) "${sc.corr}" là chính xác nhất về mặt học thuật.`,
        vocab: [{ word: sc.v[0], pos: sc.v[1], meaning_vi: sc.v[2] }],
        collocation: sc.c,
        similarIds,
      });
    });
  };
}

// ============================================================================
// 7. GRM_VERB_TENSE (+13 items: EXP2026_VERB_TENSE_Q001..Q013) — D1 (6) & D3 (7)
// ============================================================================
const TENSE_SCENARIOS = [
  { l: "Since its founding in 2018, Lumina Robotics", r: "more than forty patents for autonomous warehouse vehicles.", la: "Since its founding", ra: "more than forty", corr: "has obtained", dist: [{ t: "obtains", r: "Present Simple" }, { t: "obtained", r: "Past Simple" }, { t: "will obtain", r: "Future Simple" }], role: "Present Perfect Verb (Since + mốc quá khứ -> has/have + V3/ed)", rule: "Since + Mốc thời gian quá khứ (2018) -> Mệnh đề chính chia Hiện tại hoàn thành (has/have + V3/ed)", v: ["patent", "n", "bằng sáng chế"], c: "obtain a patent: nhận bằng sáng chế" },
  { l: "Last quarter, the European logistics division", r: "its on-time delivery rate from 88 percent to 96 percent.", la: "Last quarter,", ra: "its on-time delivery", corr: "improved", dist: [{ t: "improves", r: "Present Simple" }, { t: "has improved", r: "Present Perfect" }, { t: "will improve", r: "Future Simple" }], role: "Past Simple Verb with completed past marker 'Last quarter'", rule: "Dấu hiệu quá khứ đã kết thúc (Last quarter / yesterday / in 2022) -> Chia Quá khứ đơn (V2/ed)", v: ["on-time", "adj", "đúng hạn"], c: "improve the delivery rate: cải thiện tỷ lệ giao hàng" },
  { l: "Over the past five years, online grocery orders", r: "dramatically across suburban metropolitan areas.", la: "Over the past five years,", ra: "dramatically across suburban", corr: "have grown", dist: [{ t: "grew", r: "Past Simple" }, { t: "grow", r: "Present Simple" }, { t: "had grown", r: "Past Perfect" }], role: "Present Perfect Verb with duration marker 'Over the past five years'", rule: "Over/During/In the past + Khoảng thời gian -> Chia Hiện tại hoàn thành (have/has + V3/ed)", v: ["suburban", "adj", "ngoại ô"], c: "orders have grown dramatically: đơn hàng đã tăng mạnh" },
  { l: "As soon as the safety inspector", r: "the newly installed fire suppression system, the factory will resume production.", la: "safety inspector", ra: "the newly installed", corr: "approves", dist: [{ t: "will approve", r: "Future Simple (invalid in time clause)" }, { t: "approved", r: "Past Simple" }, { t: "had approved", r: "Past Perfect" }], role: "Present Simple Verb in Future Time Clause (As soon as + S + V_present, S + will + V)", rule: "Mệnh đề trạng ngữ chỉ thời gian tương lai (As soon as / When / Before / Until) -> Dùng Hiện tại đơn thay cho Tương lai đơn", v: ["fire suppression", "n", "hệ thống dập lửa/chữa cháy"], c: "resume production: nối lại sản xuất" },
  { l: "The human resources department", r: "its annual employee satisfaction survey every November.", la: "department", ra: "its annual employee", corr: "conducts", dist: [{ t: "conducted", r: "Past Simple" }, { t: "is conducting", r: "Present Continuous" }, { t: "had conducted", r: "Past Perfect" }], role: "Present Simple Verb for recurring schedule ('every November')", rule: "Dấu hiệu lịch trình lặp lại định kỳ (every November / annually) + Chủ ngữ số ít -> Chia Hiện tại đơn (V-s/es)", v: ["conduct", "v", "tiến hành, thực hiện"], c: "conduct a survey: thực hiện cuộc khảo sát" },
  { l: "Next Monday, the chief technology officer", r: "our new cloud cybersecurity architecture at the Tokyo summit.", la: "Next Monday,", ra: "our new cloud", corr: "will present", dist: [{ t: "presented", r: "Past Simple" }, { t: "has presented", r: "Present Perfect" }, { t: "had presented", r: "Past Perfect" }], role: "Future Simple Verb with future marker 'Next Monday'", rule: "Dấu hiệu tương lai (Next Monday / tomorrow / upcoming) -> Chia Tương lai đơn (will + V-inf)", v: ["summit", "n", "hội nghị thượng đỉnh"], c: "present an architecture: trình bày kiến trúc hệ thống" },
  { l: "By the time the chief executive arrived at the press conference, the media relations team", r: "the informational packets.", la: "By the time the chief executive arrived", ra: "the informational packets.", corr: "had already distributed", dist: [{ t: "has already distributed", r: "Present Perfect" }, { t: "will distribute", r: "Future Simple" }, { t: "distributes", r: "Present Simple" }], role: "Past Perfect Verb (By the time + S + V2/ed, S + had + V3/ed)", rule: "By the time + Mệnh đề Quá khứ đơn (arrived) -> Mệnh đề chính chia Quá khứ hoàn thành (had + V3/ed)", v: ["packet", "n", "bộ tài liệu"], c: "distribute informational packets: phát bộ tài liệu thông tin" },
  { l: "By the end of the next fiscal quarter, the construction consortium", r: "all three phases of the solar farm.", la: "By the end of the next", ra: "all three phases", corr: "will have completed", dist: [{ t: "completed", r: "Past Simple" }, { t: "has completed", r: "Present Perfect" }, { t: "had completed", r: "Past Perfect" }], role: "Future Perfect Verb (By + mốc tương lai -> will have + V3/ed)", rule: "By / By the end of + Mốc thời gian tương lai (the next fiscal quarter) -> Chia Tương lai hoàn thành (will have + V3/ed)", v: ["consortium", "n", "liên danh nhà thầu"], c: "complete all phases: hoàn thành tất cả các giai đoạn" },
  { l: "In July, Ms. Lindholm", r: "as the head of international procurement for exactly ten years.", la: "In July, Ms. Lindholm", ra: "as the head of", corr: "will have served", dist: [{ t: "served", r: "Past Simple" }, { t: "serves", r: "Present Simple" }, { t: "had served", r: "Past Perfect" }], role: "Future Perfect Verb for milestone duration reached in the future ('for exactly ten years')", rule: "Mốc tương lai (In July) + Khoảng thời gian tính đến mốc đó (for exactly ten years) -> Chia Tương lai hoàn thành (will have + V3/ed)", v: ["procurement", "n", "bộ phận thu mua"], c: "serve as the head of: đảm nhiệm vị trí trưởng bộ phận" },
  { l: "Prior to joining Vantara Pharmaceuticals in 2023, Dr. Okafor", r: "a cellular research laboratory in Zurich for eight years.", la: "in 2023, Dr. Okafor", ra: "a cellular research", corr: "had directed", dist: [{ t: "has directed", r: "Present Perfect" }, { t: "directs", r: "Present Simple" }, { t: "will direct", r: "Future Simple" }], role: "Past Perfect Verb for an action prior to a past point ('Prior to ... in 2023')", rule: "Hành động kéo dài và xảy ra trước một mốc trong quá khứ (Prior to ... in 2023) -> Chia Quá khứ hoàn thành (had + V3/ed)", v: ["cellular", "adj", "thuộc về tế bào"], c: "direct a research laboratory: điều hành phòng thí nghiệm" },
  { l: "Wait until the automated backup process", r: "before shutting down the main database server.", la: "until the automated backup process", ra: "before shutting down", corr: "finishes", dist: [{ t: "will finish", r: "Future Simple" }, { t: "finished", r: "Past Simple" }, { t: "had finished", r: "Past Perfect" }], role: "Present Simple Verb in 'until' Time Clause following an Imperative", rule: "Mệnh lệnh thức (Wait...) + until + Chủ ngữ số ít -> Chia Hiện tại đơn (finishes), tuyệt đối không dùng 'will finish'", v: ["backup", "n", "sao lưu dự phòng"], c: "shut down the server: tắt máy chủ" },
  { l: "Before the new inventory tracking software was deployed last month, warehouse clerks", r: "all incoming pallets manually.", la: "was deployed last month,", ra: "all incoming pallets", corr: "had recorded", dist: [{ t: "have recorded", r: "Present Perfect" }, { t: "record", r: "Present Simple" }, { t: "will record", r: "Future Simple" }], role: "Past Perfect Verb before a Past Simple event ('Before ... was deployed')", rule: "Before + Mệnh đề Quá khứ (was deployed last month) -> Hành động xảy ra trước đó chia Quá khứ hoàn thành (had + V3/ed)", v: ["pallet", "n", "kệ kê hàng"], c: "record incoming pallets: ghi chép các kiện hàng nhập kho" },
  { l: "By the time the annual shareholders' meeting convenes in May, the audit committee", r: "its final financial review.", la: "convenes in May,", ra: "its final financial", corr: "will have submitted", dist: [{ t: "submitted", r: "Past Simple" }, { t: "had submitted", r: "Past Perfect" }, { t: "submits", r: "Present Simple" }], role: "Future Perfect Verb (By the time + S + V_present, S + will have + V3/ed)", rule: "By the time + Mệnh đề Hiện tại đơn chỉ tương lai (convenes in May) -> Mệnh đề chính chia Tương lai hoàn thành (will have + V3/ed)", v: ["convene", "v", "triệu tập, nhóm họp"], c: "submit a financial review: nộp báo cáo rà soát tài chính" },
];

export const generateM3TenseQuestions = makeStandardGenerator({
  topicId: "GRM_VERB_TENSE",
  topicNameVi: "Thì của Động từ & Sự phối thì (Verb Tenses & Sequence of Tenses)",
  idPrefix: "EXP2026_VERB_TENSE",
  commonTrapVi: "Dùng `will` trong mệnh đề trạng ngữ chỉ thời gian (`as soon as / until / by the time`), hoặc nhầm giữa `has + V3` (Hiện tại hoàn thành) và `had + V3` / `will have + V3`.",
  errCode: "ERR_VERB_TENSE_MARKER",
  errNameVi: "Chia sai Thì so với trạng ngữ chỉ thời gian (Time Marker) hoặc quy tắc phối thì",
  similarIds: ["ETS2024_T01_Q138", "ETS2024_T03_Q132", "ETS2024_T03_Q144"],
  scenarios: TENSE_SCENARIOS,
  diffFn: (idx) => (idx < 6 ? 1 : 3),
});

// ============================================================================
// 8. GRM_VERB_PARTICIPLE (+4 items: EXP2026_VERB_PART_Q001..Q004) — D1 (2) & D3 (2)
// ============================================================================
const PARTICIPLE_SCENARIOS = [
  { l: "Attendees at the annual tech expo were", r: "by the live demonstration of the holographic display.", la: "expo were", ra: "by the live", corr: "fascinated", dist: [{ t: "fascinating", r: "Present Participle (active/cause)" }, { t: "fascinate", r: "Base Verb" }, { t: "fascination", r: "Noun (-tion)" }], role: "Past Participle Adjective describing human emotion ('Attendees ... were fascinated by')", rule: "Chủ ngữ chỉ người nhận cảm xúc (Attendees) + be + V-ed (fascinated) + by; V-ing dùng cho vật gây ra cảm xúc", v: ["demonstration", "n", "buổi trình diễn thực tế"], c: "be fascinated by: bị cuốn hút/hấp dẫn bởi" },
  { l: "Please review the", r: "schedule of workshops before registering for your afternoon breakout sessions.", la: "review the", ra: "schedule of workshops", corr: "updated", dist: [{ t: "updating", r: "Present Participle (active)" }, { t: "update", r: "Base Verb / Noun" }, { t: "updates", r: "Plural Noun / Verb" }], role: "Past Participle Adjective modifying 'schedule' (the updated schedule = lịch trình đã được cập nhật)", rule: "the + V3/ed (updated/revised/enclosed/attached) + Danh từ chỉ vật chịu tác động (schedule)", v: ["breakout session", "n", "phiên thảo luận chuyên đề nhỏ"], c: "updated schedule: lịch trình đã được cập nhật" },
  { l: "", r: "Near-Field Communication technology, the new transit card allows commuters to pass through turnstiles in under a second.", la: "", ra: "Near-Field Communication technology,", corr: "Utilizing", dist: [{ t: "Utilized", r: "Past Participle (passive - cannot take direct object)" }, { t: "Utilize", r: "Base Verb" }, { t: "Utilization", r: "Noun (-tion)" }], role: "Fronted Present Participle in Active Reduced Adverbial Clause (Utilizing + Direct Object)", rule: "Rút gọn mệnh đề đồng chủ ngữ ở đầu câu: Có Tân ngữ trực tiếp theo sau (Near-Field Communication technology) -> Dùng V-ing chủ động (Utilizing)", v: ["turnstile", "n", "cổng xoay kiểm soát vé"], c: "utilize technology: sử dụng/ứng dụng công nghệ" },
  { l: "All reimbursement forms", r: "after the fifteenth of the month will be processed in the next payroll cycle.", la: "reimbursement forms", ra: "after the fifteenth", corr: "received", dist: [{ t: "receiving", r: "Present Participle (active)" }, { t: "receive", r: "Base Verb" }, { t: "receipt", r: "Noun" }], role: "Post-nominal Past Participle in Reduced Relative Clause (forms [which are] received after...)", rule: "Danh từ chỉ vật (forms) + V3/ed rút gọn mệnh đề quan hệ bị động (received after...) + Động từ chính (will be processed)", v: ["payroll cycle", "n", "kỳ tính lương"], c: "forms received after: các biểu mẫu được tiếp nhận sau" },
];

export const generateM3ParticipleQuestions = makeStandardGenerator({
  topicId: "GRM_VERB_PARTICIPLE",
  topicNameVi: "Phân từ Hiện tại (V-ing) vs. Quá khứ (V-ed) & Rút gọn Mệnh đề (Participles)",
  idPrefix: "EXP2026_VERB_PART",
  commonTrapVi: "Nhầm hướng Chủ động (`V-ing` + Tân ngữ) và Bị động (`V3/ed` + Giới từ / trạng ngữ) khi rút gọn mệnh đề quan hệ hoặc mệnh đề trạng ngữ.",
  errCode: "ERR_VERB_PARTICIPLE_DIRECTION",
  errNameVi: "Nhầm chiều Chủ động (V-ing) và Bị động (V-ed) của Phân từ",
  similarIds: ["ETS2024_T01_Q105", "ETS2024_T01_Q110", "ETS2024_T01_Q113"],
  scenarios: PARTICIPLE_SCENARIOS,
  diffFn: (idx) => (idx < 2 ? 1 : 3),
});

// ============================================================================
// 9. GRM_CONN_PREP_VS_CONJ (+6 items: EXP2026_CONN_PVC_Q001..Q006) — D1 (3) & D3 (3)
// ============================================================================
const PVC_SCENARIOS = [
  { l: "The outdoor charity concert went ahead as scheduled", r: "the heavy afternoon downpour.", la: "as scheduled", ra: "the heavy afternoon downpour.", corr: "despite", dist: [{ t: "although", r: "Subordinating Conjunction (+ Clause)" }, { t: "even though", r: "Subordinating Conjunction (+ Clause)" }, { t: "whereas", r: "Subordinating Conjunction (+ Clause)" }], role: "Preposition of Concession followed by Noun Phrase ('the heavy afternoon downpour')", rule: "Theo sau là Cụm danh từ (không có động từ chia thì) -> Dùng Giới từ chỉ sự nhượng bộ (despite / in spite of), loại liên từ (although/even though)", v: ["downpour", "n", "cơn mưa lớn"], c: "despite the downpour: bất chấp cơn mưa lớn" },
  { l: "Several commuter trains were delayed this morning", r: "a signal malfunction near the central junction.", la: "this morning", ra: "a signal malfunction near", corr: "because of", dist: [{ t: "because", r: "Subordinating Conjunction (+ Clause)" }, { t: "since", r: "Subordinating Conjunction" }, { t: "now that", r: "Subordinating Conjunction (+ Clause)" }], role: "Compound Preposition of Cause followed by Noun Phrase ('a signal malfunction')", rule: "Theo sau là Cụm danh từ (a signal malfunction) -> Dùng Cụm giới từ chỉ nguyên nhân (because of / due to / owing to)", v: ["malfunction", "n", "sự cố hỏng hóc kỹ thuật"], c: "because of a malfunction: do sự cố kỹ thuật" },
  { l: "Smartphones must remain turned off", r: "the aircraft is taxiing to the terminal gate.", la: "turned off", ra: "the aircraft is taxiing", corr: "while", dist: [{ t: "during", r: "Preposition (+ Noun Phrase)" }, { t: "throughout", r: "Preposition (+ Noun Phrase)" }, { t: "prior to", r: "Compound Preposition (+ Noun Phrase)" }], role: "Subordinating Conjunction followed by Full Clause ('the aircraft is taxiing')", rule: "Theo sau là một Mệnh đề hoàn chỉnh có S + V chia thì (the aircraft is taxiing) -> Dùng Liên từ (while), tuyệt đối không dùng giới từ 'during'", v: ["taxi", "v", "(máy bay) lăn bánh trên đường băng"], c: "while the aircraft is taxiing: trong khi máy bay đang lăn bánh" },
  { l: "", r: "the raw material costs rose by twelve percent, the manufacturer kept its retail prices unchanged.", la: "", ra: "the raw material costs rose", corr: "Even though", dist: [{ t: "Despite", r: "Preposition (+ Noun Phrase)" }, { t: "In spite of", r: "Compound Preposition (+ Noun Phrase)" }, { t: "Regardless of", r: "Compound Preposition (+ Noun Phrase)" }], role: "Subordinating Conjunction of Concession followed by Full Clause ('costs rose')", rule: "Phía sau có Chủ ngữ (the raw material costs) + Động từ chia thì (rose) -> Dùng Liên từ phụ thuộc (Even though / Although)", v: ["unchanged", "adj", "không thay đổi, giữ nguyên"], c: "keep prices unchanged: giữ nguyên giá bán" },
  { l: "The construction of the high-speed rail bridge was completed two months early", r: "favorable weather conditions.", la: "months early", ra: "favorable weather conditions.", corr: "owing to", dist: [{ t: "inasmuch as", r: "Subordinating Conjunction (+ Clause)" }, { t: "seeing that", r: "Subordinating Conjunction (+ Clause)" }, { t: "for", r: "Coordinating Conjunction" }], role: "Compound Preposition of Cause followed by Noun Phrase ('favorable weather conditions')", rule: "Theo sau là Cụm danh từ (favorable weather conditions) -> Dùng Cụm giới từ chỉ nguyên nhân (owing to / due to / thanks to)", v: ["favorable", "adj", "thuận lợi"], c: "owing to favorable weather: nhờ điều kiện thời tiết thuận lợi" },
  { l: "The new export tariff will take effect on January 1,", r: "the trade ministry issues an official postponement.", la: "January 1,", ra: "the trade ministry issues", corr: "unless", dist: [{ t: "without", r: "Preposition (+ Noun/V-ing)" }, { t: "except for", r: "Compound Preposition (+ Noun Phrase)" }, { t: "aside from", r: "Compound Preposition (+ Noun Phrase)" }], role: "Subordinating Conjunction of Condition followed by Full Clause ('the trade ministry issues...')", rule: "Theo sau là Mệnh đề có S + V chia thì (the trade ministry issues...) -> Dùng Liên từ điều kiện phủ định (unless = trừ khi), loại các giới từ (without / except for)", v: ["postponement", "n", "sự trì hoãn"], c: "take effect: có hiệu lực" },
];

export const generateM3PrepVsConjQuestions = makeStandardGenerator({
  topicId: "GRM_CONN_PREP_VS_CONJ",
  topicNameVi: "Giới từ vs. Liên từ phụ thuộc (Prepositions vs. Subordinating Conjunctions)",
  idPrefix: "EXP2026_CONN_PVC",
  commonTrapVi: "Không kiểm tra xem thành phần phía sau chỗ trống là Cụm danh từ (`Noun Phrase` -> chọn Giới từ `despite / because of / during`) hay Mệnh đề có động từ chia thì (`S + V` -> chọn Liên từ `although / because / while / unless`).",
  errCode: "ERR_PREP_VS_CONJ_STRUCTURE",
  errNameVi: "Nhầm lẫn giữa Giới từ (+ Cụm danh từ) và Liên từ (+ Mệnh đề S + V)",
  similarIds: ["ETS2024_T01_Q109", "ETS2024_T02_Q105", "ETS2024_T02_Q111"],
  scenarios: PVC_SCENARIOS,
  diffFn: (idx) => (idx < 3 ? 1 : 3),
});

// ============================================================================
// 10. GRM_CONN_PREP_MEANING (+15 items: EXP2026_CONN_PM_Q001..Q015) — D1 (7) & D3 (8)
// ============================================================================
const PREP_MEANING_SCENARIOS = [
  { l: "All visitors must present a valid government-issued photo ID", r: "arrival at the corporate headquarters.", la: "photo ID", ra: "arrival at the", corr: "upon", dist: [{ t: "within", r: "Preposition of Duration" }, { t: "among", r: "Preposition of Group" }, { t: "beyond", r: "Preposition of Limit" }], role: "Preposition of Immediate Time (upon arrival = ngay khi đến nơi)", rule: "upon / on + Danh từ chỉ hành động (upon arrival / upon completion / upon request = ngay khi...)", v: ["headquarters", "n", "trụ sở chính"], c: "upon arrival: ngay khi đến nơi" },
  { l: "The updated employee benefits handbook will be distributed", r: "the entire organization next week.", la: "be distributed", ra: "the entire organization", corr: "throughout", dist: [{ t: "between", r: "Preposition (between 2 items)" }, { t: "aboard", r: "Preposition (on a vehicle)" }, { t: "beneath", r: "Preposition of Lower Position" }], role: "Preposition of Spatial/Organizational Distribution (throughout the entire organization = khắp toàn tổ chức)", rule: "throughout + Danh từ chỉ không gian/tổ chức (khắp toàn bộ tổ chức) hoặc thời gian (suốt cả kỳ)", v: ["distribute", "v", "phân phát, phổ biến"], c: "throughout the entire organization: khắp toàn bộ tổ chức" },
  { l: "Full payment for wholesale furniture orders must be received", r: "thirty days of the invoice date.", la: "be received", ra: "thirty days of", corr: "within", dist: [{ t: "during", r: "Preposition (+ named period, not number of days)" }, { t: "since", r: "Preposition (+ past point in time)" }, { t: "until", r: "Preposition (+ endpoint)" }], role: "Preposition of Time Limit (within thirty days of = trong vòng 30 ngày kể từ)", rule: "within + Khoảng thời gian định lượng (thirty days / 24 hours) + of = trong vòng bao lâu", v: ["wholesale", "adj", "bán sỉ"], c: "within thirty days of the invoice date: trong vòng 30 ngày kể từ ngày xuất hóa đơn" },
  { l: "The main reception desk is open daily from 8:00 A.M. to 6:00 P.M.", r: "public holidays.", la: "to 6:00 P.M.", ra: "public holidays.", corr: "except on", dist: [{ t: "prior", r: "Adjective (needs 'to')" }, { t: "instead", r: "Adverb (needs 'of')" }, { t: "according", r: "Participle (needs 'to')" }], role: "Compound Preposition of Exception (except on public holidays = ngoại trừ vào các ngày lễ)", rule: "except on / except for + Ngoại lệ (trừ các ngày lễ; lưu ý prior/instead/according đều thiếu giới từ đi kèm to/of)", v: ["reception desk", "n", "quầy lễ tân"], c: "except on public holidays: trừ các ngày nghỉ lễ" },
  { l: "The municipal transit authority plans to build a pedestrian walkway", r: "the river to connect the two business districts.", la: "pedestrian walkway", ra: "the river to connect", corr: "across", dist: [{ t: "among", r: "Preposition (3+ items)" }, { t: "within", r: "Preposition (inside)" }, { t: "despite", r: "Preposition of Concession" }], role: "Preposition of Movement/Position from one side to the other (across the river = bắc qua sông)", rule: "walkway / bridge + across + the river/street (bắc ngang qua sông/đường)", v: ["pedestrian", "n", "người đi bộ"], c: "a walkway across the river: cầu đi bộ bắc qua sông" },
  { l: "Several startups have leased office suites", r: "the newly constructed FinTech Innovation Center.", la: "office suites", ra: "the newly constructed", corr: "inside", dist: [{ t: "onto", r: "Preposition of Surface Motion" }, { t: "among", r: "Preposition (plural group)" }, { t: "during", r: "Preposition of Time" }], role: "Preposition of Enclosed Location (inside the Center = bên trong trung tâm)", rule: "lease office suites + inside / within + Tòa nhà (thuê văn phòng bên trong tòa nhà)", v: ["lease", "v", "thuê (bất động sản)"], c: "office suites inside the center: các phòng làm việc bên trong trung tâm" },
  { l: "Please submit your travel expense receipts", r: "Friday afternoon so that reimbursements can be processed this month.", la: "expense receipts", ra: "Friday afternoon so", corr: "by", dist: [{ t: "until", r: "Preposition of Continuous State" }, { t: "for", r: "Preposition of Duration" }, { t: "during", r: "Preposition of Period" }], role: "Preposition of Deadline for a one-time action (submit ... by Friday = nộp trước/muộn nhất là thứ Sáu)", rule: "Phân biệt: by + Mốc thời gian (hạn chót hoàn thành 1 hành động: submit/finish by Friday) vs until (trạng thái kéo dài liên tục đến mốc đó)", v: ["receipt", "n", "hóa đơn, biên lai"], c: "submit by Friday: nộp trước hạn chót thứ Sáu" },
  { l: "", r: "the terms of the service level agreement, the vendor must resolve critical server outages within two hours.", la: "", ra: "the terms of the", corr: "Under", dist: [{ t: "Above", r: "Preposition of Higher Level" }, { t: "Between", r: "Preposition of Two" }, { t: "Against", r: "Preposition of Opposition" }], role: "Preposition of Legal/Contractual Authority (Under the terms of = Theo các điều khoản của)", rule: "Under + the terms of / the agreement / the warranty / the new policy (= Theo quy định của)", v: ["outage", "n", "sự cố mất điện/ngừng hoạt động máy chủ"], c: "under the terms of the agreement: theo các điều khoản của hợp đồng" },
  { l: "The real estate developer decided to purchase the warehouse plot", r: "its proximity to the international cargo port.", la: "warehouse plot", ra: "its proximity to", corr: "on account of", dist: [{ t: "in contrast to", r: "Compound Preposition of Contrast" }, { t: "by means of", r: "Compound Preposition of Method" }, { t: "on behalf of", r: "Compound Preposition of Representation" }], role: "Compound Preposition of Cause (on account of = because of / do, nhờ vào)", rule: "on account of + Cụm danh từ (= because of / due to = bởi vì, xét đến)", v: ["proximity", "n", "sự gần kề về vị trí"], c: "on account of its proximity to: nhờ vị trí gần với" },
  { l: "All electrical rewiring in the historic theater was carried out", r: "municipal fire safety codes.", la: "carried out", ra: "municipal fire safety", corr: "in accordance with", dist: [{ t: "in opposition to", r: "Compound Preposition of Conflict" }, { t: "by means of", r: "Compound Preposition of Instrument" }, { t: "at the expense of", r: "Compound Preposition of Cost" }], role: "Compound Preposition of Compliance (in accordance with = tuân theo, phù hợp với)", rule: "in accordance with / in compliance with + regulations / codes / standards (tuân thủ đúng quy chuẩn)", v: ["rewiring", "n", "việc đi lại đường dây điện"], c: "in accordance with safety codes: tuân theo quy chuẩn an toàn" },
  { l: "Ms. Vance accepted the lifetime achievement award", r: "the retired founder of the publishing house.", la: "achievement award", ra: "the retired founder", corr: "on behalf of", dist: [{ t: "in light of", r: "Compound Preposition of Reason" }, { t: "by way of", r: "Compound Preposition of Route" }, { t: "in excess of", r: "Compound Preposition of Quantity" }], role: "Compound Preposition of Representation (on behalf of = thay mặt cho)", rule: "on behalf of + Somebody (thay mặt / đại diện cho ai)", v: ["publishing house", "n", "nhà xuất bản"], c: "accept an award on behalf of: nhận giải thưởng thay mặt cho" },
  { l: "", r: "his extensive background in maritime law, Mr. Costas is fluent in four European languages.", la: "", ra: "his extensive background", corr: "In addition to", dist: [{ t: "In place of", r: "Compound Preposition of Substitution" }, { t: "In case of", r: "Compound Preposition of Precaution" }, { t: "In comparison with", r: "Compound Preposition of Comparison" }], role: "Compound Preposition of Addition (In addition to = Bên cạnh, ngoài ... ra)", rule: "In addition to / Besides + Cụm danh từ (Bên cạnh năng lực A, chủ ngữ còn có năng lực B)", v: ["maritime", "adj", "thuộc về hàng hải"], c: "in addition to his background: bên cạnh nền tảng chuyên môn của ông ấy" },
  { l: "The logistics firm managed to reduce fuel consumption by fifteen percent", r: "AI-powered route optimization software.", la: "fifteen percent", ra: "AI-powered route optimization", corr: "by means of", dist: [{ t: "in spite of", r: "Compound Preposition of Concession" }, { t: "prior to", r: "Compound Preposition of Time" }, { t: "contrary to", r: "Compound Preposition of Opposition" }], role: "Compound Preposition of Method/Instrument (by means of = bằng phương tiện / thông qua)", rule: "by means of + Công cụ / Phương pháp (= through / using = bằng cách sử dụng)", v: ["consumption", "n", "mức tiêu thụ"], c: "by means of optimization software: thông qua phần mềm tối ưu hóa" },
  { l: "In the event of a power failure, the hospital's emergency generators activate automatically", r: "seconds.", la: "activate automatically", ra: "seconds.", corr: "within", dist: [{ t: "among", r: "Preposition of Group" }, { t: "along", r: "Preposition of Path" }, { t: "beside", r: "Preposition of Position" }], role: "Preposition of Rapid Time Span (within seconds = chỉ trong vài giây)", rule: "within + seconds / minutes / hours (chỉ trong vòng vài giây/phút)", v: ["generator", "n", "máy phát điện"], c: "activate within seconds: kích hoạt chỉ trong vài giây" },
  { l: "", r: "the recent surge in demand for electric vehicles, the battery plant will add a third production shift.", la: "", ra: "the recent surge in demand", corr: "In light of", dist: [{ t: "In place of", r: "Compound Preposition of Substitution" }, { t: "On behalf of", r: "Compound Preposition of Representation" }, { t: "Except for", r: "Compound Preposition of Exception" }], role: "Compound Preposition of Reason/Consideration (In light of = Xét đến / Trước tình hình)", rule: "In light of / In view of + Cụm danh từ chỉ bối cảnh/nguyên nhân (= Bởi vì / Xét thấy tình hình...)", v: ["surge", "n", "sự tăng vọt"], c: "in light of the recent surge: trước sự tăng vọt gần đây" },
];

export const generateM3PrepMeaningQuestions = makeStandardGenerator({
  topicId: "GRM_CONN_PREP_MEANING",
  topicNameVi: "Giới từ chỉ Thời gian, Nơi chốn & Cụm giới từ thương mại (Prepositions & Compound Prepositions)",
  idPrefix: "EXP2026_CONN_PM",
  commonTrapVi: "Nhầm lẫn giữa `by` (hạn chót) và `until` (kéo dài liên tục), `within` (+ khoảng thời gian định lượng) và `during` (+ tên giai đoạn), hoặc các cụm giới từ thương mại (`in accordance with`, `on behalf of`, `by means of`, `in light of`, `under the terms of`).",
  errCode: "ERR_VOCAB_COLLOCATION_MISMATCH",
  errNameVi: "Chọn sai Giới từ / Cụm giới từ không khớp ngữ cảnh hoặc quy ước thương mại",
  similarIds: ["ETS2024_T01_Q116", "ETS2024_T01_Q120", "ETS2024_T02_Q103"],
  scenarios: PREP_MEANING_SCENARIOS,
  diffFn: (idx) => (idx < 7 ? 1 : 3),
});

// ============================================================================
// 11. GRM_CONN_TRANSITION (+15 items: EXP2026_CONN_TRANS_Q001..Q015) — D1 (7) & D3 (8)
// ============================================================================
const TRANSITION_SCENARIOS = [
  { l: "The prototype passed all thermal stress tests; ", r: ", the engineering director approved it for mass production.", la: "stress tests;", ra: ", the engineering director", corr: "therefore", dist: [{ t: "nonetheless", r: "Conjunctive Adverb of Concession" }, { t: "otherwise", r: "Conjunctive Adverb of Negative Condition" }, { t: "meanwhile", r: "Conjunctive Adverb of Simultaneous Time" }], role: "Conjunctive Adverb of Result after semicolon (; therefore, = vì vậy, do đó)", rule: "Mệnh đề Nguyên nhân; + therefore / consequently / thus, + Mệnh đề Kết quả", v: ["mass production", "n", "sản xuất hàng loạt"], c: "approve for mass production: phê duyệt để sản xuất hàng loạt" },
  { l: "The new downtown coworking space offers high-speed fiber internet;", r: ", it provides complimentary access to private podcast studios.", la: "fiber internet;", ra: ", it provides complimentary", corr: "furthermore", dist: [{ t: "however", r: "Conjunctive Adverb of Contrast" }, { t: "otherwise", r: "Conjunctive Adverb of Condition" }, { t: "instead", r: "Conjunctive Adverb of Replacement" }], role: "Conjunctive Adverb of Addition (; furthermore, = hơn thế nữa, ngoài ra)", rule: "Mệnh đề Ưu điểm 1; + furthermore / moreover / in addition, + Mệnh đề Ưu điểm 2 (bổ sung thông tin cùng chiều)", v: ["complimentary", "adj", "miễn phí (dịch vụ đi kèm)"], c: "complimentary access: quyền sử dụng miễn phí" },
  { l: "Construction on the coastal highway was delayed by severe winter storms;", r: ", the project was completed within the original budget.", la: "winter storms;", ra: ", the project was completed", corr: "nevertheless", dist: [{ t: "consequently", r: "Conjunctive Adverb of Result" }, { t: "similarly", r: "Conjunctive Adverb of Similarity" }, { t: "for instance", r: "Conjunctive Phrase of Example" }], role: "Conjunctive Adverb of Unexpected Contrast (; nevertheless, = tuy nhiên, bất chấp điều đó)", rule: "Mệnh đề Khó khăn/Trở ngại; + nevertheless / nonetheless / however, + Mệnh đề Kết quả tích cực ngược dự đoán", v: ["budget", "n", "ngân sách"], c: "within the original budget: nằm trong ngân sách ban đầu" },
  { l: "All warehouse staff must complete the forklift safety certification by Friday;", r: ", they will not be scheduled for next week's shifts.", la: "by Friday;", ra: ", they will not be", corr: "otherwise", dist: [{ t: "moreover", r: "Conjunctive Adverb of Addition" }, { t: "likewise", r: "Conjunctive Adverb of Similarity" }, { t: "consequently", r: "Conjunctive Adverb of Result" }], role: "Conjunctive Adverb of Negative Condition (; otherwise, = nếu không thì)", rule: "Mệnh đề Yêu cầu bắt buộc; + otherwise (= if not / nếu không thì), + Mệnh đề Hậu quả bất lợi", v: ["forklift", "n", "xe nâng hàng"], c: "safety certification: chứng chỉ an toàn" },
  { l: "Several luxury retailers have scaled back their physical storefronts; ", r: ", they are investing heavily in augmented-reality mobile shopping apps.", la: "physical storefronts;", ra: ", they are investing", corr: "instead", dist: [{ t: "therefore", r: "Conjunctive Adverb of Result" }, { t: "for example", r: "Conjunctive Phrase of Illustration" }, { t: "likewise", r: "Conjunctive Adverb of Similarity" }], role: "Conjunctive Adverb of Replacement/Alternative (; instead, = thay vào đó)", rule: "Mệnh đề Từ bỏ/Cắt giảm phương án A; + instead (thay vào đó), + Mệnh đề Chuyển sang phương án B", v: ["storefront", "n", "cửa hàng thực tế"], c: "scale back storefronts: thu hẹp số lượng cửa hàng vật lý" },
  { l: "The software engineering team is finalizing the backend database migration;", r: ", the marketing department is preparing the product launch campaign.", la: "database migration;", ra: ", the marketing department", corr: "meanwhile", dist: [{ t: "consequently", r: "Conjunctive Adverb of Result" }, { t: "otherwise", r: "Conjunctive Adverb of Condition" }, { t: "nevertheless", r: "Conjunctive Adverb of Concession" }], role: "Conjunctive Adverb of Simultaneous Action (; meanwhile, = trong lúc đó)", rule: "Mệnh đề Hành động của bộ phận A; + meanwhile (trong cùng thời gian đó), + Mệnh đề Hành động song song của bộ phận B", v: ["migration", "n", "việc chuyển đổi dữ liệu/hệ thống"], c: "product launch campaign: chiến dịch ra mắt sản phẩm" },
  { l: "The hospital has implemented several energy-saving measures;", r: ", it replaced all corridor lighting with motion-activated LED fixtures.", la: "energy-saving measures;", ra: ", it replaced all", corr: "for example", dist: [{ t: "however", r: "Conjunctive Adverb of Contrast" }, { t: "otherwise", r: "Conjunctive Adverb of Condition" }, { t: "on the contrary", r: "Conjunctive Phrase of Denial" }], role: "Conjunctive Phrase of Illustration (; for example, = ví dụ như)", rule: "Mệnh đề Khái quát (several measures); + for example / for instance, + Mệnh đề Minh họa cụ thể", v: ["fixture", "n", "thiết bị chiếu sáng cố định"], c: "energy-saving measures: các biện pháp tiết kiệm năng lượng" },
  { l: "Third-quarter revenue in our North American division grew by fourteen percent;", r: ", our European subsidiaries recorded double-digit expansion.", la: "fourteen percent;", ra: ", our European subsidiaries", corr: "likewise", dist: [{ t: "otherwise", r: "Conjunctive Adverb of Condition" }, { t: "nevertheless", r: "Conjunctive Adverb of Concession" }, { t: "instead", r: "Conjunctive Adverb of Replacement" }], role: "Conjunctive Adverb of Similarity (; likewise, = tương tự như vậy)", rule: "Mệnh đề Kết quả của khu vực A; + likewise / similarly (tương tự như vậy), + Mệnh đề Kết quả tương đồng của khu vực B", v: ["subsidiary", "n", "công ty con"], c: "double-digit expansion: mức tăng trưởng hai chữ số" },
  { l: "The merger negotiations required four months of intensive legal review;", r: ", both boards signed the definitive agreement yesterday.", la: "legal review;", ra: ", both boards signed", corr: "ultimately", dist: [{ t: "otherwise", r: "Conjunctive Adverb of Condition" }, { t: "for instance", r: "Conjunctive Phrase of Example" }, { t: "conversely", r: "Conjunctive Adverb of Opposite Contrast" }], role: "Conjunctive Adverb of Final Outcome (; ultimately, = rốt cuộc, cuối cùng thì)", rule: "Mệnh đề Quá trình kéo dài/phức tạp; + ultimately / eventually (cuối cùng thì), + Mệnh đề Kết cục hoàn tất", v: ["definitive", "adj", "chính thức, cuối cùng"], c: "definitive agreement: thỏa thuận chính thức cuối cùng" },
  { l: "Demand for compact urban apartments has risen sharply this year;", r: ", sales of large suburban estates have declined by nine percent.", la: "sharply this year;", ra: ", sales of large", corr: "conversely", dist: [{ t: "furthermore", r: "Conjunctive Adverb of Addition" }, { t: "consequently", r: "Conjunctive Adverb of Result" }, { t: "for instance", r: "Conjunctive Phrase of Example" }], role: "Conjunctive Adverb of Direct Opposition (; conversely, = ngược lại)", rule: "Mệnh đề Xu hướng tăng của nhóm A; + conversely / by contrast (ngược lại), + Mệnh đề Xu hướng giảm đối lập của nhóm B", v: ["estate", "n", "bất động sản/biệt thự lớn"], c: "rise sharply vs. decline: tăng mạnh đối lập với sụt giảm" },
  { l: "The regional airline experienced a shortage of certified mechanics last month;", r: ", nearly forty domestic flights had to be rescheduled.", la: "last month;", ra: ", nearly forty domestic", corr: "consequently", dist: [{ t: "nonetheless", r: "Conjunctive Adverb of Concession" }, { t: "meanwhile", r: "Conjunctive Adverb of Time" }, { t: "likewise", r: "Conjunctive Adverb of Similarity" }], role: "Conjunctive Adverb of Cause-and-Effect (; consequently, = hậu quả là, do đó)", rule: "Mệnh đề Sự cố/Nguyên nhân; + consequently / as a result (kết quả/hậu quả là), + Mệnh đề Hệ quả trực tiếp", v: ["reschedule", "v", "đổi lịch trình"], c: "shortage of mechanics: sự thiếu hụt thợ máy" },
  { l: "The cloud backup service encrypts files automatically before upload;", r: ", it stores redundant copies across three geographically separate data centers.", la: "before upload;", ra: ", it stores redundant", corr: "moreover", dist: [{ t: "otherwise", r: "Conjunctive Adverb of Condition" }, { t: "however", r: "Conjunctive Adverb of Contrast" }, { t: "instead", r: "Conjunctive Adverb of Replacement" }], role: "Conjunctive Adverb of Reinforcing Addition (; moreover, = hơn nữa, thêm vào đó)", rule: "Mệnh đề Tính năng bảo mật 1; + moreover / furthermore (hơn thế nữa), + Mệnh đề Tính năng bảo mật 2", v: ["redundant", "adj", "dự phòng (bản sao)"], c: "redundant copies: các bản sao dự phòng" },
  { l: "The initial soil survey indicated stable bedrock beneath the site;", r: ", deeper drilling revealed an underground aquifer requiring foundation redesign.", la: "beneath the site;", ra: ", deeper drilling revealed", corr: "however", dist: [{ t: "therefore", r: "Conjunctive Adverb of Result" }, { t: "likewise", r: "Conjunctive Adverb of Similarity" }, { t: "for example", r: "Conjunctive Phrase of Example" }], role: "Conjunctive Adverb of Contrast (; however, = tuy nhiên)", rule: "Mệnh đề Nhận định ban đầu; + however (tuy nhiên), + Mệnh đề Phát hiện thực tế trái ngược", v: ["aquifer", "n", "tầng chứa nước ngầm"], c: "soil survey: khảo sát địa chất/đất" },
  { l: "The municipality offers tax incentives to manufacturers that install rooftop solar arrays;", r: ", it provides low-interest loans for industrial battery storage.", la: "solar arrays;", ra: ", it provides low-interest", corr: "in addition", dist: [{ t: "on the other hand", r: "Conjunctive Phrase of Contrast" }, { t: "as a consequence", r: "Conjunctive Phrase of Result" }, { t: "otherwise", r: "Conjunctive Adverb of Condition" }], role: "Conjunctive Phrase of Addition (; in addition, = ngoài ra, thêm vào đó)", rule: "Mệnh đề Chính sách hỗ trợ 1; + in addition (ngoài ra), + Mệnh đề Chính sách hỗ trợ 2", v: ["tax incentive", "n", "ưu đãi thuế"], c: "offer tax incentives: cung cấp các ưu đãi về thuế" },
  { l: "The artisan bakery has never paid for traditional print or television advertising;", r: ", it has built a loyal following entirely through word-of-mouth referrals.", la: "television advertising;", ra: ", it has built", corr: "rather", dist: [{ t: "therefore", r: "Conjunctive Adverb of Result" }, { t: "moreover", r: "Conjunctive Adverb of Addition" }, { t: "otherwise", r: "Conjunctive Adverb of Condition" }], role: "Conjunctive Adverb of Correction/Alternative after Negative Clause (never A; rather, B = trái lại/thay vào đó là B)", rule: "Mệnh đề Phủ định (never/not A); + rather / instead (thay vào đó, đúng hơn là), + Mệnh đề Khẳng định phương thức thực tế B", v: ["referral", "n", "sự giới thiệu truyền miệng"], c: "word-of-mouth referrals: sự giới thiệu truyền miệng" },
];

export const generateM3TransitionQuestions = makeStandardGenerator({
  topicId: "GRM_CONN_TRANSITION",
  topicNameVi: "Trạng từ liên kết & Từ nối chuyển ý (Conjunctive Adverbs & Discourse Transitions)",
  idPrefix: "EXP2026_CONN_TRANS",
  commonTrapVi: "Không đọc mối quan hệ logic giữa hai mệnh đề trước và sau dấu chấm phẩy (`; ______,`) dẫn đến nhầm giữa quan hệ Nhân quả (`therefore/consequently`), Nhượng bộ (`nevertheless/however`), Bổ sung (`furthermore/moreover`), Điều kiện phủ định (`otherwise`) và Thay thế sau phủ định (`instead/rather`).",
  errCode: "ERR_COHERENCE_DISCOURSE_FLOW",
  errNameVi: "Chọn Trạng từ liên kết sai mạch logic giữa hai mệnh đề",
  similarIds: ["ETS2024_T01_Q133", "ETS2024_T02_Q136", "ETS2024_T04_Q140"],
  scenarios: TRANSITION_SCENARIOS,
  diffFn: (idx) => (idx < 7 ? 1 : 3),
});
