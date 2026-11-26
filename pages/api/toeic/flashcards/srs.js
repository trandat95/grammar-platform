import {
  attachCorrelationId,
  checkApiRateLimit,
  sendSafeServerError,
} from "../../../../lib/api/security-guard";
import { verifyServerSession } from "../../../../lib/supabase/middleware";
import { getAdminClient } from "../../../../lib/supabase/server";
import { summarizeFlashcardSrs } from "../../../../lib/toeic/flashcard-fsrs";
import FlashcardRepository from "../../../../lib/toeic/flashcard-repository";

export default async function handler(req, res) {
  const correlationId = attachCorrelationId(req, res);

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ success: false, error: "Method not allowed", correlationId });
  }

  const rate = checkApiRateLimit(req, res, {
    keyPrefix: "toeic_fc_srs",
    maxRequests: 60,
    correlationId,
  });
  if (!rate.allowed) return;

  try {
    const authUser = await verifyServerSession(req);
    if (!authUser?.id) {
      return res.status(401).json({
        success: false,
        error: "Vui lòng đăng nhập để đồng bộ tiến độ FSRS trên đám mây.",
        correlationId,
      });
    }

    const adminClient = getAdminClient();
    const { data, error } = await adminClient
      .from("user_toeic_flashcard_srs")
      .select("*")
      .eq("user_id", authUser.id)
      .order("due_at", { ascending: true });

    if (error) throw error;

    const records = (data || []).map((row) => ({
      ...row,
      flashcard: FlashcardRepository.getById(row.flashcard_id) || null,
    }));

    return res.status(200).json({
      success: true,
      records,
      summary: summarizeFlashcardSrs(records),
      correlationId,
    });
  } catch (err) {
    return sendSafeServerError(res, {
      correlationId,
      route: "/api/toeic/flashcards/srs",
      err,
      publicMessage: "Không thể tải tiến độ ôn tập Flashcard FSRS.",
    });
  }
}
