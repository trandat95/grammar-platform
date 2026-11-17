# 🧠 LEARNING EXPERIENCE & RETENTION UX SPECIFICATION

> **Chi tiết 5 Core User Journeys & Quy tắc Hiển thị/Cấm Mascot (`M4.0`):** Xem [`M4_0_UX_JOURNEYS_AND_MASCOT_MAP.md`](./M4_0_UX_JOURNEYS_AND_MASCOT_MAP.md).

> Thiết kế trải nghiệm để người học **hiểu bản chất, sửa đúng lỗi gốc và thấy sự tiến bộ thực sự** — không chỉ là app tích điểm XP/streak.

---

## 1. 8 Nguyên Tắc Learning UX Bắt Buộc

1. **Cognitive Load Reduction:** Mỗi màn chỉ hiện việc cần làm ngay (Action-First); ẩn bớt bảng phụ dài bằng thu gọn/tab thông minh.
2. **Progressive Disclosure:** Mở rộng `StructuredExplanation` theo 3 bậc (*Cơ bản* → *Sơ cấp* → *Nâng cao VIP*) và thu gọn ví dụ `> 4`.
3. **Active Recall:** Ưu tiên trả lời trước khi mở đáp án/giải thích.
4. **Immediate Feedback:** Chấm & phản hồi lý do đúng/sai ngay lập tức.
5. **Spaced Repetition:** Đưa hàng đợi ôn tập SM-2 đến hạn (`1→3→7→14→30d`) lên ngay tầm mắt khi vào học.
6. **Visual Learning:** Gắn đúng 1 trong 8 sơ đồ `GrammarVisualization` theo ngữ cảnh bài đang học.
7. **Measurable Learning Progress:** Hiển thị độ thành thạo từng chuyên đề thực tế.
8. **Supportive Motivation:** Khuyến khích quay lại học mà không hù dọa mất chuỗi hay tạo áp lực giả.

---

## 2. 6 Cơ Chế Retention UX Dựa Trên Thuật Toán Thực Tế Có Sẵn

> **Ràng buộc trung thực dữ liệu:** Toàn bộ chỉ số phải trích xuất trực tiếp từ `mastery-tracker.js`, `spaced-repetition.js`, `lib/diagnostic/knowledge.graph.js` và `user_error_dna_snapshots` — **cấm tạo chỉ số giả khi chưa có dữ liệu/thuật toán hỗ trợ**.

| Cơ chế | Dữ liệu Nền Thực Tế | Trải nghiệm Hiển thị (UI Pattern) |
| :--- | :--- | :--- |
| **Learning Momentum** | `completedLessons` + `streak` + `% Accuracy` theo phiên | Cho thấy sự tăng trưởng đa lượt giữa các lần test. |
| **Weakness Discovery** | `user_error_dna_snapshots` + `knowledge-graph.js` | Card chẩn đoán lỗi sai lặp lại (ví dụ: sai liên tiếp *Present Perfect* 42% → gợi ý đúng bài cần ôn + 10 câu đặc trị). |
| **Smart Review** | `spaced-repetition.js` (SM-2 due queue) | Nút 1 chạm `Ôn X thẻ đến hạn hôm nay`. |
| **Knowledge Mastery** | 6-Factor Mastery Tracker (`12` chủ đề) | Radar 12 trục + thanh progress phân tầng New/Learning/Mastered. |
| **Learning Milestones** | `achievement-engine.js` (cột mốc thực tế) | `GamificationCelebrationModal` ăn mừng cột mốc hoàn thành chương/test. |
| **Recovery Experience** | `challenge-streak-engine.js` (Streak Freeze / Comeback) | Chào đón nhẹ nhàng khi quay lại sau nhiều ngày nghỉ (`mascot-welcome`/`encourage`), không trừng phạt tinh thần. |
