# 🧭 `M4.0` — 5 CORE USER JOURNEYS, EMOTIONAL TOUCHPOINTS & MASCOT GOVERNANCE MAP

> **Milestone:** `M4.0` (`P0` • Design Agent)  
> **Nguồn kiểm toán thực tế:** `pages/index.js` (`3955`, `5351`, `5358`, `6756`, `7961`), `pages/toeic/*`, `components/gamification/GamificationCelebrationModal.jsx`, `components/monetization/SmartPaywallModal.jsx`, `components/monetization/MonetizationHub.jsx`, `components/diagnostic/AiAdvisorDrawer.jsx`, `components/toeic/AITutorDrawer.jsx`.  
> **Nguyên tắc định vị:** *Premium AI-Powered Learning Platform* — hình ảnh & Mascot phải dẫn dắt cảm xúc tiến bộ, **không trẻ con, không gây phân tâm khi đang đọc/làm bài**.

---

## 1. BẢN ĐỒ 5 CORE USER JOURNEYS & EMOTIONAL TOUCHPOINTS

### Journey 1 — First-Time / Guest Onboarding (`Khách lần đầu vào web`)
- **Mục tiêu người học:** Hiểu giá trị cốt lõi trong `< 30s`, làm thử không cần đăng ký, rồi tạo tài khoản tự nhiên.
- **Luồng thực tế:**
  1. **Entry (`dashboard`):** Xem Action-First Hero + 3 thẻ hành động (`Học tiếp`, `Test 30 câu`, `TOEIC Hub`) + bảng xếp hạng LIVE.
  2. **First Win (`study` / `diagnostic`):** Đọc lý thuyết 12 chuyên đề toàn quyền; làm thử `4` câu đầu mỗi bài tập (`FREE_QUESTIONS_PER_EXERCISE = 4`) hoặc test chẩn đoán 30 câu (lưu local).
  3. **Prompt đăng ký (`#auth-modal`):** Khi bấm Lưu cloud / VIP / Đăng ký → hiện `#auth-modal` tab `Đăng ký mới`.
- **Emotional Touchpoints & Error/Empty Fallbacks:**
  - *#auth-modal (Welcome):* Gắn **`mascot-welcome`** (cỡ vừa/lớn `110px`) thân thiện, tạo cảm giác đồng hành học thuật.
  - *Mất mạng / Sync Pending:* `SyncStatusIndicator` báo `OFFLINE` rõ ràng, giữ nguyên tiến độ localStorage/IndexedDB.

---

### Journey 2 — Daily Grammar Study & Active Recall (`Học lý thuyết ➔ Làm bài tập`)
- **Mục tiêu người học:** Đọc sâu công thức/quy tắc dài không mỏi mắt, tra từ tức thì, trả lời câu hỏi nhanh mượt trên cả Desktop & Mobile.
- **Luồng thực tế:**
  1. **Navigation (`study`):** Desktop mở Sidebar `256–280px` (hoặc Collapse sang *Focus Reading `780px`*); Mobile `375px` mở Drawer từ `.ge-mobile-chapter-bar`.
  2. **Deep Reading:** Xem Cheat-Sheet, 1 trong 8 `GrammarVisualization`, phân mục `01..N`, ví dụ song ngữ + Audio US/UK; click bất kỳ từ tiếng Anh → `#dict-popup` (Desktop popup / Mobile bottom sheet).
  3. **Practice (`BeforeAnswer → AfterCorrect / AfterWrong`):** Chuyển tab `Bài tập thực hành` hoặc `Quiz`: trả lời câu hỏi → chấm điểm ngay → xem `StructuredExplanation` 5 bước → bấm `Đánh dấu đã học xong (+25 XP)`.
- **Emotional Touchpoints & Fallbacks:**
  - *Before Answer:* **0 Mascot, 0 hiệu ứng gây nhiễu.** Toàn bộ tập trung dồn vào đề bài & lựa chọn (`RadioChoiceCard` `>= 48px` hoặc `<input>`).
  - *Complete Lesson / Streak Milestone (`GamificationCelebrationModal.jsx`):* Gắn **`mascot-celebrate`** thay OS Emoji `🎖️`.
  - *#vocab-modal trống (`pages/index.js:3955`) / Tìm kiếm bài học 0 kết quả:* Gắn **`mascot-empty`** + CTA rõ ràng.

---

### Journey 3 — Mistake Recovery, SM-2 & Diagnostic (`Sửa lỗi sai gốc rễ`)
- **Mục tiêu người học:** Hiểu *vì sao mình sai*, sửa tận gốc theo lộ trình cá nhân thay vì cày đề mù quáng.
- **Luồng thực tế:**
  1. **Diagnostic (`DiagnosticOnboarding` → `DiagnosticTestSession` → `DiagnosticAnalysisDashboard`):** Làm 30 câu A/B/C/D → xem Root Cause DAG & Lộ trình 4 tuần (`PersonalizedRoadmapView`).
  2. **AI Advice (`AiAdvisorDrawer.jsx`):** Hỏi Cố vấn AI dựa trên DAG & điểm thật.
  3. **Spaced Repetition & Mistakes (`SM-2` trên Dashboard & `mistakes`):** Ôn thẻ đến hạn `1→3→7→14→30d` và làm lại câu sai trong Sổ tay.
- **Emotional Touchpoints & Fallbacks:**
  - *After Wrong Answer / Điểm Diagnostic `< 50%`:* Không dùng đỏ gắt gây nản; hiển thị **`mascot-encourage`** cỡ vừa (`96px`) kèm phân tích bẫy tư duy + nút `Ôn lại chuyên đề gốc`.
  - *AiAdvisorDrawer (`AiAdvisorDrawer.jsx:85-100`):* Thay 2 avatar `.jpg` ghép bằng **`mascot-ai-coach`** (`40px`) đồng nhất phong cách.
  - *Sổ tay câu sai trống (`pages/index.js:7961`):* Gắn **`mascot-empty`** (`130px`) + nút `Bắt đầu làm Quiz ngay`.
  - *Lỗi API / Thiếu trường Common Mistakes:* Fallback trung thực về quy tắc chính trong bài học, không bịa lời giải.

---

### Journey 4 — TOEIC 2026 Adaptive Practice & Exam (`/toeic`)
- **Mục tiêu người học:** Trải nghiệm môi trường thi thử chuẩn quốc tế trên Desktop & Zero-Scroll Mobile Dock trên điện thoại, hiểu sâu câu qua Sentence X-Ray.
- **Luồng thực tế:**
  1. **Hub Overview (`/toeic`):** Hero Banner + 4 trụ chính (*Đề thi thử 20 bộ, Chẩn đoán thích ứng, Luyện 24 dạng bài + X-Ray, Dictation 540 đoạn*).
  2. **Exam & Drill (`/toeic/tests/*`, `/toeic/practice/*`):** Split Passage Reader, Pacing Timer, Mobile Zero-Scroll Exam Dock, Sentence X-Ray Breakdown.
  3. **AI Tutor (`AITutorDrawer.jsx`):** Giải thích câu hỏi TOEIC dựa trên `ai_tutor_rag_context`.
- **Emotional Touchpoints & Fallbacks:**
  - *AITutorDrawer (`AITutorDrawer.jsx:90`):* Thay OS Emoji `🧑‍🏫` bằng **`mascot-ai-coach`** (`36px`).
  - *Exam Session (đang tính giờ):* **0 Mascot trong vùng làm bài** để bảo toàn trạng thái tập trung thi cử tối đa.
  - *Trang 404 / Mất tuyến (`/toeic/...` hoặc route lỗi):* Trang `pages/404.js` gắn **`state-404`** + nút quay về Trang chủ / TOEIC Hub.

---

### Journey 5 — Transparent Free-to-VIP Conversion & SePay VietQR (`Mở khóa nâng cấp`)
- **Mục tiêu người học:** Hiểu rõ mình đang bị giới hạn ở đâu (`4` câu/bài tập, `0` ngày dùng thử), thấy rõ giá trị thực khi lên VIP, và thanh toán VietQR nhanh trong `30s`.
- **Luồng thực tế:**
  1. **Hit Gate (`pages/index.js:6756`):** Làm hết `4/4` câu dùng thử của 1 bài tập → câu `5+` hiện thẻ khóa rõ ràng (cấm popup chen ngang giữa câu `1..4` đang làm!).
  2. **Smart Paywall (`SmartPaywallModal.jsx`):** Hiển thị tiến độ thật + `FeaturePreview` + lưu ý yêu cầu đăng ký nếu đang là Guest (`onRequireRegister`).
  3. **VIP Hub & SePay Checkout (`MonetizationHub.jsx`):** Đối sánh FREE vs VIP (`free-tier-showcase` / `vip-tier-showcase`), nhập coupon, quét Dynamic VietQR (`qr.sepay.vn/img`), tự động polling `3s` kích hoạt VIP; có nút Hủy VIP minh bạch **2 chạm**.
- **Emotional Touchpoints & Fallbacks:**
  - *SmartPaywallModal / Thẻ nâng cấp VIP:* Dùng **`mascot-vip`** cỡ vừa (`100–120px`), tông Navy/Gold trang nhã.
  - *Tuân thủ FTC:* Tuyệt đối **0** countdown giả, **0** thông báo khan hiếm ảo, **0** câu đe dọa mất streak.

---

## 2. MA TRẬN ĐƯỢC PHÉP vs CẤM HIỂN THỊ MASCOT (`MASCOT INCLUSION & EXCLUSION MAP`)

| Vị trí / Ngữ cảnh | Trạng thái | Asset & Kích thước | Lý do UX |
| :--- | :---: | :--- | :--- |
| `#auth-modal` (Header chào mừng / Đăng ký mới) | ✅ **ALLOWED** | `mascot-welcome` (`110–140px`) | Tạo thiện cảm onboarding, giảm tỷ lệ bỏ giữa form. |
| `GamificationCelebrationModal.jsx` | ✅ **ALLOWED** | `mascot-celebrate` (`140px`) | Khuếch đại cảm xúc thành công khi lên level / đạt mốc. |
| `#vocab-modal` trống, `mistakes` trống, Search `0` kết quả | ✅ **ALLOWED** | `mascot-empty` (`130px`) | Chuyển trạng thái trống khô khan thành lời mời hành động. |
| `pages/404.js` & Trạng thái lỗi đồng bộ nặng | ✅ **ALLOWED** | `state-404` (`180px`) | Trấn an người dùng, định hướng đường quay lại. |
| `DiagnosticAnalysisDashboard` (`score < 50%`) / `mistakes` review | ✅ **ALLOWED** | `mascot-encourage` (`96px`) | Giảm tâm lý nản chí khi điểm chẩn đoán thấp. |
| `SmartPaywallModal.jsx` & VIP Showcase | ✅ **ALLOWED** | `mascot-vip` (`110px`) | Tạo cảm giác giá trị cao cấp không mang tính thúc ép. |
| `AiAdvisorDrawer.jsx` & `AITutorDrawer.jsx` | ✅ **ALLOWED (SMALL)** | `mascot-ai-coach` (`36–44px`) | Avatar gia sư AI thống nhất thay cho emoji/stock cũ. |
| **4 KPI Cards trên Dashboard (`Bài xong`, `Câu đúng`, `XP`, `Câu sai`)** | ❌ **FORBIDDEN** | *None* | Giữ dashboard sạch kiểu SaaS chuyên nghiệp, tránh rối mắt/trẻ con. |
| **Inside `BeforeAnswer` Question Card (Study / Quiz / TOEIC / Diagnostic)** | ❌ **FORBIDDEN** | *None* | Bảo toàn Cognitive Load tối thiểu khi học viên đang đọc đề & suy nghĩ. |
| **Inside Sidebar Chapter/Lesson Navigation List (`#chapter-sidebar`)** | ❌ **FORBIDDEN** | *None* | Giữ mật độ hiển thị 12 chuyên đề & 53 bài học gọn, dễ scan nhanh. |
| **Inside Admin Panel (`View 4`)** | ❌ **FORBIDDEN** | *None* | Giao diện vận hành enterprise ưu tiên số liệu & bảng kiểm toán thuần. |
