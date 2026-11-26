import {
  attachCorrelationId,
  checkApiRateLimit,
  sanitizeShortText,
  sendSafeServerError,
} from "../../../../lib/api/security-guard";
import { verifyServerSession } from "../../../../lib/supabase/middleware";
import { getAdminClient } from "../../../../lib/supabase/server";
import { reviewFlashcardFSRS } from "../../../../lib/toeic/flashcard-fsrs";
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
    keyPrefix: "toeic_fc_review",
    maxRequests: 120,
    correlationId,
  });
  if (!rate.allowed) return;

  try {
    const authUser = await verifyServerSession(req);
    if (!authUser?.id) {
      return res.status(401).json({
        success: false,
        error: "Vui lòng đăng nhập để lưu tiến độ FSRS-4.5 lên đám mây.",
        correlationId,
      });
    }

    const { flashcardId, rating, responseTimeMs, personalNote } = req.body || {};
    const fcId = Number.parseInt(String(flashcardId), 10);
    const parsedRating = Number.parseInt(String(rating), 10);

    if (!Number.isInteger(fcId) || fcId < 1 || fcId > 1000) {
      return res.status(422).json({ success: false, error: "Mã thẻ flashcardId không hợp lệ.", correlationId });
    }
    if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 4) {
      return res.status(422).json({ success: false, error: "Đánh giá FSRS phải từ 1 đến 4.", correlationId });
    }

    const flashcard = FlashcardRepository.getById(fcId);
    if (!flashcard) {
      return res.status(404).json({ success: false, error: "Không tìm thấy thẻ Flashcard.", correlationId });
    }

    const { isVip } = await resolveServerUserRole(req);
    const adminClient = getAdminClient();

    const { data: existing, error: fetchErr } = await adminClient
      .from("user_toeic_flashcard_srs")
      .select("*")
      .eq("user_id", authUser.id)
      .eq("flashcard_id", fcId)
      .maybeSingle();

    if (fetchErr) throw fetchErr;

    if (!existing && !isVip) {
      const { count } = await adminClient
        .from("user_toeic_flashcard_srs")
        .select("id", { count: "exact", head: true })
        .eq("user_id", authUser.id);
      if (Number(count || 0) >= FREE_TIER_LIMITS.maxSrsCards) {
        return res.status(403).json({
          success: false,
          requiresUpgrade: true,
          error: `Tài khoản Miễn phí đã đạt giới hạn ${FREE_TIER_LIMITS.maxSrsCards} thẻ lưu FSRS. Nâng cấp VIP để ôn tập trọn 1,000 thẻ!`,
          correlationId,
        });
      }
    }

    const next = reviewFlashcardFSRS(
      existing,
      {
        ...(flashcard.spaced_repetition_defaults || {}),
        flashcard_id: fcId,
      },
      parsedRating,
      new Date(),
      responseTimeMs
    );

    const upsertRow = {
      user_id: authUser.id,
      flashcard_id: fcId,
      srs_state: next.srs_state,
      reps: next.reps,
      lapses: next.lapses,
      ease_factor: next.ease_factor,
      stability: next.stability,
      difficulty: next.difficulty,
      interval_days: next.interval_days,
      last_rating: next.last_rating,
      last_response_ms: next.last_response_ms,
      due_at: next.due_at,
      last_reviewed_at: next.last_reviewed_at,
      source_context: existing?.source_context || "TOPIC_BROWSE",
      source_question_id: existing?.source_question_id || null,
      ...(personalNote !== undefined
        ? { personal_mnemonic_note: sanitizeShortText(personalNote, 500) }
        : {}),
    };

    const { data: saved, error: saveErr } = await adminClient
      .from("user_toeic_flashcard_srs")
      .upsert(upsertRow, { onConflict: "user_id,flashcard_id" })
      .select("*")
      .single();

    if (saveErr) throw saveErr;

    return res.status(200).json({
      success: true,
      record: saved,
      xpAwarded: parsedRating >= 3 ? 5 : 2,
      correlationId,
    });
  } catch (err) {
    return sendSafeServerError(res, {
      correlationId,
      route: "/api/toeic/flashcards/review",
      err,
      publicMessage: "Lỗi cập nhật trạng thái ôn tập FSRS-4.5.",
    });
  }
}
