import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { KitIcon } from '../ui-2026/KitIcon';
import { ToeicBadge } from './ui';

/**
 * SentenceXRayCard Component (X-Ray 2.0 — Milestones MX1 to MX4)
 * 4-State Machine:
 * 1. STATE_SOLVING (Câu gốc, thẻ ngữ cảnh tách biệt, công cụ gạch loại trừ Strike-through)
 * 2. STATE_STRUCTURAL_BREAKDOWN (Thanh Quang Phổ 3 Khối, Chốt chặn học thuật, Option Inspector, Word Family, Collocations)
 * 3. STATE_RULE_FORMULA (Hộp công thức chuẩn, quy tắc sống còn, bẫy tư duy, 3 bước 10s)
 * 4. STATE_TWIN_REMEDIATION (Chuỗi 1..3 Câu hỏi sinh đôi gỡ điểm kèm giải thích X-Ray tại chỗ)
 * Strict Design Token Discipline: var(--ds-*).
 */
export const XRAY_STATES = {
  SOLVING: 'STATE_SOLVING',
  HINT_ACTIVE: 'STATE_HINT_ACTIVE',
  SUBMITTED: 'STATE_SUBMITTED_XRAY',
  STRUCTURAL_BREAKDOWN: 'STATE_STRUCTURAL_BREAKDOWN',
  RULE_FORMULA: 'STATE_RULE_FORMULA',
  TWIN_REMEDIATION: 'STATE_TWIN_REMEDIATION'
};

function shortenPosRole(posOrRole) {
  if (!posOrRole) return 'N/A';
  const s = String(posOrRole).trim();
  const parenMatch = s.match(/^([^(]+)\(([^)]+)\)$/);
  if (parenMatch) {
    const left = parenMatch[1].trim();
    const right = parenMatch[2].trim();
    return left.length <= 28 ? left : right;
  }
  return s.length > 36 ? s.slice(0, 34) + '…' : s;
}

const LINKING_VERBS = new Set([
  'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'become', 'becomes', 'became', 'remain', 'remains', 'remained',
  'stay', 'stays', 'stayed', 'seem', 'seems', 'seemed',
  'appear', 'appears', 'appeared', 'look', 'looks', 'looked',
  'feel', 'feels', 'felt', 'prove', 'proves', 'proved', 'sound', 'sounds'
]);

const MODAL_AUX = new Set([
  'will', 'would', 'can', 'could', 'shall', 'should', 'may', 'might', 'must',
  'has', 'have', 'had', 'do', 'does', 'did'
]);

const PREPOSITIONS = new Set([
  'in', 'on', 'at', 'of', 'for', 'to', 'with', 'by', 'from', 'into', 'onto',
  'upon', 'within', 'without', 'during', 'through', 'throughout', 'among',
  'between', 'under', 'over', 'across', 'after', 'before', 'since', 'until',
  'despite', 'regarding', 'concerning', 'about', 'against', 'toward', 'towards'
]);

const SUBORDINATING_CONJ = new Set([
  'although', 'though', 'even', 'because', 'while', 'whereas', 'unless',
  'if', 'whether', 'once', 'whenever', 'wherever', 'provided', 'providing'
]);

const DETERMINERS = new Set([
  'a', 'an', 'the', 'this', 'that', 'these', 'those', 'my', 'your', 'his',
  'her', 'its', 'our', 'their', 'each', 'every', 'any', 'some', 'no', 'all', 'both'
]);

const WH_RELATIVES = new Set([
  'who', 'whom', 'whose', 'which', 'what', 'where', 'when', 'why', 'how'
]);

/**
 * Classifies a short anchor phrase or grammatical role into an uppercase badge label
 * (e.g. LINKING VERB, ADVERB, ADJECTIVE, NOUN PHRASE, PREPOSITION, TO-INFINITIVE, SUBJECT)
 * matching the Super X-Ray visual style.
 */
function classifyRoleBadge(phrase, roleHint = '', side = 'target') {
  const r = String(roleHint || '').toLowerCase();
  if (side === 'target' && r) {
    if (r.includes('adverb') || r.includes('trạng từ')) return 'ADVERB';
    if (r.includes('adjective') || r.includes('tính từ')) return 'ADJECTIVE';
    if (r.includes('to-infinitive') || r.includes('to-v') || r.includes('nguyên mẫu có to')) return 'TO-INFINITIVE';
    if (r.includes('gerund') || r.includes('present participle') || r.includes('v-ing')) return 'V-ING / GERUND';
    if (r.includes('passive') || r.includes('bị động')) return 'PASSIVE VERB';
    if (r.includes('past participle') || r.includes('v3') || r.includes('v-ed')) return 'PAST PARTICIPLE';
    if (r.includes('pronoun') || r.includes('đại từ')) return 'PRONOUN';
    if (r.includes('preposition') || r.includes('giới từ')) return 'PREPOSITION';
    if (r.includes('conjunction') || r.includes('liên từ')) return 'CONJUNCTION';
    if (r.includes('quantifier') || r.includes('lượng từ')) return 'QUANTIFIER';
    if (r.includes('noun') || r.includes('danh từ')) return 'NOUN';
    if (r.includes('verb') || r.includes('động từ')) return 'VERB';
    return shortenPosRole(roleHint).toUpperCase().slice(0, 18);
  }

  const words = String(phrase || '')
    .trim()
    .split(/\s+/)
    .map(w => w.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '').toLowerCase())
    .filter(Boolean);

  if (words.length === 0) return side === 'left' ? 'LEFT CLUE' : 'RIGHT CLUE';
  const first = words[0];
  const last = words[words.length - 1];

  if (words.some(w => WH_RELATIVES.has(w))) return 'WH-CLAUSE';
  if (words.length === 1 && LINKING_VERBS.has(first)) return 'LINKING VERB';
  if (LINKING_VERBS.has(last)) return 'LINKING VERB';
  if (MODAL_AUX.has(last)) return 'AUX / MODAL';
  if (PREPOSITIONS.has(first) || PREPOSITIONS.has(last)) return 'PREPOSITION';
  if (SUBORDINATING_CONJ.has(first)) return 'CONJUNCTION';
  if (DETERMINERS.has(last)) return 'DETERMINER';
  if (last.endsWith('ly') && last.length > 4) return 'ADVERB';
  if (/(able|ible|ous|ive|al|ic|ful|less|ent|ant)$/.test(last)) return 'ADJECTIVE';
  if (/(tion|sion|ment|ness|ity|ance|ence|ship|er|or|ist)$/.test(last)) return 'NOUN';
  if (/(ed|ing)$/.test(last)) return 'VERB / PARTICIPLE';
  return side === 'left' ? 'KEY ANCHOR' : 'FOLLOW-UP';
}

/**
 * Groups interactiveTokens into visual segments so that:
 * - A leading subject noun phrase before the left anchor gets a blue [SUBJECT] pill
 * - Contiguous left-anchor tokens are grouped under one amber [ROLE] pill
 * - The blank slot is a glowing green box with an emerald [ROLE] pill above it
 * - Contiguous right-anchor tokens are grouped under one blue [ROLE] pill
 */
function buildXRayVisualSegments(interactiveTokens, xray, question) {
  const segments = [];
  const blankIdx = interactiveTokens.findIndex(t => t.isBlank);
  const firstLeftIdx = interactiveTokens.findIndex(t => t.anchorSide === 'left');

  // Identify optional leading Subject phrase (1..5 tokens right before left-anchor)
  let subjStart = -1;
  let subjEnd = -1;
  if (firstLeftIdx > 0 && firstLeftIdx <= 6) {
    const preTokens = interactiveTokens.slice(0, firstLeftIdx);
    const hasComma = preTokens.some(t => t.raw.includes(','));
    if (!hasComma) {
      subjStart = 0;
      subjEnd = firstLeftIdx - 1;
    }
  }

  let i = 0;
  while (i < interactiveTokens.length) {
    const tok = interactiveTokens[i];

    if (i === subjStart && subjEnd >= subjStart) {
      const group = interactiveTokens.slice(subjStart, subjEnd + 1);
      segments.push({
        type: 'subject-group',
        id: `seg_subj_${i}`,
        badge: 'SUBJECT',
        tokens: group
      });
      i = subjEnd + 1;
      continue;
    }

    if (tok.isBlank) {
      const correctWord = question.options?.[question.correct_answer] || '';
      segments.push({
        type: 'blank-slot',
        id: `seg_blank_${i}`,
        badge: classifyRoleBadge(correctWord, xray?.required_grammatical_role, 'target'),
        word: correctWord,
        token: tok
      });
      i++;
      continue;
    }

    if (tok.anchorSide === 'left' || tok.anchorSide === 'right') {
      const side = tok.anchorSide;
      const group = [tok];
      let j = i + 1;
      while (j < interactiveTokens.length && interactiveTokens[j].anchorSide === side) {
        group.push(interactiveTokens[j]);
        j++;
      }
      const phraseText = group.map(g => g.raw).join(' ');
      segments.push({
        type: side === 'left' ? 'left-anchor-group' : 'right-anchor-group',
        id: `seg_${side}_${i}`,
        side,
        badge: classifyRoleBadge(phraseText, '', side),
        tokens: group
      });
      i = j;
      continue;
    }

    segments.push({
      type: 'plain-token',
      id: `seg_tok_${i}`,
      token: tok
    });
    i++;
  }

  return segments;
}

function cleanTokenWord(word) {
  return String(word || '')
    .replace(/^[^a-zA-Z0-9$€£¥%]+|[^a-zA-Z0-9$€£¥%]+$/g, '')
    .toLowerCase();
}

/**
 * Generates an explicit, learner-friendly causal explanation of WHY the highlighted
 * words before/after the blank force the required grammatical role and correct answer.
 */
function buildCausalAnchorBridge(question, xray, aiAnalysis) {
  const left = (xray?.left_anchor_words || '').trim();
  const right = (xray?.right_anchor_words || '').trim();
  const role = xray?.required_grammatical_role || 'Từ loại phù hợp';
  const roleVi = shortenPosRole(role);
  const corrKey = question.correct_answer || 'A';
  const corrWord = question.options?.[corrKey] || '';
  const formula = aiAnalysis?.micro_rule_formula_vi || '';
  const topicId = question.primary_grammar_topic_id || '';

  let leftReason = left
    ? `Dấu hiệu đứng trước "${left}" mở cấu trúc ngữ pháp đòi hỏi vị trí tiếp theo phải là ${role}`
    : `Vị trí đứng đầu mệnh đề cần ${role}`;
  let rightReason = right
    ? `kết hợp với cụm phía sau "${right}" để hoàn chỉnh nghĩa và cấu trúc`
    : `để kết thúc trọn vẹn cấu trúc câu`;

  if (/\b(which|what|where|how|when|whether)\b/i.test(left) && /To-Infinitive/i.test(role)) {
    leftReason = `Cấu trúc Từ để hỏi "${left}" (WH-word + Danh từ) bắt buộc theo sau bởi Động từ nguyên mẫu có "to" (To-V: "${corrWord}") làm tân ngữ rút gọn`;
    rightReason = right ? `bổ nghĩa mục đích/đối tượng "${right}"` : `hoàn chỉnh tân ngữ`;
  } else if (topicId === 'GRM_POS_NOUN') {
    leftReason = left
      ? `Phía trước có "${left}" (mạo từ / tính từ / sở hữu cách / giới từ) nên vị trí ngay sau bắt buộc phải là Danh từ chính`
      : `Đầu câu trước động từ/giới từ cần một Danh từ làm chủ ngữ`;
    rightReason = right
      ? `đứng trước "${right}" (giới từ / động từ chia thì) để đóng cụm danh từ`
      : `làm danh từ trung tâm (Head Noun) ở cuối câu`;
  } else if (topicId === 'GRM_POS_ADJ') {
    leftReason = left
      ? `Phía trước có "${left}" (động từ nối / mạo từ / trạng từ) đòi hỏi một Tính từ đi kèm`
      : `Vị trí này cần một Tính từ bổ nghĩa`;
    rightReason = right
      ? `để bổ nghĩa trực tiếp cho danh từ hoặc giới từ theo sau "${right}"`
      : `làm bổ ngữ tính từ hoàn chỉnh câu`;
  } else if (topicId === 'GRM_POS_ADV') {
    leftReason = left
      ? `Cấu trúc "${left}" đã đủ thành phần chính nên cần một Trạng từ (-ly)`
      : `Đầu câu trước dấu phẩy cần một Trạng từ bổ nghĩa cho cả mệnh đề`;
    rightReason = right
      ? `để bổ nghĩa trực tiếp cho động từ / tính từ / phân từ "${right}"`
      : `để bổ nghĩa cách thức/mức độ cho động từ phía trước`;
  } else if (topicId === 'GRM_VERB_PASSIVE') {
    leftReason = left
      ? `Chủ ngữ/trợ động từ "${left}" mang nghĩa chịu tác động nên cần Động từ ở thể Bị động (be + V3/ed)`
      : `Cấu trúc câu yêu cầu Động từ thể Bị động (be + V3/ed)`;
    rightReason = right
      ? `vì phía sau là giới từ / tác nhân "${right}" (không có tân ngữ trực tiếp)`
      : `vì phía sau không có tân ngữ trực tiếp`;
  } else if (topicId === 'GRM_VERB_INFINITIVE_GERUND') {
    leftReason = left
      ? `Từ khóa phía trước "${left}" quy định trực tiếp dạng thức của động từ theo sau (${roleVi})`
      : `Đầu câu làm chủ ngữ hoặc chỉ mục đích cần ${roleVi}`;
    rightReason = right
      ? `kết nối với tân ngữ/giới từ "${right}" phía sau`
      : `theo đúng công thức động từ đi kèm`;
  } else if (topicId === 'GRM_CONN_CORRELATIVE_COORD') {
    leftReason = left
      ? `Từ khóa "${left}" phía trước`
      : `Vị trí mở đầu cấu trúc song song`;
    rightReason = right
      ? `bắt cặp cố định với từ khóa "${right}" phía sau để tạo cặp liên từ tương quan (${corrWord})`
      : `tạo cấu trúc liên từ song song`;
  } else if (topicId === 'GRM_CONN_PREP_VS_CONJ') {
    rightReason = right
      ? `Phía sau chỗ trống là "${right}" — dựa vào việc cụm này là Mệnh đề (có S + V) hay Cụm danh từ để quyết định chọn Liên từ hay Giới từ "${corrWord}"`
      : `Phụ thuộc vào cấu trúc Mệnh đề hay Cụm danh từ đi kèm`;
  }

  const oneLineCausalVi = `${leftReason}, ${rightReason} ➔ Chọn (${corrKey}) "${corrWord}".`;

  return {
    left,
    right,
    role,
    roleVi,
    corrKey,
    corrWord,
    formula,
    leftReason,
    rightReason,
    oneLineCausalVi
  };
}

/**
 * MX1.2: Extract leading [Memo: ...] / [Doc 1 ... / Doc 2 ...] / [Part 3 Transcript: ...]
 * into a separate Context Document / Transcript Card so the main question stem stays clean.
 */
function parseContextAndStem(rawSentence) {
  const text = String(rawSentence || '').trim();
  const match = text.match(/^\[([^\]]+)\]\s*(.+)$/s);
  if (!match) {
    return { contextHeader: null, contextBody: null, mainStem: text };
  }
  const bracketContent = match[1].trim();
  const remainder = match[2].trim();
  const colonIdx = bracketContent.indexOf(':');
  if (colonIdx > 0 && colonIdx < 42) {
    return {
      contextHeader: bracketContent.slice(0, colonIdx).trim(),
      contextBody: bracketContent.slice(colonIdx + 1).trim(),
      mainStem: remainder
    };
  }
  return {
    contextHeader: 'Ngữ cảnh / Đoạn trích',
    contextBody: bracketContent,
    mainStem: remainder
  };
}

/**
 * MX1.1: Contiguous Phrase-Window Anchor Matcher around the blank token.
 * Prevents short function words ('a', 'in', 'to', 'the') far from the blank from being falsely highlighted.
 */
function findAnchorTokenIndices(tokenObjs, anchorPhrase, blankIndex, direction) {
  const matched = new Set();
  if (!anchorPhrase) return matched;

  const anchorWords = String(anchorPhrase)
    .trim()
    .split(/\s+/)
    .map(cleanTokenWord)
    .filter(Boolean);

  if (anchorWords.length === 0) return matched;

  const startBound = direction === 'left' ? 0 : Math.max(0, blankIndex + 1);
  const endBound =
    direction === 'left'
      ? blankIndex >= 0
        ? blankIndex - 1
        : tokenObjs.length - 1
      : tokenObjs.length - 1;

  if (endBound < startBound) return matched;

  // Search for contiguous window matching anchorWords (preferring closest to blankIndex)
  const candidates = [];
  for (let i = startBound; i <= endBound - anchorWords.length + 1; i++) {
    let ok = true;
    for (let j = 0; j < anchorWords.length; j++) {
      if (tokenObjs[i + j].norm !== anchorWords[j]) {
        ok = false;
        break;
      }
    }
    if (ok) {
      candidates.push(i);
    }
  }

  if (candidates.length > 0) {
    const chosenStart =
      direction === 'left' ? candidates[candidates.length - 1] : candidates[0];
    for (let j = 0; j < anchorWords.length; j++) {
      matched.add(chosenStart + j);
    }
    return matched;
  }

  // Fallback: match individual words closest to blank within a 6-token radius
  const windowStart =
    direction === 'left' ? Math.max(0, endBound - 6) : startBound;
  const windowEnd =
    direction === 'left' ? endBound : Math.min(endBound, startBound + 6);
  const anchorSet = new Set(anchorWords.filter(w => w.length > 1));
  for (let i = windowStart; i <= windowEnd; i++) {
    if (anchorSet.has(tokenObjs[i].norm)) {
      matched.add(i);
    }
  }
  return matched;
}

export default function SentenceXRayCard({
  question,
  examMode = 'practice', // 'practice' | 'exam'
  initialSelectedOption = null,
  forceReview = false,
  onAnswerSubmit,
  onSaveToSrs,
  onOpenAiTutor,
  onNextQuestion
}) {
  if (!question) return null;

  const [state, setState] = useState(
    forceReview || (examMode === 'practice' && initialSelectedOption)
      ? XRAY_STATES.SUBMITTED
      : XRAY_STATES.SOLVING
  );
  const [activeTab, setActiveTab] = useState('breakdown'); // 'breakdown' | 'formula' | 'twin'
  const [selectedOption, setSelectedOption] = useState(initialSelectedOption || null);
  const [inspectedOption, setInspectedOption] = useState(initialSelectedOption || null);
  const [eliminatedOptions, setEliminatedOptions] = useState({});
  const [timeSpentSec, setTimeSpentSec] = useState(0);
  const [usedHint, setUsedHint] = useState(false);
  const [selectedToken, setSelectedToken] = useState(null);
  const [twinQuestions, setTwinQuestions] = useState([]);
  const [activeTwinIdx, setActiveTwinIdx] = useState(0);
  const [twinAnswersByIdx, setTwinAnswersByIdx] = useState({});
  const [isLoadingTwin, setIsLoadingTwin] = useState(false);
  const [srsSavedWords, setSrsSavedWords] = useState({});
  const [sentenceTranslationVi, setSentenceTranslationVi] = useState(
    question.translation_vi || question.ai_analysis?.sentence_translation_vi || ''
  );
  const [isLoadingTranslation, setIsLoadingTranslation] = useState(false);

  const aiAnalysis = question.ai_analysis || {};
  const xray = aiAnalysis.sentence_xray || null;
  const recommendedTime = question.recommended_time_sec || 12;

  // Reset / sync state when question or review mode changes
  useEffect(() => {
    setSelectedOption(initialSelectedOption || null);
    setInspectedOption(initialSelectedOption || null);
    setEliminatedOptions({});
    if (forceReview || (examMode === 'practice' && initialSelectedOption)) {
      setState(XRAY_STATES.SUBMITTED);
    } else {
      setState(XRAY_STATES.SOLVING);
    }
    setActiveTab('breakdown');
    setTimeSpentSec(0);
    setUsedHint(false);
    setSelectedToken(null);
    setTwinQuestions([]);
    setActiveTwinIdx(0);
    setTwinAnswersByIdx({});
    setIsLoadingTwin(false);
    setSentenceTranslationVi(
      question.translation_vi || question.ai_analysis?.sentence_translation_vi || ''
    );
    setIsLoadingTranslation(false);
  }, [question.id, forceReview, examMode]);

  // Keep selectedOption synced when initialSelectedOption updates externally
  useEffect(() => {
    if (initialSelectedOption !== undefined) {
      setSelectedOption(initialSelectedOption || null);
      setInspectedOption(initialSelectedOption || null);
    }
  }, [initialSelectedOption]);

  // Pacing Timer in SOLVING state
  useEffect(() => {
    if (forceReview || (state !== XRAY_STATES.SOLVING && state !== XRAY_STATES.HINT_ACTIVE)) return;
    const interval = setInterval(() => {
      setTimeSpentSec(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [state, forceReview]);

  // Handle Option Selection
  const handleSelectOption = useCallback((optionKey) => {
    if (forceReview) {
      setInspectedOption(optionKey);
      return;
    }
    if (examMode === 'practice' && state !== XRAY_STATES.SOLVING && state !== XRAY_STATES.HINT_ACTIVE) {
      setInspectedOption(optionKey);
      return;
    }

    setSelectedOption(optionKey);
    setInspectedOption(optionKey);
    if (examMode === 'practice') {
      setState(XRAY_STATES.SUBMITTED);
    }

    const isCorrect = optionKey === question.correct_answer;
    if (onAnswerSubmit) {
      onAnswerSubmit({
        questionId: question.id,
        selectedOption: optionKey,
        isCorrect,
        timeSpentSec,
        usedHint
      });
    }
  }, [forceReview, examMode, state, question, timeSpentSec, usedHint, onAnswerSubmit]);

  // Toggle strike-through elimination before submitting (MX3.1)
  const handleToggleEliminate = useCallback((e, optKey) => {
    e.stopPropagation();
    setEliminatedOptions(prev => ({ ...prev, [optKey]: !prev[optKey] }));
  }, []);

  // Trigger Hint
  const handleToggleHint = useCallback(() => {
    if (state === XRAY_STATES.SOLVING) {
      setUsedHint(true);
      setState(XRAY_STATES.HINT_ACTIVE);
    }
  }, [state]);

  // Trigger Twin Remediation (MX4.1: Load all 1..3 twin questions)
  const handleOpenTwinRemediation = async () => {
    setActiveTab('twin');
    if (twinQuestions.length === 0 && !isLoadingTwin) {
      setIsLoadingTwin(true);
      try {
        const res = await fetch('/api/toeic/practice/check-answer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questionId: question.id, selectedOption: selectedOption || question.correct_answer || 'A' })
        });
        const data = await res.json();
        if (Array.isArray(data.twinQuestions) && data.twinQuestions.length > 0) {
          setTwinQuestions(data.twinQuestions);
          setActiveTwinIdx(0);
        }
      } catch (e) {
        console.error('Failed to load twin questions:', e);
      } finally {
        setIsLoadingTwin(false);
      }
    }
  };

  // Keyboard Shortcuts (1-4 / A-D / H / Enter for Next)
  useEffect(() => {
    function handleKeyDown(e) {
      const key = e.key.toUpperCase();
      if (state === XRAY_STATES.SOLVING || state === XRAY_STATES.HINT_ACTIVE) {
        if (key === '1' || key === 'A') handleSelectOption('A');
        else if (key === '2' || key === 'B') handleSelectOption('B');
        else if (key === '3' || key === 'C') handleSelectOption('C');
        else if (key === '4' || key === 'D') handleSelectOption('D');
        else if (key === 'H') handleToggleHint();
      } else if (onNextQuestion && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight')) {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          onNextQuestion();
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state, handleSelectOption, handleToggleHint, onNextQuestion]);

  // Pacing Ratio
  const pacingRatio = timeSpentSec / recommendedTime;
  let pacingColor = 'var(--ds-success)';
  if (pacingRatio > 1.0) pacingColor = 'var(--ds-warning)';
  else if (pacingRatio > 0.7) pacingColor = 'var(--ds-accent)';

  const isSubmitted = forceReview || (state !== XRAY_STATES.SOLVING && state !== XRAY_STATES.HINT_ACTIVE);
  const isCorrect = selectedOption === question.correct_answer;
  const activeInspectKey = inspectedOption || selectedOption || question.correct_answer;
  const inspectedFeedback = activeInspectKey && aiAnalysis.option_deep_analysis?.[activeInspectKey];
  const distractorWhyVi = activeInspectKey && aiAnalysis.distractor_analysis?.[activeInspectKey];
  const explanationTextVi = question.explanation_vi || aiAnalysis.explanation_vi || '';
  const keyClueText = question.key_clue || aiAnalysis.key_clue || '';
  const causalBridge = useMemo(
    () => buildCausalAnchorBridge(question, xray, aiAnalysis),
    [question, xray, aiAnalysis]
  );

  // MX1.2: Parse optional [Context / Transcript / Doc 1 & 2] prefix from sentence
  const parsedPrompt = useMemo(() => {
    const raw = question.context_sentence || question.stem || '';
    return parseContextAndStem(raw);
  }, [question]);

  // Fetch full Vietnamese translation of the completed sentence upon submission
  useEffect(() => {
    if (!isSubmitted) return;
    if (sentenceTranslationVi) return;

    const correctWord = question.options?.[question.correct_answer] || '';
    const rawBase = question.context_sentence || question.stem || '';
    const fullEnglishSentence = rawBase
      .replace(/-------|_____/g, correctWord)
      .replace(/^\[([^\]]+)\]\s*/, '$1 — ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!fullEnglishSentence) return;

    let cancelled = false;
    setIsLoadingTranslation(true);
    fetch(`/api/translate-sentence?text=${encodeURIComponent(fullEnglishSentence)}`)
      .then(res => res.json())
      .then(data => {
        if (!cancelled && data?.translationVi) {
          setSentenceTranslationVi(data.translationVi);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setIsLoadingTranslation(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isSubmitted, question, sentenceTranslationVi]);

  // MX1.1: Tokenize sentence with Contiguous Phrase-Window Anchor Matching
  const interactiveTokens = useMemo(() => {
    const raw = parsedPrompt.mainStem || question.context_sentence || question.stem || '';
    const words = raw.split(/\s+/).filter(Boolean);
    const baseTokens = words.map((w, idx) => {
      const cleanWord = w.replace(/^[.,/#!$%^&*;:{}=\-_`~()'"]+|[.,/#!$%^&*;:{}=\-_`~()'"]+$/g, '');
      const isBlank = w.includes('-------') || w.includes('_____');
      return {
        id: idx,
        raw: w,
        clean: cleanWord,
        norm: cleanTokenWord(w),
        isBlank
      };
    });

    const blankIdx = baseTokens.findIndex(t => t.isBlank);
    const leftAnchorIndices = findAnchorTokenIndices(
      baseTokens,
      xray?.left_anchor_words,
      blankIdx,
      'left'
    );
    const rightAnchorIndices = findAnchorTokenIndices(
      baseTokens,
      xray?.right_anchor_words,
      blankIdx,
      'right'
    );

    return baseTokens.map((tok, idx) => {
      const linked = aiAnalysis.linked_vocabulary?.find(
        v => v.word.toLowerCase() === tok.clean.toLowerCase()
      );
      const isLeftAnchor = leftAnchorIndices.has(idx);
      const isRightAnchor = rightAnchorIndices.has(idx);
      const isAnchor = isLeftAnchor || isRightAnchor;

      return {
        ...tok,
        isAnchor,
        anchorSide: isLeftAnchor ? 'left' : isRightAnchor ? 'right' : null,
        pos: linked?.pos || (tok.isBlank ? xray?.required_grammatical_role : null),
        meaning: linked?.meaning_vi || null,
        linkedData: linked
      };
    });
  }, [parsedPrompt, question, aiAnalysis, xray]);

  // Render Context Card + Prompt Sentence
  const renderPromptSentence = () => {
    const contextCard = parsedPrompt.contextBody ? (
      <div className="toeic-xray-context-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--ds-accent)' }}>
            <KitIcon name="books" size={13} />
            <span>{parsedPrompt.contextHeader}</span>
          </span>
          {isSubmitted && xray?.left_anchor_words && parsedPrompt.contextBody.includes(xray.left_anchor_words) && (
            <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.12rem 0.45rem', borderRadius: '999px', backgroundColor: 'var(--ds-warning-bg)', color: 'var(--ds-warning)', border: '1px solid var(--ds-warning-border)' }}>
              Bằng chứng: &ldquo;{xray.left_anchor_words}&rdquo;
            </span>
          )}
        </div>
        <div style={{ color: 'var(--ds-text)', fontWeight: 500 }}>
          {parsedPrompt.contextBody}
        </div>
      </div>
    ) : null;

    if (!isSubmitted) {
      const rawSentence = parsedPrompt.mainStem || question.context_sentence || question.stem || '';
      if (!rawSentence.includes('-------') && !rawSentence.includes('_____')) {
        return (
          <>
            {contextCard}
            <span>{rawSentence}</span>
          </>
        );
      }
      const parts = rawSentence.split(/-------|_____/);
      return (
        <>
          {contextCard}
          <span style={{ lineHeight: 1.65 }}>
            {parts[0]}
            {state === XRAY_STATES.HINT_ACTIVE && xray ? (
              <span
                style={{
                  display: 'inline-block',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '0.35rem',
                  border: '1.5px dashed var(--ds-accent)',
                  backgroundColor: 'var(--ds-accent-bg)',
                  color: 'var(--ds-accent)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  margin: '0 0.35rem'
                }}
              >
                [ Cần: {xray.required_grammatical_role || '?'} ]
              </span>
            ) : (
              <span
                style={{
                  display: 'inline-block',
                  padding: '0.15rem 0.75rem',
                  borderRadius: '0.35rem',
                  border: '1px solid var(--ds-border)',
                  backgroundColor: 'var(--ds-bg-elevated)',
                  color: 'var(--ds-text-muted)',
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  fontSize: '0.85rem',
                  margin: '0 0.35rem'
                }}
              >
                [ &nbsp; ? &nbsp; ]
              </span>
            )}
            {parts[1]}
          </span>
        </>
      );
    }

    // When submitted: Super X-Ray Annotated Sentence + Breakdown Box (exact mockup layout)
    const visualSegments = buildXRayVisualSegments(interactiveTokens, xray, question);
    const leftBadgeLabel = classifyRoleBadge(xray?.left_anchor_words, '', 'left');
    const targetBadgeLabel = classifyRoleBadge(
      question.options?.[question.correct_answer],
      xray?.required_grammatical_role,
      'target'
    );
    const rightBadgeLabel = classifyRoleBadge(xray?.right_anchor_words, '', 'right');
    const shortFormulaChain = [
      xray?.left_anchor_words ? leftBadgeLabel : null,
      targetBadgeLabel,
      xray?.right_anchor_words ? rightBadgeLabel : null
    ]
      .filter(Boolean)
      .join(' + ');
    const anchorPairDisplay = [xray?.left_anchor_words, xray?.right_anchor_words]
      .filter(Boolean)
      .join(' ... ');
    const correctWord = question.options?.[question.correct_answer] || '';

    return (
      <>
        {contextCard}

        {/* 1. SUPER X-RAY ANNOTATED SENTENCE (Floating Role Badges above key chunks + Glowing Target Box) */}
        <div className="toeic-super-xray-sentence">
          {visualSegments.map(seg => {
            if (seg.type === 'blank-slot') {
              return (
                <span key={seg.id} className="toeic-super-xray-chunk is-target">
                  <span className="toeic-super-role-pill pill-emerald">
                    {seg.badge}
                  </span>
                  <span className="toeic-super-target-box">
                    {seg.word}
                  </span>
                </span>
              );
            }

            if (
              seg.type === 'subject-group' ||
              seg.type === 'left-anchor-group' ||
              seg.type === 'right-anchor-group'
            ) {
              const pillClass =
                seg.type === 'left-anchor-group' ? 'pill-amber' : 'pill-blue';
              return (
                <span
                  key={seg.id}
                  className={`toeic-super-xray-chunk ${
                    seg.type === 'left-anchor-group'
                      ? 'is-left-anchor'
                      : seg.type === 'right-anchor-group'
                        ? 'is-right-anchor'
                        : 'is-subject'
                  }`}
                >
                  <span className={`toeic-super-role-pill ${pillClass}`}>
                    {seg.badge}
                  </span>
                  <span className="toeic-super-chunk-words">
                    {seg.tokens.map(tok => {
                      const isSelected = selectedToken?.id === tok.id;
                      return (
                        <span
                          key={tok.id}
                          onClick={() => setSelectedToken(isSelected ? null : tok)}
                          className={`toeic-pos-token ${isSelected ? 'active' : ''}`}
                        >
                          <span style={{ fontWeight: 800 }}>{tok.raw}</span>
                        </span>
                      );
                    })}
                  </span>
                </span>
              );
            }

            const tok = seg.token;
            const isSelected = selectedToken?.id === tok.id;
            return (
              <span
                key={seg.id}
                onClick={() => setSelectedToken(isSelected ? null : tok)}
                className={`toeic-pos-token ${isSelected ? 'active' : ''}`}
              >
                <span style={{ fontWeight: 600 }}>{tok.raw}</span>
                {tok.pos && <span className="toeic-pos-tag">{tok.pos}</span>}
              </span>
            );
          })}
        </div>

        {/* 2. "SIÊU QUANG PHỔ X-RAY BÓC TÁCH:" BOX (Directly under sentence, before options) */}
        <div className="toeic-super-xray-box">
          <div className="toeic-super-xray-box-title">
            <span style={{ color: 'var(--ds-warning)', fontSize: '0.9rem' }}>⚡</span>
            <span>SIÊU QUANG PHỔ X-RAY BÓC TÁCH:</span>
          </div>

          {(sentenceTranslationVi || isLoadingTranslation) && (
            <div className="toeic-super-xray-trans-quote">
              <span>📖 <strong>Dịch nghĩa:</strong> {sentenceTranslationVi || 'Đang dịch nghĩa câu...'}</span>
            </div>
          )}

          <div className="toeic-super-xray-formula-line">
            {shortFormulaChain}
          </div>

          <div className="toeic-super-xray-pivot-text">
            <span style={{ color: 'var(--ds-success)', fontWeight: 800 }}>&rarr; Điểm tựa:</span>{' '}
            {anchorPairDisplay ? (
              <>
                Cụm <strong>&lsquo;{anchorPairDisplay}&rsquo;</strong> yêu cầu áp dụng quy tắc{' '}
                <strong>&lsquo;{shortFormulaChain}&rsquo;</strong> ({shortenPosRole(xray?.required_grammatical_role)}). Do đó lựa chọn{' '}
                <strong>&lsquo;{question.correct_answer}&rsquo; ({correctWord})</strong> là phương án chuẩn xác duy nhất.
              </>
            ) : (
              causalBridge.oneLineCausalVi
            )}
          </div>
        </div>
      </>
    );
  };

  const currentTwin = twinQuestions[activeTwinIdx] || null;
  const currentTwinAnswer = currentTwin ? twinAnswersByIdx[activeTwinIdx] || null : null;

  return (
    <div className="toeic-card toeic-xray-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
      {/* 1. TOP HEADER & PACING TIMER */}
      <div className="toeic-flex-between toeic-xray-card-header" style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--ds-border)', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <ToeicBadge variant="muted">
            Part {question.part} • #{question.number || 101}
          </ToeicBadge>
          <span className="ge-hide-mobile" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <ToeicBadge variant="primary">
              {aiAnalysis.primary_topic_name_vi || question.primary_grammar_topic_id}
            </ToeicBadge>
            <span style={{ fontSize: '0.75rem', color: 'var(--ds-text-muted)', fontWeight: 600 }}>
              Band {question.target_score_band || 500}+
            </span>
          </span>
        </div>

        {/* Pacing Timer & Quick Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.25rem 0.55rem',
              borderRadius: '9999px',
              border: `1px solid ${pacingColor}`,
              color: pacingColor,
              fontSize: '0.74rem',
              fontWeight: 700,
              whiteSpace: 'nowrap'
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
              <KitIcon name="timer" size={13} />
              <span>{timeSpentSec}s</span>
            </span>
            <span className="ge-hide-mobile" style={{ fontSize: '0.65rem', color: 'var(--ds-text-muted)' }}>
              /{recommendedTime}s
            </span>
          </div>

          {!isSubmitted && (
            <button
              type="button"
              onClick={handleToggleHint}
              disabled={state === XRAY_STATES.HINT_ACTIVE}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.28rem 0.6rem',
                borderRadius: '0.5rem',
                border: '1px solid var(--ds-border)',
                backgroundColor: state === XRAY_STATES.HINT_ACTIVE ? 'var(--ds-accent-bg)' : 'transparent',
                color: 'var(--ds-accent)',
                fontSize: '0.74rem',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              <KitIcon name="bulb" size={13} />
              <span>Gợi ý<span className="ge-hide-mobile"> X-Ray (H)</span></span>
            </button>
          )}

          {onOpenAiTutor && (
            <button
              type="button"
              onClick={() => onOpenAiTutor(question, selectedOption)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.28rem 0.6rem',
                borderRadius: '0.5rem',
                border: '1px solid var(--ds-border)',
                backgroundColor: 'var(--ds-bg-elevated)',
                color: 'var(--ds-text)',
                fontSize: '0.74rem',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              <KitIcon name="bot" size={13} color="var(--ds-accent)" />
              <span>AI<span className="ge-hide-mobile"> Gia Sư</span></span>
            </button>
          )}
        </div>
      </div>

      {/* 2. HINT BANNER (When Hint Active) */}
      {state === XRAY_STATES.HINT_ACTIVE && xray && (
        <div className="toeic-formula-box trap" style={{ margin: '0 0 1.25rem 0' }}>
          <div className="toeic-formula-title" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <KitIcon name="search" size={14} />
            <span>GỢI Ý QUANG PHỔ CÂU (SENTENCE X-RAY):</span>
          </div>
          <div style={{ fontSize: '0.85rem', lineHeight: 1.5 }}>
            <div>
              Neo trước: <strong>{xray.left_anchor_words || 'N/A'}</strong> • Neo sau: <strong>{xray.right_anchor_words || 'N/A'}</strong>
            </div>
            <div>
              Vị trí ô trống cần: <strong style={{ color: 'var(--ds-accent)' }}>{xray.required_grammatical_role}</strong>
            </div>
          </div>
        </div>
      )}

      {/* 3. PROMPT SENTENCE & CONTEXT CARD */}
      <div className="toeic-xray-prompt-wrap" style={{ margin: '0.75rem 0 1.25rem 0', fontWeight: 500 }}>
        {renderPromptSentence()}
      </div>

      {/* 4. INTERACTIVE TOKEN DETAILS POPOVER (AC-U4.2) */}
      {selectedToken && (
        <div className="toeic-pos-popover" style={{ marginBottom: '1.25rem' }}>
          <div className="toeic-flex-between" style={{ marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--ds-text)' }}>
                {selectedToken.clean}
              </span>
              {selectedToken.pos && (
                <ToeicBadge variant="primary">{selectedToken.pos}</ToeicBadge>
              )}
              {selectedToken.anchorSide === 'left' && (
                <ToeicBadge variant="warning">Neo Trái (Left Anchor)</ToeicBadge>
              )}
              {selectedToken.anchorSide === 'right' && (
                <ToeicBadge variant="primary">Neo Phải (Right Anchor)</ToeicBadge>
              )}
            </div>
            <button
              type="button"
              onClick={() => setSelectedToken(null)}
              style={{ background: 'none', border: 'none', color: 'var(--ds-text-muted)', cursor: 'pointer', fontSize: '1rem' }}
            >
              ✕
            </button>
          </div>

          <div style={{ fontSize: '0.85rem', color: 'var(--ds-text-secondary)', lineHeight: 1.5 }}>
            <div>
              <strong>Vai trò trong câu:</strong>{' '}
              {selectedToken.anchorSide
                ? `Từ khóa neo (${selectedToken.anchorSide === 'left' ? 'phía trước' : 'phía sau'} chỗ trống) quyết định trực tiếp việc chọn "${question.options?.[question.correct_answer]}"`
                : selectedToken.pos
                  ? `Bổ nghĩa / Thành phần ${selectedToken.pos}`
                  : 'Thành phần ngữ pháp trong mệnh đề'}
            </div>
            {selectedToken.meaning && (
              <div>
                <strong>Nghĩa ngữ cảnh:</strong> {selectedToken.meaning}
              </div>
            )}
          </div>

          {selectedToken.linkedData && (
            <div style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid var(--ds-border-subtle)' }}>
              <button
                type="button"
                onClick={() => {
                  setSrsSavedWords(prev => ({ ...prev, [selectedToken.clean]: true }));
                  if (onSaveToSrs) onSaveToSrs({ type: 'VOCABULARY', word: selectedToken.clean, data: selectedToken.linkedData });
                }}
                disabled={!!srsSavedWords[selectedToken.clean]}
                className="toeic-btn toeic-btn-sm toeic-btn-outline"
              >
                {srsSavedWords[selectedToken.clean] ? '✓ Đã lưu vào Sổ tay SRS' : '+ Lưu từ này vào Sổ tay SRS'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* 5. 4 OPTIONS (A, B, C, D) WITH STRIKE-THROUGH & POST-SUBMISSION INSPECTOR (MX3) */}
      <div className="toeic-grid-2 toeic-xray-options-grid" style={{ gap: '0.75rem', marginBottom: '1.25rem' }}>
        {(['A', 'B', 'C', 'D']).map(optKey => {
          const optText = question.options?.[optKey];
          if (!optText) return null;

          const isSelected = selectedOption === optKey;
          const isInspected = isSubmitted && activeInspectKey === optKey;
          const isEliminated = !isSubmitted && !!eliminatedOptions[optKey];
          const isCorrectAnswer = optKey === question.correct_answer;
          const optAnalysis = aiAnalysis.option_deep_analysis?.[optKey];

          let btnBg = 'var(--ds-card)';
          let btnBorder = 'var(--ds-border)';
          let badgeBg = 'var(--ds-bg-elevated)';
          let badgeColor = 'var(--ds-text)';

          if (isSubmitted) {
            if (isCorrectAnswer) {
              btnBg = 'var(--ds-success-bg)';
              btnBorder = 'var(--ds-success)';
              badgeBg = 'var(--ds-success)';
              badgeColor = 'var(--ds-text-on-accent)';
            } else if (isSelected && !isCorrectAnswer) {
              btnBg = 'var(--ds-danger-bg)';
              btnBorder = 'var(--ds-danger)';
              badgeBg = 'var(--ds-danger)';
              badgeColor = 'var(--ds-text-on-accent)';
            }
          } else if (isSelected) {
            btnBg = 'var(--ds-accent-bg)';
            btnBorder = 'var(--ds-accent)';
            badgeBg = 'var(--ds-accent)';
            badgeColor = 'var(--ds-text-on-accent)';
          }

          return (
            <div key={optKey} className="toeic-xray-option-wrap">
              {!isSubmitted && (
                <button
                  type="button"
                  onClick={(e) => handleToggleEliminate(e, optKey)}
                  className={`toeic-xray-eliminate-toggle ${isEliminated ? 'active' : ''}`}
                  title={isEliminated ? 'Bỏ gạch loại trừ phương án này' : 'Gạch loại trừ phương án nhiễu này'}
                  aria-label={`Loại trừ đáp án ${optKey}`}
                >
                  ✕
                </button>
              )}
              <button
                type="button"
                className={`toeic-xray-option-btn ${isEliminated ? 'is-eliminated' : ''} ${isInspected ? 'is-inspected' : ''}`}
                onClick={() => handleSelectOption(optKey)}
                title={isSubmitted ? `Bấm để soi phân tích chi tiết phương án (${optKey})` : undefined}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '0.85rem 1rem',
                  paddingRight: !isSubmitted ? '2.25rem' : '1rem',
                  borderRadius: '0.75rem',
                  border: `1.5px solid ${btnBorder}`,
                  backgroundColor: btnBg,
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  width: '100%'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
                    <span
                      style={{
                        width: '25px',
                        height: '25px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '0.78rem',
                        backgroundColor: badgeBg,
                        color: badgeColor,
                        flexShrink: 0
                      }}
                    >
                      {optKey}
                    </span>
                    <span className="toeic-xray-option-text" style={{ fontSize: '0.93rem', fontWeight: 700, color: 'var(--ds-text)', wordBreak: 'break-word' }}>
                      {optText}
                    </span>
                  </div>

                  {isSubmitted && (
                    <span style={{ flexShrink: 0, fontSize: '0.72rem', fontWeight: 800 }}>
                      {isCorrectAnswer ? (
                        <span style={{ color: 'var(--ds-success)' }}>✓ Đúng</span>
                      ) : isSelected ? (
                        <span style={{ color: 'var(--ds-danger)' }}>✗ Đã chọn</span>
                      ) : (
                        <span style={{ color: isInspected ? 'var(--ds-accent)' : 'var(--ds-text-muted)', fontWeight: 600 }}>
                          {isInspected ? '● Đang soi' : 'Soi bẫy'}
                        </span>
                      )}
                    </span>
                  )}
                </div>

                {isSubmitted && optAnalysis && (
                  <div className="toeic-xray-option-meta">
                    <span className="ge-hide-mobile" style={{ fontFamily: 'monospace' }}>
                      {optAnalysis.pos_or_role || 'Từ loại N/A'}
                    </span>
                    <span className="ge-show-mobile-only" style={{ fontFamily: 'monospace' }}>
                      {shortenPosRole(optAnalysis.pos_or_role)}
                    </span>
                  </div>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* QUICK NEXT STRIP (Desktop Only — Mobile already has fixed Bottom Exam Dock) */}
      {isSubmitted && onNextQuestion && (
        <div
          className="ge-hide-mobile"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--ds-radius-md)',
            backgroundColor: 'var(--ds-bg-elevated)',
            border: '1.5px solid var(--ds-accent)',
            marginBottom: '1.25rem',
            boxShadow: 'var(--ds-shadow-sm)',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ display: 'inline-flex', color: isCorrect ? 'var(--ds-success)' : 'var(--ds-accent)' }}>
              <KitIcon name={isCorrect ? 'check-circle' : 'bulb'} size={18} />
            </span>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--ds-text)' }}>
              {isCorrect ? 'Chính xác!' : `Đáp án đúng là (${question.correct_answer}).`}
              <span style={{ fontWeight: 500, color: 'var(--ds-text-secondary)', marginLeft: '0.35rem' }}>
                Bấm vào từng phương án A/B/C/D để soi bẫy hoặc bấm Next sang câu mới.
              </span>
            </span>
          </div>

          <button
            type="button"
            onClick={onNextQuestion}
            className="toeic-btn toeic-btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.55rem 1.15rem',
              fontSize: '0.85rem',
              fontWeight: 800,
              whiteSpace: 'nowrap',
              marginLeft: 'auto'
            }}
          >
            <span>Câu Tiếp Theo &rarr;</span>
            <kbd className="ge-hide-mobile" style={{ fontSize: '0.7rem', padding: '0.1rem 0.35rem', borderRadius: '4px', backgroundColor: 'var(--ds-bg-elevated)', color: 'var(--ds-accent)' }}>Enter ↵</kbd>
          </button>
        </div>
      )}

      {/* 6. POST-SUBMISSION 4-STATE PEDAGOGICAL WORKSPACE (X-Ray 2.0) */}
      {isSubmitted && (
        <div style={{ borderTop: '1px solid var(--ds-border)', paddingTop: '1.25rem' }}>
          {/* Navigation Tabs for X-Ray Analysis */}
          <div className="toeic-h-scroll-strip" style={{ marginBottom: '1.15rem' }}>
            <button
              type="button"
              onClick={() => setActiveTab('breakdown')}
              className={`toeic-target-chip ${activeTab === 'breakdown' ? 'active' : ''}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', padding: '0.38rem 0.75rem' }}
            >
              <KitIcon name="ruler" size={13} />
              <span>Bóc Tách Cấu Trúc <span className="ge-hide-mobile">(State 2)</span></span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('formula')}
              className={`toeic-target-chip ${activeTab === 'formula' ? 'active' : ''}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', padding: '0.38rem 0.75rem' }}
            >
              <KitIcon name="bolt" size={13} />
              <span>Quy Tắc &amp; Công Thức <span className="ge-hide-mobile">(State 3)</span></span>
            </button>
            <button
              type="button"
              onClick={handleOpenTwinRemediation}
              className={`toeic-target-chip ${activeTab === 'twin' ? 'active' : ''}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', padding: '0.38rem 0.75rem' }}
            >
              <KitIcon name="target" size={13} />
              <span>Câu Sinh Đôi <span className="ge-hide-mobile">Twin-Questions (State 4)</span></span>
            </button>
          </div>

          {/* TAB 1: STRUCTURAL BREAKDOWN (MX2 + MX3) */}
          {activeTab === 'breakdown' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* MX2.1: 3-BLOCK CAUSAL X-RAY SPECTRUM BAR (Explains WHY each highlighted phrase matters) */}
              {xray && (
                <div className="toeic-xray-spectrum-bar">
                  <div className="toeic-xray-spectrum-node left-anchor">
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--ds-warning)', marginBottom: '0.18rem' }}>
                      1. Dấu Hiệu Đứng Trước (Tô Cam)
                    </span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--ds-text)', wordBreak: 'break-word' }}>
                      {xray.left_anchor_words ? `“${xray.left_anchor_words}”` : '(Đầu câu)'}
                    </span>
                    <span style={{ fontSize: '0.73rem', color: 'var(--ds-text-secondary)', marginTop: '0.22rem', lineHeight: 1.38 }}>
                      {causalBridge.leftReason}
                    </span>
                  </div>

                  <div className="toeic-xray-spectrum-arrow">&rarr;</div>

                  <div className="toeic-xray-spectrum-node target-slot">
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--ds-success)', marginBottom: '0.18rem' }}>
                      2. Bắt Buộc Điền ({question.correct_answer})
                    </span>
                    <span style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--ds-success)' }}>
                      {question.options?.[question.correct_answer]}
                    </span>
                    <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--ds-text)', marginTop: '0.15rem' }}>
                      Cần: {xray.required_grammatical_role}
                    </span>
                  </div>

                  <div className="toeic-xray-spectrum-arrow">&larr;</div>

                  <div className="toeic-xray-spectrum-node right-anchor">
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--ds-accent)', marginBottom: '0.18rem' }}>
                      3. Dấu Hiệu Đứng Sau (Tô Xanh)
                    </span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--ds-text)', wordBreak: 'break-word' }}>
                      {xray.right_anchor_words ? `“${xray.right_anchor_words}”` : '(Cuối câu)'}
                    </span>
                    <span style={{ fontSize: '0.73rem', color: 'var(--ds-text-secondary)', marginTop: '0.22rem', lineHeight: 1.38 }}>
                      {causalBridge.rightReason}
                    </span>
                  </div>
                </div>
              )}

              {/* MX2.2: UNLOCK ACADEMIC EXPLANATION (question.explanation_vi || aiAnalysis.explanation_vi) */}
              {explanationTextVi && (
                <div className="toeic-formula-box standard">
                  <div className="toeic-formula-title" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                    <KitIcon name="check-circle" size={14} />
                    <span>GIẢI THÍCH LOGIC SOI CÂU X-RAY:</span>
                    {keyClueText && (
                      <ToeicBadge variant="primary">{keyClueText}</ToeicBadge>
                    )}
                  </div>
                  <p style={{ fontSize: '0.88rem', color: 'var(--ds-text)', margin: '0.35rem 0 0 0', lineHeight: 1.55 }}>
                    {explanationTextVi}
                  </p>
                </div>
              )}

              {/* MX3.2: INTERACTIVE OPTION INSPECTOR (Click any option A/B/C/D above to inspect why it's right or wrong) */}
              {inspectedFeedback && (
                <div className={`toeic-formula-box ${inspectedFeedback.is_correct ? 'tip' : 'critical'}`}>
                  <div className="toeic-formula-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                      <KitIcon name={inspectedFeedback.is_correct ? 'check-circle' : 'warning'} size={14} />
                      <span>
                        SOI PHƯƠNG ÁN ({activeInspectKey}) &ldquo;{inspectedFeedback.text}&rdquo;:
                      </span>
                      {!inspectedFeedback.is_correct && inspectedFeedback.error_pattern_name_vi && (
                        <ToeicBadge variant="danger">{inspectedFeedback.error_pattern_name_vi}</ToeicBadge>
                      )}
                    </div>
                    <div style={{ display: 'inline-flex', gap: '0.25rem' }}>
                      {(['A', 'B', 'C', 'D']).map(k => (
                        <button
                          key={k}
                          type="button"
                          onClick={() => setInspectedOption(k)}
                          style={{
                            padding: '0.15rem 0.45rem',
                            borderRadius: '0.35rem',
                            border: `1px solid ${activeInspectKey === k ? 'var(--ds-accent)' : 'var(--ds-border)'}`,
                            backgroundColor: activeInspectKey === k ? 'var(--ds-accent)' : 'var(--ds-card)',
                            color: activeInspectKey === k ? 'var(--ds-text-on-accent)' : 'var(--ds-text-secondary)',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                        >
                          {k}
                        </button>
                      ))}
                    </div>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--ds-text)', margin: '0.35rem 0 0 0', lineHeight: 1.5 }}>
                    {inspectedFeedback.ai_feedback_vi || distractorWhyVi}
                  </p>
                </div>
              )}

              {/* Word Family Matrix */}
              {aiAnalysis.word_family_matrix?.length > 0 && (
                <div style={{ padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--ds-border)', backgroundColor: 'var(--ds-card)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--ds-text)', marginBottom: '0.75rem' }}>
                    <KitIcon name="books" size={14} color="var(--ds-accent)" />
                    <span>Bảng Họ Từ Loại (Word Family Matrix — Bấm để soi từng phương án):</span>
                  </div>
                  <div className="toeic-grid-4" style={{ gap: '0.5rem' }}>
                    {aiAnalysis.word_family_matrix.map((wf, idx) => {
                      const isWfInspected = activeInspectKey === wf.option;
                      return (
                        <div
                          key={idx}
                          onClick={() => setInspectedOption(wf.option)}
                          style={{
                            padding: '0.65rem',
                            borderRadius: '0.5rem',
                            border: `1.5px solid ${
                              wf.is_correct
                                ? 'var(--ds-success)'
                                : isWfInspected
                                  ? 'var(--ds-accent)'
                                  : 'var(--ds-border)'
                            }`,
                            backgroundColor: wf.is_correct
                              ? 'var(--ds-success-bg)'
                              : isWfInspected
                                ? 'var(--ds-accent-bg)'
                                : 'var(--ds-bg-elevated)',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ fontWeight: 700, color: 'var(--ds-text)' }}>
                            ({wf.option}) {wf.word}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--ds-text-muted)' }}>
                            {wf.grammatical_role}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* MX2.3: UNLOCK COLLOCATION HIGHLIGHTS & LINKED VOCABULARY STRIP (+1-Click SRS Save) */}
              {(aiAnalysis.collocation_highlights?.length > 0 || aiAnalysis.linked_vocabulary?.length > 0) && (
                <div style={{ padding: '0.9rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--ds-border)', backgroundColor: 'var(--ds-bg-elevated)', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--ds-accent)' }}>
                    <KitIcon name="bulb" size={14} />
                    <span>Cụm Từ Thương Mại Ăn Điểm (Collocations) &amp; Từ Vựng Học Thuật:</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {(aiAnalysis.collocation_highlights || []).map((col, cIdx) => {
                      const colKey = `col_${cIdx}_${col}`;
                      return (
                        <div
                          key={colKey}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.45rem',
                            padding: '0.35rem 0.65rem',
                            borderRadius: '0.5rem',
                            backgroundColor: 'var(--ds-card)',
                            border: '1px solid var(--ds-border)',
                            fontSize: '0.8rem'
                          }}
                        >
                          <span style={{ fontWeight: 700, color: 'var(--ds-text)' }}>{col}</span>
                          {onSaveToSrs && (
                            <button
                              type="button"
                              disabled={!!srsSavedWords[colKey]}
                              onClick={() => {
                                setSrsSavedWords(prev => ({ ...prev, [colKey]: true }));
                                onSaveToSrs({ type: 'COLLOCATION', word: col, data: { collocation: col, questionId: question.id } });
                              }}
                              style={{
                                border: 'none',
                                background: 'var(--ds-accent-bg)',
                                color: 'var(--ds-accent)',
                                borderRadius: '0.3rem',
                                padding: '0.12rem 0.4rem',
                                fontSize: '0.7rem',
                                fontWeight: 800,
                                cursor: 'pointer'
                              }}
                            >
                              {srsSavedWords[colKey] ? '✓ Đã lưu' : '+ SRS'}
                            </button>
                          )}
                        </div>
                      );
                    })}
                    {(aiAnalysis.linked_vocabulary || []).map((voc, vIdx) => {
                      const vocKey = `voc_${vIdx}_${voc.word}`;
                      return (
                        <div
                          key={vocKey}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.45rem',
                            padding: '0.35rem 0.65rem',
                            borderRadius: '0.5rem',
                            backgroundColor: 'var(--ds-card)',
                            border: '1px solid var(--ds-border)',
                            fontSize: '0.8rem'
                          }}
                        >
                          <span>
                            <strong style={{ color: 'var(--ds-text)' }}>{voc.word}</strong>{' '}
                            <span style={{ color: 'var(--ds-text-muted)' }}>({voc.pos})</span>: {voc.meaning_vi}
                          </span>
                          {onSaveToSrs && (
                            <button
                              type="button"
                              disabled={!!srsSavedWords[vocKey]}
                              onClick={() => {
                                setSrsSavedWords(prev => ({ ...prev, [vocKey]: true }));
                                onSaveToSrs({ type: 'VOCABULARY', word: voc.word, data: voc });
                              }}
                              style={{
                                border: 'none',
                                background: 'var(--ds-accent-bg)',
                                color: 'var(--ds-accent)',
                                borderRadius: '0.3rem',
                                padding: '0.12rem 0.4rem',
                                fontSize: '0.7rem',
                                fontWeight: 800,
                                cursor: 'pointer'
                              }}
                            >
                              {srsSavedWords[vocKey] ? '✓ Đã lưu' : '+ SRS'}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: RULE & FORMULA BOX VARIANTS (State 3 / AC-U4.3) */}
          {activeTab === 'formula' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Standard Formula */}
              {aiAnalysis.micro_rule_formula_vi && (
                <div className="toeic-formula-box standard">
                  <div className="toeic-formula-title" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <KitIcon name="bolt" size={14} />
                    <span>CÔNG THỨC NGỮ PHÁP CHUẨN:</span>
                  </div>
                  <div className="toeic-formula-text">
                    {aiAnalysis.micro_rule_formula_vi}
                  </div>
                </div>
              )}

              {/* Trap Alert */}
              {aiAnalysis.common_traps_vi && (
                <div className="toeic-formula-box trap">
                  <div className="toeic-formula-title" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <KitIcon name="warning" size={14} />
                    <span>BẪY NHẬN THỨC THƯỜNG GẶP:</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--ds-text)', lineHeight: 1.5 }}>
                    {aiAnalysis.common_traps_vi}
                  </div>
                </div>
              )}

              {/* 3 Solving Steps */}
              {aiAnalysis.solving_steps_vi?.length > 0 && (
                <div className="toeic-formula-box tip">
                  <div className="toeic-formula-title" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <KitIcon name="bulb" size={14} />
                    <span>3 BƯỚC GIẢI NHANH 10 GIÂY:</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem' }}>
                    {aiAnalysis.solving_steps_vi.map((step, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 800, color: 'var(--ds-success)' }}>{idx + 1}.</span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MULTI-TWIN QUESTIONS REMEDIATION CAROUSEL (MX4) */}
          {activeTab === 'twin' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {currentTwin ? (
                <div className="toeic-card" style={{ border: '1.5px solid var(--ds-warning-border)', backgroundColor: 'var(--ds-warning-bg)' }}>
                  <div className="toeic-flex-between" style={{ marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                      <ToeicBadge variant="warning" icon="target">
                        Câu Sinh Đôi #{activeTwinIdx + 1}/{twinQuestions.length}
                      </ToeicBadge>
                      <span style={{ fontSize: '0.75rem', color: 'var(--ds-text-muted)', fontWeight: 700 }}>
                        #{currentTwin.id}
                      </span>
                    </div>

                    {twinQuestions.length > 1 && (
                      <div style={{ display: 'inline-flex', gap: '0.3rem' }}>
                        {twinQuestions.map((tq, tIdx) => {
                          const answeredThis = twinAnswersByIdx[tIdx];
                          const isThisRight = answeredThis && answeredThis === tq.correct_answer;
                          return (
                            <button
                              key={tq.id || tIdx}
                              type="button"
                              onClick={() => setActiveTwinIdx(tIdx)}
                              style={{
                                padding: '0.2rem 0.55rem',
                                borderRadius: '0.4rem',
                                border: `1px solid ${activeTwinIdx === tIdx ? 'var(--ds-accent)' : 'var(--ds-border)'}`,
                                backgroundColor:
                                  activeTwinIdx === tIdx
                                    ? 'var(--ds-accent)'
                                    : answeredThis
                                      ? isThisRight
                                        ? 'var(--ds-success-bg)'
                                        : 'var(--ds-danger-bg)'
                                      : 'var(--ds-card)',
                                color:
                                  activeTwinIdx === tIdx
                                    ? 'var(--ds-text-on-accent)'
                                    : 'var(--ds-text)',
                                fontSize: '0.74rem',
                                fontWeight: 800,
                                cursor: 'pointer'
                              }}
                            >
                              Câu {tIdx + 1}
                              {answeredThis ? (isThisRight ? ' ✓' : ' ✗') : ''}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--ds-text)', marginBottom: '1rem', lineHeight: 1.55 }}>
                    {currentTwin.context_sentence || currentTwin.stem}
                  </div>

                  <div className="toeic-grid-2" style={{ gap: '0.5rem', marginBottom: '1rem' }}>
                    {(['A', 'B', 'C', 'D']).map(tOpt => {
                      const tText = currentTwin.options?.[tOpt];
                      if (!tText) return null;

                      const isTwinSelected = currentTwinAnswer === tOpt;
                      const isTwinCorrect = tOpt === currentTwin.correct_answer;

                      let tBg = 'var(--ds-card)';
                      let tBorder = 'var(--ds-border)';
                      if (currentTwinAnswer) {
                        if (isTwinCorrect) {
                          tBg = 'var(--ds-success-bg)';
                          tBorder = 'var(--ds-success)';
                        } else if (isTwinSelected) {
                          tBg = 'var(--ds-danger-bg)';
                          tBorder = 'var(--ds-danger)';
                        }
                      }

                      return (
                        <button
                          key={tOpt}
                          type="button"
                          disabled={!!currentTwinAnswer}
                          onClick={() =>
                            setTwinAnswersByIdx(prev => ({ ...prev, [activeTwinIdx]: tOpt }))
                          }
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.65rem 0.85rem',
                            borderRadius: '0.5rem',
                            border: `1.5px solid ${tBorder}`,
                            backgroundColor: tBg,
                            color: 'var(--ds-text)',
                            fontSize: '0.85rem',
                            cursor: currentTwinAnswer ? 'default' : 'pointer',
                            textAlign: 'left'
                          }}
                        >
                          <span style={{ fontWeight: 800 }}>({tOpt})</span>
                          <span style={{ fontWeight: 600 }}>{tText}</span>
                        </button>
                      );
                    })}
                  </div>

                  {currentTwinAnswer && (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.55rem',
                        padding: '0.85rem 1rem',
                        borderRadius: '0.65rem',
                        fontSize: '0.85rem',
                        backgroundColor: 'var(--ds-card)',
                        border: `1.5px solid ${
                          currentTwinAnswer === currentTwin.correct_answer
                            ? 'var(--ds-success)'
                            : 'var(--ds-danger)'
                        }`
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            fontWeight: 800,
                            color:
                              currentTwinAnswer === currentTwin.correct_answer
                                ? 'var(--ds-success)'
                                : 'var(--ds-danger)'
                          }}
                        >
                          {currentTwinAnswer === currentTwin.correct_answer
                            ? '✓ Xuất sắc! Bạn đã gỡ điểm thành công ở câu sinh đôi này!'
                            : `✗ Đáp án đúng là (${currentTwin.correct_answer}) "${currentTwin.options?.[currentTwin.correct_answer]}".`}
                        </span>

                        {activeTwinIdx + 1 < twinQuestions.length && (
                          <button
                            type="button"
                            onClick={() => setActiveTwinIdx(activeTwinIdx + 1)}
                            className="toeic-btn toeic-btn-sm toeic-btn-primary"
                            style={{ padding: '0.3rem 0.75rem', fontSize: '0.76rem', fontWeight: 800 }}
                          >
                            Luyện tiếp Câu sinh đôi #{activeTwinIdx + 2} &rarr;
                          </button>
                        )}
                      </div>

                      {currentTwin.ai_analysis?.key_clue && (
                        <div style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--ds-accent)', fontWeight: 700 }}>
                          Từ khóa X-Ray: {currentTwin.ai_analysis.key_clue}
                        </div>
                      )}

                      {currentTwin.ai_analysis?.explanation_vi && (
                        <div style={{ color: 'var(--ds-text-secondary)', lineHeight: 1.5 }}>
                          {currentTwin.ai_analysis.explanation_vi}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--ds-text-muted)', fontSize: '0.85rem' }}>
                  {isLoadingTwin
                    ? 'Đang tải chuỗi câu hỏi sinh đôi cùng chủ điểm...'
                    : 'Không tìm thấy câu hỏi sinh đôi cho câu này.'}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
