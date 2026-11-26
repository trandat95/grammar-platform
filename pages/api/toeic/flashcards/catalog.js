import {
  attachCorrelationId,
  checkApiRateLimit,
  sendSafeServerError,
} from "../../../../lib/api/security-guard";
import FlashcardRepository from "../../../../lib/toeic/flashcard-repository";
import { resolveServerUserRole } from "../../../../lib/toeic/subscription/server-gate";

const FREE_MODULES = new Set(["M01", "M02"]);

export default async function handler(req, res) {
  const correlationId = attachCorrelationId(req, res);

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ success: false, error: "Method not allowed", correlationId });
  }

  const rate = checkApiRateLimit(req, res, {
    keyPrefix: "toeic_fc_catalog",
    maxRequests: 90,
    correlationId,
  });
  if (!rate.allowed) return;

  try {
    const { moduleId, topicId, band, cefr, q, limit = 100, offset = 0, metaOnly } = req.query || {};
    const { isVip } = await resolveServerUserRole(req);
    const meta = FlashcardRepository.getCatalogMeta();

    if (metaOnly === "1" || metaOnly === "true") {
      return res.status(200).json({
        success: true,
        isVip,
        freeModules: [...FREE_MODULES],
        ...meta,
        correlationId,
      });
    }

    const result = FlashcardRepository.queryFlashcards({
      moduleId,
      topicId,
      band,
      cefr,
      q,
      limit,
      offset,
    });

    // Enforce Free vs VIP boundary on full card payload while keeping M01-M02 open & 3 preview cards per locked topic
    let filteredItems = result.items;
    let lockedCount = 0;
    if (!isVip) {
      const seenPerTopic = new Map();
      filteredItems = [];
      for (const item of result.items) {
        if (FREE_MODULES.has(item.module_id)) {
          filteredItems.push(item);
        } else {
          const cnt = seenPerTopic.get(item.topic_id) || 0;
          if (cnt < 3) {
            seenPerTopic.set(item.topic_id, cnt + 1);
            filteredItems.push({ ...item, is_preview: true });
          } else {
            lockedCount += 1;
          }
        }
      }
    }

    return res.status(200).json({
      success: true,
      isVip,
      total: result.total,
      lockedCount,
      items: filteredItems,
      modules: meta.modules,
      topics: meta.topics,
      correlationId,
    });
  } catch (err) {
    return sendSafeServerError(res, {
      correlationId,
      route: "/api/toeic/flashcards/catalog",
      err,
      publicMessage: "Lỗi tải danh mục Flashcard TOEIC.",
    });
  }
}
