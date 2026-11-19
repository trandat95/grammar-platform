/**
 * Milestone M3 Expansion — Part 1 (57 Curated Academic TOEIC X-Ray Items)
 * Topics:
 *   1. GRM_POS_ADJ     (+16 items: EXP2026_POS_ADJ_Q001..Q016)   -> 29 + 16 = 45
 *   2. GRM_POS_NOUN    (+14 items: EXP2026_POS_NOUN_Q001..Q014)  -> 31 + 14 = 45
 *   3. GRM_POS_ADV     (+8 items:  EXP2026_POS_ADV_Q001..Q008)   -> 37 + 8  = 45
 *   4. GRM_PRON_CASE   (+12 items: EXP2026_PRON_CASE_Q001..Q012) -> 33 + 12 = 45
 *   5. GRM_POS_VERB    (+5 items:  EXP2026_POS_VERB_Q001..Q005)  -> 70 + 5  = 75
 *   6. GRM_VERB_SVA    (+2 items:  EXP2026_VERB_SVA_Q001..Q002)  -> 43 + 2  = 45
 */

import { buildQuestionFromSpec } from "./m2_items_part1.mjs";

const KEYS = ["A", "B", "C", "D"];

function makeStandardGenerator({
  topicId,
  topicNameVi,
  idPrefix,
  skillCategory = "GRAMMAR",
  defaultBand = 550,
  defaultTime = 10,
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
      const diff = diffFn ? diffFn(idx) : idx % 2 === 0 ? 2 : 3;
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
              : `Sai ngữ pháp: "${dText}" không thỏa mãn quy tắc "${sc.rule}" tại vị trí chỗ trống này.`;
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
// 1. GRM_POS_ADJ (+16 items: EXP2026_POS_ADJ_Q001..Q016)
// ============================================================================
const ADJ_SCENARIOS = [
  { l: "The chief financial officer found the revised budget proposal highly", r: "for the upcoming fiscal year.", la: "proposal highly", ra: "for the upcoming", corr: "favorable", dist: [{ t: "favor", r: "Noun / Verb" }, { t: "favorably", r: "Adverb (-ly)" }, { t: "favored", r: "Past Verb" }], role: "Adjective as Object Complement (find + Object + [adv] + Adjective)", rule: "find / consider / deem / keep + Tân ngữ + (Trạng từ) + Tính từ (Object Complement)", v: ["favorable", "adj", "thuận lợi, khả quan"], c: "favorable budget proposal: đề xuất ngân sách khả quan" },
  { l: "To keep sensitive patient records", r: ", the hospital upgraded its cloud encryption protocols.", la: "patient records", ra: ", the hospital upgraded", corr: "confidential", dist: [{ t: "confidentiality", r: "Noun (-ity)" }, { t: "confidentially", r: "Adverb (-ly)" }, { t: "confide", r: "Base Verb" }], role: "Adjective as Object Complement (keep + Object + Adjective)", rule: "keep / make / leave + Tân ngữ + Tính từ (bổ ngữ cho tân ngữ)", v: ["confidential", "adj", "bảo mật, tuyệt mật"], c: "keep records confidential: giữ hồ sơ bảo mật" },
  { l: "The new biometric authentication software proved remarkably", r: "at preventing unauthorized server access.", la: "proved remarkably", ra: "at preventing unauthorized", corr: "effective", dist: [{ t: "effectively", r: "Adverb (-ly)" }, { t: "effectiveness", r: "Noun (-ness)" }, { t: "effect", r: "Noun" }], role: "Predicative Adjective after Linking Verb 'prove' (prove + adv + Adjective)", rule: "Linking Verb (be / become / remain / prove / seem) + (Adverb) + Tính từ", v: ["authentication", "n", "sự xác thực danh tính"], c: "prove effective at: chứng tỏ hiệu quả trong việc" },
  { l: "All warehouse supervisors must remain", r: "to potential safety hazards on the loading dock.", la: "must remain", ra: "to potential safety", corr: "attentive", dist: [{ t: "attention", r: "Noun (-tion)" }, { t: "attentively", r: "Adverb (-ly)" }, { t: "attend", r: "Base Verb" }], role: "Predicative Adjective after Linking Verb 'remain' (remain attentive to)", rule: "remain + Tính từ (+ giới từ: attentive to = chú ý, cảnh giác với)", v: ["hazard", "n", "mối nguy hiểm, rủi ro"], c: "remain attentive to: luôn chú ý/cảnh giác với" },
  { l: "Even after three rounds of negotiation, the union leadership considered the wage offer", r: ".", la: "wage offer", ra: ".", corr: "inadequate", dist: [{ t: "inadequately", r: "Adverb (-ly)" }, { t: "inadequacy", r: "Noun (-cy)" }, { t: "adequateness", r: "Noun (-ness)" }], role: "Adjective as Object Complement (consider + Object + Adjective)", rule: "consider / deem + Tân ngữ + Tính từ (cho rằng cái gì như thế nào)", v: ["inadequate", "adj", "không thỏa đáng, chưa đủ"], c: "consider the offer inadequate: cho rằng đề xuất chưa thỏa đáng" },
  { l: "The updated accounting software makes quarterly tax preparation much more", r: "for small retail firms.", la: "much more", ra: "for small retail", corr: "manageable", dist: [{ t: "manageably", r: "Adverb (-ly)" }, { t: "management", r: "Noun (-ment)" }, { t: "manager", r: "Person Noun (-er)" }], role: "Adjective as Object Complement (make + Object + more + Adjective)", rule: "make + Tân ngữ + (more) + Tính từ (làm cho cái gì trở nên thế nào)", v: ["manageable", "adj", "dễ quản lý, có thể xoay xở"], c: "make preparation manageable: giúp việc chuẩn bị dễ thực hiện hơn" },
  { l: "Despite fierce competition in the telecom sector, NexaCorp has stayed consistently", r: "over the past decade.", la: "stayed consistently", ra: "over the past", corr: "profitable", dist: [{ t: "profitably", r: "Adverb (-ly)" }, { t: "profitability", r: "Noun (-ity)" }, { t: "profited", r: "Past Verb" }], role: "Predicative Adjective after Linking Verb 'stay' (stay + adv + Adjective)", rule: "stay / remain + (Adverb) + Tính từ (duy trì trạng thái như thế nào)", v: ["profitable", "adj", "có lợi nhuận, sinh lời"], c: "stay consistently profitable: duy trì lợi nhuận ổn định" },
  { l: "Any employee who becomes", r: "of a cybersecurity breach must notify the IT help desk immediately.", la: "who becomes", ra: "of a cybersecurity", corr: "aware", dist: [{ t: "awareness", r: "Noun (-ness)" }, { t: "awarely", r: "Non-standard Adverb" }, { t: "awaken", r: "Verb" }], role: "Predicative Adjective after Linking Verb 'become' (become aware of)", rule: "become / be + aware of + Noun (nhận thức / phát hiện ra điều gì)", v: ["breach", "n", "sự vi phạm, rò rỉ dữ liệu"], c: "become aware of: phát hiện ra, biết về" },
  { l: "The streamlined customs clearance procedure was", r: "in reducing port congestion by twenty percent.", la: "procedure was", ra: "in reducing port", corr: "instrumental", dist: [{ t: "instrument", r: "Noun" }, { t: "instrumentally", r: "Adverb (-ly)" }, { t: "instrumentation", r: "Noun (-tion)" }], role: "Predicative Adjective (be instrumental in + V-ing = đóng vai trò then chốt)", rule: "be instrumental in + V-ing / Noun (đóng vai trò quan trọng giúp đạt điều gì)", v: ["instrumental", "adj", "đóng vai trò then chốt"], c: "be instrumental in reducing: đóng vai trò chủ chốt trong việc giảm" },
  { l: "Customers are eligible for a full refund only if the returned merchandise is in", r: "condition.", la: "is in", ra: "condition.", corr: "salable", dist: [{ t: "sale", r: "Noun" }, { t: "salability", r: "Noun (-ity)" }, { t: "selling", r: "Gerund" }], role: "Attributive Adjective before Noun 'condition' (in salable condition)", rule: "Giới từ (in) + Tính từ + Danh từ (in salable/original condition)", v: ["salable", "adj", "có thể bán lại được"], c: "in salable condition: trong tình trạng còn bán được" },
  { l: "The external auditors deemed the inventory valuation methods fully", r: "with international reporting standards.", la: "methods fully", ra: "with international reporting", corr: "compliant", dist: [{ t: "compliance", r: "Noun (-ce)" }, { t: "compliantly", r: "Adverb (-ly)" }, { t: "comply", r: "Base Verb" }], role: "Adjective as Object Complement (deem + Object + adv + Adjective)", rule: "deem + Tân ngữ + (Adverb) + compliant with (đánh giá cái gì tuân thủ đúng quy chuẩn)", v: ["compliant", "adj", "tuân thủ quy định"], c: "compliant with standards: tuân thủ các tiêu chuẩn" },
  { l: "Although the prototype's exterior looks", r: ", its internal battery architecture has been completely redesigned.", la: "exterior looks", ra: ", its internal battery", corr: "identical", dist: [{ t: "identically", r: "Adverb (-ly)" }, { t: "identity", r: "Noun (-ity)" }, { t: "identify", r: "Base Verb" }], role: "Predicative Adjective after Linking Verb 'look' (look + Adjective)", rule: "Động từ tri giác (look / appear / sound / feel) + Tính từ", v: ["prototype", "n", "nguyên mẫu thử nghiệm"], c: "look identical: trông giống hệt" },
  { l: "Please leave the conference room", r: "after your afternoon client presentation concludes.", la: "conference room", ra: "after your afternoon", corr: "tidy", dist: [{ t: "tidiness", r: "Noun (-ness)" }, { t: "tidily", r: "Adverb (-ly)" }, { t: "tidied up", r: "Phrasal Verb" }], role: "Adjective as Object Complement (leave + Object + Adjective)", rule: "leave + Tân ngữ + Tính từ (để lại vật/nơi chốn ở trạng thái nào)", v: ["tidy", "adj", "gọn gàng, ngăn nắp"], c: "leave the room tidy: giữ phòng gọn gàng sau khi dùng" },
  { l: "The pharmaceutical giant is seeking a research partner", r: "of conducting large-scale clinical trials in Asia.", la: "research partner", ra: "of conducting large-scale", corr: "capable", dist: [{ t: "capability", r: "Noun (-ity)" }, { t: "capably", r: "Adverb (-ly)" }, { t: "capacitate", r: "Verb" }], role: "Postpositive Adjective Phrase modifying 'partner' (a partner [who is] capable of)", rule: "Danh từ + Tính từ hậu vị (capable of / responsible for / available to) — rút gọn mệnh đề quan hệ", v: ["clinical trial", "n", "thử nghiệm lâm sàng"], c: "capable of conducting: có năng lực tiến hành" },
  { l: "Any expense reimbursement request exceeding $500 requires", r: "written authorization from a department head.", la: "requires", ra: "written authorization from", corr: "prior", dist: [{ t: "priority", r: "Noun (-ity)" }, { t: "prioritize", r: "Verb (-ize)" }, { t: "priorly", r: "Non-standard Adverb" }], role: "Attributive Adjective modifying 'written authorization' (prior authorization)", rule: "Tính từ (prior) + Cụm danh từ (written authorization = sự phê duyệt trước bằng văn bản)", v: ["reimbursement", "n", "sự hoàn trả chi phí"], c: "prior written authorization: sự phê duyệt trước bằng văn bản" },
  { l: "The newly appointed chief operating officer is", r: "about the semiconductor division's third-quarter growth prospects.", la: "officer is", ra: "about the semiconductor", corr: "optimistic", dist: [{ t: "optimism", r: "Noun (-ism)" }, { t: "optimistically", r: "Adverb (-ly)" }, { t: "optimist", r: "Person Noun (-ist)" }], role: "Predicative Adjective after 'be' (be optimistic about)", rule: "be + Tính từ (optimistic about = lạc quan về)", v: ["prospect", "n", "triển vọng"], c: "optimistic about growth prospects: lạc quan về triển vọng tăng trưởng" },
];

export const generateM3AdjQuestions = makeStandardGenerator({
  topicId: "GRM_POS_ADJ",
  topicNameVi: "Tính từ: Vị trí, Hậu tố & Động từ nối (Adjectives & Linking Verbs)",
  idPrefix: "EXP2026_POS_ADJ",
  commonTrapVi: "Bẫy chọn trạng từ `-ly` sau động từ nối (`remain/prove/stay/look`) hoặc sau cấu trúc bổ ngữ tân ngữ (`find/keep/make/consider/deem/leave + O + Adj`).",
  errCode: "ERR_POS_ADV_FOR_ADJ",
  errNameVi: "Dùng Trạng từ thay vì Tính từ sau Linking Verb hoặc Object Complement",
  similarIds: ["ETS2024_T01_Q107", "ETS2024_T02_Q131", "ETS2024_T04_Q125"],
  scenarios: ADJ_SCENARIOS,
  diffFn: (idx) => (idx < 8 ? 2 : 3),
});

// ============================================================================
// 2. GRM_POS_NOUN (+14 items: EXP2026_POS_NOUN_Q001..Q014)
// ============================================================================
const NOUN_SCENARIOS = [
  { l: "All visitors to the chemical processing laboratory must wear protective gear as a safety", r: ".", la: "a safety", ra: ".", corr: "precaution", dist: [{ t: "precautionary", r: "Adjective (-ary)" }, { t: "precautious", r: "Adjective (-ous)" }, { t: "precautiously", r: "Adverb (-ly)" }], role: "Head Noun in Compound Noun (a safety precaution = biện pháp phòng ngừa an toàn)", rule: "Mạo từ (a) + Danh từ bổ nghĩa (safety) + Danh từ chính (precaution)", v: ["precaution", "n", "biện pháp phòng ngừa"], c: "safety precaution: biện pháp phòng ngừa an toàn" },
  { l: "The board of directors expressed strong", r: "of the chief executive's five-year sustainability roadmap.", la: "expressed strong", ra: "of the chief", corr: "approval", dist: [{ t: "approve", r: "Base Verb" }, { t: "approvingly", r: "Adverb (-ly)" }, { t: "approved", r: "Past Participle" }], role: "Noun ending in '-al' after Adjective 'strong' (strong approval of)", rule: "Ngoại động từ (express) + Tính từ (strong) + Danh từ (approval - danh từ đuôi -al!) + of", v: ["approval", "n", "sự tán thành, phê duyệt"], c: "express strong approval of: bày tỏ sự tán thành mạnh mẽ" },
  { l: "Upon the", r: "of the thirty-day trial period, subscribers will be billed automatically.", la: "Upon the", ra: "of the thirty-day", corr: "expiration", dist: [{ t: "expire", r: "Base Verb" }, { t: "expired", r: "Past Participle" }, { t: "expiring", r: "Participle" }], role: "Noun between 'the' and 'of' (Upon the expiration of)", rule: "the + Danh từ (-tion) + of + Noun Phrase", v: ["expiration", "n", "sự hết hạn"], c: "upon the expiration of: ngay khi hết hạn" },
  { l: "Regular calibration of the laser cutting machines ensures high precision and operational", r: ".", la: "and operational", ra: ".", corr: "reliability", dist: [{ t: "reliable", r: "Adjective (-able)" }, { t: "reliably", r: "Adverb (-ly)" }, { t: "rely", r: "Base Verb" }], role: "Noun after Adjective 'operational' (parallel to 'high precision')", rule: "Cấu trúc song song: [Adj + Noun] and [Adj + Danh từ (-ity)]", v: ["calibration", "n", "sự hiệu chuẩn thiết bị"], c: "operational reliability: độ tin cậy khi vận hành" },
  { l: "Ms. Lindqvist received formal", r: "from the municipal council for her leadership in urban reforestation.", la: "received formal", ra: "from the municipal", corr: "recognition", dist: [{ t: "recognize", r: "Base Verb" }, { t: "recognizable", r: "Adjective (-able)" }, { t: "recognizably", r: "Adverb (-ly)" }], role: "Uncountable Noun after Adjective 'formal' (receive formal recognition)", rule: "Ngoại động từ (receive) + Tính từ (formal) + Danh từ không đếm được (recognition)", v: ["recognition", "n", "sự ghi nhận, vinh danh"], c: "receive formal recognition: nhận được sự ghi nhận chính thức" },
  { l: "Please submit a copy of your professional certification to the human resources", r: "by Friday.", la: "human resources", ra: "by Friday.", corr: "representative", dist: [{ t: "represent", r: "Base Verb" }, { t: "representation", r: "Abstract Noun (-tion)" }, { t: "representatively", r: "Adverb (-ly)" }], role: "Person Noun ending in '-ative' (human resources representative = người đại diện nhân sự)", rule: "Sau cụm danh từ chỉ phòng ban cần Danh từ chỉ người (representative) nhận hồ sơ (lưu ý đuôi -ative nhưng là Danh từ đếm được!)", v: ["representative", "n", "người đại diện, nhân viên phụ trách"], c: "human resources representative: chuyên viên đại diện phòng nhân sự" },
  { l: "The merger agreement remains subject to final", r: "by the federal antitrust commission.", la: "to final", ra: "by the federal", corr: "clearance", dist: [{ t: "clear", r: "Adjective / Verb" }, { t: "clearly", r: "Adverb (-ly)" }, { t: "cleared", r: "Past Verb" }], role: "Noun after Preposition 'to' + Adjective 'final' (subject to final clearance)", rule: "be subject to (giới từ) + (Tính từ) + Danh từ (-ance)", v: ["clearance", "n", "sự cấp phép, thông qua"], c: "subject to final clearance: tùy thuộc vào sự thông qua cuối cùng" },
  { l: "Strict", r: "with international aviation safety regulations is mandatory for all charter carriers.", la: "Strict", ra: "with international aviation", corr: "compliance", dist: [{ t: "compliant", r: "Adjective (-ant)" }, { t: "comply", r: "Base Verb" }, { t: "compliantly", r: "Adverb (-ly)" }], role: "Head Noun of Subject Phrase (Strict compliance with ... is mandatory)", rule: "Tính từ đầu câu (Strict) + Danh từ làm chủ ngữ (compliance) + Cụm giới từ + Động từ số ít (is)", v: ["compliance", "n", "sự tuân thủ"], c: "strict compliance with regulations: sự tuân thủ nghiêm ngặt quy định" },
  { l: "The newly launched savings account offers competitive interest rates with no minimum balance", r: ".", la: "minimum balance", ra: ".", corr: "requirement", dist: [{ t: "require", r: "Base Verb" }, { t: "required", r: "Past Participle" }, { t: "requiring", r: "Present Participle" }], role: "Head Noun in Compound Noun (minimum balance requirement = yêu cầu số dư tối thiểu)", rule: "no + Cụm danh từ ghép (minimum balance + Danh từ chính: requirement)", v: ["balance", "n", "số dư tài khoản"], c: "minimum balance requirement: yêu cầu số dư tối thiểu" },
  { l: "Through the", r: "of automated sorting conveyors, the distribution center doubled its daily throughput.", la: "Through the", ra: "of automated sorting", corr: "implementation", dist: [{ t: "implement", r: "Base Verb" }, { t: "implemented", r: "Past Participle" }, { t: "implementing", r: "Gerund (cannot take 'the...of')" }], role: "Pure Noun between 'the' and 'of' (the implementation of)", rule: "the + Danh từ thuần (-tion) + of + Noun Phrase (không dùng V-ing giữa 'the ... of')", v: ["throughput", "n", "lưu lượng xử lý"], c: "the implementation of: việc triển khai/áp dụng" },
  { l: "To qualify for the senior architect position, candidates must demonstrate proficiency in structural", r: ".", la: "in structural", ra: ".", corr: "analysis", dist: [{ t: "analyze", r: "Base Verb" }, { t: "analytical", r: "Adjective (-al)" }, { t: "analytically", r: "Adverb (-ly)" }], role: "Uncountable Noun after Adjective 'structural' (structural analysis = phân tích kết cấu)", rule: "Giới từ (in) + Tính từ (structural) + Danh từ chỉ lĩnh vực (analysis) vs Danh từ chỉ người (analyst)", v: ["proficiency", "n", "sự thành thạo"], c: "structural analysis: phân tích kết cấu" },
  { l: "The hospitality group hired an independent financial", r: "to evaluate the acquisition of three coastal resorts.", la: "independent financial", ra: "to evaluate the", corr: "strategist", dist: [{ t: "strategy", r: "Abstract Noun" }, { t: "strategic", r: "Adjective (-ic)" }, { t: "strategically", r: "Adverb (-ly)" }], role: "Countable Person Noun after 'an + Adj + Adj' (an independent financial strategist)", rule: "Mạo từ 'an' + Tính từ + Danh từ đếm được chỉ người (strategist - chiến lược gia) sau động từ 'hired'", v: ["acquisition", "n", "thương vụ mua lại/thâu tóm"], c: "hire a financial strategist: thuê một chiến lược gia tài chính" },
  { l: "Any unauthorized", r: "of proprietary source code will result in immediate termination of employment.", la: "unauthorized", ra: "of proprietary source", corr: "disclosure", dist: [{ t: "disclose", r: "Base Verb" }, { t: "disclosed", r: "Past Participle" }, { t: "disclosing", r: "Participle" }], role: "Head Noun after Determiner 'Any' + Adjective 'unauthorized' (unauthorized disclosure of)", rule: "Determiner (Any) + Tính từ + Danh từ (-ure: disclosure) + of", v: ["disclosure", "n", "sự tiết lộ thông tin"], c: "unauthorized disclosure of: hành vi tiết lộ trái phép" },
  { l: "We apologize for the temporary", r: "caused by the elevator modernization project in the North Tower.", la: "the temporary", ra: "caused by the", corr: "inconvenience", dist: [{ t: "inconvenient", r: "Adjective (-ent)" }, { t: "inconveniently", r: "Adverb (-ly)" }, { t: "convenient", r: "Adjective" }], role: "Noun after 'the + Adjective' (the temporary inconvenience)", rule: "the + Tính từ (temporary) + Danh từ (-ence: inconvenience) + Mệnh đề phân từ rút gọn (caused by...)", v: ["modernization", "n", "sự hiện đại hóa, nâng cấp"], c: "apologize for the inconvenience: xin lỗi vì sự bất tiện" },
];

export const generateM3NounQuestions = makeStandardGenerator({
  topicId: "GRM_POS_NOUN",
  topicNameVi: "Danh từ: Vị trí, Hậu tố & Danh từ ghép (Noun Positions & Compound Nouns)",
  idPrefix: "EXP2026_POS_NOUN",
  commonTrapVi: "Nhầm lẫn giữa Danh từ chỉ người (`representative/strategist/analyst`) với Danh từ chỉ vật/khái niệm (`representation/strategy/analysis`), hoặc nhầm Danh từ đuôi `-al` (`approval/renewal/proposal`) là Tính từ.",
  errCode: "ERR_POS_ADJ_FOR_NOUN",
  errNameVi: "Dùng sai từ loại ở vị trí Danh từ chính hoặc nhầm Danh từ chỉ người/vật",
  similarIds: ["ETS2024_T01_Q118", "ETS2024_T02_Q102", "ETS2024_T02_Q116"],
  scenarios: NOUN_SCENARIOS,
  diffFn: (idx) => (idx < 7 ? 2 : 3),
});

// Override errCode for Noun generator to use canonical catalog code ERR_POS_NOUN_FOR_ADJ
for (const sc of NOUN_SCENARIOS) {
  sc.errCode = "ERR_POS_NOUN_FOR_ADJ";
  sc.errNameVi = "Nhầm lẫn vị trí Danh từ / Tính từ trong cụm danh từ (NP)";
}

// ============================================================================
// 3. GRM_POS_ADV (+8 items: EXP2026_POS_ADV_Q001..Q008)
// ============================================================================
const ADV_SCENARIOS = [
  { l: "The updated logistics software is", r: "compatible with both legacy warehouse scanners and mobile tablets.", la: "software is", ra: "compatible with both", corr: "fully", dist: [{ t: "full", r: "Adjective" }, { t: "fullest", r: "Superlative Adjective" }, { t: "fullness", r: "Noun (-ness)" }], role: "Adverb of Degree modifying Adjective 'compatible' (be + Adverb + Adjective)", rule: "be + Trạng từ (-ly) + Tính từ (compatible)", v: ["compatible", "adj", "tương thích"], c: "fully compatible with: tương thích hoàn toàn với" },
  { l: "All hazardous chemical containers must be", r: "sealed before being loaded onto the freight vessel.", la: "must be", ra: "sealed before being", corr: "securely", dist: [{ t: "secure", r: "Adjective / Verb" }, { t: "security", r: "Noun (-ity)" }, { t: "securing", r: "Participle" }], role: "Adverb modifying Past Participle 'sealed' (be + Adverb + V3/ed)", rule: "be + Trạng từ (-ly) + V3/ed (bổ nghĩa cho phân từ bị động)", v: ["vessel", "n", "tàu chở hàng"], c: "securely sealed: được niêm phong chắc chắn" },
  { l: "", r: ", the regional sales conference will be held in Osaka rather than Kyoto this autumn.", la: "", ra: ", the regional sales", corr: "Reportedly", dist: [{ t: "Reported", r: "Past Participle" }, { t: "Reporting", r: "Present Participle" }, { t: "Report", r: "Noun / Verb" }], role: "Sentence-initial Adverb modifying the entire clause (Adv, S + V)", rule: "Đầu câu trước dấu phẩy và một mệnh đề hoàn chỉnh (S + V) -> Điền Trạng từ (-ly)", v: ["reportedly", "adv", "theo như đưa tin/báo cáo"], c: "Reportedly, S + V: Theo thông tin ghi nhận, ..." },
  { l: "Our customer support specialists respond", r: "to technical inquiries submitted through the enterprise portal.", la: "specialists respond", ra: "to technical inquiries", corr: "promptly", dist: [{ t: "prompt", r: "Adjective / Verb" }, { t: "promptness", r: "Noun (-ness)" }, { t: "prompted", r: "Past Verb" }], role: "Adverb of Manner modifying Intransitive Verb 'respond' (respond promptly to)", rule: "Nội động từ (respond / react / comply) + Trạng từ (-ly) + Giới từ", v: ["inquiry", "n", "câu hỏi, yêu cầu thông tin"], c: "respond promptly to: phản hồi nhanh chóng với" },
  { l: "The newly installed solar panels generate", r: "enough electricity to power the entire administrative complex.", la: "panels generate", ra: "enough electricity to", corr: "nearly", dist: [{ t: "near", r: "Adjective / Preposition" }, { t: "nearest", r: "Superlative Adjective" }, { t: "nearing", r: "Participle" }], role: "Adverb of Approximation modifying Determiner 'enough' (nearly enough = gần như đủ)", rule: "Phân biệt cặp trạng từ: nearly (= almost / gần như, xấp xỉ) vs near (gần về khoảng cách)", v: ["complex", "n", "khu phức hợp"], c: "nearly enough: gần như đủ" },
  { l: "Having worked in international customs brokerage for twenty years, Mr. Alvarez is", r: "regarded by his peers.", la: "Alvarez is", ra: "regarded by his", corr: "highly", dist: [{ t: "high", r: "Adjective / Physical Adverb" }, { t: "height", r: "Noun" }, { t: "higher", r: "Comparative Adjective" }], role: "Abstract Adverb modifying Past Participle 'regarded' (be highly regarded)", rule: "Phân biệt: highly (mang nghĩa trừu tượng = rất, đánh giá cao) vs high (cao về vị trí vật lý)", v: ["peer", "n", "đồng nghiệp cùng ngành"], c: "be highly regarded: được đánh giá rất cao" },
  { l: "The microchips manufactured at the Dresden facility are", r: "inspected for microscopic defects prior to packaging.", la: "facility are", ra: "inspected for microscopic", corr: "thoroughly", dist: [{ t: "thorough", r: "Adjective" }, { t: "thoroughness", r: "Noun (-ness)" }, { t: "through", r: "Preposition" }], role: "Adverb of Manner between 'be' and Past Participle 'inspected'", rule: "Trợ động từ (are) + Trạng từ (-ly) + Động từ chính (V3/ed)", v: ["defect", "n", "lỗi, khuyết tật sản phẩm"], c: "thoroughly inspected: được kiểm tra kỹ lưỡng" },
  { l: "Because the quarterly audit is due tomorrow, the accounting team worked", r: "to reconcile the remaining ledger discrepancies.", la: "team worked", ra: "to reconcile the", corr: "late", dist: [{ t: "lately", r: "Adverb (= recently)" }, { t: "lateness", r: "Noun (-ness)" }, { t: "later on", r: "Time Phrase" }], role: "Irregular Adverb modifying 'worked' (work late = làm việc muộn/tăng ca)", rule: "Bẫy trạng từ không có -ly: work late (làm muộn) vs lately (= recently / gần đây, thường đi với Hiện tại hoàn thành)", v: ["reconcile", "v", "đối soát, cân đối sổ sách"], c: "work late: làm việc muộn" },
];

export const generateM3AdvQuestions = makeStandardGenerator({
  topicId: "GRM_POS_ADV",
  topicNameVi: "Trạng từ: Vị trí & Các cặp trạng từ dễ nhầm (Adverb Positions & Confusable Pairs)",
  idPrefix: "EXP2026_POS_ADV",
  commonTrapVi: "Bẫy chọn Tính từ thay vì Trạng từ ở giữa `be + [Adv] + Adj/V3`, hoặc nhầm các cặp trạng từ `hard/hardly`, `late/lately`, `high/highly`, `near/nearly`.",
  errCode: "ERR_POS_ADJ_FOR_ADV",
  errNameVi: "Dùng Tính từ thay vì Trạng từ để bổ nghĩa cho Động từ/Tính từ/Phân từ",
  similarIds: ["ETS2024_T01_Q115", "ETS2024_T01_Q135", "ETS2024_T02_Q110"],
  scenarios: ADV_SCENARIOS,
  diffFn: (idx) => (idx < 4 ? 2 : 3),
});

// ============================================================================
// 4. GRM_PRON_CASE (+12 items: EXP2026_PRON_CASE_Q001..Q012)
// ============================================================================
const PRON_CASE_SCENARIOS = [
  { l: "Ms. Deshmukh organized the entire international trade symposium", r: "without hiring an external event agency.", la: "trade symposium", ra: "without hiring an", corr: "herself", dist: [{ t: "she", r: "Subject Pronoun" }, { t: "her", r: "Object Pronoun / Possessive Adj" }, { t: "hers", r: "Possessive Pronoun" }], role: "Emphatic Reflexive Pronoun at the end of a complete clause (organized ... herself)", rule: "Khi mệnh đề đã đủ Chủ ngữ (Ms. Deshmukh) + Động từ + Tân ngữ (the symposium) -> Dùng Đại từ phản thân (-self) để nhấn mạnh 'tự chính cô ấy làm'", v: ["symposium", "n", "hội nghị chuyên đề"], c: "organize ... herself: tự mình tổ chức" },
  { l: "While our assembly plant in Monterrey operates twenty-four hours a day,", r: "in Guadalajara runs only two shifts.", la: "a day,", ra: "in Guadalajara runs", corr: "theirs", dist: [{ t: "their", r: "Possessive Adjective (needs a noun)" }, { t: "them", r: "Object Pronoun" }, { t: "themselves", r: "Reflexive Pronoun" }], role: "Possessive Pronoun standing alone as Subject (theirs = their assembly plant)", rule: "Đại từ sở hữu (theirs = their + Noun) đứng độc lập làm chủ ngữ cho động từ số ít 'runs'", v: ["shift", "n", "ca làm việc"], c: "our plant vs. theirs: nhà máy của chúng tôi so với của họ" },
  { l: "All freelance graphic designers must register", r: "on the vendor portal before submitting an invoice.", la: "must register", ra: "on the vendor", corr: "themselves", dist: [{ t: "they", r: "Subject Pronoun" }, { t: "their", r: "Possessive Adjective" }, { t: "theirs", r: "Possessive Pronoun" }], role: "Reflexive Pronoun as Direct Object (designers register themselves)", rule: "Khi Chủ ngữ (designers) và Tân ngữ chỉ cùng một đối tượng -> Dùng Đại từ phản thân số nhiều (themselves)", v: ["invoice", "n", "hóa đơn thanh toán"], c: "register themselves: tự đăng ký thông tin của mình" },
  { l: "The vice president of marketing asked", r: "assistant to compile the competitor pricing data before noon.", la: "marketing asked", ra: "assistant to compile", corr: "his", dist: [{ t: "he", r: "Subject Pronoun" }, { t: "him", r: "Object Pronoun" }, { t: "himself", r: "Reflexive Pronoun" }], role: "Possessive Adjective modifying Noun 'assistant' (asked his assistant)", rule: "Trước danh từ đếm được (assistant) bắt buộc dùng Tính từ sở hữu (his), tuyệt đối không dùng tân ngữ 'him' dù đứng sau động từ 'asked'", v: ["compile", "v", "tổng hợp, biên soạn"], c: "ask his assistant: yêu cầu trợ lý của ông ấy" },
  { l: "Any technician who prefers to work on the weekend shift by", r: "should notify the floor supervisor.", la: "shift by", ra: "should notify the", corr: "himself", dist: [{ t: "he", r: "Subject Pronoun" }, { t: "his", r: "Possessive Adjective" }, { t: "him", r: "Object Pronoun" }], role: "Reflexive Pronoun in Idiom 'by oneself' (by himself = một mình / tự lực)", rule: "Cụm cố định: by + Đại từ phản thân (by himself / herself / themselves = alone / on one's own)", v: ["supervisor", "n", "người giám sát"], c: "by himself: làm việc một mình" },
  { l: "Although the two architectural firms submitted separate bids, our design proposal was significantly more cost-effective than", r: ".", la: "cost-effective than", ra: ".", corr: "theirs", dist: [{ t: "their", r: "Possessive Adjective (needs a noun)" }, { t: "them", r: "Object Pronoun" }, { t: "they", r: "Subject Pronoun" }], role: "Possessive Pronoun in Comparison (our design proposal ... than theirs [= their design proposal])", rule: "So sánh tương đương đối tượng: our + Noun ... than + Đại từ sở hữu (theirs = their + Noun)", v: ["cost-effective", "adj", "hiệu quả về chi phí"], c: "more cost-effective than theirs: tiết kiệm chi phí hơn đề xuất của họ" },
  { l: "The board members familiarized", r: "with the revised corporate governance charter prior to the annual vote.", la: "members familiarized", ra: "with the revised", corr: "themselves", dist: [{ t: "them", r: "Object Pronoun" }, { t: "their", r: "Possessive Adjective" }, { t: "theirs", r: "Possessive Pronoun" }], role: "Reflexive Pronoun in Collocation 'familiarize oneself with'", rule: "Cấu trúc phản thân cố định: familiarize + oneself (themselves) + with + Something (tự làm quen/nắm rõ cái gì)", v: ["charter", "n", "điều lệ, quy chế"], c: "familiarize themselves with: tự tìm hiểu kỹ về" },
  { l: "Because Dr. Takahashi's laptop was being serviced, a colleague lent him", r: "for the morning keynote address.", la: "lent him", ra: "for the morning", corr: "hers", dist: [{ t: "her", r: "Possessive Adjective / Object Pronoun" }, { t: "she", r: "Subject Pronoun" }, { t: "herself", r: "Reflexive Pronoun" }], role: "Possessive Pronoun as Direct Object (lent him hers [= her laptop])", rule: "lend + Indirect Object (him) + Direct Object (hers = her laptop)", v: ["keynote address", "n", "bài phát biểu chính"], c: "lend him hers: cho ông ấy mượn chiếc máy của cô ấy" },
  { l: "To protect client privacy, the law firm requires all associates to shred confidential drafts on", r: "own.", la: "drafts on", ra: "own.", corr: "their", dist: [{ t: "them", r: "Object Pronoun" }, { t: "theirs", r: "Possessive Pronoun" }, { t: "themselves", r: "Reflexive Pronoun" }], role: "Possessive Adjective before 'own' (on their own = tự mình)", rule: "Cụm cố định: on + Tính từ sở hữu (my/his/her/their) + own (= by oneself)", v: ["shred", "v", "tiêu hủy/cắt vụn tài liệu"], c: "on their own: tự mình thực hiện" },
  { l: "Mr. Beaumont assured the regional branch managers that he would review", r: "staffing requests personally.", la: "would review", ra: "staffing requests personally.", corr: "their", dist: [{ t: "they", r: "Subject Pronoun" }, { t: "them", r: "Object Pronoun" }, { t: "theirs", r: "Possessive Pronoun" }], role: "Possessive Adjective modifying Noun Phrase 'staffing requests'", rule: "Ngoại động từ (review) + Tính từ sở hữu (their) + Cụm danh từ (staffing requests)", v: ["staffing", "n", "việc bố trí nhân sự"], c: "review their staffing requests: xem xét yêu cầu nhân sự của họ" },
  { l: "The newly hired software engineers introduced", r: "to the product development team during Monday's stand-up meeting.", la: "engineers introduced", ra: "to the product", corr: "themselves", dist: [{ t: "them", r: "Object Pronoun" }, { t: "their", r: "Possessive Adjective" }, { t: "they", r: "Subject Pronoun" }], role: "Reflexive Pronoun (introduce oneself to = tự giới thiệu bản thân với)", rule: "introduce + oneself (themselves) + to + Somebody (tự giới thiệu bản thân)", v: ["stand-up meeting", "n", "cuộc họp giao ban ngắn"], c: "introduce themselves to: tự giới thiệu bản thân với" },
  { l: "A dedicated account manager will contact", r: "within twenty-four hours to confirm the freight delivery schedule.", la: "will contact", ra: "within twenty-four hours", corr: "you", dist: [{ t: "your", r: "Possessive Adjective (needs a noun)" }, { t: "yours", r: "Possessive Pronoun" }, { t: "yourself", r: "Reflexive Pronoun (subject is manager, not you)" }], role: "Object Pronoun after Transitive Verb 'contact' (contact you)", rule: "Chủ ngữ là 'account manager' khác với người nhận hành động -> Dùng Đại từ tân ngữ (you), không dùng phản thân 'yourself' và không có danh từ theo sau nên loại 'your'", v: ["dedicated", "adj", "chuyên trách, tận tâm"], c: "contact you within 24 hours: liên hệ với bạn trong vòng 24 giờ" },
];

export const generateM3PronCaseQuestions = makeStandardGenerator({
  topicId: "GRM_PRON_CASE",
  topicNameVi: "Đại từ: Nhân xưng, Sở hữu & Phản thân (Personal, Possessive & Reflexive Pronouns)",
  idPrefix: "EXP2026_PRON_CASE",
  commonTrapVi: "Nhầm lẫn giữa Tính từ sở hữu (`their/his/her` + Danh từ) với Đại từ sở hữu đứng độc lập (`theirs/his/hers`), hoặc dùng Đại từ tân ngữ (`them/him`) thay vì Đại từ phản thân (`themselves/himself`).",
  errCode: "ERR_PRON_CASE_MISMATCH",
  errNameVi: "Sai hình thái Đại từ (Nhân xưng / Sở hữu / Phản thân)",
  similarIds: ["ETS2024_T01_Q101", "ETS2024_T01_Q134", "ETS2024_T01_Q139"],
  scenarios: PRON_CASE_SCENARIOS,
  diffFn: (idx) => (idx < 6 ? 2 : 3),
});

// ============================================================================
// 5. GRM_POS_VERB (+5 items: EXP2026_POS_VERB_Q001..Q005) — Add D2 & D3 coverage
// ============================================================================
const POS_VERB_SCENARIOS = [
  { l: "To remain competitive in the cloud storage market, the firm must continually", r: "its data center infrastructure.", la: "must continually", ra: "its data center", corr: "modernize", dist: [{ t: "modern", r: "Adjective" }, { t: "modernization", r: "Noun (-tion)" }, { t: "modernly", r: "Adverb (-ly)" }], role: "Base Verb after Modal + Adverb (must + continually + V-inf)", rule: "Modal Verb (must/should/can/will) + (Adverb) + Động từ nguyên mẫu (V-inf đuôi -ize/-ify/-en)", v: ["modernize", "v", "hiện đại hóa"], c: "modernize infrastructure: hiện đại hóa cơ sở hạ tầng" },
  { l: "Please", r: "all electrical testing instruments before leaving the quality assurance laboratory.", la: "Please", ra: "all electrical testing", corr: "disconnect", dist: [{ t: "disconnection", r: "Noun (-tion)" }, { t: "disconnected", r: "Past Verb / Participle" }, { t: "disconnecting", r: "Participle (no finite verb)" }], role: "Imperative Base Verb after 'Please' (Please + V-inf + Object)", rule: "Câu mệnh lệnh bắt đầu bằng 'Please' -> Theo sau là Động từ nguyên mẫu (V-inf)", v: ["instrument", "n", "thiết bị đo lường"], c: "disconnect instruments: ngắt kết nối thiết bị" },
  { l: "The revised packaging guidelines will significantly", r: "the process of sorting recyclable materials at regional depots.", la: "will significantly", ra: "the process of", corr: "simplify", dist: [{ t: "simple", r: "Adjective" }, { t: "simplicity", r: "Noun (-ity)" }, { t: "simply", r: "Adverb (-ly)" }], role: "Base Verb ending in '-ify' after Modal 'will' + Adverb", rule: "will + (Adverb) + Động từ nguyên mẫu (simplify - hậu tố động từ -ify)", v: ["simplify", "v", "đơn giản hóa"], c: "simplify the process: đơn giản hóa quy trình" },
  { l: "Implementing automated invoice matching did not", r: "the need for final review by a senior certified accountant.", la: "did not", ra: "the need for", corr: "eliminate", dist: [{ t: "elimination", r: "Noun (-tion)" }, { t: "eliminated", r: "Past Verb" }, { t: "eliminating", r: "Gerund" }], role: "Base Verb after Auxiliary 'did not' (did not + V-inf)", rule: "Trợ động từ phủ định (do/does/did not) + Động từ nguyên mẫu không chia (V-inf)", v: ["eliminate", "v", "loại bỏ"], c: "eliminate the need for: loại bỏ sự cần thiết của" },
  { l: "The human resources director plans to", r: "the employee orientation program to include a module on data privacy.", la: "plans to", ra: "the employee orientation", corr: "broaden", dist: [{ t: "broad", r: "Adjective" }, { t: "broadly", r: "Adverb (-ly)" }, { t: "breadth", r: "Noun" }], role: "Base Verb ending in '-en' after 'to' (plan to + V-inf)", rule: "to-infinitive: to + Động từ nguyên mẫu (broaden - hậu tố động từ -en = mở rộng)", v: ["broaden", "v", "mở rộng phạm vi"], c: "broaden the program: mở rộng chương trình" },
];

export const generateM3PosVerbQuestions = makeStandardGenerator({
  topicId: "GRM_POS_VERB",
  topicNameVi: "Hình thái Động từ & Vị trí Động từ chính (Main Verb vs. Non-finite Forms)",
  idPrefix: "EXP2026_POS_VERB",
  commonTrapVi: "Nhầm lẫn giữa các hậu tố tạo động từ (`-ize`, `-ify`, `-en`, `-ate`) với danh từ/tính từ cùng gốc, hoặc chọn `V-ing`/`To-V` ở vị trí cần động từ nguyên mẫu sau `Modal + Adv` / `Please` / `did not`.",
  errCode: "ERR_POS_NONFINITE_FOR_MAIN_VERB",
  errNameVi: "Dùng V-ing / To-V hoặc Danh từ thay vì Động từ chính / Nguyên mẫu bắt buộc",
  similarIds: ["ETS2024_T01_Q102", "ETS2024_T01_Q111", "ETS2024_T01_Q114"],
  scenarios: POS_VERB_SCENARIOS,
  diffFn: (idx) => (idx < 2 ? 2 : 3),
});

// ============================================================================
// 6. GRM_VERB_SVA (+2 items: EXP2026_VERB_SVA_Q001..Q002) — Add D1 & D3 coverage
// ============================================================================
const SVA_SCENARIOS = [
  { l: "Every shipment of perishable dairy products", r: "a digital temperature log from the refrigerated truck.", la: "Every shipment", ra: "a digital temperature", corr: "includes", dist: [{ t: "include", r: "Plural Verb" }, { t: "including", r: "Participle (no main verb)" }, { t: "have included", r: "Plural Perfect Verb" }], role: "Singular Main Verb agreeing with 'Every shipment' (ignoring plural object 'products')", rule: "Every / Each + Danh từ số ít (shipment) + [of + Danh từ số nhiều] -> Động từ chia SỐ ÍT (includes)", v: ["perishable", "adj", "dễ hỏng (thực phẩm)"], c: "every shipment includes: mỗi lô hàng đều bao gồm" },
  { l: "The number of enterprise clients subscribing to our cybersecurity suite", r: "risen by forty percent this year.", la: "The number of", ra: "risen by forty", corr: "has", dist: [{ t: "have", r: "Plural Auxiliary Verb" }, { t: "are", r: "Plural Passive Auxiliary" }, { t: "having", r: "Participle (no finite verb)" }], role: "Singular Auxiliary Verb 'has' agreeing with 'The number of...' (+ risen)", rule: "Phân biệt: The number of + N số nhiều -> Động từ SỐ ÍT (has risen); A number of + N số nhiều -> Động từ SỐ NHIỀU", v: ["suite", "n", "bộ phần mềm/giải pháp"], c: "the number of clients has risen: số lượng khách hàng đã tăng lên" },
];

export const generateM3SvaQuestions = makeStandardGenerator({
  topicId: "GRM_VERB_SVA",
  topicNameVi: "Sự hòa hợp Chủ ngữ & Động từ (Subject-Verb Agreement)",
  idPrefix: "EXP2026_VERB_SVA",
  commonTrapVi: "Bị đánh lừa bởi danh từ số nhiều đứng ngay trước chỗ trống (`products`, `clients`) thay vì chia động từ theo danh từ chính đầu cụm (`Every shipment`, `The number of`).",
  errCode: "ERR_VERB_SVA_TRAP",
  errNameVi: "Chia động từ theo danh từ phụ đứng sát chỗ trống thay vì Chủ ngữ chính",
  similarIds: ["ETS2024_T01_Q108", "ETS2024_T02_Q114", "ETS2024_T02_Q123"],
  scenarios: SVA_SCENARIOS,
  diffFn: (idx) => (idx === 0 ? 1 : 3),
});
