/**
 * Milestone 2.5: Explanation Migrator & Pedagogical Generator
 * Converts raw question explanations into standardized 5-field structured JSON
 */

import {
  SCHEMA_VERSION,
  DIFFICULTY_LEVELS,
  DIFFICULTY_SCORES,
  ESTIMATED_TIME_SECONDS,
  createEmptyExplanation,
  validateExplanation,
} from "./explanation.schema";

const MINI_GLOSSARY = {
  smoke: "khói",
  factory: "nhà máy",
  chimneys: "ống khói",
  chimney: "ống khói",
  polluted: "làm ô nhiễm",
  believe: "tin rằng",
  usually: "thường xuyên",
  always: "luôn luôn",
  seldom: "hiếm khi",
  yesterday: "hôm qua",
  tomorrow: "ngày mai",
  already: "đã ... rồi",
  quiet: "yên lặng",
  sleep: "ngủ",
  money: "tiền bạc",
  difficulty: "khó khăn",
  nowadays: "ngày nay",
  progress: "tiến bộ",
  certainty: "sự chắc chắn",
  noise: "tiếng ồn",
  complains: "phàn nàn",
  parcel: "bưu kiện",
  station: "nhà ga",
  unlucky: "không may mắn",
  healthy: "khỏe mạnh",
  important: "quan trọng",
  weather: "thời tiết",
  student: "học sinh",
  teacher: "giáo viên",
  children: "trẻ em",
  people: "mọi người",
  because: "bởi vì",
  although: "mặc dù",
  unless: "trừ khi",
  before: "trước khi",
  after: "sau khi",
};

function extractPrimaryAnswer(question) {
  if (Array.isArray(question.answers) && question.answers.length > 0) {
    const first = question.answers[0];
    if (first && typeof first === "object") {
      return String(first.correct || first.answer || "").trim();
    }
    return String(first || "").trim();
  }
  return String(question.answer || "").trim();
}

function inferGrammarDomain(topicName, instruction, stem, correctAnswer, rawExpl) {
  const combined = `${topicName} ${instruction} ${stem} ${rawExpl}`.toLowerCase();
  if (combined.includes("câu chẻ") || combined.includes("cleft") || combined.includes("emphasis on the underlined")) {
    return "EMPHASIS_CLEFT";
  }
  if (
    combined.includes("much") && combined.includes("many") ||
    combined.includes("a lot") ||
    combined.includes("few") && combined.includes("little") ||
    combined.includes("số lượng") ||
    combined.includes("lượng từ")
  ) {
    return "QUANTIFIERS";
  }
  if (combined.includes("noun clause") || combined.includes("mệnh đề danh từ")) {
    return "NOUN_CLAUSE";
  }
  if (combined.includes("wish") || combined.includes("if only")) {
    return "WISH_CLAUSE";
  }
  if (combined.includes("điều kiện") || combined.includes("conditional") || /\bif\b/.test(combined)) {
    return "CONDITIONALS";
  }
  if (combined.includes("quan hệ") || combined.includes("relative")) {
    return "RELATIVE_CLAUSE";
  }
  if (combined.includes("bị động") || combined.includes("passive")) {
    return "PASSIVE_VOICE";
  }
  if (combined.includes("gián tiếp") || combined.includes("reported")) {
    return "REPORTED_SPEECH";
  }
  if (combined.includes("word form") || combined.includes("cấu tạo từ") || combined.includes("hậu tố")) {
    return "WORD_FORMATION";
  }
  if (combined.includes("hòa hợp") || combined.includes("verb form") || combined.includes("các thì") || combined.includes("phối hợp")) {
    return "TENSE_AND_AGREEMENT";
  }
  if (combined.includes("so sánh") || combined.includes("comparison")) {
    return "COMPARISON";
  }
  return "GENERAL_TRANSFORMATION";
}

/**
 * Extracts and structures raw explanation text into the canonical 5-field schema.
 * @param {Object} question - The raw question object
 * @param {string} targetDifficulty - Target difficulty level
 * @returns {Object} Validated 5-field explanation object
 */
export function migrateQuestionExplanation(question, targetDifficulty = DIFFICULTY_LEVELS.INTERMEDIATE) {
  if (!question) return null;

  const qId = question.id || "Q_UNKNOWN";
  const topicName = question.topic_name || "Ngữ pháp tổng hợp";
  const instruction = question.instruction || "";
  const stem = question.stem || "";
  const correctAnswer = extractPrimaryAnswer(question);
  const rawExpl = question.explanation || "";
  const domain = inferGrammarDomain(topicName, instruction, stem, correctAnswer, rawExpl);

  // 1. Extract Signal Keywords & Clues
  const keywords = [];
  const candidateTokens = [
    "since", "for", "yesterday", "ago", "last week", "now", "at the moment", "already",
    "just", "yet", "tomorrow", "if", "unless", "seldom", "always", "usually", "often",
    "never", "much", "many", "a lot of", "few", "a few", "little", "a little",
    "wish", "if only", "who", "whom", "which", "whose", "that", "although", "despite",
    "because", "so that", "in order to", "hadn't", "don't", "didn't",
  ];
  const lowerStemInst = `${stem} ${instruction}`.toLowerCase();
  candidateTokens.forEach((kw) => {
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`\\b${escaped}\\b`, "i").test(lowerStemInst)) {
      keywords.push(kw);
    }
  });

  if (keywords.length === 0) {
    const fallbackKeywordMap = {
      EMPHASIS_CLEFT: ["It is/was ... that/who"],
      QUANTIFIERS: ["Lượng từ (much / many / a lot of)"],
      NOUN_CLAUSE: ["Mệnh đề danh từ (that + S + V)"],
      WISH_CLAUSE: ["Câu ước (wish / if only)"],
      CONDITIONALS: ["Mệnh đề điều kiện"],
      RELATIVE_CLAUSE: ["Đại từ quan hệ"],
      PASSIVE_VOICE: ["be + V3/ed"],
      REPORTED_SPEECH: ["Lùi thì & đổi đại từ"],
      WORD_FORMATION: ["Vị trí từ loại (N/V/Adj/Adv)"],
      TENSE_AND_AGREEMENT: ["Mốc thời gian & chủ ngữ"],
      COMPARISON: ["Cấp độ so sánh"],
      GENERAL_TRANSFORMATION: [topicName],
    };
    keywords.push(...(fallbackKeywordMap[domain] || [topicName]));
  }

  let grammarClues = [];
  const identifiedPattern = topicName;

  if (rawExpl.includes("【Dấu hiệu & Ngữ cảnh】")) {
    const signalText = rawExpl.split("【Dấu hiệu & Ngữ cảnh】")[1]?.split("【")[0]?.trim() || "";
    if (signalText) grammarClues.push(signalText);
  }
  if (grammarClues.length === 0 && question.pedagogy?.signal) {
    grammarClues.push(question.pedagogy.signal);
  }
  if (grammarClues.length === 0 && instruction) {
    grammarClues.push(instruction);
  }
  if (grammarClues.length === 0) {
    grammarClues.push(`Dựa vào cấu trúc ngữ pháp và ngữ cảnh của câu: "${stem}"`);
  }

  // 2. Extract Rule, Formula, Conditions & Exceptions
  const defaultFormulaByDomain = {
    EMPHASIS_CLEFT: "It + is/was + [thành phần nhấn mạnh] + that/who + [vế còn lại]",
    QUANTIFIERS: "Câu phủ định/nghi vấn: giữ much/many • Câu khẳng định: dùng a lot of / lots of",
    NOUN_CLAUSE: "S + V(nhận thức/tường thuật) + that + S + V(mệnh đề hoàn chỉnh)",
    WISH_CLAUSE: "S + wish(es) + S + V(lùi 1 thì so với thực tế)",
    CONDITIONALS: "If + S + V(mệnh đề đk), S + will/would + V...",
    RELATIVE_CLAUSE: "... + N + who/whom/which/that/whose + (S) + V...",
    PASSIVE_VOICE: "S + be (chia theo thì) + V3/ed (+ by O)",
    REPORTED_SPEECH: "S + said/told (+ O) + (that) + S + V(lùi thì)",
    WORD_FORMATION: "[Tiền tố] + Gốc từ + [Hậu tố] -> N / V / Adj / Adv",
    TENSE_AND_AGREEMENT: "S + V(chia theo thì & chủ ngữ số ít/nhiều)",
    COMPARISON: "as + adj/adv + as | adj-er / more + adj + than | the + adj-est / most adj",
    GENERAL_TRANSFORMATION: "Cấu trúc tương đương bảo toàn nghĩa & thì gốc",
  };

  let ruleFormula = defaultFormulaByDomain[domain] || defaultFormulaByDomain.GENERAL_TRANSFORMATION;
  let ruleExpl = `Áp dụng quy tắc thuộc chuyên đề ${topicName}.`;

  if (rawExpl.includes("【Quy tắc & Công thức】")) {
    const ruleText = rawExpl.split("【Quy tắc & Công thức】")[1]?.split("【")[0]?.trim() || "";
    if (ruleText) {
      ruleExpl = ruleText;
      // Case-sensitive match for formal syntax blueprints (never match lowercase 's' inside words like 'was +')
      const formulaMatch = ruleText.match(
        /\b((?:It\s*\+\s*is\/was|It\s+is\/was|S\s*\+|If\s*\+|There\s*\+|What\s*\+|Not only\s*\+|No sooner\s*\+)[^.\n]+?)(?=\s*->|\s*\.|\n|$)/
      );
      if (formulaMatch) {
        ruleFormula = formulaMatch[1].trim();
      }
    }
  } else if (question.pedagogy?.rule) {
    ruleExpl = question.pedagogy.rule;
  }

  const noChangeAnswer = /no word needed|không cần|ø/i.test(correctAnswer);
  if (domain === "QUANTIFIERS" && noChangeAnswer) {
    ruleExpl =
      `Câu gốc "${stem}" là câu phủ định hoặc câu hỏi nên giữ nguyên từ "much/many" (không cần đổi sang "a lot of"). Đáp án: ${correctAnswer}.`;
  }

  const conditionsByDomain = {
    EMPHASIS_CLEFT: [
      "Thì của 'is' (hiện tại) hoặc 'was' (quá khứ) phải khớp với thì động từ trong câu gốc.",
      "Thành phần đặt ngay sau 'It is/was' là đối tượng cần nhấn mạnh.",
    ],
    QUANTIFIERS: [
      "'much' đi với danh từ không đếm được hoặc bổ nghĩa động từ; 'many' đi với danh từ đếm được số nhiều.",
      "Trong câu phủ định và nghi vấn, dùng 'much/many' tự nhiên hơn 'a lot of' nên giữ nguyên câu gốc.",
    ],
    NOUN_CLAUSE: [
      "Mệnh đề danh từ sau 'that' bắt buộc có đầy đủ Chủ ngữ (S) + Động từ chia thì (V).",
      "Phối hợp thì giữa động từ chính ('believe / know / think...') và mệnh đề phụ sao cho hợp logic.",
    ],
    TENSE_AND_AGREEMENT: [
      "Xác định chính xác mốc thời gian (quá khứ / hiện tại / tương lai) trước khi chia trợ động từ.",
      "Kiểm tra chủ ngữ thực sự của câu để chia số ít hoặc số nhiều chuẩn xác.",
    ],
    GENERAL_TRANSFORMATION: [
      "Đối chiếu thì và cấu trúc câu gốc để chọn mẫu câu biến đổi tương đương nghĩa.",
    ],
  };
  const conditions = conditionsByDomain[domain] || conditionsByDomain.GENERAL_TRANSFORMATION;

  const exceptionsByDomain = {
    EMPHASIS_CLEFT: [
      "Khi nhấn mạnh người (tân ngữ hoặc chủ ngữ) có thể dùng 'that' hoặc 'who'; khi nhấn mạnh vật/thời gian/nơi chốn luôn dùng 'that' (tránh dùng 'which/where' ngay sau câu chẻ).",
      "Mặc dù nhấn mạnh chủ ngữ số nhiều (ví dụ 'It was the boys that...'), động từ sau 'It' vẫn luôn chia số ít ('is/was').",
    ],
    QUANTIFIERS: [
      "Bẫy hay gặp: Thấy đề bảo đổi 'much -> many/a lot of' liền đổi tất cả, quên mất trong câu phủ định ('don't ... much') hoặc có 'too/so/very/as' đứng trước thì giữ nguyên 'much' -> đáp án là 'Ø (No word needed)'.",
      "Trong văn viết trang trọng (academic), câu khẳng định vẫn chấp nhận 'much/many' nếu làm chủ ngữ (Much has been said...).",
    ],
    NOUN_CLAUSE: [
      "Có thể lược bỏ 'that' khi mệnh đề danh từ làm tân ngữ ('I believe (that) you will win'), nhưng BẮT BUỘC giữ 'that' nếu mệnh đề đứng đầu câu làm chủ ngữ.",
      "Trật tự từ trong mệnh đề danh từ dạng wh- luôn giữ S + V (không đảo ngữ như câu hỏi).",
    ],
    TENSE_AND_AGREEMENT: [
      "Một số danh từ tận cùng bằng '-s' (measles, news, mathematics, physics) mang nghĩa số ít -> động từ luôn chia số ít.",
      "Không chia thì tiếp diễn (V-ing) cho động từ trạng thái (know, believe, want, belong, seem).",
    ],
    GENERAL_TRANSFORMATION: [
      "Kiểm tra kỹ giới từ đi kèm, đại từ quy chiếu và đảo ngữ nếu câu chuyển sang cấu trúc nhấn mạnh hoặc phủ định đầu câu.",
    ],
  };
  const exceptions = exceptionsByDomain[domain] || exceptionsByDomain.GENERAL_TRANSFORMATION;

  // 3. Extract Translation & Vocabulary Glosses
  let vietnamese = "";
  if (rawExpl.includes("【Dịch nghĩa câu】")) {
    vietnamese = rawExpl.split("【Dịch nghĩa câu】")[1]?.split("【")[0]?.trim() || "";
  } else if (question.pedagogy?.translation) {
    vietnamese = question.pedagogy.translation;
  } else {
    vietnamese = `(Câu tham khảo cho: ${stem})`;
  }

  const vocabulary = [];
  const words = stem
    .replace(/[^a-zA-Z\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 4);
  const sampleWords = [...new Set(words)].slice(0, 4);
  sampleWords.forEach((w) => {
    const gloss = MINI_GLOSSARY[w.toLowerCase()];
    if (gloss) {
      vocabulary.push({
        word: w,
        meaning: gloss,
        contextual_meaning: `Nghĩa trong câu: ${gloss}`,
      });
    }
  });

  // 4. Common Mistakes (Domain-specific & Accurate)
  const mistakesByDomain = {
    EMPHASIS_CLEFT: {
      mistake: `Dùng sai thì ('is' thay vì 'was') hoặc chia sai đại từ nối 'that/who' quanh "${correctAnswer}".`,
      reason: "Nhiều bạn viết sai thành 'It is...' dù động từ câu gốc ở quá khứ, hoặc chọn 'which' thay vì 'that'.",
      correction: `Đáp án chuẩn là "${correctAnswer}" theo mẫu ${ruleFormula}.`,
      prevention_tip: "Kiểm tra thì của động từ chính trong câu gốc rồi mới chọn 'It is' hay 'It was', ưu tiên dùng 'that'.",
    },
    QUANTIFIERS: {
      mistake: noChangeAnswer
        ? `Thay đổi 'much' thành 'a lot of' trong câu phủ định/nghi vấn khiến câu không tự nhiên (đáp án chuẩn là "${correctAnswer}").`
        : `Nhầm giữa 'much' (không đếm được) và 'many' (đếm được số nhiều) với đáp án "${correctAnswer}".`,
      reason: "Thói quen sửa cơ học theo đề bài mà không xét xem câu ở dạng khẳng định hay phủ định/nghi vấn.",
      correction: `Đáp án chuẩn: "${correctAnswer}".`,
      prevention_tip: "Xem câu là khẳng định, phủ định hay nghi vấn; sau đó xác định danh từ phía sau đếm được hay không đếm được.",
    },
    NOUN_CLAUSE: {
      mistake: `Viết thiếu chủ ngữ hoặc động từ trong mệnh đề phụ sau 'that', hoặc sai phối hợp thì so với "${correctAnswer}".`,
      reason: "Nhầm mệnh đề danh từ với cụm danh từ nên viết thiếu động từ chính chia thì.",
      correction: `Hoàn thiện trọn vẹn S + V cho mệnh đề: "${correctAnswer}".`,
      prevention_tip: "Sau 'I believe/know/think that...' phải là một mệnh đề hoàn chỉnh gồm Chủ ngữ + Động từ chia thì.",
    },
    TENSE_AND_AGREEMENT: {
      mistake: `Điền sai dạng động từ hoặc chia sai thì / hòa hợp chủ vị so với đáp án "${correctAnswer}".`,
      reason: "Bỏ sót từ khóa thời gian hoặc nhầm chủ ngữ chính với cụm danh từ bổ nghĩa đứng cạnh.",
      correction: `Đáp án đúng là "${correctAnswer}".`,
      prevention_tip: "Gạch chân từ nhận biết thời gian và tìm đúng chủ ngữ chính trước khi chia động từ.",
    },
    GENERAL_TRANSFORMATION: {
      mistake: `Biến đổi thiếu thành phần hoặc sai thì câu gốc so với "${correctAnswer}".`,
      reason: "Chưa đối chiếu trọn vẹn thì của động từ, đại từ và giới từ khi viết lại câu.",
      correction: `Cấu trúc chuẩn là "${correctAnswer}".`,
      prevention_tip: "Đối chiếu từng vế câu gốc với câu đáp án để đảm bảo không sót nghĩa và đúng thì.",
    },
  };
  const chosenMistake = mistakesByDomain[domain] || mistakesByDomain.GENERAL_TRANSFORMATION;
  const commonMistakes = [chosenMistake];

  // 5. Exam Tips (Domain-specific)
  const tipsByDomain = {
    EMPHASIS_CLEFT: {
      strategy: "Nhìn phần gạch chân/cần nhấn mạnh -> đưa lên ngay sau 'It is/was', giữ nguyên các từ còn lại sau 'that'.",
      example: `Khớp ngay câu trả lời: "${correctAnswer}".`,
      warning: "Thì của 'is/was' luôn phải đồng bộ với thì câu gốc.",
    },
    QUANTIFIERS: {
      strategy: "Đọc kỹ câu có từ phủ định ('don't/doesn't/didn't/not'), dấu hỏi hay không trước khi đổi 'much'.",
      example: noChangeAnswer
        ? `Câu có dạng phủ định nên 'much' hoàn toàn chính xác -> "${correctAnswer}".`
        : `Áp dụng công thức ${ruleFormula} -> "${correctAnswer}".`,
      warning: "Không bao giờ tự động thay 'much' sang 'a lot of' nếu câu là câu phủ định hoặc có 'too/so/how'.",
    },
    NOUN_CLAUSE: {
      strategy: "Xác định động từ mệnh đề chính và nối tiếp bằng mệnh đề S + V phù hợp ngữ cảnh.",
      example: `Kiểm tra mệnh đề bổ sung: "${correctAnswer}".`,
      warning: "Đảm bảo sau 'that' là câu đầy đủ chủ-vị, không dùng dạng câu hỏi đảo trợ động từ.",
    },
    TENSE_AND_AGREEMENT: {
      strategy: `Kỹ thuật nhận diện nhanh cho chuyên đề ${topicName}:`,
      example: keywords.length > 0
        ? `Bắt từ khóa [${keywords.join(", ")}] để chốt thì và dạng động từ "${correctAnswer}".`
        : `Đối chiếu chủ ngữ chính và thì để chia "${correctAnswer}".`,
      warning: "Luôn kiểm tra chủ ngữ chính là số ít, số nhiều hay không đếm được.",
    },
    GENERAL_TRANSFORMATION: {
      strategy: `Kiểm tra yêu cầu đề (${instruction || topicName}) và áp đúng khung cấu trúc:`,
      example: `Đối chiếu với đáp án mẫu: "${correctAnswer}".`,
      warning: "Giữ nguyên thì, số ít/nhiều và nghĩa gốc của câu khi biến đổi.",
    },
  };
  const examTips = [tipsByDomain[domain] || tipsByDomain.GENERAL_TRANSFORMATION];

  const explanation = {
    schema_version: SCHEMA_VERSION,
    question_id: qId,
    topic_id: question.topic_id || "general",
    difficulty: targetDifficulty,
    difficulty_score: DIFFICULTY_SCORES[targetDifficulty] || 3,
    estimated_time_seconds: ESTIMATED_TIME_SECONDS[targetDifficulty] || 60,
    language: "vi",
    signal: {
      keywords,
      grammar_clues: grammarClues,
      identified_pattern: identifiedPattern,
    },
    rule: {
      topic: topicName,
      formula: ruleFormula,
      explanation: ruleExpl,
      conditions,
      exceptions,
    },
    translation: {
      original: stem,
      vietnamese,
      vocabulary,
    },
    common_mistakes: commonMistakes,
    exam_tips: examTips,
    status: "published",
    version: 1,
  };

  const validation = validateExplanation(explanation);
  if (!validation.isValid) {
    console.warn(`[Migrator] Validation warnings for question ${qId}:`, validation.errors);
  }

  return explanation;
}
