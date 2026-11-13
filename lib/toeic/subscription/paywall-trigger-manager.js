/**
 * Milestone E7.6: Smart Paywall Trigger Engine & Fatigue Protection
 * Governs the 7 Contextual Triggers with strict frequency capping (Max 2/session),
 * preventing spam and ensuring a respectful learning experience.
 */

export const PAYWALL_TRIGGERS = {
  TRG_01_MILESTONE_LOCKED: {
    id: 'TRG_01_MILESTONE_LOCKED',
    title: 'Mở Khóa Lộ Trình 7 Milestones Nâng Cao',
    badge: '🏆 Bứt Phá Điểm Số',
    teaser: 'Chinh phục trọn bộ các chủ điểm ngữ pháp và đọc hiểu Part 7 để nâng band điểm lên 750+.'
  },
  TRG_02_AI_TUTOR_QUOTA: {
    id: 'TRG_02_AI_TUTOR_QUOTA',
    title: 'Hỏi Đáp AI Gia Sư Không Giới Hạn',
    badge: '🧑‍🏫 AI Pedagogical Coach',
    teaser: 'Bạn đã sử dụng hết 3 lượt hỏi miễn phí hôm nay. Nâng cấp VIP để được giải đáp tức thì 24/7 mọi bẫy đề thi!'
  },
  TRG_03_BOSS_GATE_PREMIUM: {
    id: 'TRG_03_BOSS_GATE_PREMIUM',
    title: 'Thử Thách Thi Vượt Trạm Boss Gate',
    badge: '⚡ Kiểm Tra Chuẩn ETS',
    teaser: 'Vượt trạm tính giờ nghiêm ngặt và nhận gói bài tập khắc phục điểm mù cá nhân hóa.'
  },
  TRG_04_FULL_MOCK_TEST: {
    id: 'TRG_04_FULL_MOCK_TEST',
    title: 'Kho 20 Đề Thi Chuẩn ETS 2024 & 2026',
    badge: '📚 Full Test Simulation',
    teaser: 'Trọn bộ 4.000 câu hỏi chia đôi màn hình Split-Passage Reader và Auto-Highlight bằng chứng.'
  },
  TRG_05_DICTATION_PART34: {
    id: 'TRG_05_DICTATION_PART34',
    title: 'Phòng Nghe Chép Chính Tả 540 Tracks',
    badge: '🎧 Listening Mastery',
    teaser: 'Rèn luyện phản xạ nghe chép hội thoại dài Part 3 & 4 với giọng đọc bản xứ chuẩn ETS.'
  },
  TRG_06_REPEATED_ERROR: {
    id: 'TRG_06_REPEATED_ERROR',
    title: 'Khắc Phục Bẫy Ngữ Pháp Lặp Lại',
    badge: '🎯 Điểm Nghẽn Tư Duy',
    teaser: 'Hệ thống phát hiện bạn đang mất điểm nhiều ở chủ điểm này. VIP giúp bạn bẻ khóa bẫy đề triệt để.'
  },
  TRG_07_DIAGNOSTIC_COMPLETION: {
    id: 'TRG_07_DIAGNOSTIC_COMPLETION',
    title: 'Lộ Trình Cá Nhân Hóa Theo Năng Lực IRT',
    badge: '🎯 Đánh Giá Chuẩn Xác',
    teaser: 'Dựa trên kết quả chẩn đoán, một lộ trình 7 trạm tối ưu đã được thiết kế riêng cho mục tiêu điểm của bạn.'
  }
};

const SESSION_STORAGE_KEY = 'ge_paywall_session_count';
const LAST_SHOWN_KEY = 'ge_paywall_last_shown';
const MAX_PER_SESSION = 2;
const COOLDOWN_HOURS = 12;

/**
 * Checks whether paywall can be shown according to fatigue protection rules.
 */
export function canShowPaywall(triggerId) {
  if (typeof window === 'undefined') return false;

  try {
    const sessionCount = parseInt(sessionStorage.getItem(SESSION_STORAGE_KEY) || '0', 10);
    if (sessionCount >= MAX_PER_SESSION) {
      return false;
    }

    const lastShownTime = parseInt(localStorage.getItem(`${LAST_SHOWN_KEY}_${triggerId}`) || '0', 10);
    const now = Date.now();
    const elapsedHours = (now - lastShownTime) / (1000 * 60 * 60);

    if (elapsedHours < COOLDOWN_HOURS) {
      return false;
    }

    return true;
  } catch (err) {
    return true;
  }
}

/**
 * Records that a paywall impression was delivered.
 */
export function recordPaywallImpression(triggerId) {
  if (typeof window === 'undefined') return;

  try {
    const sessionCount = parseInt(sessionStorage.getItem(SESSION_STORAGE_KEY) || '0', 10);
    sessionStorage.setItem(SESSION_STORAGE_KEY, String(sessionCount + 1));
    localStorage.setItem(`${LAST_SHOWN_KEY}_${triggerId}`, String(Date.now()));
  } catch (err) {
    // Ignore storage quota
  }
}

export const shouldTriggerPaywall = canShowPaywall;
