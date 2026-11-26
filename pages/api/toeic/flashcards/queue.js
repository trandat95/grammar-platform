import {
  attachCorrelationId,
  checkApiRateLimit,
  sanitizeShortText,
  sendSafeServerError,
} from "../../../../lib/api/security-guard";
import { verifyServerSession } from "../../../../lib/supabase/middleware";
import { getAdminClient } from "../../../../lib/supabase/server";
import { buildQueuedSrsPayload } from "../../../../lib/toeic/flashcard-fsrs";
import FlashcardRepository from "../../../../lib/toeic/flashcard-repository";
import { resolveServerUserRole } from "../../../../lib/toeic/subscription/server-gate";
import { FREE_TIER_LIMITS } from "../../../../lib/toeic/subscription/toeic-entitlement";

export default async function handler(req, res) {
  const correlationId = attachCorrelationId(req, res);

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ success: false, error: "Method not allowed", correlationId });
  }

  const rate = checkApiRateLimit(req, res, {
    keyPrefix: "toeic_fc_queue",
    maxRequests: 60,
    correlationId,
  });
  if (!rate.allowed) return;

  try {
    const authUser = await verifyServerSession(req);
    if (!authUser?.id) {
      return res.status(401).json({
        success: false,
        error: "Cần đăng nhập để đồng bộ hàng đợi Flashcard lên đám mây.",
        correlationId,
      });
    }

    const {
      flashcardIds = [],
      words = [],
      questionId = null,
      sourceContext = "XRAY_SAVE",
    } = req.body || {};

    const candidateSet = new Set();
    for (const rawId of Array.isArray(flashcardIds) ? flashcardIds : []) {
      const n = Number.parseInt(String(rawId), 10);
      if (Number.isInteger(n) && n >= 1 && n <= 1000) candidateSet.add(n);
    }
    for (const rawW of Array.isArray(words) ? words : []) {
      const fc = FlashcardRepository.findByWord(rawW);
      if (fc) candidateSet.add(fc.id);
    }
    if (questionId && candidateSet.size === 0) {
      const matched = FlashcardRepository.getMatchedFlashcardsForQuestion(String(questionId), 3);
      for (const m of matched) candidateSet.add(m.id);
    }

    const targetIds = [...candidateSet].slice(0, 25);
    if (targetIds.length === 0) {
      return res.status(200).json({
        success: true,
        queued: [],
        message: "Không tìm thấy thẻ từ vựng TOEIC tương ứng trong kho 1,000 từ.",
        correlationId,
      });
    }

    const { isVip } = await resolveServerUserRole(req);
    const adminClient = getAdminClient();

    const { data: existingRows, error: exErr } = await adminClient
      .from("user_toeic_flashcard_srs")
      .select("*")
      .eq("user_id", authUser.id);
    if (exErr) throw exErr;

    const existingMap = new Map((existingRows || []).map((r) => [Number(r.flashcard_id), r]));
    let totalTracked = existingMap.size;
    let limitReached = false;

    const safeContext = ["TOPIC_BROWSE", "XRAY_SAVE", "MISTAKE_AUTO_QUEUE", "EXAM_REMEDIATION"].includes(
      sourceContext
    )
      ? sourceContext
      : "XRAY_SAVE";
    const safeQId = questionId ? sanitizeShortText(String(questionId), 80) : null;

    const rowsToUpsert = [];
    for (const fcId of targetIds) {
      const existing = existingMap.get(fcId) || null;
      if (!existing && !isVip && totalTracked >= FREE_TIER_LIMITS.maxSrsCards) {
        limitReached = true;
        continue;
      }
      const fc = FlashcardRepository.getById(fcId);
      if (!fc) continue;

      const payload = buildQueuedSrsPayload({
        existingRecord: existing,
        flashcard: fc,
        sourceContext: safeContext,
        sourceQuestionId: safeQId,
      });

      rowsToUpsert.push({
        user_id: authUser.id,
        flashcard_id: fcId,
        srs_state: payload.srs_state,
        reps: payload.reps,
        lapses: payload.lapses,
        ease_factor: payload.ease_factor,
        stability: payload.stability,
        difficulty: payload.difficulty,
        interval_days: payload.interval_days,
        source_context: payload.source_context,
        source_question_id: payload.source_question_id,
        due_at: payload.due_at,
        last_reviewed_at: payload.last_reviewed_at,
      });
      if (!existing) totalTracked += 1;
    }

    if (rowsToUpsert.length === 0 && limitReached) {
      return res.status(403).json({
        success: false,
        requiresUpgrade: true,
        limitReached: true,
        error: `Đã đạt giới hạn ${FREE_TIER_LIMITS.maxSrsCards} thẻ FSRS cho tài khoản Miễn phí. Nâng cấp VIP để thêm không giới hạn!`,
        correlationId,
      });
    }

    let saved = [];
    if (rowsToUpsert.length > 0) {
      const { data, error: upErr } = await adminClient
        .from("user_toeic_flashcard_srs")
        .upsert(rowsToUpsert, { onConflict: "user_id,flashcard_id" })
        .select("*");
      if (upErr) throw upErr;
      saved = data || [];
    }

    return res.status(200).json({
      success: true,
      queued: saved,
      limitReached,
      message: limitReached
        ? `Đã thêm ${saved.length} thẻ; một số thẻ chạm giới hạn ${FREE_TIER_LIMITS.maxSrsCards} thẻ Free.`
        : `Đã đưa ${saved.length} thẻ từ vựng vào hàng đợi ôn tập FSRS!`,
      correlationId,
    });
  } catch (err) {
    return sendSafeServerError(res, {
      correlationId,
      route: "/api/toeic/flashcards/queue",
      err,
      publicMessage: "Lỗi thêm thẻ vào hàng đợi ôn tập FSRS.",
    });
  }
}
