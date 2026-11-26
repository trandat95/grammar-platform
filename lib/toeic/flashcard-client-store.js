/**
 * Client-Side Hybrid 3-Tier Store for New TOEIC 1,000 Flashcards
 * Tier 1: Static CDN JSON (/data/toeic-flashcards/manifest.json & modules/*.json)
 * Tier 2: Supabase Cloud (via /api/toeic/flashcards/*)
 * Tier 3: IndexedDB v3 + LocalStorage fallback for offline & instant warm starts
 */

import { StorageAdapter as idb } from "../sync/indexed-db";
import {
  FSRS_STATES,
  buildQueuedSrsPayload,
  reviewFlashcardFSRS,
  summarizeFlashcardSrs,
} from "./flashcard-fsrs";
import { FREE_TIER_LIMITS, hasVipPrivilege } from "./subscription/toeic-entitlement";

export const FREE_FLASHCARD_MODULE_IDS = new Set(["M01", "M02"]);

let _memoryManifest = null;
let _memoryCrosslinks = null;
const _memoryModules = new Map();

/**
 * Browser-safe deterministic SVG Card fallback identical to V3.json visual template.
 */
export function buildClientOfflineFlashcardSvgDataUri(card) {
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

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export async function loadFlashcardManifest() {
  if (_memoryManifest) return _memoryManifest;
  const cached = await idb.getCachedFlashcardPack("manifest");
  if (cached && Array.isArray(cached.modules) && cached.modules.length > 0) {
    _memoryManifest = cached;
    // Background refresh silently if online
    if (typeof navigator === "undefined" || navigator.onLine !== false) {
      fetch("/data/toeic-flashcards/manifest.json")
        .then((r) => (r.ok ? r.json() : null))
        .then((fresh) => {
          if (fresh?.modules?.length) {
            _memoryManifest = fresh;
            idb.cacheFlashcardPack("manifest", fresh);
          }
        })
        .catch(() => {});
    }
    return cached;
  }

  const res = await fetch("/data/toeic-flashcards/manifest.json");
  if (!res.ok) throw new Error("Không thể tải danh mục 1,000 thẻ TOEIC.");
  const data = await res.json();
  _memoryManifest = data;
  await idb.cacheFlashcardPack("manifest", data);
  return data;
}

export async function loadFlashcardModule(moduleId = "M01") {
  const key = String(moduleId || "M01").toUpperCase();
  if (_memoryModules.has(key)) return _memoryModules.get(key);

  const cached = await idb.getCachedFlashcardPack(`module_${key}`);
  if (cached?.flashcards?.length) {
    _memoryModules.set(key, cached);
    return cached;
  }

  const res = await fetch(`/data/toeic-flashcards/modules/${key}.json`);
  if (!res.ok) throw new Error(`Không thể tải Module ${key}`);
  const data = await res.json();
  _memoryModules.set(key, data);
  await idb.cacheFlashcardPack(`module_${key}`, data);
  return data;
}

export async function loadAllFlashcardsForSearch() {
  const cached = await idb.getCachedFlashcardPack("lite_all");
  if (cached?.flashcards?.length) return cached.flashcards;

  const res = await fetch("/data/toeic-flashcards/lite.json");
  if (!res.ok) throw new Error("Không thể tải dữ liệu tìm kiếm toàn bộ 1,000 từ.");
  const data = await res.json();
  await idb.cacheFlashcardPack("lite_all", data);
  return data.flashcards || [];
}

export async function loadFlashcardCrosslinks() {
  if (_memoryCrosslinks) return _memoryCrosslinks;
  const cached = await idb.getCachedFlashcardPack("crosslinks");
  if (cached?.flashcardToQuestions) {
    _memoryCrosslinks = cached;
    return cached;
  }
  try {
    const res = await fetch("/data/toeic-flashcards/crosslinks.json");
    if (!res.ok) return { flashcardToQuestions: {} };
    const data = await res.json();
    _memoryCrosslinks = data;
    await idb.cacheFlashcardPack("crosslinks", data);
    return data;
  } catch {
    return { flashcardToQuestions: {} };
  }
}

export async function fetchUserFlashcardSrs({ userId = "guest", authToken = null } = {}) {
  const localRecords = await idb.getAllFlashcardSrsLocal(userId);
  if (!authToken) {
    return {
      records: localRecords,
      summary: summarizeFlashcardSrs(localRecords),
      source: "local",
    };
  }

  try {
    const res = await fetch("/api/toeic/flashcards/srs", {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (!res.ok) throw new Error("SRS fetch failed");
    const data = await res.json();
    const remoteRecords = data.records || [];

    // Merge local records if any offline changes have newer updated_at
    const mergedMap = new Map(remoteRecords.map((r) => [Number(r.flashcard_id), r]));
    for (const loc of localRecords) {
      const fid = Number(loc.flashcard_id);
      const rem = mergedMap.get(fid);
      if (!rem || new Date(loc.updated_at || 0).getTime() > new Date(rem.updated_at || 0).getTime()) {
        mergedMap.set(fid, loc);
      }
    }

    const merged = [...mergedMap.values()];
    await idb.bulkUpsertFlashcardSrsLocal(userId, merged);
    return {
      records: merged,
      summary: summarizeFlashcardSrs(merged),
      source: "cloud+local",
    };
  } catch {
    return {
      records: localRecords,
      summary: summarizeFlashcardSrs(localRecords),
      source: "offline_cache",
    };
  }
}

export async function submitFlashcardReview({
  userId = "guest",
  authToken = null,
  role = "FREE",
  flashcard,
  existingRecord = null,
  rating = 3,
  responseTimeMs = null,
  personalNote = undefined,
}) {
  const localRecords = await idb.getAllFlashcardSrsLocal(userId);
  const alreadyTracked = localRecords.some((r) => Number(r.flashcard_id) === Number(flashcard.id));

  if (!hasVipPrivilege(role) && !alreadyTracked && localRecords.length >= FREE_TIER_LIMITS.maxSrsCards) {
    return {
      success: false,
      requiresUpgrade: true,
      limitReached: true,
      message: `Tài khoản Miễn phí lưu tối đa ${FREE_TIER_LIMITS.maxSrsCards} thẻ FSRS-4.5. Nâng cấp VIP để ôn tập không giới hạn 1,000 thẻ!`,
    };
  }

  const nextState = reviewFlashcardFSRS(
    existingRecord,
    {
      ...(flashcard.spaced_repetition_defaults || {}),
      flashcard_id: flashcard.id,
    },
    rating,
    new Date(),
    responseTimeMs
  );

  const enriched = {
    ...existingRecord,
    ...nextState,
    flashcard_id: Number(flashcard.id),
    ...(personalNote !== undefined ? { personal_mnemonic_note: personalNote } : {}),
    updated_at: new Date().toISOString(),
  };

  await idb.upsertFlashcardSrsLocal(userId, enriched);

  if (authToken) {
    try {
      const res = await fetch("/api/toeic/flashcards/review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          flashcardId: flashcard.id,
          rating,
          responseTimeMs,
          ...(personalNote !== undefined ? { personalNote } : {}),
        }),
      });
      const json = await res.json();
      if (res.status === 403 && json.requiresUpgrade) {
        return { success: false, requiresUpgrade: true, message: json.error };
      }
      if (json?.record) {
        await idb.upsertFlashcardSrsLocal(userId, json.record);
        return { success: true, record: json.record, xpAwarded: json.xpAwarded || 0 };
      }
    } catch {
      // Offline resilient: already stored in IndexedDB
    }
  }

  return { success: true, record: enriched, offline: !authToken };
}

export async function queueLinkedFlashcards({
  userId = "guest",
  authToken = null,
  role = "FREE",
  flashcardIds = [],
  words = [],
  questionId = null,
  sourceContext = "XRAY_SAVE",
}) {
  const localRecords = await idb.getAllFlashcardSrsLocal(userId);
  const localMap = new Map(localRecords.map((r) => [Number(r.flashcard_id), r]));
  const isVip = hasVipPrivilege(role);

  // Optimistically resolve flashcard IDs from manifest if words provided
  let resolvedIds = [...new Set((flashcardIds || []).map((id) => Number(id)).filter((n) => n > 0))];
  if (words && words.length > 0 && resolvedIds.length === 0) {
    try {
      const manifest = await loadFlashcardManifest();
      const wordMap = new Map((manifest.index || []).map((x) => [x.word.toLowerCase(), x.id]));
      for (const rawW of words) {
        const clean = String(rawW || "").toLowerCase().trim();
        if (wordMap.has(clean)) resolvedIds.push(wordMap.get(clean));
      }
      resolvedIds = [...new Set(resolvedIds)];
    } catch {}
  }

  // Also sync to cloud first or alongside local
  let queuedRecords = [];
  let blockedByLimit = false;

  if (authToken) {
    try {
      const res = await fetch("/api/toeic/flashcards/queue", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          flashcardIds: resolvedIds,
          words,
          questionId,
          sourceContext,
        }),
      });
      const data = await res.json();
      if (data?.queued?.length > 0) {
        await idb.bulkUpsertFlashcardSrsLocal(userId, data.queued);
        return {
          success: true,
          queued: data.queued,
          requiresUpgrade: Boolean(data.limitReached),
          message: data.message,
        };
      }
      if (res.status === 403 && data?.requiresUpgrade) {
        return {
          success: false,
          queued: [],
          requiresUpgrade: true,
          message: data.error,
        };
      }
    } catch {
      // Fallback to local queue below
    }
  }

  for (const fcId of resolvedIds) {
    const existing = localMap.get(fcId) || null;
    if (!existing && !isVip && localMap.size >= FREE_TIER_LIMITS.maxSrsCards) {
      blockedByLimit = true;
      break;
    }
    const nextRec = buildQueuedSrsPayload({
      existingRecord: existing,
      flashcard: { id: fcId },
      sourceContext,
      sourceQuestionId: questionId,
    });
    localMap.set(fcId, nextRec);
    queuedRecords.push(nextRec);
  }

  if (queuedRecords.length > 0) {
    await idb.bulkUpsertFlashcardSrsLocal(userId, queuedRecords);
  }

  return {
    success: queuedRecords.length > 0 || !blockedByLimit,
    queued: queuedRecords,
    requiresUpgrade: blockedByLimit,
    message: blockedByLimit
      ? `Đã đạt giới hạn ${FREE_TIER_LIMITS.maxSrsCards} thẻ FSRS cho tài khoản Miễn phí.`
      : undefined,
  };
}
