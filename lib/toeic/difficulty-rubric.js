/**
 * Objective 4-Dimension / 100-Point Linguistic Difficulty Rubric (v2.1)
 * Zero circular bias (does NOT rely on noisy legacy difficulty_level / target_score_band).
 *
 * Dimensions (Total = 100 pts):
 *  1) Grammar / Discourse Structure Complexity (0-32)
 *  2) Distractor Trap Density (0-24)
 *  3) Lexical CEFR Level of Correct Answer (0-24)
 *  4) Syntactic Complexity of Stem (0-20)
 *  + Hard Guardrails preventing A1-A2 answers ("drink", "table", "his/her") from leaking into Hard.
 */

const RUBRIC_VERSION = 'v2.1';

// Basic A1-A2 vocabulary that must NEVER leak into Hard (750-900+)
const A1_A2_WORDS = new Set([
  'a', 'an', 'the', 'in', 'on', 'at', 'to', 'of', 'for', 'by', 'with', 'from', 'into', 'onto', 'out', 'up', 'down',
  'and', 'or', 'but', 'so', 'if', 'as', 'than', 'that', 'this', 'these', 'those', 'it', 'its', 'he', 'him', 'his',
  'she', 'her', 'hers', 'they', 'them', 'their', 'we', 'us', 'our', 'you', 'your', 'i', 'me', 'my', 'who', 'which',
  'what', 'when', 'where', 'why', 'how', 'all', 'any', 'some', 'each', 'every', 'many', 'much', 'more', 'most',
  'few', 'little', 'no', 'not', 'yes', 'very', 'too', 'also', 'just', 'only', 'now', 'then', 'here', 'there',
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'am', 'do', 'does', 'did', 'have', 'has', 'had', 'can', 'will',
  'may', 'must', 'get', 'got', 'make', 'made', 'take', 'took', 'give', 'gave', 'go', 'went', 'come', 'came', 'see',
  'saw', 'know', 'knew', 'use', 'used', 'find', 'found', 'work', 'call', 'try', 'ask', 'need', 'feel', 'become',
  'leave', 'put', 'mean', 'keep', 'let', 'begin', 'seem', 'help', 'talk', 'turn', 'start', 'show', 'hear', 'play',
  'run', 'move', 'live', 'pay', 'meet', 'send', 'buy', 'sell', 'open', 'close', 'read', 'write', 'check', 'eat',
  'eaten', 'drink', 'table', 'chair', 'room', 'book', 'time', 'year', 'day', 'week', 'month', 'hour', 'name',
  'place', 'home', 'house', 'car', 'bus', 'road', 'city', 'food', 'water', 'money', 'price', 'cost', 'free',
  'good', 'best', 'better', 'bad', 'new', 'old', 'big', 'small', 'long', 'short', 'high', 'low', 'early', 'late',
  'fast', 'slow', 'easy', 'hard', 'happy', 'great', 'nice', 'fine', 'right', 'wrong', 'next', 'last', 'first',
  'second', 'third', 'one', 'two', 'three', 'four', 'five', 'ten', 'today', 'tomorrow', 'yesterday', 'morning',
  'people', 'person', 'man', 'woman', 'staff', 'team', 'client', 'office', 'store', 'shop', 'hotel', 'event',
  'meeting', 'report', 'email', 'letter', 'paper', 'file', 'plan', 'job', 'line', 'part', 'way', 'end', 'back',
  'own', 'same', 'other', 'well', 'still', 'again', 'never', 'always', 'often', 'soon', 'yet', 'already',
]);

const BASIC_PRONOUNS = new Set([
  'his', 'her', 'my', 'our', 'their', 'your', 'its', 'him', 'them', 'us', 'he', 'she', 'they', 'we', 'me', 'you',
]);

// High-frequency A2-B1 words that happen to be >= 8-10 chars long (avoid length-based score inflation)
const COMMON_LONG_WORDS_A2_B1 = new Set([
  'information', 'restaurant', 'everything', 'understand', 'department', 'management', 'interested',
  'experience', 'immediately', 'customer', 'customers', 'business', 'employee', 'employees', 'company',
  'schedule', 'scheduled', 'building', 'remember', 'different', 'important', 'available', 'everyone',
  'anything', 'something', 'afternoon', 'document', 'documents', 'question', 'questions', 'training',
  'delivery', 'location', 'position', 'standard', 'possible', 'complete', 'completed', 'recently',
  'normally', 'directly', 'together', 'personal', 'national', 'original', 'included', 'provided',
  'required', 'received', 'expected', 'finished', 'prepared', 'improved', 'increase', 'continue',
  'consider', 'discount', 'purchase', 'products', 'services', 'feedback', 'contract', 'workshop',
  'software', 'material', 'materials', 'attention', 'carefully', 'currently', 'effective', 'following',
  'including', 'marketing', 'necessary', 'operating', 'organized', 'presented', 'published', 'regarding',
  'requested', 'submitted', 'suggested', 'telephone', 'traveling', 'visiting', 'welcoming', 'assistant',
  'conference', 'director', 'equipment', 'executive', 'financial', 'insurance', 'interview', 'inventory',
  'membership', 'newsletter', 'operations', 'production', 'promotion', 'quarterly', 'reception',
  'reference', 'remaining', 'scheduled', 'selection', 'statement', 'supervisor', 'technical', 'warehouse',
]);

// Short but high-value TOEIC 750-900+ C1 lexical / structural items
const HIGH_VALUE_C1_SHORT_WORDS = new Set([
  'via', 'amid', 'lest', 'nor', 'waive', 'waived', 'deem', 'deemed', 'curb', 'curbed', 'cite', 'cited',
  'void', 'sole', 'solely', 'mere', 'merely', 'akin', 'apt', 'opt', 'opted', 'vow', 'vowed', 'albeit',
  'whereby', 'thereby', 'hence', 'thus', 'prior', 'prone', 'gauge', 'yield', 'onset', 'enact', 'enacted',
  'elicit', 'revoke', 'revoked', 'exempt', 'abide', 'forgo', 'forgone', 'remit', 'levy', 'levied',
  'vetted', 'upheld', 'bolster', 'deter', 'impede', 'avert', 'exert', 'entail', 'accord', 'devoid',
  'hefty', 'steep', 'brisk', 'stark', 'lucid', 'adept', 'rigid', 'lax',
]);

const TOPIC_BASE_SCORE = {
  GRM_COND_INVERSION: 32,
  GRM_CONN_TRANSITION: 26,
  COH_P6_SENTENCE_INSERT: 26,
  GRM_VERB_PARTICIPLE: 24,
  GRM_CONN_PREP_VS_CONJ: 24,
  GRM_PRON_RELATIVE: 22,
  GRM_VERB_INFINITIVE_GERUND: 22,
  VOC_PHRASAL_PREP: 22,
  GRM_VERB_PASSIVE: 20,
  GRM_VERB_SVA: 20,
  GRM_VERB_TENSE: 20,
  GRM_COMP_QUANTIFIER: 20,
  GRM_CONN_CORRELATIVE_COORD: 18,
  VOC_COLLOCATION: 18,
  GRM_CONN_PREP_MEANING: 16,
  GRM_POS_ADV: 12,
  GRM_POS_NOUN: 10,
  GRM_POS_VERB: 10,
  GRM_POS_ADJ: 10,
  GRM_PRON_CASE: 8,
};

const VERB_TRAP_TOPICS = new Set([
  'GRM_VERB_PARTICIPLE',
  'GRM_VERB_INFINITIVE_GERUND',
  'GRM_VERB_PASSIVE',
  'GRM_VERB_TENSE',
]);

const HARD_STRUCT_RE = /\b(?:had\s+[a-z]+\s+[a-z]+(?:ed|en)|should\s+you|were\s+[a-z]+\s+to|notwithstanding|albeit|whereby|thereby|nonetheless|nevertheless|subsequently|consequently|accordingly|provided\s+that|in\s+case|even\s+though|as\s+long\s+as|so\s+that|whether|whoever|whichever|whatever|whose|whom|having\s+[a-z]+(?:ed|en)|neither\b.+\bnor|either\b.+\bor|not\s+only\b.+\bbut|insist|recommend|require|stipulate|mandate|unprecedented|stringent|substantial|considerable|tentatively|meticulously|comprehensive|disproportionate|preliminary|mandatory|consecutive|feasible|lucrative|prohibitive|versatile|adjacent|contingent|commenced|withheld|subsequent|negligible|ramifications|discrepancies|reimburse|reimbursement|expedite|alleviate|corroborate|disseminate|unanimous|unanimously)\b/i;

const POS_SUFFIX_RE = /(?:tion|sion|ment|ity|ness|ance|ence|al|ive|ous|able|ible|ly|ed|ing|er|or|ize|ise|ate)$/;

/**
 * Compute longest common prefix length across a list of lowercase words.
 */
function hasTrueWordFamily(cleanOpts) {
  const singleWords = cleanOpts.filter((o) => !o.includes(' ') && o.length >= 4);
  if (singleWords.length < 3) return false;

  // Check if at least 3 options share a >= 5-char prefix OR share >= 4-char prefix with POS suffixes
  const buckets5 = new Map();
  const buckets4 = new Map();
  for (const w of singleWords) {
    if (w.length >= 5) {
      const p5 = w.slice(0, 5);
      buckets5.set(p5, (buckets5.get(p5) || 0) + 1);
    }
    const p4 = w.slice(0, 4);
    buckets4.set(p4, (buckets4.get(p4) || 0) + 1);
  }

  const max5 = Math.max(0, ...buckets5.values());
  if (max5 >= 3) return true;

  const max4 = Math.max(0, ...buckets4.values());
  if (max4 >= 3) {
    const suffixedCount = singleWords.filter((w) => POS_SUFFIX_RE.test(w)).length;
    if (suffixedCount >= 2) return true;
  }

  return false;
}

/**
 * Score lexical CEFR difficulty of the correct answer (0-24).
 */
function scoreLexicalAnswer(ansLow) {
  if (!ansLow) return 6;
  const words = ansLow.replace(/[^a-z\s'-]/g, ' ').split(/\s+/).filter(Boolean);

  // Single-word answer
  if (words.length === 1) {
    const w = words[0];
    if (A1_A2_WORDS.has(w)) return 0;
    if (HIGH_VALUE_C1_SHORT_WORDS.has(w) || HARD_STRUCT_RE.test(w)) return 24;
    if (COMMON_LONG_WORDS_A2_B1.has(w)) return 8;
    if (w.length >= 10) return 22;
    if (w.length >= 7) return 14;
    return 7;
  }

  // Multi-word answer (complex verb phrase, connector, or Part 6 sentence)
  const contentWords = words.filter((w) => !A1_A2_WORDS.has(w));
  if (contentWords.length === 0) return 6;

  let maxWordScore = 0;
  let highCount = 0;
  for (const w of contentWords) {
    let ws = 7;
    if (HIGH_VALUE_C1_SHORT_WORDS.has(w) || HARD_STRUCT_RE.test(w)) ws = 24;
    else if (COMMON_LONG_WORDS_A2_B1.has(w)) ws = 9;
    else if (w.length >= 10) ws = 22;
    else if (w.length >= 7) ws = 14;

    if (ws >= 14) highCount += 1;
    if (ws > maxWordScore) maxWordScore = ws;
  }

  // Multi-word complex verb/clause bonus when >= 2 B2/C1 content words appear
  return Math.min(24, maxWordScore + (highCount >= 2 ? 2 : 0));
}

/**
 * Map deterministic 0-100 score -> consistent difficulty_level, target_score_band, prior_irt_b
 */
function mapScoreToMetadata(total) {
  const clamped = Math.max(0, Math.min(100, Math.round(total)));

  if (clamped >= 62) {
    const band = clamped >= 80 ? 850 : clamped >= 70 ? 800 : 750;
    // Linear map [62..100] -> [+0.50..+1.50]
    const irtB = Number((0.5 + ((clamped - 62) / 38) * 1.0).toFixed(3));
    return {
      difficulty: 'hard',
      difficulty_level: 3,
      target_score_band: band,
      prior_irt_b: irtB,
      difficulty_label: 'Khó · 750–900+',
    };
  }

  if (clamped >= 40) {
    const band = clamped >= 52 ? 650 : 600;
    // Linear map [40..61] -> [-0.30..+0.45]
    const irtB = Number((-0.3 + ((clamped - 40) / 21) * 0.75).toFixed(3));
    return {
      difficulty: 'medium',
      difficulty_level: 2,
      target_score_band: band,
      prior_irt_b: irtB,
      difficulty_label: 'Trung Bình · 600–650',
    };
  }

  const band = clamped >= 26 ? 500 : 450;
  // Linear map [0..39] -> [-1.20..-0.35]
  const irtB = Number((-1.2 + (clamped / 39) * 0.85).toFixed(3));
  return {
    difficulty: 'easy',
    difficulty_level: 1,
    target_score_band: band,
    prior_irt_b: irtB,
    difficulty_label: 'Dễ · 450–500',
  };
}

/**
 * Objective 4-Dimension Linguistic Difficulty Scorer (v2.1, 0-100 scale, zero circular bias)
 */
function scoreQuestionDifficulty(item) {
  const stem = String(item?.stem || item?.context_sentence || '').trim();
  const optionsObj = item?.options || {};
  const opts = Object.values(optionsObj);
  const ans = String(optionsObj[item?.correct_answer] || '').trim();
  const ansLow = ans.toLowerCase();
  const topic = String(item?.primary_grammar_topic_id || '');

  // 1. Grammar / Discourse Structure Complexity (0-32)
  const sTopic = TOPIC_BASE_SCORE[topic] ?? 14;

  // 2. Distractor Trap Density (0-24)
  const cleanOpts = opts
    .map((o) => String(o || '').toLowerCase().replace(/[^a-z\s]/g, '').trim())
    .filter(Boolean);
  const sharedFamily = hasTrueWordFamily(cleanOpts);
  const multiWordOpts = cleanOpts.filter((o) => o.includes(' ')).length >= 2;
  const avgWordsPerOpt =
    cleanOpts.reduce((acc, o) => acc + o.split(/\s+/).filter(Boolean).length, 0) /
    Math.max(1, cleanOpts.length);
  const nonBasicCount = cleanOpts.filter((o) => !A1_A2_WORDS.has(o)).length;

  let sTrap = 6;
  if (multiWordOpts) {
    // Full-sentence Part 6 or complex verb phrases vs simple 2-word phrases
    sTrap = avgWordsPerOpt >= 2.5 ? 24 : 20;
  } else if (sharedFamily && VERB_TRAP_TOPICS.has(topic)) {
    sTrap = 22;
  } else if (sharedFamily) {
    sTrap = 14;
  } else {
    const avgLen = cleanOpts.reduce((acc, o) => acc + o.length, 0) / Math.max(1, cleanOpts.length);
    if (nonBasicCount <= 1) {
      sTrap = 6;
    } else if (avgLen >= 9) {
      sTrap = 21;
    } else if (avgLen >= 6.5) {
      sTrap = 14;
    } else {
      sTrap = 8;
    }
  }

  // 3. Lexical CEFR Level of Correct Answer (0-24)
  const isA1A2Single = A1_A2_WORDS.has(ansLow);
  const sLex = scoreLexicalAnswer(ansLow);

  // 4. Syntactic Complexity of Stem (0-20)
  const wordCount = stem.split(/\s+/).filter(Boolean).length;
  const clauses = (stem.match(/[,;:—]/g) || []).length;
  const hasHardStruct = HARD_STRUCT_RE.test(stem);
  let sSyn = 0;
  if (wordCount >= 18) sSyn += 8;
  else if (wordCount >= 14) sSyn += 5;
  else if (wordCount >= 10) sSyn += 2;

  if (clauses >= 2) sSyn += 5;
  else if (clauses === 1) sSyn += 2;

  if (hasHardStruct) sSyn += 7;
  sSyn = Math.min(20, sSyn);

  let total = sTopic + sTrap + sLex + sSyn;
  const guardrailsApplied = [];

  // Hard Guardrail 1: Basic A1-A2 single-word answers never enter Hard unless true C1 structure/inversion
  if (isA1A2Single && !(topic === 'GRM_COND_INVERSION' || hasHardStruct)) {
    if (total > 50) guardrailsApplied.push('CAP_A1_A2_MAX_50');
    total = Math.min(total, 50);
  }

  // Hard Guardrail 2: Basic personal/possessive pronoun case is always Easy (450-500)
  if (topic === 'GRM_PRON_CASE' && BASIC_PRONOUNS.has(ansLow)) {
    if (total > 32) guardrailsApplied.push('CAP_BASIC_PRONOUN_MAX_32');
    total = Math.min(total, 32);
  }

  const mapped = mapScoreToMetadata(total);
  return {
    ...mapped,
    difficulty_score: Math.max(0, Math.min(100, Math.round(total))),
    difficulty_rubric_version: RUBRIC_VERSION,
    breakdown: {
      grammar: sTopic,
      distractor: sTrap,
      lexical: sLex,
      syntax: sSyn,
      guardrails: guardrailsApplied,
    },
  };
}

module.exports = {
  RUBRIC_VERSION,
  A1_A2_WORDS,
  BASIC_PRONOUNS,
  COMMON_LONG_WORDS_A2_B1,
  HIGH_VALUE_C1_SHORT_WORDS,
  TOPIC_BASE_SCORE,
  scoreQuestionDifficulty,
  mapScoreToMetadata,
};
