/**
 * Milestone M2 Expansion — Part 1 (119 Curated Academic TOEIC X-Ray Items)
 * Topics:
 *   1. GRM_CONN_CORRELATIVE_COORD (+44 items: EXP2026_CONN_COORD_Q001..Q044)
 *   2. GRM_COND_INVERSION         (+40 items: EXP2026_COND_INV_Q001..Q040)
 *   3. GRM_VERB_PASSIVE           (+35 items: EXP2026_VERB_PASS_Q001..Q035)
 */

export function buildQuestionFromSpec(spec) {
  const {
    id,
    part = 5,
    number = 101,
    topicId,
    topicNameVi,
    skillCategory = "GRAMMAR",
    difficultyLevel = 2,
    targetBand = 550,
    recommendedTime = 12,
    microFormulaVi,
    commonTrapVi,
    leftContext,
    rightContext,
    leftAnchor,
    rightAnchor,
    requiredRole,
    options, // { A: { text, role, errCode, errNameVi, whyWrongVi }, ... }
    correctKey,
    explanationVi,
    vocab = [],
    collocation = "",
    similarIds = [],
  } = spec;

  const leftClean = String(leftContext || "").trim();
  const rightClean = String(rightContext || "").trim();
  const sentence = [leftClean, "-------", rightClean]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+([.,;?!])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();

  const correctWord = options[correctKey].text;
  const optMap = {};
  const distractorAnalysis = {};
  const optionDeepAnalysis = {};
  const wordFamilyMatrix = [];

  for (const k of ["A", "B", "C", "D"]) {
    const o = options[k];
    optMap[k] = o.text;
    const isCorr = k === correctKey;
    if (!isCorr) {
      distractorAnalysis[k] = o.whyWrongVi;
    }
    optionDeepAnalysis[k] = {
      text: o.text,
      is_correct: isCorr,
      pos_or_role: o.role,
      error_pattern_code: isCorr ? null : o.errCode,
      ...(isCorr ? {} : { error_pattern_name_vi: o.errNameVi }),
      ai_feedback_vi: isCorr
        ? `Chính xác! "${o.text}" (${o.role}) khớp hoàn toàn với cấu trúc ngữ pháp và ngữ cảnh thương mại của câu.`
        : `Bẫy ${o.errNameVi}: ${o.whyWrongVi}`,
    };
    wordFamilyMatrix.push({
      option: k,
      word: o.text,
      grammatical_role: o.role,
      is_correct: isCorr,
    });
  }

  const keyClue = `${leftAnchor ? `... ${leftAnchor} ` : "... "}[ ${correctWord} ]${rightAnchor ? ` ${rightAnchor} ...` : " ..."}`;

  return {
    number,
    part,
    passage_id: null,
    stem: sentence,
    options: optMap,
    source_page: 1,
    id,
    correct_answer: correctKey,
    passage_group_id: null,
    passage_doc_ids: [],
    context_sentence: sentence,
    primary_grammar_topic_id: topicId,
    secondary_topic_ids: [],
    skill_category: skillCategory,
    difficulty_level: difficultyLevel,
    target_score_band: targetBand,
    recommended_time_sec: recommendedTime,
    key_clue: keyClue,
    explanation_vi: explanationVi,
    distractor_analysis: distractorAnalysis,
    ai_analysis: {
      primary_topic_id: topicId,
      primary_topic_name_vi: topicNameVi,
      micro_rule_formula_vi: microFormulaVi,
      common_trap_warning_vi: commonTrapVi,
      irt_3pl: {
        discrimination_a: difficultyLevel === 3 ? 1.45 : difficultyLevel === 2 ? 1.25 : 1.1,
        difficulty_b: difficultyLevel === 3 ? 0.85 : difficultyLevel === 2 ? 0.0 : -0.9,
        guessing_c: 0.25,
      },
      skill_weight_vector: { [skillCategory]: 1.0 },
      sentence_xray: {
        left_context: leftClean,
        blank_slot: "-------",
        right_context: rightClean,
        left_anchor_words: leftAnchor,
        right_anchor_words: rightAnchor,
        required_grammatical_role: requiredRole,
        xray_pattern_display: `${leftAnchor || "Context"} ➔ [${requiredRole}: ${correctWord}] ➔ ${rightAnchor || "Context"}`,
      },
      option_deep_analysis: optionDeepAnalysis,
      linked_vocabulary: vocab,
      ai_tutor_rag_context: `[${id} | Part ${part} | Chủ điểm: ${topicNameVi} | Band ${targetBand}] Câu hỏi: ${sentence} | Đáp án đúng: (${correctKey}) ${correctWord} (${requiredRole}). Giải thích: ${explanationVi}`,
      solving_steps_vi: [
        `Bước 1 (Quét X-Ray quanh chỗ trống): Quan sát cụm từ neo phía trước ("${leftAnchor || leftClean}") và phía sau ("${rightAnchor || rightClean}").`,
        `Bước 2 (Xác định cấu trúc cần điền): Theo quy tắc ${topicId} (${microFormulaVi}) ➔ Vị trí này bắt buộc dùng ${requiredRole}.`,
        `Bước 3 (Chốt đáp án): Chọn (${correctKey}) "${correctWord}" và loại các phương án bẫy không khớp cấu trúc.`,
      ],
      word_family_matrix: wordFamilyMatrix,
      collocation_highlights: collocation ? [collocation] : [],
      evidence_sentence_en: null,
      similar_question_ids: similarIds,
    },
  };
}

// ============================================================================
// 1. GRM_CONN_CORRELATIVE_COORD (44 questions: Q001..Q044)
// ============================================================================
const COORD_SCENARIOS = [
  // Pattern A: both [A] and [B] — blank at "both" (10 items)
  { l: "The upgraded ERP platform streamlines", r: "inventory tracking and supplier invoicing across all regional warehouses.", la: "streamlines", ra: "inventory tracking and supplier", v: ["streamline", "v", "tinh gọn, tối ưu hóa"], c: "inventory tracking: theo dõi tồn kho" },
  { l: "Candidates for the senior auditor role must demonstrate", r: "technical proficiency and strong interpersonal communication skills.", la: "demonstrate", ra: "technical proficiency and strong", v: ["proficiency", "n", "sự thành thạo, năng lực chuyên môn"], c: "interpersonal skills: kỹ năng giao tiếp liên cá nhân" },
  { l: "The municipal transit authority plans to renovate", r: "the central railway terminal and the adjacent commuter parking garage.", la: "renovate", ra: "the central railway terminal and", v: ["adjacent", "adj", "liền kề, kế bên"], c: "transit authority: cơ quan quản lý giao thông" },
  { l: "Our standard warranty covers", r: "replacement parts and authorized labor charges for twenty-four months.", la: "covers", ra: "replacement parts and authorized", v: ["warranty", "n", "chế độ bảo hành"], c: "labor charges: chi phí nhân công" },
  { l: "Ms. Lindqvist oversees", r: "domestic distribution channels and international freight partnerships.", la: "oversees", ra: "domestic distribution channels and", v: ["oversee", "v", "giám sát, điều hành"], c: "distribution channels: kênh phân phối" },
  { l: "The quarterly financial briefing addressed", r: "operating margin expansion and long-term capital allocation.", la: "addressed", ra: "operating margin expansion and", v: ["allocation", "n", "sự phân bổ"], c: "capital allocation: phân bổ vốn" },
  { l: "New safety protocols apply to", r: "full-time laboratory technicians and visiting research fellows.", la: "apply to", ra: "full-time laboratory technicians and", v: ["protocol", "n", "quy trình, quy tắc chuẩn"], c: "safety protocols: quy trình an toàn" },
  { l: "The boutique hotel received high ratings for", r: "its attentive concierge service and its complimentary breakfast buffet.", la: "ratings for", ra: "its attentive concierge service and", v: ["attentive", "adj", "tận tình, chu đáo"], c: "complimentary breakfast: bữa sáng miễn phí" },
  { l: "Dr. Hasegawa's keynote lecture examined", r: "renewable energy storage and smart grid integration.", la: "examined", ra: "renewable energy storage and", v: ["integration", "n", "sự tích hợp"], c: "renewable energy: năng lượng tái tạo" },
  { l: "The revised editorial guidelines improved", r: "manuscript turnaround times and peer-review consistency.", la: "improved", ra: "manuscript turnaround times and", v: ["turnaround", "n", "thời gian quay vòng/xử lý"], c: "peer-review: bình duyệt chuyên môn" },

  // Pattern B: either [A] or [B] — blank at "either" (9 items)
  { l: "Reimbursement receipts may be submitted", r: "through the employee portal or directly to the payroll supervisor.", la: "submitted", ra: "through the employee portal or", v: ["reimbursement", "n", "sự hoàn trả chi phí"], c: "payroll supervisor: giám sát tiền lương" },
  { l: "Passholders may redeem their promotional voucher", r: "at our flagship downtown store or on our official mobile app.", la: "voucher", ra: "at our flagship downtown store or", v: ["redeem", "v", "quy đổi (voucher/điểm thưởng)"], c: "flagship store: cửa hàng trung tâm chính" },
  { l: "Tenants must notify the property manager", r: "by registered mail or via the online tenant dashboard.", la: "property manager", ra: "by registered mail or via", v: ["tenant", "n", "người thuê nhà/văn phòng"], c: "registered mail: thư bảo đảm" },
  { l: "Workshop participants can register for", r: "the morning data-analytics track or the afternoon leadership seminar.", la: "register for", ra: "the morning data-analytics track or", v: ["seminar", "n", "hội thảo chuyên đề"], c: "register for: đăng ký tham gia" },
  { l: "Defective appliances will be", r: "repaired free of charge or replaced with an equivalent model.", la: "will be", ra: "repaired free of charge or", v: ["defective", "adj", "bị lỗi kỹ thuật"], c: "free of charge: hoàn toàn miễn phí" },
  { l: "Authorizations for overtime work must be signed by", r: "the plant director or the shift operations superintendent.", la: "signed by", ra: "the plant director or", v: ["overtime", "n", "thời gian làm thêm giờ"], c: "plant director: giám đốc nhà máy" },
  { l: "Clients may schedule their annual portfolio review", r: "in person at our Geneva branch or over a secure video conference.", la: "portfolio review", ra: "in person at our Geneva branch or", v: ["portfolio", "n", "danh mục đầu tư"], c: "in person: trực tiếp" },
  { l: "Complimentary shuttle buses depart", r: "from Terminal 2 every twenty minutes or upon request at the hotel desk.", la: "depart", ra: "from Terminal 2 every twenty minutes or", v: ["shuttle", "n", "xe buýt đưa đón tuyến ngắn"], c: "upon request: khi có yêu cầu" },
  { l: "Applicants should enclose", r: "a certified academic transcript or an official letter of completion.", la: "enclose", ra: "a certified academic transcript or", v: ["transcript", "n", "bảng điểm học thuật"], c: "enclose: đính kèm (trong hồ sơ)" },

  // Pattern C: neither [A] nor [B] — blank at "nor" with "neither" anchor (9 items)
  { l: "Neither the chief procurement officer", r: "the warehouse supervisor was informed of the shipment delay.", la: "Neither the chief procurement officer", ra: "the warehouse supervisor was", v: ["procurement", "n", "hoạt động thu mua/cung ứng"], c: "shipment delay: sự chậm trễ lô hàng" },
  { l: "The preliminary inspection revealed neither structural cracks", r: "electrical wiring hazards in the leased warehouse.", la: "neither structural cracks", ra: "electrical wiring hazards", v: ["preliminary", "adj", "sơ bộ, bước đầu"], c: "structural cracks: vết nứt kết cấu" },
  { l: "Neither the marketing brochures", r: "the product packaging prototypes arrived in time for the trade exhibition.", la: "Neither the marketing brochures", ra: "the product packaging prototypes", v: ["prototype", "n", "nguyên mẫu thử nghiệm"], c: "trade exhibition: triển lãm thương mại" },
  { l: "According to the confidentiality clause, contractors may neither disclose client lists", r: "duplicate proprietary source code.", la: "neither disclose client lists", ra: "duplicate proprietary source code", v: ["proprietary", "adj", "độc quyền sở hữu"], c: "confidentiality clause: điều khoản bảo mật" },
  { l: "The entry-level accounting software is neither compatible with macOS", r: "capable of multi-currency tax reporting.", la: "neither compatible with macOS", ra: "capable of multi-currency", v: ["compatible", "adj", "tương thích"], c: "tax reporting: báo cáo thuế" },
  { l: "Neither the board chairperson", r: "the external legal counsel raised any objection to the merger proposal.", la: "Neither the board chairperson", ra: "the external legal counsel", v: ["counsel", "n", "cố vấn pháp lý / luật sư"], c: "merger proposal: đề xuất sáp nhập" },
  { l: "The seasonal discount applies to neither clearance merchandise", r: "custom-ordered corporate gift baskets.", la: "neither clearance merchandise", ra: "custom-ordered corporate gift", v: ["clearance", "n", "hàng thanh lý tồn kho"], c: "seasonal discount: giảm giá theo mùa" },
  { l: "Neither the original invoice", r: "the signed delivery receipt could be located in the archived folder.", la: "Neither the original invoice", ra: "the signed delivery receipt", v: ["invoice", "n", "hóa đơn thương mại"], c: "delivery receipt: biên nhận giao hàng" },
  { l: "The updated mobile interface is neither cluttered", r: "difficult for first-time customers to navigate.", la: "neither cluttered", ra: "difficult for first-time customers", v: ["navigate", "v", "điều hướng, thao tác"], c: "first-time customers: khách hàng lần đầu" },

  // Pattern D: not only [A] but also [B] — blank at "but also" or "not only" (8 items)
  { l: "The new biodegradable packaging reduces", r: "shipping weight but also manufacturing carbon emissions.", la: "reduces", ra: "shipping weight but also", v: ["biodegradable", "adj", "có thể phân hủy sinh học"], c: "carbon emissions: khí thải carbon" },
  { l: "Ms. Vance was commended for", r: "exceeding her quarterly sales quota but also mentoring six junior associates.", la: "commended for", ra: "exceeding her quarterly sales quota but also", v: ["commend", "v", "tuyên dương, khen ngợi"], c: "sales quota: chỉ tiêu doanh số" },
  { l: "The cloud migration enhanced", r: "data backup reliability but also remote team collaboration speed.", la: "enhanced", ra: "data backup reliability but also", v: ["migration", "n", "sự chuyển đổi hệ thống"], c: "remote collaboration: cộng tác từ xa" },
  { l: "The conference venue offers", r: "spacious auditorium seating but also state-of-the-art simultaneous interpretation booths.", la: "offers", ra: "spacious auditorium seating but also", v: ["state-of-the-art", "adj", "hiện đại bậc nhất"], c: "conference venue: địa điểm hội nghị" },
  { l: "Not only did the pharmaceutical division expand its research facility,", r: "it also secured three international patents.", la: "Not only did the pharmaceutical division", ra: "it also secured three", v: ["patent", "n", "bằng sáng chế"], c: "secure a patent: giành được bằng sáng chế" },
  { l: "The automated quality scanner detects not only surface scratches", r: "microscopic internal weld defects.", la: "not only surface scratches", ra: "microscopic internal weld defects", v: ["defect", "n", "khuyết tật, lỗi sản phẩm"], c: "surface scratches: vết xước bề mặt" },
  { l: "Our culinary institute trains students not only in classical pastry techniques", r: "in commercial kitchen cost control.", la: "not only in classical pastry techniques", ra: "in commercial kitchen cost control", v: ["culinary", "adj", "thuộc về nghệ thuật ẩm thực"], c: "cost control: kiểm soát chi phí" },
  { l: "The downtown coworking hub provides not only high-speed fiber internet", r: "soundproof private meeting pods.", la: "not only high-speed fiber internet", ra: "soundproof private meeting pods", v: ["soundproof", "adj", "cách âm"], c: "high-speed internet: internet tốc độ cao" },

  // Pattern E: whether [A] or [B] & coordinating conjunctions yet / so (8 items)
  { l: "The steering committee will decide tomorrow", r: "to expand the Osaka warehouse or to lease a third-party logistics center.", la: "decide tomorrow", ra: "to expand the Osaka warehouse or", v: ["lease", "v", "thuê dài hạn (bất động sản)"], c: "steering committee: ủy ban chỉ đạo" },
  { l: "All airfreight parcels are inspected thoroughly,", r: "they arrive on domestic flights or international cargo carriers.", la: "inspected thoroughly,", ra: "they arrive on domestic flights or", v: ["parcel", "n", "kiện hàng, bưu kiện"], c: "cargo carrier: hãng vận tải hàng hóa" },
  { l: "Please confirm by Wednesday", r: "your delegation requires airport limousine pickup or hotel parking passes.", la: "confirm by Wednesday", ra: "your delegation requires airport limousine pickup or", v: ["delegation", "n", "phái đoàn, đoàn đại biểu"], c: "parking pass: thẻ đỗ xe" },
  { l: "Tuition fees remain identical", r: "enrollees attend the live evening lectures or complete the recorded modules online.", la: "remain identical", ra: "enrollees attend the live evening lectures or", v: ["enrollee", "n", "học viên đăng ký khóa học"], c: "tuition fees: học phí" },
  { l: "The prototype battery is remarkably lightweight,", r: "it delivers forty percent more runtime than previous models.", la: "remarkably lightweight,", ra: "it delivers forty percent more", v: ["runtime", "n", "thời lượng hoạt động"], c: "prototype battery: pin nguyên mẫu" },
  { l: "Demand for ergonomic office chairs surged in October,", r: "the factory added a second assembly shift.", la: "surged in October,", ra: "the factory added a second", v: ["ergonomic", "adj", "công thái học"], c: "assembly shift: ca lắp ráp" },
  { l: "The construction bid was slightly above our initial budget,", r: "the board approved it due to the contractor's safety record.", la: "initial budget,", ra: "the board approved it", v: ["bid", "n", "hồ sơ dự thầu / mức giá thầu"], c: "safety record: hồ sơ an toàn" },
  { l: "The main server room will undergo maintenance at midnight,", r: "all staff should save their work before leaving today.", la: "maintenance at midnight,", ra: "all staff should save their work", v: ["undergo", "v", "trải qua (bảo trì/kiểm tra)"], c: "undergo maintenance: được bảo trì" },
];

export function generateCoordQuestions() {
  const errName = "Nhầm lẫn cấu trúc Giới từ (+ Cụm danh từ/V-ing) và Liên từ (+ Mệnh đề S + V)";
  const errCode = "ERR_PREP_VS_CONJ_STRUCTURE";
  const topicId = "GRM_CONN_CORRELATIVE_COORD";
  const topicNameVi = "Liên từ kết hợp & Liên từ tương quan (Coordinating & Correlative Conjunctions)";

  return COORD_SCENARIOS.map((sc, idx) => {
    const qNum = idx + 1;
    const id = `EXP2026_CONN_COORD_Q${String(qNum).padStart(3, "0")}`;
    const diff = idx < 15 ? 1 : idx < 30 ? 2 : 3;

    let options;
    let correctKey;
    let requiredRole;
    let microFormulaVi;
    let explanationVi;

    if (idx < 10) {
      // both ... and
      correctKey = "B";
      requiredRole = "Correlative Conjunction (both ... and)";
      microFormulaVi = "both + [Cụm danh từ A] + and + [Cụm danh từ B]";
      options = {
        A: { text: "either", role: "Correlative Conjunction (either ... or)", errCode, errNameVi: errName, whyWrongVi: `"either" bắt buộc đi cặp với "or" (either A or B), không đi với liên từ "and" phía sau.` },
        B: { text: "both", role: requiredRole, errCode: null, errNameVi: "", whyWrongVi: "" },
        C: { text: "neither", role: "Correlative Conjunction (neither ... nor)", errCode, errNameVi: errName, whyWrongVi: `"neither" bắt buộc đi cặp với "nor" (neither A nor B), không đi với "and".` },
        D: { text: "whether", role: "Subordinating Conjunction (whether ... or)", errCode, errNameVi: errName, whyWrongVi: `"whether" dùng để dẫn mệnh đề nghi vấn lựa chọn đi với "or", không ghép cấu trúc "whether A and B".` },
      };
      explanationVi = `Đáp án đúng là (B) "both". Phía sau chỗ trống có hai cụm danh từ nối với nhau bằng liên từ "and" (${sc.ra}) -> áp dụng công thức liên từ tương quan bắt cặp cố định "both A and B" (cả A lẫn B).`;
    } else if (idx < 19) {
      // either ... or
      correctKey = "A";
      requiredRole = "Correlative Conjunction (either ... or)";
      microFormulaVi = "either + [Thành phần A] + or + [Thành phần B]";
      options = {
        A: { text: "either", role: requiredRole, errCode: null, errNameVi: "", whyWrongVi: "" },
        B: { text: "both", role: "Correlative Conjunction (both ... and)", errCode, errNameVi: errName, whyWrongVi: `"both" bắt buộc đi cặp với "and" (both A and B), không đi với "or" phía sau.` },
        C: { text: "neither", role: "Correlative Conjunction (neither ... nor)", errCode, errNameVi: errName, whyWrongVi: `"neither" bắt buộc đi cặp với "nor" (neither A nor B), không ghép với "or".` },
        D: { text: "not only", role: "Correlative Conjunction (not only ... but also)", errCode, errNameVi: errName, whyWrongVi: `"not only" phải đi cặp với "but (also)", không đi với "or".` },
      };
      explanationVi = `Đáp án đúng là (A) "either". Phía sau chỗ trống xuất hiện liên từ "or" (${sc.ra}) nối hai lựa chọn song song -> bắt buộc dùng cặp liên từ tương quan "either A or B" (hoặc A hoặc B).`;
    } else if (idx < 28) {
      // neither ... nor
      correctKey = "C";
      requiredRole = "Correlative Conjunction (neither ... nor)";
      microFormulaVi = "neither + [Thành phần A] + nor + [Thành phần B]";
      options = {
        A: { text: "or", role: "Coordinating Conjunction (đi với either)", errCode, errNameVi: errName, whyWrongVi: `"or" đi cặp với "either" (either A or B), không được dùng sau "neither".` },
        B: { text: "and", role: "Coordinating Conjunction (đi với both)", errCode, errNameVi: errName, whyWrongVi: `"and" đi cặp với "both" (both A and B), không đi sau "neither".` },
        C: { text: "nor", role: requiredRole, errCode: null, errNameVi: "", whyWrongVi: "" },
        D: { text: "but", role: "Coordinating Conjunction (đi với not only)", errCode, errNameVi: errName, whyWrongVi: `"but" đi cặp với "not only", không ghép với "neither".` },
      };
      explanationVi = `Đáp án đúng là (C) "nor". Phía trước chỗ trống có từ khóa neo "${sc.la}" chứa "neither" -> bắt buộc hoàn thiện cặp liên từ tương quan phủ định kép "neither A nor B" (không A mà cũng không B).`;
    } else if (idx < 32) {
      // not only ... but also (blank at "not only")
      correctKey = "D";
      requiredRole = "Correlative Conjunction (not only ... but also)";
      microFormulaVi = "not only + [Thành phần A] + but also + [Thành phần B]";
      options = {
        A: { text: "either", role: "Correlative Conjunction (either ... or)", errCode, errNameVi: errName, whyWrongVi: `"either" đi với "or", không đi với "but also" phía sau.` },
        B: { text: "neither", role: "Correlative Conjunction (neither ... nor)", errCode, errNameVi: errName, whyWrongVi: `"neither" đi với "nor", không đi với "but also".` },
        C: { text: "both", role: "Correlative Conjunction (both ... and)", errCode, errNameVi: errName, whyWrongVi: `"both" đi với "and", không ghép với "but also".` },
        D: { text: "not only", role: requiredRole, errCode: null, errNameVi: "", whyWrongVi: "" },
      };
      explanationVi = `Đáp án đúng là (D) "not only". Phía sau chỗ trống có cụm từ khóa neo "but also" (${sc.ra}) -> bắt buộc dùng "not only" để tạo cấu trúc tương quan "not only A but also B" (không những A mà còn B).`;
    } else if (idx === 32) {
      // Not only did S + V, [but] it also...
      correctKey = "B";
      requiredRole = "Coordinating Conjunction (Not only ... but ... also)";
      microFormulaVi = "Not only + Auxiliary + S + V, but + S + also + V";
      options = {
        A: { text: "nor", role: "Coordinating Conjunction (neither ... nor)", errCode, errNameVi: errName, whyWrongVi: `"nor" dùng trong cấu trúc phủ định "neither... nor", không đi sau mệnh đề đảo ngữ "Not only...".` },
        B: { text: "but", role: requiredRole, errCode: null, errNameVi: "", whyWrongVi: "" },
        C: { text: "or", role: "Coordinating Conjunction (either ... or)", errCode, errNameVi: errName, whyWrongVi: `"or" chỉ sự lựa chọn, không đi cặp với "Not only... also".` },
        D: { text: "yet", role: "Coordinating Conjunction (nhưng - tương phản)", errCode, errNameVi: errName, whyWrongVi: `"yet" không tạo thành cặp liên từ tương quan chuẩn với "Not only... also".` },
      };
      explanationVi = `Đáp án đúng là (B) "but". Mệnh đề đầu mở đầu bằng đảo ngữ "Not only did..." và mệnh đề sau có "it also..." -> điền "but" để hoàn chỉnh cấu trúc "Not only..., but S also...".`;
    } else if (idx < 36) {
      // not only A [but also] B
      correctKey = "A";
      requiredRole = "Correlative Conjunction (not only ... but also)";
      microFormulaVi = "not only + [Cụm A] + but also + [Cụm B]";
      options = {
        A: { text: "but also", role: requiredRole, errCode: null, errNameVi: "", whyWrongVi: "" },
        B: { text: "or else", role: "Conjunction Phrase (nếu không thì)", errCode, errNameVi: errName, whyWrongVi: `"or else" mang nghĩa điều kiện ngược, không đi cặp với "not only" phía trước.` },
        C: { text: "nor even", role: "Negative Conjunction Phrase", errCode, errNameVi: errName, whyWrongVi: `"nor" chỉ dùng sau mệnh đề/cụm phủ định "neither/not", không ghép với "not only".` },
        D: { text: "as well", role: "Adverbial Phrase (đứng cuối câu)", errCode, errNameVi: errName, whyWrongVi: `"as well" không dùng để nối trực tiếp sau "not only" (chuẩn ngữ pháp phải là "but also").` },
      };
      explanationVi = `Đáp án đúng là (A) "but also". Phía trước chỗ trống có cụm neo "${sc.la}" chứa "not only" -> bắt buộc điền "but also" để nối hai thành phần song hành.`;
    } else if (idx < 40) {
      // whether ... or
      correctKey = "C";
      requiredRole = "Correlative Subordinating Conjunction (whether ... or)";
      microFormulaVi = "whether + [Mệnh đề / To-V A] + or + [Mệnh đề / To-V B]";
      options = {
        A: { text: "both", role: "Correlative Conjunction (both ... and)", errCode, errNameVi: errName, whyWrongVi: `"both" phải đi với "and" và không đứng trước mệnh đề/cụm lựa chọn đi với "or".` },
        B: { text: "neither", role: "Correlative Conjunction (neither ... nor)", errCode, errNameVi: errName, whyWrongVi: `"neither" phải đi với "nor", không đi với "or" hoặc mệnh đề S + V.` },
        C: { text: "whether", role: requiredRole, errCode: null, errNameVi: "", whyWrongVi: "" },
        D: { text: "despite", role: "Preposition (+ Noun Phrase)", errCode, errNameVi: errName, whyWrongVi: `"despite" là giới từ, không thể đứng trước mệnh đề S + V hoặc cấu trúc "to-V ... or to-V".` },
      };
      explanationVi = `Đáp án đúng là (C) "whether". Phía sau chỗ trống là cấu trúc lựa chọn có từ khóa "or" (${sc.ra}) -> dùng "whether ... or ..." (dù là A hay B / liệu A hay B).`;
    } else if (idx === 40 || idx === 42) {
      // S1 + V1, [yet] S2 + V2 (contrast)
      correctKey = "B";
      requiredRole = "Coordinating Conjunction (yet = nhưng, nối 2 mệnh đề sau dấu phẩy)";
      microFormulaVi = "S1 + V1, + yet / but + S2 + V2";
      options = {
        A: { text: "despite", role: "Preposition (+ Cụm danh từ)", errCode, errNameVi: errName, whyWrongVi: `"despite" là giới từ nên chỉ đi với cụm danh từ/V-ing, không thể nối trực tiếp mệnh đề S + V.` },
        B: { text: "yet", role: requiredRole, errCode: null, errNameVi: "", whyWrongVi: "" },
        C: { text: "moreover", role: "Conjunctive Adverb (cần dấu chấm/chấm phẩy và dấu phẩy)", errCode, errNameVi: errName, whyWrongVi: `"moreover" là trạng từ liên kết bổ sung ý (không phải tương phản) và không nối 2 mệnh đề chỉ bằng 1 dấu phẩy.` },
        D: { text: "nor", role: "Coordinating Conjunction (cần mệnh đề trước phủ định + đảo ngữ)", errCode, errNameVi: errName, whyWrongVi: `"nor" đòi hỏi mệnh đề trước ở thể phủ định và mệnh đề sau phải đảo trợ động từ.` },
      };
      explanationVi = `Đáp án đúng là (B) "yet". Sau dấu phẩy là một mệnh đề hoàn chỉnh (${sc.ra}) mang ý tương phản với mệnh đề trước -> cần liên từ kết hợp (Coordinating Conjunction) "yet" (nhưng/tuy nhiên).`;
    } else {
      // S1 + V1, [so] S2 + V2 (cause -> result)
      correctKey = "D";
      requiredRole = "Coordinating Conjunction (so = vì vậy, nối 2 mệnh đề sau dấu phẩy)";
      microFormulaVi = "S1 + V1 (Nguyên nhân), + so + S2 + V2 (Kết quả)";
      options = {
        A: { text: "due to", role: "Preposition (+ Cụm danh từ)", errCode, errNameVi: errName, whyWrongVi: `"due to" là cụm giới từ chỉ nguyên nhân, không đứng trước mệnh đề S + V chỉ kết quả.` },
        B: { text: "neither", role: "Correlative Conjunction (neither ... nor)", errCode, errNameVi: errName, whyWrongVi: `"neither" không thể làm liên từ nối hai mệnh đề độc lập chỉ nguyên nhân - kết quả.` },
        C: { text: "therefore", role: "Conjunctive Adverb (cần dấu chấm phẩy trước và dấu phẩy sau)", errCode, errNameVi: errName, whyWrongVi: `"therefore" là trạng từ liên kết, không thể nối 2 mệnh đề độc lập chỉ qua một dấu phẩy mà không có dấu chấm/chấm phẩy.` },
        D: { text: "so", role: requiredRole, errCode: null, errNameVi: "", whyWrongVi: "" },
      };
      explanationVi = `Đáp án đúng là (D) "so". Mệnh đề trước nêu nguyên nhân (${sc.la}) và sau dấu phẩy là mệnh đề hoàn chỉnh nêu kết quả (${sc.ra}) -> dùng liên từ kết hợp "so" (vì vậy).`;
    }

    return buildQuestionFromSpec({
      id,
      part: 5,
      number: 100 + qNum,
      topicId,
      topicNameVi,
      skillCategory: "GRAMMAR",
      difficultyLevel: diff,
      targetBand: 550,
      recommendedTime: 10,
      microFormulaVi,
      commonTrapVi: "Bẫy ghép sai cặp liên từ tương quan (both...and, either...or, neither...nor, not only...but also) hoặc dùng giới từ trước mệnh đề.",
      leftContext: sc.l,
      rightContext: sc.r,
      leftAnchor: sc.la,
      rightAnchor: sc.ra,
      requiredRole,
      options,
      correctKey,
      explanationVi,
      vocab: [{ word: sc.v[0], pos: sc.v[1], meaning_vi: sc.v[2] }],
      collocation: sc.c,
      similarIds: ["ETS2024_T08_Q107"],
    });
  });
}

// ============================================================================
// 2. GRM_COND_INVERSION (40 questions: Q001..Q040)
// ============================================================================
const COND_SCENARIOS = [
  // Group 1 (0..9): Inverted Type 1 — "[Should] + S + V_bare, main clause" (10 items)
  { l: "", r: "you encounter any difficulty activating your corporate VPN token, please contact the IT helpdesk immediately.", la: "", ra: "you encounter any difficulty", v: ["encounter", "v", "gặp phải (vấn đề/khó khăn)"], c: "IT helpdesk: bộ phận hỗ trợ CNTT" },
  { l: "", r: "the raw material shipment arrive later than Thursday, the packaging line will reschedule its weekend shift.", la: "", ra: "the raw material shipment arrive", v: ["shipment", "n", "lô hàng vận chuyển"], c: "raw material: nguyên vật liệu thô" },
  { l: "", r: "any shareholder wish to propose an amendment to the bylaws, written notice must be filed ten days in advance.", la: "", ra: "any shareholder wish to propose", v: ["amendment", "n", "sự sửa đổi, bổ sung (văn bản/điều lệ)"], c: "in advance: trước thời hạn" },
  { l: "", r: "inclement weather force the cancellation of the outdoor gala, the reception will move to the grand ballroom.", la: "", ra: "inclement weather force", v: ["inclement", "adj", "khắc nghiệt, xấu (thời tiết)"], c: "inclement weather: thời tiết xấu" },
  { l: "", r: "the client request additional customizations after contract signing, a supplemental fee schedule will apply.", la: "", ra: "the client request additional", v: ["supplemental", "adj", "bổ sung, phụ thêm"], c: "fee schedule: biểu phí" },
  { l: "", r: "your billing address change before the renewal date, please update your profile in the subscriber portal.", la: "", ra: "your billing address change", v: ["renewal", "n", "sự gia hạn"], c: "billing address: địa chỉ thanh toán" },
  { l: "", r: "the fire alarm sound during the seminar, attendees must exit via the nearest illuminated stairwell.", la: "", ra: "the fire alarm sound", v: ["illuminated", "adj", "được chiếu sáng"], c: "fire alarm: chuông báo cháy" },
  { l: "", r: "further laboratory testing reveal any batch inconsistency, the quality director will halt distribution at once.", la: "", ra: "further laboratory testing reveal", v: ["halt", "v", "đình chỉ, dừng ngay"], c: "batch inconsistency: sự không đồng nhất của lô hàng" },
  { l: "", r: "a replacement component be unavailable locally, our Munich depot can dispatch one by express courier.", la: "", ra: "a replacement component be", v: ["dispatch", "v", "gửi đi nhanh, điều phối"], c: "express courier: chuyển phát nhanh" },
  { l: "", r: "demand for the commemorative edition exceed initial projections, the publisher will authorize a second printing.", la: "", ra: "demand for the commemorative edition exceed", v: ["commemorative", "adj", "mang tính kỷ niệm"], c: "initial projections: dự báo ban đầu" },

  // Group 2 (10..19): Inverted Type 3 — "[Had] + S + V3, S + would have + V3" (10 items)
  { l: "", r: "the procurement team locked in the steel supplier contract in March, the firm would have avoided the price surge.", la: "", ra: "the procurement team locked in", v: ["surge", "n", "sự tăng vọt (giá cả/nhu cầu)"], c: "lock in a contract: chốt hợp đồng cố định giá" },
  { l: "", r: "we known about the customs clearance backlog at the port, we would have routed the cargo by airfreight.", la: "", ra: "we known about the customs", v: ["backlog", "n", "tình trạng ứ đọng, tồn đọng"], c: "customs clearance: thông quan hải quan" },
  { l: "", r: "the software patch been deployed before Friday afternoon, the weekend database outage would not have occurred.", la: "", ra: "the software patch been deployed", v: ["outage", "n", "sự cố ngừng hoạt động hệ thống"], c: "deploy a patch: triển khai bản vá lỗi" },
  { l: "", r: "Ms. Alverez submitted her travel reimbursement form on time, the finance office would have included it in this payroll cycle.", la: "", ra: "Ms. Alverez submitted her travel", v: ["payroll", "n", "bảng lương"], c: "reimbursement form: biểu mẫu hoàn chi phí" },
  { l: "", r: "the architectural firm consulted the municipal zoning board earlier, the permit approval would not have been delayed.", la: "", ra: "the architectural firm consulted", v: ["zoning", "n", "quy hoạch phân khu đô thị"], c: "permit approval: phê duyệt giấy phép" },
  { l: "", r: "the marketing department conducted a focus group prior to launch, the packaging design flaws would have been identified.", la: "", ra: "the marketing department conducted", v: ["flaw", "n", "thiếu sót, khuyết điểm"], c: "focus group: nhóm khách hàng khảo sát" },
  { l: "", r: "the keynote speaker's flight not been diverted to Brussels, the morning plenary session would have started on schedule.", la: "", ra: "the keynote speaker's flight not been", v: ["divert", "v", "chuyển hướng (chuyến bay)"], c: "on schedule: đúng lịch trình" },
  { l: "", r: "the retail chain invested in automated checkout kiosks two years ago, store queue times would have dropped significantly.", la: "", ra: "the retail chain invested in", v: ["kiosk", "n", "quầy/máy tự phục vụ"], c: "retail chain: chuỗi bán lẻ" },
  { l: "", r: "the safety inspector noticed the valve pressure anomaly sooner, the turbine maintenance would have taken only two hours.", la: "", ra: "the safety inspector noticed", v: ["anomaly", "n", "dấu hiệu bất thường"], c: "safety inspector: thanh tra an toàn" },
  { l: "", r: "the negotiating committee accepted the initial licensing terms, the joint venture would have launched last autumn.", la: "", ra: "the negotiating committee accepted", v: ["venture", "n", "dự án liên doanh"], c: "joint venture: liên doanh" },

  // Group 3 (20..29): Mandative Subjunctive Active — "...recommend/require/essential that S + [V_bare]" (10 items)
  { l: "The external cybersecurity auditor strongly recommended that every department head", r: "multi-factor authentication before Monday.", la: "recommended that every department head", ra: "multi-factor authentication", word: "enable", forms: ["enables", "enabled", "enable", "enabling"], v: ["authentication", "n", "sự xác thực bảo mật"], c: "multi-factor authentication: xác thực đa yếu tố" },
  { l: "Aviation safety regulations stipulate that each cabin crew member", r: "an emergency evacuation drill every six months.", la: "stipulate that each cabin crew member", ra: "an emergency evacuation drill", word: "complete", forms: ["completes", "completed", "completing", "complete"], v: ["stipulate", "v", "quy định rõ (trong luật/hợp đồng)"], c: "evacuation drill: diễn tập sơ tán" },
  { l: "It is imperative that the laboratory supervisor", r: "all temperature-sensitive vaccine samples upon arrival.", la: "imperative that the laboratory supervisor", ra: "all temperature-sensitive vaccine samples", word: "inspect", forms: ["inspect", "inspects", "inspected", "inspecting"], v: ["imperative", "adj", "cấp bách, bắt buộc"], c: "upon arrival: ngay khi đến nơi" },
  { l: "The board of directors insisted that the chief financial officer", r: "a revised debt-restructuring plan by Friday.", la: "insisted that the chief financial officer", ra: "a revised debt-restructuring plan", word: "present", forms: ["presents", "presented", "present", "presenting"], v: ["restructure", "v", "tái cơ cấu (nợ/tổ chức)"], c: "board of directors: hội đồng quản trị" },
  { l: "Hospital accreditation standards require that the attending pharmacist", r: "every high-dosage prescription twice.", la: "require that the attending pharmacist", ra: "every high-dosage prescription", word: "verify", forms: ["verifies", "verify", "verified", "verifying"], v: ["accreditation", "n", "sự kiểm định/công nhận chất lượng"], c: "attending pharmacist: dược sĩ phụ trách" },
  { l: "The legal counsel advised that the real estate developer", r: "an independent environmental impact survey first.", la: "advised that the real estate developer", ra: "an independent environmental impact", word: "commission", forms: ["commissioned", "commissions", "commissioning", "commission"], v: ["commission", "v", "ủy thác, đặt làm (khảo sát/nghiên cứu)"], c: "environmental impact: tác động môi trường" },
  { l: "It is essential that every warehouse forklift operator", r: "protective steel-toed footwear on the loading dock.", la: "essential that every warehouse forklift operator", ra: "protective steel-toed footwear", word: "wear", forms: ["wears", "wear", "wore", "wearing"], v: ["footwear", "n", "giày dép bảo hộ"], c: "loading dock: bến bốc dỡ hàng" },
  { l: "The quality assurance committee requested that the plant manager", r: "monthly calibration logs for all assembly robots.", la: "requested that the plant manager", ra: "monthly calibration logs", word: "maintain", forms: ["maintains", "maintained", "maintain", "maintaining"], v: ["calibration", "n", "sự hiệu chuẩn thiết bị"], c: "quality assurance: đảm bảo chất lượng" },
  { l: "Corporate governance policy demands that any board member with a conflict of interest", r: "from voting on the transaction.", la: "demands that any board member with a conflict of interest", ra: "from voting on the transaction", word: "abstain", forms: ["abstain", "abstains", "abstained", "abstaining"], v: ["abstain", "v", "kiêng, bỏ phiếu trắng / không tham gia biểu quyết"], c: "conflict of interest: xung đột lợi ích" },
  { l: "The event coordinator suggested that the keynote speaker", r: "at the convention center thirty minutes early for a sound check.", la: "suggested that the keynote speaker", ra: "at the convention center thirty minutes", word: "arrive", forms: ["arrives", "arrived", "arriving", "arrive"], v: ["convention", "n", "hội nghị lớn"], c: "sound check: kiểm tra âm thanh" },

  // Group 4 (30..39): Mandative Subjunctive Passive ("be + V3") & Type 3 result ("would have + V3") (10 items)
  { l: "City building codes mandate that every commercial elevator", r: "by a licensed mechanical engineer once a year.", la: "mandate that every commercial elevator", ra: "by a licensed mechanical engineer", word: "be certified", forms: ["is certified", "be certified", "was certified", "certifying"], v: ["mandate", "v", "bắt buộc theo luật định"], c: "building codes: quy chuẩn xây dựng", mode: "subj_pass" },
  { l: "It is vital that all confidential merger documents", r: "in a fireproof vault after the executive briefing concludes.", la: "vital that all confidential merger documents", ra: "in a fireproof vault", word: "be stored", forms: ["are stored", "were stored", "be stored", "storing"], v: ["vault", "n", "hầm/tủ két bảo mật"], c: "confidential documents: tài liệu mật", mode: "subj_pass" },
  { l: "The client requested that the defective circuit boards", r: "before the final assembly phase begins next Monday.", la: "requested that the defective circuit boards", ra: "before the final assembly phase", word: "be replaced", forms: ["be replaced", "are replaced", "were replaced", "replacing"], v: ["circuit", "n", "mạch điện tử"], c: "assembly phase: giai đoạn lắp ráp", mode: "subj_pass" },
  { l: "Customs regulations require that every imported agricultural crate", r: "with a country-of-origin barcode.", la: "require that every imported agricultural crate", ra: "with a country-of-origin barcode", word: "be labeled", forms: ["is labeled", "was labeled", "labeling", "be labeled"], v: ["crate", "n", "thùng kiện hàng lớn"], c: "country of origin: quốc gia xuất xứ", mode: "subj_pass" },
  { l: "The data privacy officer insisted that customer credit card records", r: "immediately after the subscription is canceled.", la: "insisted that customer credit card records", ra: "immediately after the subscription", word: "be purged", forms: ["are purged", "be purged", "were purged", "purging"], v: ["purge", "v", "xóa sạch vĩnh viễn (dữ liệu)"], c: "data privacy: quyền riêng tư dữ liệu", mode: "subj_pass" },
  { l: "If the logistics coordinator had received the revised manifest before noon, the containers", r: "onto the evening freighter.", la: "had received the revised manifest before noon, the containers", ra: "onto the evening freighter", word: "would have been loaded", forms: ["will be loaded", "would be loaded", "would have been loaded", "had loaded"], v: ["manifest", "n", "bản kê khai hàng hóa tàu biển"], c: "evening freighter: tàu chở hàng chuyến tối", mode: "cond3_pass" },
  { l: "Had the research team secured the federal grant in January, clinical trials", r: "three months ahead of schedule.", la: "Had the research team secured the federal grant in January, clinical trials", ra: "three months ahead of schedule", word: "would have commenced", forms: ["will commence", "would commence", "commenced", "would have commenced"], v: ["commence", "v", "bắt đầu, khởi sự"], c: "ahead of schedule: sớm hơn tiến độ", mode: "cond3_act" },
  { l: "If the regional sales manager had attended the Tokyo trade fair, she", r: "with several prospective distributors.", la: "had attended the Tokyo trade fair, she", ra: "with several prospective distributors", word: "would have met", forms: ["would have met", "will meet", "would meet", "meets"], v: ["prospective", "adj", "tiềm năng, triển vọng"], c: "trade fair: hội chợ thương mại", mode: "cond3_act" },
  { l: "Were the manufacturing plant to automate its packaging line, annual operating costs", r: "by nearly eighteen percent.", la: "Were the manufacturing plant to automate its packaging line, annual operating costs", ra: "by nearly eighteen percent", word: "would decrease", forms: ["will decrease", "would decrease", "decreased", "have decreased"], v: ["automate", "v", "tự động hóa"], c: "operating costs: chi phí vận hành", mode: "cond2_act" },
  { l: "Unless the contractor submits the structural engineering certificate by 5:00 P.M., the municipal permit", r: "until next month.", la: "Unless the contractor submits the structural engineering certificate by 5:00 P.M., the municipal permit", ra: "until next month", word: "will be withheld", forms: ["would have been withheld", "was withheld", "had been withheld", "will be withheld"], v: ["withhold", "v", "giữ lại, chưa cấp"], c: "municipal permit: giấy phép thành phố", mode: "cond1_pass" },
];

export function generateCondQuestions() {
  const topicId = "GRM_COND_INVERSION";
  const topicNameVi = "Câu điều kiện, Giả định thức & Đảo ngữ (Conditionals, Subjunctive & Inversion)";
  const keys = ["A", "B", "C", "D"];

  return COND_SCENARIOS.map((sc, idx) => {
    const qNum = idx + 1;
    const id = `EXP2026_COND_INV_Q${String(qNum).padStart(3, "0")}`;
    const diff = idx < 13 ? 1 : idx < 26 ? 2 : 3;

    let options;
    let correctKey;
    let requiredRole;
    let microFormulaVi;
    let explanationVi;

    if (idx < 10) {
      // Inverted Type 1: Should + S + V_bare
      correctKey = "A";
      requiredRole = "Inverted Conditional Type 1 Auxiliary (Should + S + V_bare)";
      microFormulaVi = "Should + S + V_bare (nguyên mẫu không chia), S + will / please + V_bare";
      options = {
        A: { text: "Should", role: requiredRole, errCode: null, errNameVi: "", whyWrongVi: "" },
        B: { text: "Had", role: "Inverted Conditional Type 3 Auxiliary (Had + S + V3)", errCode: "ERR_VERB_TENSE_MARKER", errNameVi: "Chọn sai Thì của động từ so với mốc thời gian trong câu", whyWrongVi: `"Had" trong đảo ngữ điều kiện loại 3 bắt buộc đi với V3/ed, trong khi động từ sau chủ ngữ ở đây là động từ nguyên mẫu (V_bare).` },
        C: { text: "Were", role: "Inverted Conditional Type 2 Auxiliary (Were + S + to V)", errCode: "ERR_VERB_TENSE_MARKER", errNameVi: "Chọn sai Thì của động từ so với mốc thời gian trong câu", whyWrongVi: `"Were" trong đảo ngữ điều kiện loại 2 phải đi với "to + V_bare" (Were + S + to V), không đi trực tiếp với V_bare.` },
        D: { text: "Unless", role: "Subordinating Conjunction (Unless + S + V chia theo chủ ngữ)", errCode: "ERR_VERB_SVA_TRAP", errNameVi: "Mắc bẫy Hòa hợp Chủ ngữ - Động từ do cụm giới từ chen giữa", whyWrongVi: `"Unless" không tạo cấu trúc đảo ngữ với động từ nguyên mẫu không chia (V_bare) cho chủ ngữ ngôi thứ 3 số ít và mang nghĩa phủ định ("trừ khi") trái mạch câu.` },
      };
      explanationVi = `Đáp án đúng là (A) "Should". Đầu câu khuyết liên từ "If" nhưng động từ theo sau chủ ngữ ở dạng nguyên mẫu không chia (${sc.ra}) và mệnh đề chính dùng câu mệnh lệnh / "will + V" -> đây là cấu trúc Đảo ngữ câu điều kiện loại 1: "Should + S + V_bare" (= If + S + should + V_bare).`;
    } else if (idx < 20) {
      // Inverted Type 3: Had + S + V3/ed
      correctKey = "C";
      requiredRole = "Inverted Conditional Type 3 Auxiliary (Had + S + V3/ed)";
      microFormulaVi = "Had + S + V3/ed, S + would (not) have + V3/ed";
      options = {
        A: { text: "Should", role: "Inverted Conditional Type 1 Auxiliary (Should + S + V_bare)", errCode: "ERR_VERB_TENSE_MARKER", errNameVi: "Chọn sai Thì của động từ so với mốc thời gian trong câu", whyWrongVi: `"Should" đi với động từ nguyên mẫu (V_bare), không đi với quá khứ phân từ V3/ed và mệnh đề chính "would have + V3".` },
        B: { text: "Were", role: "Inverted Conditional Type 2 Auxiliary (Were + S + to V)", errCode: "ERR_VERB_TENSE_MARKER", errNameVi: "Chọn sai Thì của động từ so với mốc thời gian trong câu", whyWrongVi: `"Were" dùng cho đảo ngữ điều kiện loại 2 (Were + S + to V), không khớp với mệnh đề chính "would have + V3" ở loại 3.` },
        C: { text: "Had", role: requiredRole, errCode: null, errNameVi: "", whyWrongVi: "" },
        D: { text: "If", role: "Conditional Conjunction (If + S + had + V3)", errCode: "ERR_POS_NONFINITE_FOR_MAIN_VERB", errNameVi: "Chọn V-ing / To-V hoặc Danh từ vào vị trí Động từ chính của mệnh đề", whyWrongVi: `Nếu điền "If" thì phía sau chủ ngữ bị thiếu trợ động từ "had" (chỉ có phân từ V3/ed "${sc.ra}"), làm mệnh đề điều kiện sai ngữ pháp.` },
      };
      explanationVi = `Đáp án đúng là (C) "Had". Phía sau chủ ngữ là phân từ quá khứ V3/ed (${sc.ra}) và mệnh đề chính chia "would (not) have + V3/ed" -> đây là cấu trúc Đảo ngữ câu điều kiện loại 3: "Had + S + V3/ed" (= If + S + had + V3/ed).`;
    } else if (idx < 30) {
      // Mandative Subjunctive Active: V_bare
      requiredRole = "Subjunctive Bare Infinitive (Động từ nguyên mẫu giả định sau that)";
      microFormulaVi = "suggest / recommend / require / insist / imperative / essential + that + S + (should) + V_bare";
      options = {};
      for (let i = 0; i < 4; i++) {
        const k = keys[i];
        const w = sc.forms[i];
        if (w === sc.word) {
          correctKey = k;
          options[k] = { text: w, role: requiredRole, errCode: null, errNameVi: "", whyWrongVi: "" };
        } else if (w.endsWith("ing")) {
          options[k] = { text: w, role: "Gerund / Present Participle (V-ing)", errCode: "ERR_POS_NONFINITE_FOR_MAIN_VERB", errNameVi: "Chọn V-ing / To-V hoặc Danh từ vào vị trí Động từ chính của mệnh đề", whyWrongVi: `"${w}" là dạng V-ing, không thể làm động từ chính cho chủ ngữ trong mệnh đề "that + S + V_bare".` };
        } else if (w.endsWith("s")) {
          options[k] = { text: w, role: "3rd-Person Singular Present Verb (V-s/es)", errCode: "ERR_VERB_SVA_TRAP", errNameVi: "Mắc bẫy Hòa hợp Chủ ngữ - Động từ do cụm giới từ chen giữa", whyWrongVi: `"${w}" chia ở ngôi thứ 3 số ít thông thường, nhưng sau cấu trúc giả định "${sc.la}" động từ bắt buộc giữ nguyên mẫu không chia ("${sc.word}").` };
        } else {
          options[k] = { text: w, role: "Past Tense Verb (V-ed)", errCode: "ERR_VERB_TENSE_MARKER", errNameVi: "Chọn sai Thì của động từ so với mốc thời gian trong câu", whyWrongVi: `"${w}" chia ở thì quá khứ đơn, sai quy tắc Giả định thức (Mandative Subjunctive) vốn bắt buộc dùng động từ nguyên mẫu không chia ("${sc.word}").` };
        }
      }
      explanationVi = `Đáp án đúng là (${correctKey}) "${sc.word}". Phía trước chỗ trống có cấu trúc giả định thức "${sc.la}" -> động từ trong mệnh đề "that" bắt buộc dùng ở dạng nguyên mẫu không chia (Subjunctive Bare Infinitive "${sc.word}") bất kể chủ ngữ là ngôi thứ 3 số ít hay động từ chính ở quá khứ.`;
    } else {
      // Group 4: Mandative Subjunctive Passive or Conditional Main Clause
      options = {};
      if (sc.mode === "subj_pass") {
        requiredRole = "Passive Subjunctive (be + V3/ed sau mệnh đề giả định that)";
        microFormulaVi = "mandate / require / request / insist / vital + that + S (vật) + be + V3/ed";
      } else if (sc.mode === "cond3_pass" || sc.mode === "cond3_act") {
        requiredRole = "Conditional Type 3 Main Clause Verb (would have + V3 / been V3)";
        microFormulaVi = "If + S + had + V3 (hoặc Had + S + V3), S + would have + (been) + V3/ed";
      } else if (sc.mode === "cond2_act") {
        requiredRole = "Conditional Type 2 Main Clause Verb (would + V_bare)";
        microFormulaVi = "Were + S + to V_bare, S + would + V_bare";
      } else {
        requiredRole = "Conditional Type 1 Passive Main Clause Verb (will be + V3/ed)";
        microFormulaVi = "Unless + S + V_present, S + will be + V3/ed";
      }

      for (let i = 0; i < 4; i++) {
        const k = keys[i];
        const w = sc.forms[i];
        if (w === sc.word) {
          correctKey = k;
          options[k] = { text: w, role: requiredRole, errCode: null, errNameVi: "", whyWrongVi: "" };
        } else {
          options[k] = {
            text: w,
            role: "Mismatched Tense/Voice Verb Form",
            errCode: "ERR_VERB_TENSE_MARKER",
            errNameVi: "Chọn sai Thì của động từ so với mốc thời gian trong câu",
            whyWrongVi: `"${w}" sai quy tắc phối hợp thức/thì so với mệnh đề "${sc.la}" (cấu trúc chuẩn yêu cầu "${sc.word}").`,
          };
        }
      }
      explanationVi = `Đáp án đúng là (${correctKey}) "${sc.word}". Dựa vào dấu hiệu ngữ pháp "${sc.la}", vị trí này yêu cầu ${requiredRole} theo công thức "${microFormulaVi}".`;
    }

    return buildQuestionFromSpec({
      id,
      part: 5,
      number: 100 + qNum,
      topicId,
      topicNameVi,
      skillCategory: "GRAMMAR",
      difficultyLevel: diff,
      targetBand: 750,
      recommendedTime: 15,
      microFormulaVi,
      commonTrapVi: "Bẫy chia động từ thêm -s/-ed sau mệnh đề giả định 'suggest/require/vital that + S + V_bare' hoặc nhầm lẫn trợ động từ đảo ngữ Should (loại 1) vs Had (loại 3).",
      leftContext: sc.l,
      rightContext: sc.r,
      leftAnchor: sc.la,
      rightAnchor: sc.ra,
      requiredRole,
      options,
      correctKey,
      explanationVi,
      vocab: [{ word: sc.v[0], pos: sc.v[1], meaning_vi: sc.v[2] }],
      collocation: sc.c,
      similarIds: ["ETS2024_T02_Q120"],
    });
  });
}

// ============================================================================
// 3. GRM_VERB_PASSIVE (35 questions: Q001..Q035)
// ============================================================================
const PASSIVE_SCENARIOS = [
  // 1..25: Transitive verb with NO direct object followed by preposition (by/in/at/to/for/with) -> Passive
  { l: "All international wire transfers exceeding ten thousand dollars", r: "by the compliance department before release.", la: "wire transfers exceeding ten thousand dollars", ra: "by the compliance department", corr: "are reviewed", dist: ["review", "reviewing", "have reviewed"], role: "Present Simple Passive (are + V3/ed)", v: ["compliance", "n", "sự tuân thủ quy định"], c: "wire transfer: chuyển khoản ngân hàng" },
  { l: "The keynote address at next week's biotechnology summit", r: "by Dr. Elena Rostova, chief scientist at BioVanguard.", la: "keynote address at next week's biotechnology summit", ra: "by Dr. Elena Rostova", corr: "will be delivered", dist: ["will deliver", "is delivering", "has delivered"], role: "Future Simple Passive (will be + V3/ed)", v: ["summit", "n", "hội nghị thượng đỉnh"], c: "deliver a keynote address: trình bày bài phát biểu chính" },
  { l: "Complimentary refreshments", r: "in the mezzanine lounge during the fifteen-minute intermission.", la: "Complimentary refreshments", ra: "in the mezzanine lounge", corr: "will be served", dist: ["will serve", "are serving", "have served"], role: "Future Simple Passive (will be + V3/ed)", v: ["refreshments", "n", "đồ ăn thức uống nhẹ"], c: "complimentary refreshments: đồ ăn nhẹ miễn phí" },
  { l: "Over the past three quarters, three regional distribution hubs", r: "to reduce cross-border delivery times.", la: "Over the past three quarters, three regional distribution hubs", ra: "to reduce cross-border delivery", corr: "have been established", dist: ["have established", "are establishing", "establish"], role: "Present Perfect Passive (have been + V3/ed)", v: ["cross-border", "adj", "xuyên biên giới"], c: "distribution hub: trung tâm phân phối" },
  { l: "Visitors to the semiconductor fabrication cleanroom must", r: "by a credentialed security escort at all times.", la: "Visitors to the semiconductor fabrication cleanroom must", ra: "by a credentialed security escort", corr: "be accompanied", dist: ["accompany", "accompanying", "accompanied"], role: "Modal Passive (must be + V3/ed)", v: ["escort", "n", "nhân viên hộ tống/giám sát an ninh"], c: "at all times: mọi lúc, luôn luôn" },
  { l: "The historic waterfront warehouse", r: "into a contemporary art gallery and coworking complex last year.", la: "The historic waterfront warehouse", ra: "into a contemporary art gallery", corr: "was converted", dist: ["converted", "has converted", "is converting"], role: "Past Simple Passive (was + V3/ed)", v: ["contemporary", "adj", "đương đại, hiện đại"], c: "convert into: chuyển đổi thành" },
  { l: "All fragile optical instruments should", r: "in anti-static foam crates prior to overseas shipment.", la: "All fragile optical instruments should", ra: "in anti-static foam crates", corr: "be packed", dist: ["pack", "packing", "have packed"], role: "Modal Passive (should be + V3/ed)", v: ["fragile", "adj", "dễ vỡ"], c: "prior to shipment: trước khi vận chuyển" },
  { l: "The annual employee satisfaction survey", r: "by an independent human resources consultancy every November.", la: "The annual employee satisfaction survey", ra: "by an independent human resources consultancy", corr: "is conducted", dist: ["conducts", "conducting", "has conducted"], role: "Present Simple Passive (is + V3/ed)", v: ["consultancy", "n", "công ty tư vấn"], c: "conduct a survey: thực hiện khảo sát" },
  { l: "Because the main auditorium", r: "for acoustic upgrades right now, today's training session will meet in Room 304.", la: "Because the main auditorium", ra: "for acoustic upgrades right now", corr: "is being renovated", dist: ["is renovating", "renovates", "has renovated"], role: "Present Continuous Passive (is being + V3/ed)", v: ["acoustic", "adj", "thuộc về âm thanh/âm học"], c: "training session: buổi đào tạo" },
  { l: "Two hundred solar panels", r: "on the factory rooftop by the time the monsoon season began.", la: "Two hundred solar panels", ra: "on the factory rooftop by the time", corr: "had been installed", dist: ["had installed", "have installed", "were installing"], role: "Past Perfect Passive (had been + V3/ed)", v: ["rooftop", "n", "mái tòa nhà"], c: "solar panels: tấm pin năng lượng mặt trời" },
  { l: "Any warranty claim submitted without an original purchase receipt cannot", r: "by our customer service center.", la: "without an original purchase receipt cannot", ra: "by our customer service center", corr: "be processed", dist: ["process", "processing", "processed"], role: "Modal Passive (cannot be + V3/ed)", v: ["claim", "n", "yêu cầu bồi thường/bảo hành"], c: "purchase receipt: biên lai mua hàng" },
  { l: "The winners of the corporate innovation grant", r: "at the annual awards banquet on December 14.", la: "The winners of the corporate innovation grant", ra: "at the annual awards banquet", corr: "will be announced", dist: ["will announce", "are announcing", "have announced"], role: "Future Simple Passive (will be + V3/ed)", v: ["banquet", "n", "tiệc chiêu đãi trang trọng"], c: "awards banquet: tiệc trao giải" },
  { l: "Access to the financial forecasting spreadsheet", r: "to senior accounting managers and executive officers.", la: "Access to the financial forecasting spreadsheet", ra: "to senior accounting managers", corr: "is restricted", dist: ["restricts", "restricting", "has restricted"], role: "Present Simple Passive (is + V3/ed)", v: ["forecasting", "n", "sự dự báo tài chính"], c: "be restricted to: bị giới hạn chỉ dành cho" },
  { l: "The revised tenant lease agreements", r: "by the legal department before they were mailed out yesterday.", la: "The revised tenant lease agreements", ra: "by the legal department before they were", corr: "had been approved", dist: ["had approved", "have approved", "are approving"], role: "Past Perfect Passive (had been + V3/ed)", v: ["lease", "n", "hợp đồng thuê"], c: "lease agreement: hợp đồng thuê mặt bằng" },
  { l: "Protective safety goggles must", r: "by everyone entering the chemical mixing zone.", la: "Protective safety goggles must", ra: "by everyone entering the chemical", corr: "be worn", dist: ["wear", "wearing", "wore"], role: "Modal Passive (must be + V3/ed)", v: ["goggles", "n", "kính bảo hộ"], c: "safety goggles: kính bảo hộ lao động" },
  { l: "The quarterly dividend payment", r: "directly into shareholders' brokerage accounts next Tuesday.", la: "The quarterly dividend payment", ra: "directly into shareholders' brokerage accounts", corr: "will be deposited", dist: ["will deposit", "is depositing", "has deposited"], role: "Future Simple Passive (will be + V3/ed)", v: ["dividend", "n", "cổ tức"], c: "brokerage account: tài khoản chứng khoán" },
  { l: "Several outdated assembly conveyor belts", r: "during the scheduled plant shutdown last month.", la: "Several outdated assembly conveyor belts", ra: "during the scheduled plant shutdown last month", corr: "were replaced", dist: ["replaced", "have replaced", "are replacing"], role: "Past Simple Passive (were + V3/ed)", v: ["conveyor", "n", "băng chuyền sản xuất"], c: "plant shutdown: đợt ngừng nhà máy để bảo trì" },
  { l: "Strict quality-control inspections", r: "at every stage of the pharmaceutical bottling process.", la: "Strict quality-control inspections", ra: "at every stage of the pharmaceutical", corr: "are performed", dist: ["perform", "performing", "have performed"], role: "Present Simple Passive (are + V3/ed)", v: ["pharmaceutical", "adj", "thuộc về dược phẩm"], c: "quality-control inspection: kiểm tra chất lượng" },
  { l: "Since the new mobile ticketing app launched in May, boarding delays", r: "by nearly thirty percent.", la: "Since the new mobile ticketing app launched in May, boarding delays", ra: "by nearly thirty percent", corr: "have been reduced", dist: ["have reduced", "are reducing", "reduced"], role: "Present Perfect Passive (have been + V3/ed)", v: ["boarding", "n", "việc lên máy bay/tàu"], c: "boarding delay: sự chậm trễ khi lên tàu/máy bay" },
  { l: "Temporary parking permits can", r: "from the reception kiosk in the main lobby.", la: "Temporary parking permits can", ra: "from the reception kiosk", corr: "be obtained", dist: ["obtain", "obtaining", "obtained"], role: "Modal Passive (can be + V3/ed)", v: ["obtain", "v", "nhận được, lấy được"], c: "parking permit: giấy phép đỗ xe" },
  { l: "The confidential merger terms", r: "closely guarded until the official press release was issued this morning.", la: "The confidential merger terms", ra: "closely guarded until the official press release", corr: "were kept", dist: ["kept", "have kept", "are keeping"], role: "Past Simple Passive (were + V3/ed)", v: ["press release", "n", "thông cáo báo chí"], c: "issue a press release: phát hành thông cáo báo chí" },
  { l: "All reimbursement requests for October business travel must", r: "to the accounting portal by Friday.", la: "All reimbursement requests for October business travel must", ra: "to the accounting portal by Friday", corr: "be uploaded", dist: ["upload", "uploading", "uploaded"], role: "Modal Passive (must be + V3/ed)", v: ["portal", "n", "cổng thông tin điện tử"], c: "business travel: chuyến công tác" },
  { l: "A complimentary leather portfolio", r: "to each delegate upon check-in at the registration counter.", la: "A complimentary leather portfolio", ra: "to each delegate upon check-in", corr: "is given", dist: ["gives", "giving", "has given"], role: "Present Simple Passive (is + V3/ed)", v: ["delegate", "n", "đại biểu tham dự hội nghị"], c: "registration counter: quầy đăng ký" },
  { l: "The malfunctioning HVAC compressor on the fourth floor", r: "by a certified technician right now.", la: "The malfunctioning HVAC compressor on the fourth floor", ra: "by a certified technician right now", corr: "is being repaired", dist: ["is repairing", "repairs", "has repaired"], role: "Present Continuous Passive (is being + V3/ed)", v: ["malfunctioning", "adj", "đang gặp trục trặc/hỏng"], c: "certified technician: kỹ thuật viên có chứng chỉ" },
  { l: "Additional funding for the municipal library expansion", r: "by the city council at yesterday's session.", la: "Additional funding for the municipal library expansion", ra: "by the city council at yesterday's session", corr: "was authorized", dist: ["authorized", "has authorized", "is authorizing"], role: "Past Simple Passive (was + V3/ed)", v: ["authorize", "v", "phê chuẩn, cấp phép"], c: "city council: hội đồng thành phố" },

  // 26..35: Intransitive Verbs (Active Voice ONLY — never passive!) (10 items)
  { l: "The annual Asia-Pacific Logistics Symposium will", r: "at the Marina Bay Convention Center from May 12 to May 14.", la: "Asia-Pacific Logistics Symposium will", ra: "at the Marina Bay Convention Center", corr: "take place", dist: ["be taken place", "taken place", "taking place"], role: "Intransitive Verb Phrase (Active Voice: will + take place)", v: ["symposium", "n", "hội nghị chuyên đề"], c: "take place: diễn ra (nội động từ không chia bị động)", intrans: true },
  { l: "A brief power fluctuation", r: "at the data center last night, but backup generators activated within two seconds.", la: "A brief power fluctuation", ra: "at the data center last night", corr: "occurred", dist: ["was occurred", "has been occurred", "occurring"], role: "Intransitive Past Verb (Active Voice: occurred)", v: ["fluctuation", "n", "sự dao động, biến động"], c: "backup generator: máy phát điện dự phòng", intrans: true },
  { l: "Your complimentary trial subscription to the analytics suite will", r: "on the last day of this month.", la: "trial subscription to the analytics suite will", ra: "on the last day of this month", corr: "expire", dist: ["be expired", "expired", "expiring"], role: "Intransitive Verb (Active Voice: will + expire)", v: ["expire", "v", "hết hạn (nội động từ)"], c: "trial subscription: gói đăng ký dùng thử", intrans: true },
  { l: "The advisory panel", r: "of five independent economists and three central bank representatives.", la: "The advisory panel", ra: "of five independent economists", corr: "consists", dist: ["is consisted", "was consisted", "consisting"], role: "Intransitive Verb (Active Voice: consists of)", v: ["economist", "n", "chuyên gia kinh tế"], c: "consist of: bao gồm (không bao giờ chia bị động)", intrans: true },
  { l: "Despite fierce competition in the electric vehicle sector, Veloce Motors has", r: "as the regional market leader.", la: "Veloce Motors has", ra: "as the regional market leader", corr: "emerged", dist: ["been emerged", "emerging", "emerge"], role: "Intransitive Present Perfect Verb (has + emerged)", v: ["emerge", "v", "nổi lên, vươn lên (nội động từ)"], c: "market leader: doanh nghiệp dẫn đầu thị trường", intrans: true },
  { l: "The express cargo train from Rotterdam", r: "at Platform 4 twenty minutes ahead of schedule this morning.", la: "express cargo train from Rotterdam", ra: "at Platform 4 twenty minutes ahead of schedule this morning", corr: "arrived", dist: ["was arrived", "has been arrived", "arriving"], role: "Intransitive Past Verb (Active Voice: arrived)", v: ["cargo", "n", "hàng hóa vận chuyển"], c: "ahead of schedule: sớm hơn lịch trình", intrans: true },
  { l: "Even after the corporate restructuring, the customer support hotline will", r: "operational twenty-four hours a day.", la: "customer support hotline will", ra: "operational twenty-four hours a day", corr: "remain", dist: ["be remained", "remained", "remaining"], role: "Intransitive Linking Verb (Active Voice: will + remain)", v: ["operational", "adj", "hoạt động bình thường"], c: "remain operational: duy trì hoạt động", intrans: true },
  { l: "An unexpected delay in customs inspection", r: "yesterday when the electronic manifest system went offline.", la: "unexpected delay in customs inspection", ra: "yesterday when the electronic manifest system", corr: "happened", dist: ["was happened", "has been happened", "happening"], role: "Intransitive Past Verb (Active Voice: happened)", v: ["offline", "adj", "ngoại tuyến, ngừng kết nối"], c: "customs inspection: kiểm tra hải quan", intrans: true },
  { l: "Roadway pavement conditions tend to", r: "rapidly during periods of heavy freeze-thaw cycles.", la: "Roadway pavement conditions tend to", ra: "rapidly during periods of heavy", corr: "deteriorate", dist: ["be deteriorated", "deteriorated", "deteriorating"], role: "Intransitive Verb (Active Voice: tend to + deteriorate)", v: ["deteriorate", "v", "xuống cấp, xấu đi (nội động từ)"], c: "pavement conditions: tình trạng mặt đường", intrans: true },
  { l: "Several promising biotech startups have", r: "from the university's technology incubator over the past decade.", la: "Several promising biotech startups have", ra: "from the university's technology incubator", corr: "arisen", dist: ["been arisen", "arising", "arise"], role: "Intransitive Present Perfect Verb (have + arisen)", v: ["incubator", "n", "vườn ươm khởi nghiệp công nghệ"], c: "over the past decade: trong thập kỷ qua", intrans: true },
];

export function generatePassiveQuestions() {
  const topicId = "GRM_VERB_PASSIVE";
  const topicNameVi = "Câu bị động & Nội/Ngoại động từ (Passive Voice & Transitivity)";
  const errCode = "ERR_VERB_VOICE_DIRECTION";
  const errName = "Nhầm lẫn giữa Thể Chủ động (Active) và Thể Bị động (Passive)";
  const keys = ["A", "B", "C", "D"];

  return PASSIVE_SCENARIOS.map((sc, idx) => {
    const qNum = idx + 1;
    const id = `EXP2026_VERB_PASS_Q${String(qNum).padStart(3, "0")}`;
    const diff = idx < 12 ? 1 : idx < 24 ? 2 : 3;

    const correctIdx = idx % 4;
    const correctKey = keys[correctIdx];
    const options = {};
    let dPtr = 0;

    for (let i = 0; i < 4; i++) {
      const k = keys[i];
      if (i === correctIdx) {
        options[k] = { text: sc.corr, role: sc.role, errCode: null, errNameVi: "", whyWrongVi: "" };
      } else {
        const dText = sc.dist[dPtr++];
        options[k] = {
          text: dText,
          role: sc.intrans ? "Invalid Passive / Non-finite Form of Intransitive Verb" : "Active Voice / Non-finite Verb Form",
          errCode,
          errNameVi: errName,
          whyWrongVi: sc.intrans
            ? `"${dText}" sai ngữ pháp vì "${sc.corr}" là nội động từ (Intransitive Verb) không bao giờ chia ở thể bị động (be + V3/ed) hoặc dùng V-ing làm động từ chính.`
            : `"${dText}" là dạng chủ động hoặc chưa chia thì, trong khi chủ ngữ "${sc.la}" là đối tượng chịu tác động và phía sau chỗ trống không có tân ngữ danh từ (gặp giới từ "${sc.ra.split(" ")[0]}").`,
        };
      }
    }

    const microFormulaVi = sc.intrans
      ? "Nội động từ (take place, occur, happen, expire, consist of, emerge, arrive, remain, deteriorate, arise) -> LUÔN CHIA CHỦ ĐỘNG (Không dùng be + V3/ed)"
      : "Chủ ngữ chịu tác động + [be + V3/ed] + Giới từ (by / in / at / to / for / with / into) (Không có tân ngữ trực tiếp sau ngoại động từ)";

    const explanationVi = sc.intrans
      ? `Đáp án đúng là (${correctKey}) "${sc.corr}". Động từ trong câu thuộc nhóm nội động từ (Intransitive Verb) không bao giờ chia ở thể bị động -> bắt buộc dùng dạng chủ động "${sc.corr}".`
      : `Đáp án đúng là (${correctKey}) "${sc.corr}". Ngoại động từ ở vị trí này không có tân ngữ danh từ theo sau mà gặp ngay cụm giới từ ("${sc.ra}") và chủ ngữ ("${sc.la}") là đối tượng chịu tác động -> bắt buộc chia ở thể Bị động (${sc.role}).`;

    return buildQuestionFromSpec({
      id,
      part: 5,
      number: 100 + qNum,
      topicId,
      topicNameVi,
      skillCategory: "GRAMMAR",
      difficultyLevel: diff,
      targetBand: 550,
      recommendedTime: 14,
      microFormulaVi,
      commonTrapVi: "Bẫy chọn thể chủ động cho ngoại động từ khi phía sau không có tân ngữ (gặp giới từ by/in/at/to), hoặc bẫy chia bị động cho nội động từ (occur, take place, expire, consist of, remain).",
      leftContext: sc.l,
      rightContext: sc.r,
      leftAnchor: sc.la,
      rightAnchor: sc.ra,
      requiredRole: sc.role,
      options,
      correctKey,
      explanationVi,
      vocab: [{ word: sc.v[0], pos: sc.v[1], meaning_vi: sc.v[2] }],
      collocation: sc.c,
      similarIds: ["ETS2024_T01_Q113"],
    });
  });
}
