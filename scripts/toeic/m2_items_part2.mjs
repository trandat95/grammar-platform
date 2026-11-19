/**
 * Milestone M2 Expansion — Part 2 (122 Curated Academic TOEIC X-Ray Items)
 * Topics:
 *   4. GRM_VERB_INFINITIVE_GERUND (+34 items: EXP2026_VERB_INF_Q001..Q034)
 *   5. GRM_COMP_QUANTIFIER        (+33 items: EXP2026_COMP_QUANT_Q001..Q033)
 *   6. GRM_PRON_RELATIVE          (+29 items: EXP2026_PRON_REL_Q001..Q029)
 *   7. VOC_PHRASAL_PREP           (+26 items: EXP2026_VOC_PHR_Q001..Q026)
 */

import { buildQuestionFromSpec } from "./m2_items_part1.mjs";

const KEYS = ["A", "B", "C", "D"];

// ============================================================================
// 4. GRM_VERB_INFINITIVE_GERUND (34 questions: Q001..Q034)
// ============================================================================
const INF_GERUND_SCENARIOS = [
  // 1..12: Prepositional "to + V-ing" or Preposition + V-ing (12 items)
  { l: "Our hospitality team looks forward to", r: "your international delegates at the Grand Harbor Resort next month.", la: "looks forward to", ra: "your international delegates", corr: "welcoming", dist: ["welcome", "welcomed", "welcomes"], role: "Gerund (V-ing sau giới từ 'to' trong 'look forward to')", rule: "look forward to + V-ing (mong đợi làm gì)", v: ["hospitality", "n", "ngành dịch vụ khách sạn/đón tiếp"], c: "look forward to V-ing: mong đợi làm gì" },
  { l: "Apex BioLabs is firmly committed to", r: "sustainable packaging across all pharmaceutical product lines.", la: "committed to", ra: "sustainable packaging across all", corr: "adopting", dist: ["adopt", "adopted", "adopts"], role: "Gerund (V-ing sau cụm 'be committed to')", rule: "be committed / dedicated / devoted to + V-ing (cam kết/cống hiến làm gì)", v: ["sustainable", "adj", "bền vững, thân thiện môi trường"], c: "be committed to V-ing: cam kết thực hiện" },
  { l: "In addition to", r: "the annual financial audit, Ms.oka coordinates internal tax compliance training.", la: "In addition to", ra: "the annual financial audit", corr: "supervising", dist: ["supervise", "supervised", "supervises"], role: "Gerund (V-ing sau cụm giới từ 'in addition to')", rule: "in addition to / prior to / object to / contribute to + V-ing", v: ["audit", "n", "hoạt động kiểm toán"], c: "in addition to V-ing: bên cạnh việc làm gì" },
  { l: "Several senior engineers objected to", r: "the testing schedule without adding extra quality-control staff.", la: "objected to", ra: "the testing schedule without", corr: "shortening", dist: ["shorten", "shortened", "shortens"], role: "Gerund (V-ing sau cụm 'object to')", rule: "object to + V-ing (phản đối việc làm gì)", v: ["shorten", "v", "rút ngắn (thời gian/lịch trình)"], c: "object to V-ing: phản đối việc gì" },
  { l: "Prior to", r: "the final purchase agreement, the legal team reviewed every indemnity clause.", la: "Prior to", ra: "the final purchase agreement", corr: "signing", dist: ["sign", "signed", "signs"], role: "Gerund (V-ing sau cụm giới từ 'prior to')", rule: "prior to + V-ing / Noun (trước khi làm gì)", v: ["indemnity", "n", "điều khoản bồi thường/miễn trừ trách nhiệm"], c: "prior to V-ing: trước khi thực hiện" },
  { l: "Continuous staff training has contributed significantly to", r: "workplace accidents at our assembly plants.", la: "contributed significantly to", ra: "workplace accidents at our", corr: "reducing", dist: ["reduce", "reduced", "reduces"], role: "Gerund (V-ing sau 'contribute to')", rule: "contribute to + V-ing (góp phần vào việc làm gì)", v: ["workplace", "n", "nơi làm việc"], c: "contribute to V-ing: góp phần vào việc" },
  { l: "Most regional sales representatives are accustomed to", r: "client presentations via encrypted video platforms.", la: "accustomed to", ra: "client presentations via encrypted", corr: "conducting", dist: ["conduct", "conducted", "conducts"], role: "Gerund (V-ing sau 'be accustomed to')", rule: "be accustomed to / be used to + V-ing (quen với việc làm gì)", v: ["encrypted", "adj", "được mã hóa bảo mật"], c: "be accustomed to V-ing: quen với việc làm gì" },
  { l: "Thank you for", r: "our customer support survey following your recent flight to Zurich.", la: "Thank you for", ra: "our customer support survey", corr: "completing", dist: ["complete", "completed", "completes"], role: "Gerund (V-ing đứng sau giới từ 'for' và có tân ngữ theo sau)", rule: "Giới từ (for / by / without / before / after) + V-ing + Tân ngữ", v: ["survey", "n", "bài khảo sát ý kiến"], c: "complete a survey: hoàn thành khảo sát" },
  { l: "By", r: "an automated inventory scanner, the pharmacy cut prescription wait times in half.", la: "By", ra: "an automated inventory scanner", corr: "implementing", dist: ["implement", "implemented", "implements"], role: "Gerund (V-ing đứng sau giới từ 'By' và có tân ngữ)", rule: "By + V-ing + Object (bằng cách làm gì)", v: ["prescription", "n", "đơn thuốc"], c: "cut wait times in half: giảm một nửa thời gian chờ" },
  { l: "No external contractor may enter the server facility without", r: "a temporary visitor badge at the security desk.", la: "without", ra: "a temporary visitor badge", corr: "obtaining", dist: ["obtain", "obtained", "obtains"], role: "Gerund (V-ing sau giới từ 'without' + tân ngữ)", rule: "without + V-ing + Object (mà không làm gì)", v: ["contractor", "n", "nhà thầu phụ"], c: "visitor badge: thẻ khách ra vào" },
  { l: "The foundation is dedicated to", r: "vocational scholarships for underprivileged engineering students.", la: "dedicated to", ra: "vocational scholarships for underprivileged", corr: "providing", dist: ["provide", "provided", "provides"], role: "Gerund (V-ing sau cụm 'be dedicated to')", rule: "be dedicated / devoted to + V-ing (tận tâm làm gì)", v: ["vocational", "adj", "thuộc về đào tạo nghề"], c: "be dedicated to V-ing: tận tâm/chuyên tâm vào việc" },
  { l: "Instead of", r: "a full-page newspaper advertisement, the boutique focused on targeted social media campaigns.", la: "Instead of", ra: "a full-page newspaper advertisement", corr: "purchasing", dist: ["purchase", "purchased", "purchases"], role: "Gerund (V-ing sau cụm giới từ 'instead of')", rule: "instead of + V-ing + Object (thay vì làm gì)", v: ["boutique", "n", "cửa hàng thời trang/chuyên biệt"], c: "instead of V-ing: thay vì làm gì" },

  // 13..23: Verbs taking Gerund V-ing (consider, postpone, avoid, suggest, recommend, finish, discontinue, appreciate, delay, mind, risk) (11 items)
  { l: "The executive committee is considering", r: "a second research and development center in Singapore.", la: "considering", ra: "a second research and development", corr: "opening", dist: ["to open", "open", "opened"], role: "Gerund (V-ing làm tân ngữ sau động từ 'consider')", rule: "consider / postpone / avoid / suggest / recommend / finish + V-ing", v: ["committee", "n", "ủy ban điều hành"], c: "consider V-ing: cân nhắc việc làm gì" },
  { l: "Due to supply chain disruptions, the automaker postponed", r: "its flagship electric sedan until October.", la: "postponed", ra: "its flagship electric sedan", corr: "unveiling", dist: ["to unveil", "unveil", "unveiled"], role: "Gerund (V-ing sau động từ 'postpone')", rule: "postpone / delay / put off + V-ing (trì hoãn làm gì)", v: ["unveil", "v", "ra mắt, công bố sản phẩm mới"], c: "postpone V-ing: hoãn việc làm gì" },
  { l: "To prevent data loss, employees should avoid", r: "unverified USB drives to company workstations.", la: "should avoid", ra: "unverified USB drives", corr: "connecting", dist: ["to connect", "connect", "connected"], role: "Gerund (V-ing sau động từ 'avoid')", rule: "avoid + V-ing (tránh làm gì)", v: ["unverified", "adj", "chưa được xác minh an toàn"], c: "avoid V-ing: tránh làm gì" },
  { l: "The external tax consultant suggested", r: "capital equipment purchases before the fiscal year ends.", la: "consultant suggested", ra: "capital equipment purchases", corr: "accelerating", dist: ["to accelerate", "accelerate", "accelerated"], role: "Gerund (V-ing trực tiếp sau động từ 'suggest')", rule: "suggest / recommend + V-ing (khi không có mệnh đề 'that')", v: ["fiscal", "adj", "thuộc về tài khóa/tài chính"], c: "fiscal year: năm tài chính" },
  { l: "As soon as the technicians finish", r: "the fiber-optic cables, internet service will be restored.", la: "technicians finish", ra: "the fiber-optic cables", corr: "splicing", dist: ["to splice", "splice", "spliced"], role: "Gerund (V-ing sau động từ 'finish')", rule: "finish + V-ing (hoàn tất việc làm gì)", v: ["restore", "v", "khôi phục hoạt động"], c: "finish V-ing: hoàn thành việc làm gì" },
  { l: "Nordic Home Appliances announced that it will discontinue", r: "replacement filters for its 2018 air purifier line.", la: "will discontinue", ra: "replacement filters for its", corr: "manufacturing", dist: ["to manufacture", "manufacture", "manufactured"], role: "Gerund (V-ing sau động từ 'discontinue')", rule: "discontinue + V-ing (ngừng sản xuất/thực hiện việc gì)", v: ["discontinue", "v", "ngừng cung cấp/sản xuất"], c: "discontinue V-ing: ngừng thực hiện" },
  { l: "We would greatly appreciate", r: "your signed vendor registration form by the end of the week.", la: "greatly appreciate", ra: "your signed vendor registration", corr: "receiving", dist: ["to receive", "receive", "received"], role: "Gerund (V-ing trực tiếp sau động từ 'appreciate')", rule: "appreciate + V-ing (cảm kích việc nhận/làm gì)", v: ["vendor", "n", "nhà cung cấp"], c: "appreciate V-ing: trân trọng/cảm kích việc gì" },
  { l: "The urban planning board recommended", r: "pedestrian walkways along the newly renovated riverfront.", la: "board recommended", ra: "pedestrian walkways along", corr: "widening", dist: ["to widen", "widen", "widened"], role: "Gerund (V-ing trực tiếp sau 'recommend')", rule: "recommend + V-ing (khuyến nghị làm gì)", v: ["pedestrian", "n", "người đi bộ"], c: "pedestrian walkway: lối đi bộ" },
  { l: "Several commuters reported having difficulty", r: "available parking spaces near the suburban train station.", la: "having difficulty", ra: "available parking spaces", corr: "finding", dist: ["to find", "find", "found"], role: "Gerund (V-ing sau cấu trúc 'have difficulty / trouble')", rule: "have difficulty / trouble / a hard time + (in) + V-ing", v: ["commuter", "n", "người đi làm hàng ngày bằng tàu/xe"], c: "have difficulty V-ing: gặp khó khăn khi làm gì" },
  { l: "The Editorial Team spent three weeks", r: "the statistical tables in the annual sustainability report.", la: "spent three weeks", ra: "the statistical tables", corr: "verifying", dist: ["to verify", "verify", "verified"], role: "Gerund (V-ing sau cấu trúc 'spend + time/money')", rule: "spend + [thời gian / tiền bạc] + V-ing", v: ["statistical", "adj", "thuộc về thống kê"], c: "spend time V-ing: dành thời gian làm gì" },
  { l: "Because of high humidity, the painting crew delayed", r: "the protective sealant to the exterior facade.", la: "painting crew delayed", ra: "the protective sealant", corr: "applying", dist: ["to apply", "apply", "applied"], role: "Gerund (V-ing sau động từ 'delay')", rule: "delay + V-ing (trì hoãn việc làm gì)", v: ["facade", "n", "mặt tiền tòa nhà"], c: "delay V-ing: hoãn việc làm gì" },

  // 24..34: Verbs / structures taking To-Infinitive (decide, expect, agree, manage, afford, allow O, remind O, require O, plan, offer, refuse) (11 items)
  { l: "Following extensive market research, the board decided", r: "its retail presence in Southeast Asia.", la: "the board decided", ra: "its retail presence in Southeast", corr: "to expand", dist: ["expanding", "expand", "expanded"], role: "To-Infinitive (To-V sau động từ 'decide')", rule: "decide / plan / expect / agree / offer / refuse / manage / afford + to-V", v: ["presence", "n", "sự hiện diện thị trường"], c: "decide to V: quyết định làm gì" },
  { l: "Despite the port strike, our logistics partner managed", r: "all perishable goods before the deadline.", la: "logistics partner managed", ra: "all perishable goods before", corr: "to deliver", dist: ["delivering", "deliver", "delivered"], role: "To-Infinitive (To-V sau động từ 'manage')", rule: "manage + to-V (xoay xở/thành công làm được việc gì khó)", v: ["perishable", "adj", "dễ hư hỏng (thực phẩm/hàng hóa)"], c: "manage to V: xoay xở thành công làm gì" },
  { l: "The updated cloud software allows project managers", r: "resource allocation across multiple departments in real time.", la: "allows project managers", ra: "resource allocation across", corr: "to monitor", dist: ["monitoring", "monitor", "monitored"], role: "To-Infinitive (To-V trong cấu trúc 'allow + Object + to-V')", rule: "allow / permit / enable / encourage / remind / require + Object + to-V", v: ["real-time", "adj", "theo thời gian thực"], c: "allow someone to V: cho phép ai làm gì" },
  { l: "Human resources sent an automated email reminding employees", r: "their annual benefit selections by November 30.", la: "reminding employees", ra: "their annual benefit selections", corr: "to finalize", dist: ["finalizing", "finalize", "finalized"], role: "To-Infinitive (To-V sau 'remind + Object')", rule: "remind + Object + to-V (nhắc nhở ai làm gì)", v: ["finalize", "v", "hoàn tất, chốt lại"], c: "remind someone to V: nhắc ai làm gì" },
  { l: "Small independent bookstores often cannot afford", r: "the same volume discounts as national retail chains.", la: "cannot afford", ra: "the same volume discounts", corr: "to offer", dist: ["offering", "offer", "offered"], role: "To-Infinitive (To-V sau 'afford')", rule: "afford + to-V (đủ khả năng tài chính/nguồn lực để làm gì)", v: ["volume", "n", "số lượng lớn"], c: "afford to V: đủ khả năng làm gì" },
  { l: "The raw material supplier agreed", r: "the defective steel coils at no additional shipping cost.", la: "supplier agreed", ra: "the defective steel coils", corr: "to replace", dist: ["replacing", "replace", "replaced"], role: "To-Infinitive (To-V sau động từ 'agree')", rule: "agree + to-V (đồng ý làm gì)", v: ["coil", "n", "cuộn (thép/dây cáp)"], c: "agree to V: đồng ý làm gì" },
  { l: "Municipal health inspectors require all commercial kitchens", r: "digital temperature logs for walk-in freezers.", la: "require all commercial kitchens", ra: "digital temperature logs", corr: "to keep", dist: ["keeping", "keep", "kept"], role: "To-Infinitive (To-V trong cấu trúc 'require + Object + to-V')", rule: "require + Object + to-V (yêu cầu ai/đơn vị nào làm gì)", v: ["inspector", "n", "thanh tra viên"], c: "require someone to V: yêu cầu ai làm gì" },
  { l: "Analysts expect the semiconductor manufacturer", r: "record quarterly earnings next Wednesday.", la: "expect the semiconductor manufacturer", ra: "record quarterly earnings", corr: "to report", dist: ["reporting", "report", "reported"], role: "To-Infinitive (To-V sau 'expect + Object')", rule: "expect + (Object) + to-V (kỳ vọng ai làm gì)", v: ["earnings", "n", "doanh thu / lợi nhuận"], c: "quarterly earnings: lợi nhuận hàng quý" },
  { l: "The keynote speaker kindly offered", r: "her slide deck with all registered workshop participants.", la: "kindly offered", ra: "her slide deck with all", corr: "to share", dist: ["sharing", "share", "shared"], role: "To-Infinitive (To-V sau động từ 'offer')", rule: "offer + to-V (ngỏ ý sẵn sàng làm gì)", v: ["participant", "n", "người tham dự"], c: "offer to V: ngỏ ý làm gì" },
  { l: "In order", r: "qualify for the early-bird registration rate, payment must be received by Friday.", la: "In order", ra: "qualify for the early-bird", corr: "to", dist: ["for", "of", "with"], role: "Infinitive Marker ('in order to + V_bare' chỉ mục đích)", rule: "in order to + V_bare (để làm gì - chỉ mục đích)", v: ["early-bird", "adj", "đăng ký sớm ưu đãi"], c: "in order to V: để làm gì" },
  { l: "The software vendor refused", r: "the maintenance contract without an annual inflation adjustment clause.", la: "vendor refused", ra: "the maintenance contract without", corr: "to renew", dist: ["renewing", "renew", "renewed"], role: "To-Infinitive (To-V sau động từ 'refuse')", rule: "refuse + to-V (từ chối làm gì)", v: ["inflation", "n", "lạm phát"], c: "refuse to V: từ chối làm gì" },
];

export function generateInfGerundQuestions() {
  const topicId = "GRM_VERB_INFINITIVE_GERUND";
  const topicNameVi = "Danh động từ (V-ing) & Động từ nguyên mẫu (To-V)";
  const errCode = "ERR_POS_NONFINITE_FOR_MAIN_VERB";
  const errName = "Chọn V-ing / To-V hoặc Danh từ vào vị trí Động từ chính của mệnh đề";

  return INF_GERUND_SCENARIOS.map((sc, idx) => {
    const qNum = idx + 1;
    const id = `EXP2026_VERB_INF_Q${String(qNum).padStart(3, "0")}`;
    const diff = idx < 11 ? 1 : idx < 23 ? 2 : 3;

    const correctIdx = idx % 4;
    const correctKey = KEYS[correctIdx];
    const options = {};
    let dPtr = 0;

    for (let i = 0; i < 4; i++) {
      const k = KEYS[i];
      if (i === correctIdx) {
        options[k] = { text: sc.corr, role: sc.role, errCode: null, errNameVi: "", whyWrongVi: "" };
      } else {
        const dText = sc.dist[dPtr++];
        options[k] = {
          text: dText,
          role: "Mismatched Non-finite / Finite Form",
          errCode,
          errNameVi: errName,
          whyWrongVi: `"${dText}" sai quy tắc kết hợp động từ sau cấu trúc "${sc.la}" (theo quy tắc "${sc.rule}", vị trí này bắt buộc dùng "${sc.corr}").`,
        };
      }
    }

    const explanationVi = `Đáp án đúng là (${correctKey}) "${sc.corr}". Phía trước chỗ trống có dấu hiệu "${sc.la}" -> theo quy tắc "${sc.rule}", vị trí này bắt buộc dùng ${sc.role} ("${sc.corr}").`;

    return buildQuestionFromSpec({
      id,
      part: 5,
      number: 100 + qNum,
      topicId,
      topicNameVi,
      skillCategory: "GRAMMAR",
      difficultyLevel: diff,
      targetBand: 600,
      recommendedTime: 14,
      microFormulaVi: sc.rule,
      commonTrapVi: "Bẫy chữ 'to' là giới từ (look forward to / be committed to / object to / prior to / in addition to + V-ing) hoặc nhầm động từ đi với V-ing (consider, postpone, avoid, suggest) và To-V (decide, manage, allow O, require O).",
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
      similarIds: ["ETS2024_T01_Q107"],
    });
  });
}

// ============================================================================
// 5. GRM_COMP_QUANTIFIER (33 questions: Q001..Q033)
// ============================================================================
const COMP_QUANT_SCENARIOS = [
  // 1..11: Comparatives with "than" & Comparative intensifiers (much/far/significantly + comparative) (11 items)
  { l: "The newly installed laser printer operates much", r: "than the older model on the third floor.", la: "operates much", ra: "than the older model", corr: "more quietly", dist: ["quietly", "most quietly", "quieter"], role: "Comparative Adverb (more + Adv + than bổ nghĩa cho động từ operates)", rule: "S + V_thường + (much/far) + more + Adv (-ly) + than...", v: ["operate", "v", "vận hành, hoạt động"], c: "operate quietly: vận hành êm ái" },
  { l: "Fourth-quarter online retail revenue was", r: "higher than our financial analysts had initially projected.", la: "revenue was", ra: "higher than our financial analysts", corr: "significantly", dist: ["very", "too", "most"], role: "Comparative Intensifier Adverb (nhấn mạnh trước tính từ so sánh hơn 'higher')", rule: "much / far / even / significantly / considerably + So sánh hơn (-er / more) + than (KHÔNG dùng 'very')", v: ["project", "v", "dự phóng, ước tính"], c: "significantly higher: cao hơn đáng kể" },
  { l: "Fiberglass insulation panels are far", r: "to install than traditional mineral wool sheets.", la: "panels are far", ra: "to install than traditional", corr: "easier", dist: ["easy", "easiest", "easily"], role: "Comparative Adjective (Adj-er + than sau động từ to be)", rule: "be + (far/much) + Adj-er / more Adj + than", v: ["insulation", "n", "vật liệu cách nhiệt"], c: "far easier: dễ hơn nhiều" },
  { l: "The express train reaches the financial district", r: "than the municipal bus during morning rush hour.", la: "financial district", ra: "than the municipal bus", corr: "more quickly", dist: ["quick", "most quickly", "quickness"], role: "Comparative Adverb (more quickly + than bổ nghĩa cho động từ reaches)", rule: "V_thường + more + Adv + than", v: ["rush hour", "n", "giờ cao điểm giao thông"], c: "financial district: khu trung tâm tài chính" },
  { l: "Our synthetic lubricant lasts", r: "longer under extreme heat than conventional petroleum-based oils.", la: "lubricant lasts", ra: "longer under extreme heat than", corr: "considerably", dist: ["very", "so", "quite"], role: "Comparative Intensifier Adverb (đứng trước so sánh hơn 'longer')", rule: "considerably / significantly / much / far + So sánh hơn + than", v: ["lubricant", "n", "dầu bôi trơn công nghiệp"], c: "considerably longer: lâu hơn đáng kể" },
  { l: "Because of lower freight tariffs, importing components from Vietnam is", r: "than sourcing them domestically.", la: "from Vietnam is", ra: "than sourcing them domestically", corr: "more economical", dist: ["economical", "most economical", "economically"], role: "Comparative Adjective (more + Adj + than sau linking verb 'is')", rule: "be + more + Adj (đa âm tiết) + than", v: ["economical", "adj", "tiết kiệm chi phí, kinh tế"], c: "freight tariff: biểu phí vận chuyển" },
  { l: "The redesigned mobile checkout flow is even", r: "than the version we tested in the spring focus group.", la: "checkout flow is even", ra: "than the version we tested", corr: "more intuitive", dist: ["intuitive", "most intuitive", "intuitively"], role: "Comparative Adjective (even + more + Adj + than)", rule: "even + more + Adj + than", v: ["intuitive", "adj", "trực quan, dễ sử dụng"], c: "checkout flow: luồng thanh toán" },
  { l: "Replacing the worn gaskets now will cost", r: "less than repairing a major hydraulic leak later.", la: "will cost", ra: "less than repairing a major", corr: "far", dist: ["very", "too", "most"], role: "Comparative Intensifier (far + less + than)", rule: "far / much + less / more + than", v: ["gasket", "n", "vòng đệm kín cơ khí"], c: "far less than: ít hơn rất nhiều so với" },
  { l: "This year's trade exposition attracted", r: "international exhibitors than any previous event in the city.", la: "exposition attracted", ra: "international exhibitors than any", corr: "more", dist: ["most", "many", "much"], role: "Comparative Quantifier (more + Plural Noun + than)", rule: "more + Danh từ số nhiều / không đếm được + than", v: ["exhibitor", "n", "đơn vị trưng bày triển lãm"], c: "trade exposition: hội chợ triển lãm thương mại" },
  { l: "Candidates with bilingual certification are", r: "likely to be assigned to our Brussels regional headquarters.", la: "certification are", ra: "likely to be assigned", corr: "more", dist: ["much", "very", "most of"], role: "Comparative Marker (more likely to V)", rule: "be + more / most + likely to V", v: ["bilingual", "adj", "song ngữ"], c: "regional headquarters: trụ sở khu vực" },
  { l: "The new titanium alloy is", r: "more durable than the aluminum frame used in earlier laptops.", la: "titanium alloy is", ra: "more durable than the aluminum", corr: "much", dist: ["very", "too", "so"], role: "Comparative Intensifier (much + more + Adj + than)", rule: "much / far + more + Adj + than", v: ["durable", "adj", "bền bỉ"], c: "titanium alloy: hợp kim titan" },

  // 12..22: Superlatives ("the ... in/of/ever") & Double Comparatives ("The more..., the more...") & Equal comparisons ("as ... as") (11 items)
  { l: "Orion Logistics operates one of the", r: "automated cold-storage facilities in Northern Europe.", la: "operates one of the", ra: "automated cold-storage facilities in Northern", corr: "largest", dist: ["larger", "large", "largely"], role: "Superlative Adjective (one of the + Adj-est + Plural Noun + in...)", rule: "one of the + So sánh nhất (-est / most Adj) + Danh từ số nhiều + in/of...", v: ["cold-storage", "n", "kho lạnh bảo quản"], c: "one of the largest: một trong những ... lớn nhất" },
  { l: "Of all the proposals submitted to the committee, Ms. Choi's budget plan was the", r: "documented.", la: "budget plan was the", ra: "documented", corr: "most thoroughly", dist: ["more thoroughly", "thoroughly", "thorough"], role: "Superlative Adverb (the + most + Adv + V3/ed trong câu có 'Of all...')", rule: "Of all + N, S + be + the + most + Adv (-ly) + V3/ed", v: ["thoroughly", "adv", "một cách kỹ lưỡng, toàn diện"], c: "thoroughly documented: được lập hồ sơ kỹ lưỡng" },
  { l: "The", r: "you submit your travel expense receipts, the sooner the finance team can process your reimbursement.", la: "The", ra: "you submit your travel expense receipts, the sooner", corr: "earlier", dist: ["early", "earliest", "more early"], role: "Double Comparative (The + So sánh hơn + S + V, the + So sánh hơn + S + V)", rule: "The + comparative (-er / more...), the + comparative (-er / more...) (Càng... càng...)", v: ["reimbursement", "n", "khoản hoàn phí"], c: "travel expense: chi phí công tác" },
  { l: "The", r: "comprehensive the initial project scope is, the fewer change requests the engineering team will face later.", la: "The", ra: "comprehensive the initial project scope is, the fewer", corr: "more", dist: ["most", "much", "very"], role: "Double Comparative Marker (The more + Adj + S + V, the fewer...)", rule: "The + more + Adj + S + V, the + comparative + S + V", v: ["comprehensive", "adj", "toàn diện, đầy đủ"], c: "project scope: phạm vi dự án" },
  { l: "The compact portable projector delivers an image just as", r: "as our standard ceiling-mounted unit.", la: "an image just as", ra: "as our standard ceiling-mounted unit", corr: "sharp", dist: ["sharper", "sharpest", "sharply"], role: "Positive Degree Adjective (as + Adj + as bổ nghĩa cho danh từ image)", rule: "as + Adj / Adv (nguyên cấp) + as (So sánh bằng)", v: ["portable", "adj", "nhỏ gọn, di động"], c: "ceiling-mounted: gắn trần" },
  { l: "Please process this urgent customs declaration as", r: "as possible so the shipment can make the evening flight.", la: "customs declaration as", ra: "as possible so the shipment", corr: "promptly", dist: ["prompt", "more promptly", "most promptly"], role: "Positive Degree Adverb (as + Adv + as possible bổ nghĩa cho động từ process)", rule: "V_thường + Object + as + Adv (-ly) + as possible", v: ["promptly", "adv", "ngay lập tức, nhanh chóng"], c: "as promptly as possible: nhanh nhất có thể" },
  { l: "Last quarter was the", r: "period in the company's twenty-year history.", la: "Last quarter was the", ra: "period in the company's twenty-year history", corr: "most profitable", dist: ["more profitable", "profitable", "profitably"], role: "Superlative Adjective (the + most + Adj + Noun + in history)", rule: "the + most + Adj + Noun + in [phạm vi/lịch sử]", v: ["profitable", "adj", "sinh lời cao"], c: "most profitable period: giai đoạn có lợi nhuận cao nhất" },
  { l: "Among the three finalist vendors, Kestrel Systems offered the", r: "service-level guarantee.", la: "Among the three finalist vendors, Kestrel Systems offered the", ra: "service-level guarantee", corr: "most reliable", dist: ["more reliable", "reliable", "reliably"], role: "Superlative Adjective (Among >= 3 đối tượng -> the most + Adj)", rule: "Among + [>= 3 đối tượng], S + V + the + So sánh nhất (-est / most Adj)", v: ["guarantee", "n", "cam kết bảo đảm"], c: "service-level guarantee: cam kết chất lượng dịch vụ" },
  { l: "Our new cloud server processes database queries twice as", r: "as the legacy on-premises hardware.", la: "database queries twice as", ra: "as the legacy on-premises hardware", corr: "fast", dist: ["faster", "fastest", "fastly"], role: "Positive Degree Adverb (twice as + Adv + as)", rule: "twice / three times + as + Adj / Adv (nguyên cấp) + as", v: ["legacy", "adj", "hệ thống cũ"], c: "database query: truy vấn cơ sở dữ liệu" },
  { l: "This handbook provides the", r: "explanation of the new import tariff regulations available to date.", la: "provides the", ra: "explanation of the new import tariff regulations available to date", corr: "clearest", dist: ["clearer", "clear", "clearly"], role: "Superlative Adjective (the + Adj-est + Noun + available to date)", rule: "the + So sánh nhất + Noun + ever / available to date", v: ["tariff", "n", "thuế quan xuất nhập khẩu"], c: "available to date: hiện có tính đến nay" },
  { l: "The", r: "we automate routine bookkeeping tasks, the more time our accountants can dedicate to strategic advisory.", la: "The", ra: "we automate routine bookkeeping tasks, the more time", corr: "more", dist: ["most", "many", "much"], role: "Double Comparative Adverb (The more + S + V, the more...)", rule: "The more + S + V, the more + Noun + S + V", v: ["bookkeeping", "n", "nghiệp vụ ghi sổ kế toán"], c: "routine tasks: công việc định kỳ hàng ngày" },

  // 23..33: Quantifiers & Determiners (another vs other vs others, each/every vs many/several/few/much/little) (11 items)
  { l: "Because the morning workshop is already full, the training coordinator scheduled", r: "session for Thursday afternoon.", la: "coordinator scheduled", ra: "session for Thursday afternoon", corr: "another", dist: ["other", "others", "each of"], role: "Singular Determiner (another + Danh từ đếm được số ít 'session')", rule: "another + Danh từ đếm được số ít (một cái/buổi khác); other + Danh từ số nhiều; others (đứng độc lập không có danh từ)", v: ["session", "n", "buổi họp / phiên đào tạo"], c: "schedule another session: xếp lịch thêm một buổi khác" },
  { l: "While two members of the audit team remain in Frankfurt,", r: "have already returned to the London headquarters.", la: "remain in Frankfurt,", ra: "have already returned to the London", corr: "the others", dist: ["another", "other", "each"], role: "Plural Definite Pronoun (the others = những người còn lại trong nhóm xác định, đi với động từ số nhiều 'have')", rule: "the others (đại từ số nhiều = the other + N_plural, làm chủ ngữ cho động từ số nhiều 'have')", v: ["headquarters", "n", "trụ sở chính"], c: "audit team: nhóm kiểm toán" },
  { l: "Only a", r: "tickets remain available for Friday's charity concert at Symphony Hall.", la: "Only a", ra: "tickets remain available for Friday's", corr: "few", dist: ["little", "much", "each"], role: "Countable Quantifier (a few + Danh từ đếm được số nhiều 'tickets')", rule: "(only) a few + Danh từ đếm được số nhiều (một vài); a little + Danh từ không đếm được", v: ["charity", "n", "hoạt động từ thiện"], c: "only a few tickets: chỉ còn một vài vé" },
  { l: "We have very", r: "time left before the courier arrives to pick up the signed contract.", la: "have very", ra: "time left before the courier", corr: "little", dist: ["few", "many", "several"], role: "Uncountable Quantifier (little + Danh từ không đếm được 'time')", rule: "little / much + Danh từ không đếm được (time, money, information, equipment)", v: ["courier", "n", "nhân viên chuyển phát nhanh"], c: "very little time: còn rất ít thời gian" },
  { l: "", r: "registered attendee will receive a personalized name badge and a printed conference program.", la: "", ra: "registered attendee will receive", corr: "Each", dist: ["Many", "Several", "Both"], role: "Singular Distributive Determiner (Each + Danh từ đếm được số ít 'attendee')", rule: "Each / Every + Danh từ đếm được số ít; Many / Several / Both + Danh từ số nhiều", v: ["attendee", "n", "người tham dự"], c: "personalized name badge: bảng tên cá nhân hóa" },
  { l: "The renovation required", r: "specialized machinery that had to be shipped from Germany.", la: "renovation required", ra: "specialized machinery that had to", corr: "a great deal of", dist: ["several", "many", "a few"], role: "Uncountable Quantifier Phrase (a great deal of + Danh từ không đếm được 'machinery')", rule: "a great deal of / much + Danh từ không đếm được (machinery, equipment, luggage, information)", v: ["machinery", "n", "máy móc thiết bị (danh từ không đếm được)"], c: "specialized machinery: máy móc chuyên dụng" },
  { l: "The human resources director interviewed", r: "qualified applicants for the bilingual receptionist position.", la: "director interviewed", ra: "qualified applicants for the bilingual", corr: "several", dist: ["much", "a little", "every"], role: "Plural Quantifier (several + Danh từ đếm được số nhiều 'applicants')", rule: "several / many / a few + Danh từ đếm được số nhiều", v: ["applicant", "n", "ứng viên xin việc"], c: "qualified applicants: các ứng viên đủ năng lực" },
  { l: "If this printer cartridge runs out of toner, there is", r: "one stored in the supply cabinet.", la: "toner, there is", ra: "one stored in the supply cabinet", corr: "another", dist: ["other", "others", "many"], role: "Singular Determiner (another + đại từ số ít 'one')", rule: "another + one / Danh từ đếm được số ít", v: ["cartridge", "n", "hộp mực máy in"], c: "supply cabinet: tủ đựng văn phòng phẩm" },
  { l: "No", r: "supplier in the region can match our twenty-four-hour turnaround guarantee.", la: "No", ra: "supplier in the region can match", corr: "other", dist: ["another", "others", "the others"], role: "Determiner after 'No' (No other + Danh từ số ít/nhiều)", rule: "no other + Danh từ (không một ... nào khác; KHÔNG dùng 'no another')", v: ["turnaround", "n", "thời gian hoàn tất xử lý"], c: "no other supplier: không nhà cung cấp nào khác" },
  { l: "", r: "of the two proposed warehouse sites offers direct access to the interstate highway.", la: "", ra: "of the two proposed warehouse sites offers", corr: "Either", dist: ["Both", "Many", "Several"], role: "Distributive Pronoun for 2 items + Singular Verb (Either of the two + N_plural + V_singular 'offers')", rule: "Either / Neither + of the two + N_plural + Động từ chia số ít ('offers'); Both of... + Động từ số nhiều", v: ["interstate", "adj", "liên bang / cao tốc liên tỉnh"], c: "direct access to: lối tiếp cận trực tiếp tới" },
  { l: "The safety manual must be reviewed by", r: "employee before operating the hydraulic press.", la: "reviewed by", ra: "employee before operating the hydraulic", corr: "every", dist: ["all", "many", "both"], role: "Singular Distributive Determiner (every + Danh từ đếm được số ít 'employee')", rule: "every / each + Danh từ đếm được số ít; all / many / both + Danh từ số nhiều", v: ["hydraulic", "adj", "thủy lực"], c: "safety manual: sổ tay hướng dẫn an toàn" },
];

export function generateCompQuantQuestions() {
  const topicId = "GRM_COMP_QUANTIFIER";
  const topicNameVi = "Cấu trúc So sánh, Lượng từ & Từ hạn định (Comparatives, Superlatives & Quantifiers)";
  const errCode = "ERR_POS_ADJ_FOR_ADV";
  const errName = "Nhầm Tính từ / Cấp so sánh / Lượng từ không khớp danh từ và cấu trúc câu";

  return COMP_QUANT_SCENARIOS.map((sc, idx) => {
    const qNum = idx + 1;
    const id = `EXP2026_COMP_QUANT_Q${String(qNum).padStart(3, "0")}`;
    const diff = idx < 11 ? 1 : idx < 22 ? 2 : 3;

    const correctIdx = idx % 4;
    const correctKey = KEYS[correctIdx];
    const options = {};
    let dPtr = 0;

    for (let i = 0; i < 4; i++) {
      const k = KEYS[i];
      if (i === correctIdx) {
        options[k] = { text: sc.corr, role: sc.role, errCode: null, errNameVi: "", whyWrongVi: "" };
      } else {
        const dText = sc.dist[dPtr++];
        options[k] = {
          text: dText,
          role: "Mismatched Degree / Quantifier",
          errCode,
          errNameVi: errName,
          whyWrongVi: `"${dText}" không khớp với dấu hiệu ngữ pháp "${sc.la} ... ${sc.ra}" (theo quy tắc "${sc.rule}", vị trí này phải dùng "${sc.corr}").`,
        };
      }
    }

    const explanationVi = `Đáp án đúng là (${correctKey}) "${sc.corr}". Căn cứ vào dấu hiệu ngữ pháp quanh chỗ trống ("${sc.la}" / "${sc.ra}"), ta áp dụng quy tắc "${sc.rule}" -> chọn ${sc.role} ("${sc.corr}").`;

    return buildQuestionFromSpec({
      id,
      part: 5,
      number: 100 + qNum,
      topicId,
      topicNameVi,
      skillCategory: "GRAMMAR",
      difficultyLevel: diff,
      targetBand: 650,
      recommendedTime: 14,
      microFormulaVi: sc.rule,
      commonTrapVi: "Bẫy dùng 'very' trước so sánh hơn (phải dùng much/far/significantly), bẫy so sánh kép 'The + comparative..., the + comparative...', và bẫy phân biệt another (+ N số ít) vs other (+ N số nhiều) vs others (đại từ).",
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
      similarIds: ["ETS2024_T01_Q121"],
    });
  });
}

// ============================================================================
// 6. GRM_PRON_RELATIVE (29 questions: Q001..Q029)
// ============================================================================
const RELATIVE_SCENARIOS = [
  // 1..8: Possessive Relative Pronoun "[whose] + bare Noun" (8 items)
  { l: "Passengers", r: "boarding passes display Zone 1 may proceed directly to the priority gate.", la: "Passengers", ra: "boarding passes display Zone 1", corr: "whose", dist: ["who", "whom", "which"], role: "Possessive Relative Pronoun (whose + Danh từ 'boarding passes')", rule: "Danh từ tiền ngữ (Người/Vật) + whose + Danh từ không mạo từ + (S) + V", v: ["priority", "n", "quyền ưu tiên"], c: "boarding pass: thẻ lên máy bay" },
  { l: "The venture capital fund invests primarily in clean-tech startups", r: "prototypes have already passed regulatory safety testing.", la: "clean-tech startups", ra: "prototypes have already passed", corr: "whose", dist: ["which", "that", "who"], role: "Possessive Relative Pronoun (whose + Danh từ 'prototypes' sở hữu của startups)", rule: "Danh từ (Người hoặc Tổ chức/Vật) + whose + Danh từ + V", v: ["regulatory", "adj", "thuộc về quy định quản lý"], c: "venture capital fund: quỹ đầu tư mạo hiểm" },
  { l: "Ms. Lindholm will interview several graphic designers", r: "portfolios received top marks from the creative director.", la: "graphic designers", ra: "portfolios received top marks", corr: "whose", dist: ["who", "whom", "which"], role: "Possessive Relative Pronoun (whose + Danh từ 'portfolios')", rule: "Person Antecedent + whose + Noun + V", v: ["portfolio", "n", "hồ sơ năng lực thiết kế"], c: "creative director: giám đốc sáng tạo" },
  { l: "Any tenant", r: "lease expires at the end of December must notify the management office by Friday.", la: "Any tenant", ra: "lease expires at the end", corr: "whose", dist: ["who", "whom", "that"], role: "Possessive Relative Pronoun (whose + Danh từ 'lease')", rule: "Person Antecedent + whose + Noun + V", v: ["expire", "v", "hết hiệu lực, hết hạn"], c: "management office: văn phòng ban quản lý" },
  { l: "We are replacing all industrial chillers", r: "energy consumption exceeds the new municipal efficiency standard.", la: "industrial chillers", ra: "energy consumption exceeds", corr: "whose", dist: ["which", "that", "what"], role: "Possessive Relative Pronoun (whose + Danh từ 'energy consumption')", rule: "Thing Antecedent + whose + Noun + V (whose dùng cho cả người lẫn vật)", v: ["consumption", "n", "mức tiêu thụ năng lượng"], c: "efficiency standard: tiêu chuẩn hiệu suất" },
  { l: "Customers", r: "warranty claims have been approved will receive a replacement unit within five business days.", la: "Customers", ra: "warranty claims have been approved", corr: "whose", dist: ["who", "whom", "which"], role: "Possessive Relative Pronoun (whose + Danh từ 'warranty claims')", rule: "Person Antecedent + whose + Noun + V", v: ["replacement", "n", "sản phẩm thay thế"], c: "within five business days: trong vòng 5 ngày làm việc" },
  { l: "The chamber of commerce honors local businesses", r: "community outreach programs create measurable social impact.", la: "local businesses", ra: "community outreach programs create", corr: "whose", dist: ["which", "who", "what"], role: "Possessive Relative Pronoun (whose + Danh từ 'community outreach programs')", rule: "Organization Antecedent + whose + Noun + V", v: ["outreach", "n", "hoạt động gắn kết cộng đồng"], c: "chamber of commerce: phòng thương mại" },
  { l: "Dr. Patel is consulting with an acoustic architect", r: "previous concert hall designs won three European awards.", la: "acoustic architect", ra: "previous concert hall designs won", corr: "whose", dist: ["who", "whom", "which"], role: "Possessive Relative Pronoun (whose + cụm danh từ 'previous concert hall designs')", rule: "Person Antecedent + whose + (Adj) + Noun + V", v: ["architect", "n", "kiến trúc sư"], c: "concert hall: nhà hát hòa nhạc" },

  // 9..15: Subject Relative Pronoun for People "[who] + V_finite" (7 items)
  { l: "Employees", r: "complete the cybersecurity awareness module before Friday will be entered into a prize drawing.", la: "Employees", ra: "complete the cybersecurity awareness module", corr: "who", dist: ["whom", "whose", "which"], role: "Subject Relative Pronoun for People (who + Động từ chia thì 'complete')", rule: "Danh từ chỉ người + who + Động từ chia thì (who làm chủ ngữ mệnh đề quan hệ)", v: ["awareness", "n", "nhận thức, ý thức bảo mật"], c: "prize drawing: chương trình bốc thăm trúng thưởng" },
  { l: "The human resources department is seeking a payroll specialist", r: "has at least four years of experience with international tax law.", la: "payroll specialist", ra: "has at least four years", corr: "who", dist: ["whom", "whose", "what"], role: "Subject Relative Pronoun for People (who + Động từ 'has')", rule: "Danh từ chỉ người + who + V_finite", v: ["specialist", "n", "chuyên viên"], c: "payroll specialist: chuyên viên tiền lương" },
  { l: "Anyone", r: "wishes to reserve a display booth at the autumn trade fair must submit a deposit today.", la: "Anyone", ra: "wishes to reserve a display booth", corr: "who", dist: ["whom", "whose", "which"], role: "Subject Relative Pronoun after 'Anyone' (Anyone who + V_singular 'wishes')", rule: "Anyone / Those + who + V_finite", v: ["deposit", "n", "khoản tiền đặt cọc"], c: "display booth: gian hàng trưng bày" },
  { l: "Our technical support team assists clients", r: "are migrating their legacy databases to the cloud.", la: "assists clients", ra: "are migrating their legacy databases", corr: "who", dist: ["whom", "whose", "which"], role: "Subject Relative Pronoun for People (who + 'are migrating')", rule: "Danh từ chỉ người + who + V_finite", v: ["migrate", "v", "chuyển đổi/di chuyển dữ liệu"], c: "technical support: hỗ trợ kỹ thuật" },
  { l: "The keynote panel features three retail executives", r: "successfully led major omnichannel transformations.", la: "three retail executives", ra: "successfully led major omnichannel", corr: "who", dist: ["whom", "whose", "which"], role: "Subject Relative Pronoun for People (who + Adv + V_past 'led')", rule: "Danh từ chỉ người + who + (Adv) + V_finite", v: ["executive", "n", "lãnh đạo cấp cao"], c: "keynote panel: phiên thảo luận chính" },
  { l: "Those", r: "register for the leadership symposium before October 15 qualify for a twenty percent discount.", la: "Those", ra: "register for the leadership symposium", corr: "who", dist: ["whom", "whose", "which"], role: "Subject Relative Pronoun after 'Those' (Those who + V_plural 'register')", rule: "Those who + V_plural (Những người mà...)", v: ["qualify", "v", "đủ điều kiện hưởng"], c: "Those who...: những người mà..." },
  { l: "The museum director thanked the volunteers", r: "guided school tour groups throughout the summer exhibition.", la: "thanked the volunteers", ra: "guided school tour groups", corr: "who", dist: ["whom", "whose", "what"], role: "Subject Relative Pronoun for People (who + V_past 'guided')", rule: "Danh từ chỉ người + who + V_finite", v: ["volunteer", "n", "tình nguyện viên"], c: "summer exhibition: triển lãm mùa hè" },

  // 16..22: Preposition + "[which]" (for things) or Preposition / Quantifier + "[whom]" (for people) (7 items)
  { l: "The evaluation criteria on", r: "the selection committee bases its grant decisions are published on our website.", la: "evaluation criteria on", ra: "the selection committee bases", corr: "which", dist: ["that", "what", "who"], role: "Object of Preposition Relative Pronoun for Things (Giới từ 'on' + which + S + V)", rule: "Danh từ chỉ vật + Giới từ (in / on / at / for / through / by) + which + S + V (KHÔNG dùng 'that' hoặc 'what' sau giới từ)", v: ["criteria", "n", "các tiêu chí đánh giá (số nhiều)"], c: "base a decision on: dựa quyết định vào" },
  { l: "The orientation packet explains the process through", r: "employees can request flexible remote-work schedules.", la: "the process through", ra: "employees can request flexible", corr: "which", dist: ["that", "what", "whom"], role: "Object of Preposition Relative Pronoun (through which + S + V)", rule: "Danh từ chỉ vật + Giới từ + which + S + V_complete", v: ["orientation", "n", "buổi định hướng nhân viên mới"], c: "flexible schedule: lịch làm việc linh hoạt" },
  { l: "The logistics conference was attended by over two hundred delegates, many of", r: "represent European shipping lines.", la: "two hundred delegates, many of", ra: "represent European shipping lines", corr: "whom", dist: ["who", "which", "them"], role: "Object of Preposition Relative Pronoun for People (many of whom + V)", rule: "Danh từ chỉ người, + many / most / all / some / both + of + whom + V (trong cùng 1 câu nối bằng dấu phẩy, KHÔNG dùng 'them')", v: ["shipping line", "n", "hãng tàu biển"], c: "many of whom: nhiều người trong số họ" },
  { l: "The company operates twelve regional warehouses, three of", r: "are equipped with automated robotic sorters.", la: "twelve regional warehouses, three of", ra: "are equipped with automated", corr: "which", dist: ["whom", "that", "them"], role: "Object of Preposition Relative Pronoun for Things (three of which + V)", rule: "Danh từ chỉ vật, + Số lượng/Lượng từ + of + which + V (KHÔNG dùng 'of that' hoặc 'of them' sau dấu phẩy)", v: ["equip", "v", "trang bị"], c: "three of which: ba trong số đó" },
  { l: "The senior consultant with", r: "Mr. Tanaka drafted the market-entry strategy has relocated to Zurich.", la: "senior consultant with", ra: "Mr. Tanaka drafted the market-entry", corr: "whom", dist: ["who", "which", "whose"], role: "Object of Preposition Relative Pronoun for People (with whom + S + V)", rule: "Danh từ chỉ người + Giới từ (with / to / for / by) + whom + S + V", v: ["relocate", "v", "chuyển công tác/chỗ ở"], c: "market-entry strategy: chiến lược thâm nhập thị trường" },
  { l: "The escrow account into", r: "the buyer deposited the initial installment is managed by First National Bank.", la: "escrow account into", ra: "the buyer deposited the initial", corr: "which", dist: ["that", "where", "what"], role: "Object of Preposition Relative Pronoun (into which + S + V)", rule: "Danh từ chỉ vật + Giới từ (into) + which + S + V", v: ["installment", "n", "khoản thanh toán trả góp/theo đợt"], c: "escrow account: tài khoản ký quỹ" },
  { l: "The panel interviewed six internal candidates, all of", r: "exceeded the minimum leadership competency score.", la: "six internal candidates, all of", ra: "exceeded the minimum leadership", corr: "whom", dist: ["who", "which", "them"], role: "Object of Preposition Relative Pronoun for People (all of whom + V)", rule: "Danh từ chỉ người, + all / most / many + of + whom + V", v: ["competency", "n", "năng lực chuyên môn"], c: "internal candidate: ứng viên nội bộ" },

  // 23..29: Nominal Relative / Compound Relative ("what", "whoever", "whichever") & Thing Relative ("which/that") (7 items)
  { l: "Our product design team carefully analyzes", r: "customers write in their post-purchase feedback surveys.", la: "carefully analyzes", ra: "customers write in their post-purchase", corr: "what", dist: ["which", "that", "who"], role: "Nominal Relative Pronoun (what = the thing that, đứng sau động từ 'analyzes' không có danh từ tiền ngữ)", rule: "Động từ / Giới từ (KHÔNG có danh từ tiền ngữ phía trước) + what + S + V_thiếu_tân_ngữ", v: ["analyze", "v", "phân tích"], c: "post-purchase feedback: phản hồi sau mua hàng" },
  { l: "The complimentary parking pass will be assigned to", r: "submits the carpool registration form first.", la: "assigned to", ra: "submits the carpool registration form", corr: "whoever", dist: ["whomever", "whatever", "whose"], role: "Compound Subject Relative Pronoun (whoever = bất kỳ ai làm chủ ngữ cho động từ 'submits')", rule: "Giới từ (to) + whoever + Động từ chia thì (whoever đóng vai trò chủ ngữ của mệnh đề theo sau)", v: ["carpool", "n", "nhóm đi chung xe ô tô"], c: "complimentary parking pass: thẻ đỗ xe miễn phí" },
  { l: "Enrollees may select", r: "of the three weekend workshop schedules best fits their availability.", la: "may select", ra: "of the three weekend workshop schedules", corr: "whichever", dist: ["whatever", "whoever", "whomever"], role: "Selective Relative Determiner/Pronoun (whichever + of the [tập hợp xác định])", rule: "whichever + of the + Danh từ xác định (bất kỳ cái nào trong số một nhóm lựa chọn giới hạn)", v: ["availability", "n", "thời gian rảnh/lịch trống"], c: "fit one's availability: phù hợp với quỹ thời gian" },
  { l: "The quarterly financial report, a copy of", r: "was circulated to board members yesterday, highlights strong export growth.", la: "financial report, a copy of", ra: "was circulated to board members", corr: "which", dist: ["that", "what", "whom"], role: "Non-restrictive Relative Pronoun after 'a copy of' (a copy of which + V)", rule: "Danh từ chỉ vật, + a [Noun] of + which + V (mệnh đề quan hệ không xác định sau dấu phẩy)", v: ["circulate", "v", "lưu hành, gửi phân phát (tài liệu)"], c: "export growth: tăng trưởng xuất khẩu" },
  { l: "Please let the catering coordinator know", r: "dietary restrictions your visiting clients may have.", la: "coordinator know", ra: "dietary restrictions your visiting clients", corr: "whatever", dist: ["whoever", "whomever", "which"], role: "Compound Relative Determiner (whatever + Noun 'dietary restrictions' + S + V)", rule: "whatever + Danh từ + S + V (bất kỳ ... nào mà)", v: ["dietary", "adj", "thuộc về chế độ ăn uống"], c: "dietary restrictions: yêu cầu kiêng khem ăn uống" },
  { l: "The automated sorting machine", r: "was installed at the Newark distribution center can process five thousand parcels an hour.", la: "automated sorting machine", ra: "was installed at the Newark", corr: "that", dist: ["what", "whom", "whose"], role: "Subject Relative Pronoun for Things (that/which + V 'was installed')", rule: "Danh từ chỉ vật + that / which + Động từ chia thì", v: ["parcel", "n", "bưu kiện"], c: "sorting machine: máy phân loại" },
  { l: "Management was impressed by", r: "the engineering task force accomplished in just three weeks.", la: "impressed by", ra: "the engineering task force accomplished", corr: "what", dist: ["which", "that", "who"], role: "Nominal Relative Pronoun (by + what + S + V_thiếu_tân_ngữ)", rule: "Giới từ (KHÔNG có danh từ đứng trước) + what + S + V_ngoại_động_từ_thiếu_tân_ngữ", v: ["accomplish", "v", "hoàn thành xuất sắc, đạt được"], c: "task force: nhóm chuyên trách" },
];

export function generateRelativeQuestions() {
  const topicId = "GRM_PRON_RELATIVE";
  const topicNameVi = "Đại từ quan hệ & Mệnh đề quan hệ (Relative Clauses)";
  const errCode = "ERR_REL_PRONOUN_MISMATCH";
  const errName = "Chọn sai Đại từ quan hệ (who / whom / whose / which / what)";

  return RELATIVE_SCENARIOS.map((sc, idx) => {
    const qNum = idx + 1;
    const id = `EXP2026_PRON_REL_Q${String(qNum).padStart(3, "0")}`;
    const diff = idx < 10 ? 1 : idx < 20 ? 2 : 3;

    const correctIdx = idx % 4;
    const correctKey = KEYS[correctIdx];
    const options = {};
    let dPtr = 0;

    for (let i = 0; i < 4; i++) {
      const k = KEYS[i];
      if (i === correctIdx) {
        options[k] = { text: sc.corr, role: sc.role, errCode: null, errNameVi: "", whyWrongVi: "" };
      } else {
        const dText = sc.dist[dPtr++];
        options[k] = {
          text: dText,
          role: "Mismatched Relative Pronoun / Personal Pronoun",
          errCode,
          errNameVi: errName,
          whyWrongVi: `"${dText}" sai chức năng đại từ quan hệ tại vị trí "${sc.la} ... ${sc.ra}" (theo quy tắc "${sc.rule}", bắt buộc dùng "${sc.corr}").`,
        };
      }
    }

    const explanationVi = `Đáp án đúng là (${correctKey}) "${sc.corr}". Quan sát từ đứng ngay trước ("${sc.la}") và cấu trúc theo sau ("${sc.ra}"), ta áp dụng quy tắc "${sc.rule}" -> chọn ${sc.role} ("${sc.corr}").`;

    return buildQuestionFromSpec({
      id,
      part: 5,
      number: 100 + qNum,
      topicId,
      topicNameVi,
      skillCategory: "GRAMMAR",
      difficultyLevel: diff,
      targetBand: 600,
      recommendedTime: 15,
      microFormulaVi: sc.rule,
      commonTrapVi: "Bẫy chọn who/which khi ngay sau chỗ trống là Danh từ không mạo từ (phải chọn whose + Noun), bẫy dùng 'that/what' sau giới từ, hoặc dùng 'them' thay vì 'whom/which' để nối 2 mệnh đề qua dấu phẩy.",
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
      similarIds: ["ETS2024_T01_Q115"],
    });
  });
}

// ============================================================================
// 7. VOC_PHRASAL_PREP (26 questions: Q001..Q026)
// ============================================================================
const PHRASAL_SCENARIOS = [
  { l: "All food processing facilities must strictly", r: "with federal hygiene and labeling regulations.", la: "must strictly", ra: "with federal hygiene and labeling", corr: "comply", dist: ["abide", "adhere", "observe"], role: "Intransitive Verb + Dependent Preposition 'with' (comply with = tuân thủ)", rule: "comply + with (tuân thủ) vs. abide + by vs. adhere + to vs. observe (+ Tân ngữ trực tiếp không giới từ)", v: ["hygiene", "n", "vệ sinh an toàn"], c: "comply with regulations: tuân thủ các quy định" },
  { l: "Theater patrons are kindly asked to", r: "from taking flash photographs during the symphony performance.", la: "kindly asked to", ra: "from taking flash photographs", corr: "refrain", dist: ["avoid", "prevent", "prohibit"], role: "Intransitive Verb + Dependent Preposition 'from' (refrain from + V-ing = kiềm chế/không làm gì)", rule: "refrain + from + V-ing (avoid đi trực tiếp với V-ing; prevent/prohibit cần Tân ngữ chỉ người ở giữa)", v: ["patron", "n", "khách hàng / khán giả"], c: "refrain from V-ing: kiềm chế/tránh làm gì" },
  { l: "Renewable energy sources now", r: "for more than forty percent of the utility company's total power generation.", la: "sources now", ra: "for more than forty percent", corr: "account", dist: ["consist", "comprise", "represent"], role: "Phrasal Verb with 'for' (account for = chiếm tỷ lệ / giải thích cho)", rule: "account + for + [Tỷ lệ %] (chiếm bao nhiêu phần trăm)", v: ["utility", "n", "công ty tiện ích (điện/nước)"], c: "account for: chiếm (tỷ trọng/phần trăm)" },
  { l: "Because of the approaching typhoon, the organizers decided to", r: "off tomorrow's outdoor charity marathon.", la: "decided to", ra: "off tomorrow's outdoor charity marathon", corr: "call", dist: ["put", "turn", "make"], role: "Phrasal Verb with 'off' (call off = cancel / hủy bỏ sự kiện)", rule: "call off = hủy bỏ (cancel); put off = trì hoãn (postpone); turn down = từ chối", v: ["approaching", "adj", "đang tiến gần (bão/thời hạn)"], c: "call off an event: hủy bỏ sự kiện" },
  { l: "The customer service supervisor promised to", r: "into the billing discrepancy and return the client's call by noon.", la: "promised to", ra: "into the billing discrepancy", corr: "look", dist: ["see", "watch", "observe"], role: "Phrasal Verb with 'into' (look into = investigate / kiểm tra, điều tra)", rule: "look into + Vấn đề (điều tra, xem xét kỹ = investigate)", v: ["discrepancy", "n", "sự sai lệch, chênh lệch số liệu"], c: "look into a discrepancy: kiểm tra sự sai lệch" },
  { l: "Although the real estate developer offered a generous buyout, the store owner", r: "down the proposal.", la: "store owner", ra: "down the proposal", corr: "turned", dist: ["called", "took", "brought"], role: "Phrasal Verb with 'down' (turn down = reject / từ chối lời đề nghị)", rule: "turn down + an offer / a proposal (từ chối = reject/decline)", v: ["buyout", "n", "thương vụ mua đứt quyền sở hữu"], c: "turn down a proposal: từ chối đề xuất" },
  { l: "All contracted laboratory staff must", r: "to the safety guidelines outlined in the employee manual.", la: "staff must", ra: "to the safety guidelines", corr: "adhere", dist: ["comply", "abide", "follow"], role: "Intransitive Verb + Dependent Preposition 'to' (adhere to = tuân thủ chặt chẽ)", rule: "adhere + to = comply + with = abide + by = follow (+ Object)", v: ["outline", "v", "nêu rõ, phác thảo"], c: "adhere to guidelines: tuân thủ hướng dẫn" },
  { l: "New patients are requested to", r: "out the medical history questionnaire before seeing the physician.", la: "requested to", ra: "out the medical history questionnaire", corr: "fill", dist: ["write", "take", "hand"], role: "Phrasal Verb with 'out' (fill out a form/questionnaire = điền hoàn chỉnh biểu mẫu)", rule: "fill out / fill in + a form / questionnaire (điền vào biểu mẫu)", v: ["questionnaire", "n", "bảng câu hỏi khảo sát/thông tin"], c: "fill out a questionnaire: điền bảng câu hỏi" },
  { l: "Full-time employees who have completed one year of service are", r: "for the company's tuition reimbursement program.", la: "service are", ra: "for the company's tuition reimbursement", corr: "eligible", dist: ["capable", "able", "probable"], role: "Adjective + Dependent Preposition 'for' (be eligible for = đủ điều kiện/tiêu chuẩn hưởng)", rule: "be eligible + for + Noun (đủ điều kiện hưởng) vs. be capable + of vs. be able + to V", v: ["tuition", "n", "học phí"], c: "eligible for a program: đủ điều kiện tham gia chương trình" },
  { l: "All international flight schedules are", r: "to change without prior notice due to air traffic control restrictions.", la: "schedules are", ra: "to change without prior notice", corr: "subject", dist: ["likely", "prone", "capable"], role: "Adjective + Dependent Preposition 'to' (be subject to + Noun = có thể chịu sự thay đổi/áp dụng)", rule: "be subject to + Noun (change / approval / availability / tax)", v: ["restriction", "n", "sự hạn chế, giới hạn"], c: "subject to change: có thể thay đổi" },
  { l: "After twelve years as chief executive officer, Mr. Beaumont announced that he will", r: "down at the end of the quarter.", la: "he will", ra: "down at the end of the quarter", corr: "step", dist: ["turn", "put", "fall"], role: "Phrasal Verb with 'down' (step down = resign / từ nhiệm, rời chức vụ)", rule: "step down (from a position) = từ chức, rút lui khỏi vị trí lãnh đạo", v: ["quarter", "n", "quý tài chính"], c: "step down as CEO: từ nhiệm chức CEO" },
  { l: "The telecommunications giant plans to", r: "out its legacy 3G network by the end of next year.", la: "plans to", ra: "out its legacy 3G network", corr: "phase", dist: ["call", "check", "hand"], role: "Phrasal Verb with 'out' (phase out = ngừng sử dụng/loại bỏ dần theo lộ trình)", rule: "phase out + sản phẩm/hệ thống cũ (loại bỏ dần); phase in (đưa vào áp dụng dần)", v: ["telecommunications", "n", "viễn thông"], c: "phase out a network: ngừng dần mạng lưới cũ" },
  { l: "Our legal firm", r: "in intellectual property litigation and cross-border patent licensing.", la: "legal firm", ra: "in intellectual property litigation", corr: "specializes", dist: ["focuses", "concentrates", "dedicates"], role: "Verb + Dependent Preposition 'in' (specialize in = chuyên sâu về lĩnh vực gì)", rule: "specialize + in (chuyên về) vs. focus/concentrate + on vs. be dedicated + to", v: ["litigation", "n", "vụ kiện tụng, tranh tụng pháp lý"], c: "specialize in: chuyên về lĩnh vực" },
  { l: "The board decided to", r: "off the construction of the new annex until interest rates stabilize.", la: "decided to", ra: "off the construction of the new annex", corr: "put", dist: ["call", "turn", "give"], role: "Phrasal Verb with 'off' (put off ... until ... = postpone / trì hoãn cho đến khi)", rule: "put off + Noun + until... (trì hoãn việc gì cho đến khi)", v: ["annex", "n", "tòa nhà phụ mở rộng"], c: "put off construction: hoãn việc xây dựng" },
  { l: "Researchers at the marine institute are", r: "out a five-year study on coastal coral reef restoration.", la: "institute are", ra: "out a five-year study on coastal", corr: "carrying", dist: ["bringing", "taking", "making"], role: "Phrasal Verb with 'out' (carry out a study/survey/inspection = tiến hành, thực hiện)", rule: "carry out + a study / survey / experiment / inspection (= conduct)", v: ["restoration", "n", "sự phục hồi, bảo tồn"], c: "carry out a study: tiến hành một nghiên cứu" },
  { l: "The newly renovated convention hotel is located", r: "to the central high-speed rail terminal.", la: "is located", ra: "to the central high-speed rail", corr: "adjacent", dist: ["near", "beside", "across"], role: "Adjective + Dependent Preposition 'to' (adjacent to = liền kề, sát cạnh)", rule: "adjacent / close / next + to + Địa điểm (near và beside không đi với 'to'; across đi với 'from')", v: ["terminal", "n", "nhà ga cuối/trung tâm"], c: "adjacent to: liền kề với" },
  { l: "Before installing the operating system update, users should", r: "up all critical project files to an external drive.", la: "users should", ra: "up all critical project files", corr: "back", dist: ["set", "pick", "take"], role: "Phrasal Verb with 'up' (back up files/data = sao lưu dữ liệu)", rule: "back up + files / data (sao lưu dữ liệu dự phòng)", v: ["critical", "adj", "quan trọng, thiết yếu"], c: "back up files: sao lưu tập tin" },
  { l: "The procurement director asked the legal team to", r: "up a standard non-disclosure agreement for new vendors.", la: "legal team to", ra: "up a standard non-disclosure agreement", corr: "draw", dist: ["bring", "call", "turn"], role: "Phrasal Verb with 'up' (draw up a contract/agreement/plan = soạn thảo văn bản/hợp đồng)", rule: "draw up + a contract / agreement / proposal (soạn thảo văn bản chính thức)", v: ["non-disclosure", "n", "bảo mật không tiết lộ thông tin"], c: "draw up an agreement: soạn thảo hợp đồng" },
  { l: "Many small exporters", r: "on regional freight forwarders to handle complex customs documentation.", la: "small exporters", ra: "on regional freight forwarders", corr: "rely", dist: ["trust", "assist", "support"], role: "Intransitive Verb + Dependent Preposition 'on' (rely on = dựa vào, tin cậy vào)", rule: "rely / depend / count + on + Somebody/Something", v: ["exporter", "n", "doanh nghiệp xuất khẩu"], c: "rely on: dựa vào, phụ thuộc vào" },
  { l: "Ms. Kowalski will", r: "over as director of European operations when Mr. Vance retires in June.", la: "Kowalski will", ra: "over as director of European", corr: "take", dist: ["hand", "turn", "get"], role: "Phrasal Verb with 'over' (take over as [chức vụ] = tiếp quản vị trí)", rule: "take over (as + chức vụ) = tiếp quản quyền điều hành; hand over = bàn giao lại", v: ["retire", "v", "nghỉ hưu"], c: "take over as director: tiếp quản chức giám đốc" },
  { l: "The recent drop in workplace absenteeism can be", r: "to the company's new flexible wellness program.", la: "absenteeism can be", ra: "to the company's new flexible wellness", corr: "attributed", dist: ["resulted", "caused", "stemmed"], role: "Passive Verb + Dependent Preposition 'to' (be attributed to = được quy cho là nhờ/do)", rule: "be attributed + to + Nguyên nhân (được quy cho là nhờ vào)", v: ["absenteeism", "n", "tình trạng vắng mặt/nghỉ làm"], c: "be attributed to: được quy cho là nhờ" },
  { l: "Several software engineers", r: "in the annual hackathon hosted by the municipal innovation hub.", la: "software engineers", ra: "in the annual hackathon hosted", corr: "participated", dist: ["attended", "joined", "entered"], role: "Intransitive Verb + Dependent Preposition 'in' (participate in = tham gia vào)", rule: "participate / engage / take part + in + Sự kiện (attend/join/enter đi trực tiếp với tân ngữ không có 'in')", v: ["host", "v", "đăng cai tổ chức"], c: "participate in: tham gia vào" },
  { l: "The regional bank plans to", r: "up three additional self-service ATM kiosks at the international airport.", la: "plans to", ra: "up three additional self-service ATM", corr: "set", dist: ["make", "turn", "carry"], role: "Phrasal Verb with 'up' (set up = lắp đặt, thiết lập, thành lập)", rule: "set up + thiết bị / chi nhánh / công ty (= establish/install)", v: ["self-service", "adj", "tự phục vụ"], c: "set up a kiosk: lắp đặt quầy tự phục vụ" },
  { l: "Unscheduled maintenance on the main assembly line", r: "in a two-day delay for outbound wholesale orders.", la: "assembly line", ra: "in a two-day delay for outbound", corr: "resulted", dist: ["caused", "led", "stemmed"], role: "Intransitive Verb + Dependent Preposition 'in' (result in = dẫn đến kết quả/hậu quả)", rule: "result + in + Kết quả (= lead + to = cause + Object); result/stem + from + Nguyên nhân", v: ["outbound", "adj", "hướng xuất đi (đơn hàng)"], c: "result in a delay: dẫn đến sự chậm trễ" },
  { l: "The chief compliance officer is directly", r: "for overseeing data protection audits across all subsidiaries.", la: "directly", ra: "for overseeing data protection audits", corr: "responsible", dist: ["charge", "duty", "accountable to"], role: "Adjective + Dependent Preposition 'for' (be responsible for + V-ing)", rule: "be responsible / accountable + for + V-ing / Noun", v: ["subsidiary", "n", "công ty con"], c: "be responsible for: chịu trách nhiệm về" },
  { l: "Despite the tight deadline, the catering crew", r: "up with a creative menu using locally sourced ingredients.", la: "catering crew", ra: "up with a creative menu", corr: "came", dist: ["kept", "put", "caught"], role: "Three-word Phrasal Verb (come up with = nảy ra, đề xuất ý tưởng/giải pháp)", rule: "come up with + an idea / a plan / a solution (đưa ra giải pháp/ý tưởng)", v: ["ingredient", "n", "nguyên liệu chế biến"], c: "come up with a menu: nghĩ ra/thiết kế thực đơn" },
];

export function generatePhrasalQuestions() {
  const topicId = "VOC_PHRASAL_PREP";
  const topicNameVi = "Cụm động từ & Cụm giới từ cố định (Phrasal Verbs & Dependent Prepositions)";
  const errCode = "ERR_VOCAB_COLLOCATION_MISMATCH";
  const errName = "Chọn từ vựng không khớp ngữ cảnh hoặc sai cụm Collocation thương mại";

  return PHRASAL_SCENARIOS.map((sc, idx) => {
    const qNum = idx + 1;
    const id = `EXP2026_VOC_PHR_Q${String(qNum).padStart(3, "0")}`;
    const diff = idx < 8 ? 1 : idx < 17 ? 2 : 3;

    const correctIdx = idx % 4;
    const correctKey = KEYS[correctIdx];
    const options = {};
    let dPtr = 0;

    for (let i = 0; i < 4; i++) {
      const k = KEYS[i];
      if (i === correctIdx) {
        options[k] = { text: sc.corr, role: sc.role, errCode: null, errNameVi: "", whyWrongVi: "" };
      } else {
        const dText = sc.dist[dPtr++];
        options[k] = {
          text: dText,
          role: "Mismatched Verb / Preposition Collocate",
          errCode,
          errNameVi: errName,
          whyWrongVi: `"${dText}" không đi kèm với giới từ/tiểu từ trong cụm "${sc.ra}" hoặc sai nghĩa ngữ cảnh (theo quy tắc "${sc.rule}", phải chọn "${sc.corr}").`,
        };
      }
    }

    const explanationVi = `Đáp án đúng là (${correctKey}) "${sc.corr}". Quan sát giới từ/tiểu từ đi ngay sau chỗ trống ("${sc.ra}") và ngữ cảnh câu -> áp dụng quy tắc "${sc.rule}" để chọn "${sc.corr}".`;

    return buildQuestionFromSpec({
      id,
      part: 5,
      number: 100 + qNum,
      topicId,
      topicNameVi,
      skillCategory: "VOCABULARY",
      difficultyLevel: diff,
      targetBand: 700,
      recommendedTime: 18,
      microFormulaVi: sc.rule,
      commonTrapVi: "Bẫy chọn động từ/tính từ cùng nghĩa tiếng Việt nhưng sai giới từ đi kèm (ví dụ: comply with vs adhere to vs abide by; participate in vs attend).",
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
      similarIds: ["ETS2024_T01_Q125"],
    });
  });
}
