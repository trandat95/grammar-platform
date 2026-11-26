/**
 * Milestone FC-1 & FC-2: O(1) TOEIC 1,000 Flashcards & Cross-Link Repository
 * Server-side fast indexed lookup for API routes (`catalog`, `review`, `check-answer`, `exams/submit`)
 * plus safe deterministic offline SVG card fallback generator.
 */

const fs = require("node:fs");
const path = require("node:path");

let _fcCache = null;
let _linksCache = null;

function resolveDataPath(filename) {
  const candidates = [
    path.join(process.cwd(), "data", "toeic", filename),
    path.join(__dirname, "..", "..", "data", "toeic", filename),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return candidates[0];
}

function initFlashcards() {
  if (_fcCache) return _fcCache;

  const litePath = resolveDataPath("flashcards_lite.json");
  let raw = { modules: [], topics: [], flashcards: [] };
  if (fs.existsSync(litePath)) {
    raw = JSON.parse(fs.readFileSync(litePath, "utf8"));
  }

  const modules = raw.modules || [];
  const topics = raw.topics || [];
  const flashcards = raw.flashcards || [];

  const byId = new Map();
  const byCode = new Map();
  const byWord = new Map();
  const byModule = new Map();
  const byTopic = new Map();
  const topicMap = new Map();
  const moduleMap = new Map();

  for (const m of modules) {
    moduleMap.set(m.module_id, m);
    byModule.set(m.module_id, []);
  }
  for (const t of topics) {
    topicMap.set(Number(t.topic_id), t);
    byTopic.set(Number(t.topic_id), []);
  }
  for (const c of flashcards) {
    byId.set(Number(c.id), c);
    byCode.set(String(c.code).toUpperCase(), c);
    const wKey = String(c.word || "").toLowerCase().trim();
    if (!byWord.has(wKey)) byWord.set(wKey, c);
    if (byModule.has(c.module_id)) byModule.get(c.module_id).push(c);
    if (byTopic.has(Number(c.topic_id))) byTopic.get(Number(c.topic_id)).push(c);
  }

  _fcCache = {
    modules,
    topics,
    flashcards,
    byId,
    byCode,
    byWord,
    byModule,
    byTopic,
    moduleMap,
    topicMap,
  };
  return _fcCache;
}

function initCrossLinks() {
  if (_linksCache) return _linksCache;
  const linksPath = resolveDataPath("question_flashcard_links.json");
  let raw = { questionToFlashcards: {}, flashcardToQuestions: {}, stats: {} };
  if (fs.existsSync(linksPath)) {
    raw = JSON.parse(fs.readFileSync(linksPath, "utf8"));
  }
  _linksCache = raw;
  return _linksCache;
}

/**
 * Generates deterministic offline SVG card Data URI identical to V3.json visual template
 * so 4-layer image fallback never fails even on zero-network offline sessions.
 */
function buildOfflineFlashcardSvgDataUri(card) {
  if (card?.visual_media?.offline_svg_card_data_uri) {
    return card.visual_media.offline_svg_card_data_uri;
  }
  const esc = (s) =>
    String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const c1 = card?.visual_media?.theme_color_hex || "#1E3A8A";
  const c2 = card?.visual_media?.accent_color_hex || "#3B82F6";
  const badgeCode = `TOEIC #${String(card?.id || 1).padStart(4, "0")}`;
  const topic = esc(card?.topic_name_en || card?.topic_name_vi || "TOEIC Vocab");
  const word = esc(card?.word || "");
  const sub = esc(`${card?.ipa_us || ""} (${card?.part_of_speech || ""})`.trim());
  const cue = esc(
    `Visual Cue: ${card?.visual_media?.visual_scene_keywords || "business context"}`.slice(0, 56)
  );

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 260" width="400" height="260">` +
    `<defs><linearGradient id="gfc" x1="0%" y1="0%" x2="100%" y2="100%">` +
    `<stop offset="0%" stop-color="${esc(c1)}"/><stop offset="100%" stop-color="${esc(c2)}"/>` +
    `</linearGradient></defs>` +
    `<rect width="400" height="260" rx="20" fill="url(#gfc)"/>` +
    `<circle cx="340" cy="60" r="70" fill="#FFFFFF" fill-opacity="0.1"/>` +
    `<circle cx="60" cy="210" r="50" fill="#FFFFFF" fill-opacity="0.08"/>` +
    `<rect x="24" y="22" width="110" height="26" rx="13" fill="#FFFFFF" fill-opacity="0.2"/>` +
    `<text x="79" y="39" font-family="Inter,Arial,sans-serif" font-size="11" font-weight="700" fill="#FFFFFF" text-anchor="middle">${badgeCode}</text>` +
    `<text x="376" y="39" font-family="Inter,Arial,sans-serif" font-size="11" font-weight="600" fill="#E2E8F0" text-anchor="end">${topic}</text>` +
    `<text x="200" y="122" font-family="Inter,Arial,sans-serif" font-size="30" font-weight="800" fill="#FFFFFF" text-anchor="middle">${word}</text>` +
    `<text x="200" y="152" font-family="Inter,Arial,sans-serif" font-size="15" font-weight="500" fill="#F1F5F9" text-anchor="middle">${sub}</text>` +
    `<rect x="40" y="188" width="320" height="36" rx="10" fill="#0F172A" fill-opacity="0.35"/>` +
    `<text x="200" y="211" font-family="Inter,Arial,sans-serif" font-size="12" font-weight="500" fill="#F8FAFC" text-anchor="middle">${cue}</text>` +
    `</svg>`;

  if (typeof Buffer !== "undefined") {
    return `data:image/svg+xml;base64,${Buffer.from(svg, "utf8").toString("base64")}`;
  }
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const FlashcardRepository = {
  getCatalogMeta() {
    const db = initFlashcards();
    return {
      totalWords: db.flashcards.length,
      modules: db.modules,
      topics: db.topics,
    };
  },

  getById(id) {
    const db = initFlashcards();
    return db.byId.get(Number(id)) || null;
  },

  getByCode(code) {
    const db = initFlashcards();
    return db.byCode.get(String(code || "").toUpperCase()) || null;
  },

  findByWord(word) {
    const db = initFlashcards();
    const clean = String(word || "").toLowerCase().trim();
    if (!clean) return null;
    if (db.byWord.has(clean)) return db.byWord.get(clean);
    // Basic inflection fallback
    const candidates = [
      clean.replace(/(ies)$/i, "y"),
      clean.replace(/(ied)$/i, "y"),
      clean.replace(/(es|ed|s|ing|ly)$/i, ""),
      clean.replace(/(ing|ed)$/i, "e"),
    ];
    for (const cand of candidates) {
      if (cand.length >= 3 && db.byWord.has(cand)) return db.byWord.get(cand);
    }
    return null;
  },

  queryFlashcards({ moduleId, topicId, band, cefr, q, limit = 100, offset = 0 } = {}) {
    const db = initFlashcards();
    let list = db.flashcards;

    if (topicId) {
      list = db.byTopic.get(Number(topicId)) || [];
    } else if (moduleId) {
      list = db.byModule.get(String(moduleId).toUpperCase()) || [];
    }

    if (band && band !== "ALL") {
      list = list.filter((c) => c.toeic_score_band === band);
    }
    if (cefr && cefr !== "ALL") {
      list = list.filter((c) => c.cefr_level === cefr);
    }
    if (q && String(q).trim()) {
      const needle = String(q).trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.word.toLowerCase().includes(needle) ||
          c.meaning_vi.toLowerCase().includes(needle) ||
          c.collocation.toLowerCase().includes(needle) ||
          c.code.toLowerCase().includes(needle)
      );
    }

    const total = list.length;
    const safeOffset = Math.max(0, Number(offset || 0));
    const safeLimit = Math.min(1000, Math.max(1, Number(limit || 100)));
    return {
      total,
      items: list.slice(safeOffset, safeOffset + safeLimit),
    };
  },

  getMatchedFlashcardsForQuestion(questionId, limit = 3) {
    const db = initFlashcards();
    const links = initCrossLinks();
    const ids = links.questionToFlashcards?.[questionId] || [];
    const results = [];
    for (const id of ids.slice(0, limit)) {
      const fc = db.byId.get(Number(id));
      if (fc) {
        results.push({
          id: fc.id,
          code: fc.code,
          word: fc.word,
          part_of_speech: fc.part_of_speech,
          ipa_us: fc.ipa_us,
          meaning_vi: fc.meaning_vi,
          collocation: fc.collocation,
          toeic_score_band: fc.toeic_score_band,
          cefr_level: fc.cefr_level,
          module_id: fc.module_id,
          topic_id: fc.topic_id,
          topic_name_vi: fc.topic_name_vi,
        });
      }
    }
    return results;
  },

  getRelatedQuestionsForFlashcard(flashcardId) {
    const links = initCrossLinks();
    return links.flashcardToQuestions?.[String(flashcardId)] || [];
  },

  buildOfflineFlashcardSvgDataUri,
};

module.exports = FlashcardRepository;
module.exports.buildOfflineFlashcardSvgDataUri = buildOfflineFlashcardSvgDataUri;
