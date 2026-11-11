/**
 * Milestone 2.10.3: Achievement & Badge Unlocking Engine
 * - Supports 4 Categories (Consistency, Mastery, Accuracy, Milestones)
 * - 4 Tiers (Bronze, Silver, Gold, Diamond) + Hidden Achievements
 * - Never awards duplicates and masks hidden metadata until unlocked
 */

export const ACHIEVEMENT_CATEGORIES = [
  "Learning Consistency",
  "Grammar Mastery",
  "Accuracy & Performance",
  "Learning Milestones",
];

export const ACHIEVEMENT_TIERS = ["Bronze", "Silver", "Gold", "Diamond"];

export const DEFAULT_ACHIEVEMENT_CATALOG = [
  { code: "first_step", title_vi: "Bước Chân Đầu Tiên", title_en: "First Step", description_vi: "Hoàn thành câu hỏi ngữ pháp đầu tiên được ghi nhận hợp lệ.", icon: "🌱", tier: "Bronze", category: "Learning Consistency", is_hidden: false, xp_bonus: 15, rule_key: "total_answered", threshold: 1 },
  { code: "daily_learner_3", title_vi: "Người Học Bền Bỉ 3 Ngày", title_en: "Daily Learner", description_vi: "Duy trì chuỗi học tập hợp lệ 3 ngày liên tiếp.", icon: "🔥", tier: "Bronze", category: "Learning Consistency", is_hidden: false, xp_bonus: 25, rule_key: "streak_days", threshold: 3 },
  { code: "streak_7_days", title_vi: "Chiến Binh 7 Ngày", title_en: "7-Day Streak", description_vi: "Học tập đều đặn không ngắt quãng suốt 7 ngày.", icon: "⚡", tier: "Silver", category: "Learning Consistency", is_hidden: false, xp_bonus: 50, rule_key: "streak_days", threshold: 7 },
  { code: "warrior_30_days", title_vi: "Huyền Thoại 30 Ngày", title_en: "30-Day Warrior", description_vi: "Duy trì chuỗi học tập kỷ luật suốt 30 ngày liên tiếp.", icon: "🛡️", tier: "Gold", category: "Learning Consistency", is_hidden: false, xp_bonus: 150, rule_key: "streak_days", threshold: 30 },
  { code: "consistency_master_100", title_vi: "Bậc Thầy Kỷ Luật 100 Ngày", title_en: "Consistency Master", description_vi: "Đạt chuỗi 100 ngày luyện tập ngữ pháp liên tục.", icon: "👑", tier: "Diamond", category: "Learning Consistency", is_hidden: false, xp_bonus: 400, rule_key: "streak_days", threshold: 100 },
  { code: "night_owl_hidden", title_vi: "Cú Đêm Cần Mẫn", title_en: "Night Owl", description_vi: "Hoàn thành phiên ôn tập lúc khuya muộn (23:00 - 04:00).", icon: "🦉", tier: "Silver", category: "Learning Consistency", is_hidden: true, xp_bonus: 60, rule_key: "night_study", threshold: 1 },

  { code: "tense_explorer", title_vi: "Khám Phá Các Thì", title_en: "Tense Explorer", description_vi: "Đạt tối thiểu 60% Mastery ở Chương 1: Các thì.", icon: "⏳", tier: "Bronze", category: "Grammar Mastery", is_hidden: false, xp_bonus: 40, rule_key: "chapter_1_mastery", threshold: 60 },
  { code: "master_13_tenses", title_vi: "Bậc Thầy 13 Thì Động Từ", title_en: "Master of 13 Tenses", description_vi: "Đạt cấp Master (>= 90%) tại Chương 1: Các thì.", icon: "🧭", tier: "Gold", category: "Grammar Mastery", is_hidden: false, xp_bonus: 120, rule_key: "chapter_1_mastery", threshold: 90 },
  { code: "conditional_expert", title_vi: "Chuyên Gia Mệnh Đề & Điều Kiện", title_en: "Conditional Expert", description_vi: "Đạt >= 75% Mastery ở Chương 3: Mệnh đề & Cụm từ.", icon: "🔀", tier: "Silver", category: "Grammar Mastery", is_hidden: false, xp_bonus: 75, rule_key: "chapter_3_mastery", threshold: 75 },
  { code: "passive_voice_master", title_vi: "Bậc Thầy Câu Bị Động", title_en: "Passive Voice Master", description_vi: "Đạt cấp Master (>= 90%) ở Chương 10: Câu Chủ động - Bị động.", icon: "🎭", tier: "Gold", category: "Grammar Mastery", is_hidden: false, xp_bonus: 120, rule_key: "chapter_10_mastery", threshold: 90 },
  { code: "grammar_legend_12", title_vi: "Huyền Thoại 12 Chuyên Đề", title_en: "Grammar Legend", description_vi: "Đạt >= 75% Mastery đồng thời trên cả 12 chuyên đề ngữ pháp.", icon: "💎", tier: "Diamond", category: "Grammar Mastery", is_hidden: false, xp_bonus: 500, rule_key: "all_12_chapters_75", threshold: 12 },

  { code: "perfect_score", title_vi: "Điểm Tuyệt Đối 100%", title_en: "Perfect Score", description_vi: "Đạt điểm tuyệt đối 100% trong một bài Quiz từ 10 câu trở lên.", icon: "🎯", tier: "Silver", category: "Accuracy & Performance", is_hidden: false, xp_bonus: 60, rule_key: "perfect_quiz", threshold: 1 },
  { code: "sharp_shooter", title_vi: "Xạ Thủ Chính Xác", title_en: "Sharp Shooter", description_vi: "Đạt độ chính xác >= 90% ở 5 bài Quiz.", icon: "🏹", tier: "Gold", category: "Accuracy & Performance", is_hidden: false, xp_bonus: 150, rule_key: "high_accuracy_quizzes", threshold: 5 },
  { code: "error_hunter", title_vi: "Thợ Săn Lỗi Sai", title_en: "Error Hunter", description_vi: "Xử lý thành công 100 câu từng làm sai hoặc câu tái ôn tập.", icon: "🔍", tier: "Gold", category: "Accuracy & Performance", is_hidden: false, xp_bonus: 150, rule_key: "errors_resolved", threshold: 100 },
  { code: "comeback_king", title_vi: "Vua Lội Ngược Dòng", title_en: "Comeback King", description_vi: "Cải thiện ít nhất 1 chuyên đề từ dưới 50% lên >= 75% Mastery.", icon: "🦅", tier: "Silver", category: "Accuracy & Performance", is_hidden: true, xp_bonus: 80, rule_key: "comeback_topic", threshold: 1 },
  { code: "lightning_master_hidden", title_vi: "Tia Chớp Chuẩn Xác", title_en: "Lightning Precision", description_vi: "Trả lời đúng liên tiếp 10 câu ở tốc độ phản xạ nhanh (< 5 giây).", icon: "⚡", tier: "Gold", category: "Accuracy & Performance", is_hidden: true, xp_bonus: 100, rule_key: "fast_streak", threshold: 10 },

  { code: "quiz_starter", title_vi: "Người Chinh Phục Quiz", title_en: "Quiz Starter", description_vi: "Hoàn thành 10 bài kiểm tra Quiz tổng hợp.", icon: "📝", tier: "Bronze", category: "Learning Milestones", is_hidden: false, xp_bonus: 35, rule_key: "quizzes_completed", threshold: 10 },
  { code: "century_club", title_vi: "Câu Lạc Bộ 100 Đề", title_en: "Century Club", description_vi: "Hoàn thành 100 bài kiểm tra Quiz trên nền tảng.", icon: "💯", tier: "Gold", category: "Learning Milestones", is_hidden: false, xp_bonus: 200, rule_key: "quizzes_completed", threshold: 100 },
  { code: "knowledge_collector", title_vi: "Kho Tàng Tri Thức 1,000 Câu", title_en: "Knowledge Collector", description_vi: "Trả lời đúng 1,000 câu hỏi ngữ pháp khác nhau.", icon: "📚", tier: "Diamond", category: "Learning Milestones", is_hidden: false, xp_bonus: 350, rule_key: "unique_questions_correct", threshold: 1000 },
  { code: "review_master", title_vi: "Bậc Thầy Ôn Tập Ngắt Quãng", title_en: "Review Master", description_vi: "Đạt trạng thái Mastered cho 100 thẻ Spaced Repetition.", icon: "🧠", tier: "Gold", category: "Learning Milestones", is_hidden: false, xp_bonus: 180, rule_key: "sr_mastered_count", threshold: 100 },
];

export function evaluateRuleMetric(ruleKey, stats = {}) {
  const chMap = new Map((stats.twelveTopicMastery || []).map((c) => [Number(c.chapter_number), Number(c.mastery_score || 0)]));
  switch (ruleKey) {
    case "total_answered":
      return Number(stats.totalAnswered || 0);
    case "streak_days":
      return Math.max(Number(stats.currentStreak || 0), Number(stats.longestStreak || 0));
    case "night_study":
      return stats.isNightStudy ? 1 : 0;
    case "chapter_1_mastery":
      return chMap.get(1) || 0;
    case "chapter_3_mastery":
      return chMap.get(3) || 0;
    case "chapter_10_mastery":
      return chMap.get(10) || 0;
    case "all_12_chapters_75":
      return (stats.twelveTopicMastery || []).filter((c) => Number(c.mastery_score || 0) >= 75).length;
    case "perfect_quiz":
      return stats.hasPerfectQuiz ? 1 : 0;
    case "high_accuracy_quizzes":
      return Number(stats.highAccuracyQuizzes || 0);
    case "errors_resolved":
      return Number(stats.errorsResolved || 0);
    case "comeback_topic":
      return stats.hasComebackTopic ? 1 : 0;
    case "fast_streak":
      return Number(stats.fastConsecutiveCorrect || 0);
    case "quizzes_completed":
      return Number(stats.quizzesCompleted || 0);
    case "unique_questions_correct":
      return Number(stats.uniqueQuestionsCorrect || 0);
    case "sr_mastered_count":
      return Number(stats.srMasteredCount || 0);
    default:
      return 0;
  }
}

/**
 * Deterministically evaluates all un-unlocked catalog achievements against current learner stats.
 */
export function evaluateUnlockableAchievements({
  stats = {},
  alreadyUnlockedCodes = [],
  catalog = DEFAULT_ACHIEVEMENT_CATALOG,
} = {}) {
  const unlockedSet = new Set(alreadyUnlockedCodes || []);
  const newlyUnlocked = [];

  for (const item of catalog) {
    if (unlockedSet.has(item.code)) continue;
    const metric = evaluateRuleMetric(item.rule_key, stats);
    if (metric >= Number(item.threshold || 1)) {
      newlyUnlocked.push({
        ...item,
        observed_metric: metric,
      });
    }
  }

  return newlyUnlocked;
}

/**
 * Formats badge gallery for frontend, masking hidden badge spoilers until unlocked.
 */
export function formatAchievementsForClient({
  catalog = DEFAULT_ACHIEVEMENT_CATALOG,
  unlockedRows = [],
} = {}) {
  const unlockedByCode = new Map((unlockedRows || []).map((r) => [r.achievement_code || r.code, r]));

  return (catalog || []).map((badge) => {
    const unlock = unlockedByCode.get(badge.code);
    const unlocked = Boolean(unlock);
    if (badge.is_hidden && !unlocked) {
      return {
        code: badge.code,
        title_vi: "Huy hiệu Bí ẩn",
        title_en: "Hidden Achievement",
        description_vi: "Tiếp tục rèn luyện ngữ pháp ở các tình huống đặc biệt để khám phá huy hiệu này.",
        icon: "❔",
        tier: badge.tier,
        category: badge.category,
        is_hidden: true,
        xp_bonus: badge.xp_bonus,
        unlocked: false,
        unlocked_at: null,
      };
    }

    return {
      code: badge.code,
      title_vi: badge.title_vi,
      title_en: badge.title_en,
      description_vi: badge.description_vi,
      icon: badge.icon,
      tier: badge.tier,
      category: badge.category,
      is_hidden: Boolean(badge.is_hidden),
      xp_bonus: badge.xp_bonus,
      unlocked,
      unlocked_at: unlock?.unlocked_at || null,
    };
  });
}
