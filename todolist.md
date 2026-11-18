# GrammarPro — Master Bug-Fix & Mobile-First Audit Todolist (Full 55 Issues Spec)

> **Nguồn:** Báo cáo Kiểm toán Toàn diện 3 Vòng (`https://grammarpro.io.vn/`)  
> **Tổng hợp:** **28** Lỗi Bố cục Mobile (Vòng 1: `UX-01..28`) + **16** Lỗi Tương tác & Chấm bài (Vòng 2: `DD-01..16`) + **11** Lỗi Luồng cuối & Dữ liệu (Vòng 3: `EC-01..11`) = **55 Hạng mục**  
> **Phân bổ:** **35 HIGH** • **20 MEDIUM & LOW** • **UX Impact TB:** `8.54 / 10` • **Tổng ước tính:** `179 giờ Dev`

---

## 0. Bảng Tổng hợp Theo Phân hệ (Từ Báo cáo Kiểm toán)

| Phân hệ / Màn hình kiểm toán | Vòng 1 (Mobile UI) | Vòng 2 (Logic & Tương tác) | Vòng 3 (Edge Cases & Data) | Tổng vấn đề | HIGH | MEDIUM & LOW | Điểm UX TB | Giờ Dev |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Header & Điều hướng | 5 | 2 | 0 | **7** | 4 | 3 | 8.43 | 24h |
| Tổng quan (Home) | 5 | 0 | 0 | **5** | 3 | 2 | 8.60 | 18h |
| Học tập (12 Chương) | 5 | 2 | 4 | **11** | 7 | 4 | 8.55 | 39h |
| Luyện tập & Sổ từ | 4 | 3 | 0 | **7** | 5 | 2 | 9.00 | 20h |
| TOEIC AI Hub | 5 | 7 | 7 | **19** | 14 | 5 | 8.95 | 59h |
| Thành tích (Gamification) | 2 | 0 | 0 | **2** | 0 | 2 | 8.00 | 5h |
| Gói VIP & Chuyển đổi | 2 | 2 | 0 | **4** | 2 | 2 | 8.25 | 14h |
| **Tổng cộng / Trung bình** | **28** | **16** | **11** | **55** | **35** | **20** | **8.54** | **179h** |

---

## 1. Bản đồ Codebase & Phạm vi Ảnh hưởng (Area & Blast-Radius Map)

| Area | Phân hệ | Files trọng tâm trong Codebase | Blast Radius & Lưu ý để không làm hỏng cái khác |
| :--- | :--- | :--- | :--- |
| **A. Shell, Nav, Theme & Auth** | Header, Bottom Nav, Routing, Sync, Dark Mode, OAuth | [AppShell2026.jsx](file:///d:/grammarproject/grammar-platform/components/ui-2026/AppShell2026.jsx), [design-system-2026.css](file:///d:/grammarproject/grammar-platform/styles/design-system-2026.css), [pages/_app.js](file:///d:/grammarproject/grammar-platform/pages/_app.js), [UnifiedAuthModal.jsx](file:///d:/grammarproject/grammar-platform/components/auth/UnifiedAuthModal.jsx), [SyncStatusIndicator.jsx](file:///d:/grammarproject/grammar-platform/components/sync/SyncStatusIndicator.jsx), [lib/supabase/client.js](file:///d:/grammarproject/grammar-platform/lib/supabase/client.js) | **Cao:** `AppShell2026` bọc cả `/` và `/toeic/*`. Mọi sửa đổi CSS token/z-index/header phải pass `generate-token-report.mjs` (WCAG AA, `z-index <= 1400`) và 20 cases `tests/visual-regression.spec.mjs`. |
| **B. Home Overview** | Trang chủ, Endowed Progress, Leaderboard | [pages/index.js](file:///d:/grammarproject/grammar-platform/pages/index.js), [LeaderboardPanel.jsx](file:///d:/grammarproject/grammar-platform/components/gamification/LeaderboardPanel.jsx), [leaderboard.js](file:///d:/grammarproject/grammar-platform/pages/api/gamification/leaderboard.js) | **Trung bình–Cao:** `pages/index.js` dài 8.077 dòng. Không đổi tên state/localStorage key sẵn có; tách sub-component mới cho Mobile Hero/Accordion thay vì sửa trực tiếp khối Desktop. |
| **C. Study, Dict & Diagnostic 30Q** | 12 Chương, Lý thuyết, Từ điển 1 chạm, Audio, Chẩn đoán 30 câu | [pages/index.js](file:///d:/grammarproject/grammar-platform/pages/index.js), [AcademicRichText.jsx](file:///d:/grammarproject/grammar-platform/components/learning/AcademicRichText.jsx), [AcademicSectionBody.jsx](file:///d:/grammarproject/grammar-platform/components/learning/AcademicSectionBody.jsx), [AudioPlayer.jsx](file:///d:/grammarproject/grammar-platform/components/audio/AudioPlayer.jsx), [pages/api/dictionary.js](file:///d:/grammarproject/grammar-platform/pages/api/dictionary.js), [remedial-engine.js](file:///d:/grammarproject/grammar-platform/lib/explanation/remedial-engine.js), [GrammarDiagnosticEngine.jsx](file:///d:/grammarproject/grammar-platform/components/diagnostic/GrammarDiagnosticEngine.jsx), [DiagnosticAnalysisDashboard.jsx](file:///d:/grammarproject/grammar-platform/components/diagnostic/DiagnosticAnalysisDashboard.jsx), [knowledge-graph.js](file:///d:/grammarproject/grammar-platform/lib/knowledge/knowledge-graph.js) | **Cao:** Bảo toàn dữ liệu 2.939 câu & 12 chương; giữ nguyên contract `QuestionExperienceEngine` (`tests/question-engine.test.mjs` 11/11 PASS) và rule Zero OS Emoji (`validate-zero-os-emoji.mjs`). |
| **D. Practice & Vocab Modal** | Quiz 20/50 câu, Sổ từ, Nộp bài, Scroll | [pages/index.js](file:///d:/grammarproject/grammar-platform/pages/index.js), [components/question-engine/](file:///d:/grammarproject/grammar-platform/components/question-engine), [spaced-repetition.js](file:///d:/grammarproject/grammar-platform/lib/explanation/spaced-repetition.js), [events.js](file:///d:/grammarproject/grammar-platform/pages/api/learning/events.js), [Modal.jsx](file:///d:/grammarproject/grammar-platform/components/design-system/overlays/Modal.jsx) | **Trung bình:** Tách rõ câu *Bỏ trống (Skipped)* khỏi *Sai thật (Wrong)* ở cả LocalStorage lẫn payload `/api/learning/events` để không làm nhiễm SM-2 SRS. |
| **E. TOEIC AI Hub** | Hero, IRT 3 Chặng, Phòng thi 20 Đề, Dictation, SRS Flashcard | [pages/toeic/index.jsx](file:///d:/grammarproject/grammar-platform/pages/toeic/index.jsx), [ToeicHeroBanner.jsx](file:///d:/grammarproject/grammar-platform/components/toeic/ToeicHeroBanner.jsx), [SentenceXRayCard.jsx](file:///d:/grammarproject/grammar-platform/components/toeic/SentenceXRayCard.jsx), [ToeicDiagnosticSession.jsx](file:///d:/grammarproject/grammar-platform/components/toeic/ToeicDiagnosticSession.jsx), [DiagnosticRadarDashboard.jsx](file:///d:/grammarproject/grammar-platform/components/toeic/DiagnosticRadarDashboard.jsx), [MilestoneSkillTree.jsx](file:///d:/grammarproject/grammar-platform/components/toeic/MilestoneSkillTree.jsx), [pages/toeic/tests/[series]/[testNum].jsx](file:///d:/grammarproject/grammar-platform/pages/toeic/tests/[series]/[testNum].jsx), [DictationStudio.jsx](file:///d:/grammarproject/grammar-platform/components/toeic/DictationStudio.jsx), [pages/toeic/mistakes-srs.jsx](file:///d:/grammarproject/grammar-platform/pages/toeic/mistakes-srs.jsx), [toeic-ui-2026.css](file:///d:/grammarproject/grammar-platform/styles/toeic-ui-2026.css), [lib/toeic/](file:///d:/grammarproject/grammar-platform/lib/toeic) | **Cao (Ưu tiên #1):** Chứa 14/35 lỗi `HIGH`. Sửa data/grading (`DD-01`, `DD-02`, `EC-05..08`) phải kiểm tra đối chiếu answer key và logic submit trên API lẫn UI. |
| **F. Gamification** | Huy hiệu, Nhiệm vụ Ngày/Tuần | [GamificationHub.jsx](file:///d:/grammarproject/grammar-platform/components/gamification/GamificationHub.jsx), [achievement-engine.js](file:///d:/grammarproject/grammar-platform/lib/gamification/achievement-engine.js), [challenge-streak-engine.js](file:///d:/grammarproject/grammar-platform/lib/gamification/challenge-streak-engine.js) | **Thấp:** Cô lập trong `GamificationHub.jsx`; chạy `tests/gamification-engine.test.mjs` khi chạm engine. |
| **G. VIP & Checkout** | Bảng giá, Khuyến mãi, VietQR, Dark Mode thẻ Free | [MonetizationHub.jsx](file:///d:/grammarproject/grammar-platform/components/monetization/MonetizationHub.jsx), [SmartPaywallModal.jsx](file:///d:/grammarproject/grammar-platform/components/monetization/SmartPaywallModal.jsx), [overview.js](file:///d:/grammarproject/grammar-platform/pages/api/monetization/overview.js), [checkout.js](file:///d:/grammarproject/grammar-platform/pages/api/monetization/checkout.js), [pages/index.js](file:///d:/grammarproject/grammar-platform/pages/index.js#L7299) | **Trung bình:** Giữ nguyên Sepay VietQR webhook & `tests/monetization-engine.test.mjs` + `tests/analytics-m47.test.mjs` (FTC-Safe, không dark pattern). |

---

## 2. Lộ trình Plan Fix (4 Waves An Toàn)

1. **Wave 1 — Quick Wins, Chính xác Học thuật & Lỗi Dữ liệu/Logic (16 issues, rủi ro thấp):**  
   `UX-06`, `UX-19`, `DD-01`, `DD-02`, `DD-03`, `DD-04`, `DD-06`, `DD-10`, `DD-14` (toán giá), `EC-03`, `EC-05`, `EC-06`, `EC-07`, `EC-08`, `EC-09`, `EC-10`.
2. **Wave 2 — State Sync, Auth, Dictionary & Grading Hygiene (14 issues):**  
   `UX-02`, `UX-03`, `UX-05`, `UX-09`, `DD-05`, `DD-08`, `DD-09`, `DD-12`, `DD-13`, `DD-15`, `EC-01`, `EC-02`, `EC-04`, `EC-11`.
3. **Wave 3 — Mobile-First Shell, Bottom Nav & Drawers (7 issues, `SPEC-01..06`):**  
   `UX-01`, `UX-04`, `UX-11`, `UX-16`, `UX-20`, `UX-22`, `DD-16`.
4. **Wave 4 — Mobile Ergonomics, Micro-learning & Conversion (18 issues + `RET-01..10`, `SPEC-07..08`):**  
   `UX-07`, `UX-08`, `UX-10`, `UX-12`, `UX-13`, `UX-14`, `UX-15`, `UX-17`, `UX-18`, `UX-21`, `UX-23`, `UX-24`, `UX-25`, `UX-26`, `UX-27`, `UX-28`, `DD-07`, `DD-11`, `DD-14` (1-Tap VietQR Checkout).

---

## 3. VÒNG 1: 28 Hạng mục Bố cục, Điều hướng & Công thái học Mobile (`UX-01` → `UX-28`)

### Area A — Header & Điều hướng

- [x] **UX-01** | `HIGH` | UX: `10/10` | `6h` | `Wave 3` | `Area A` | Status: `FIXED (Preview)`
  - **URL:** `https://grammarpro.io.vn/`
  - **Thành phần UI:** Sticky Header (13 phần tử trên 1 hàng ngang)
  - **Hiện trạng thực tế:** Trên cùng 1 thanh Header đang nhồi nhét 3 cụm lớn: Logo + 6 tab điều hướng (`Tổng quan`, `Học tập`, `Luyện tập`, `TOEIC AI`, `Thành tích`, `Gói VIP`) + 7 badge/nút bên phải (`Đã đồng bộ`, `Sách`, `Sao`, `Theme`, `Streak 1d`, `50 XP`, `Đăng nhập`).
  - **Tại sao cần sửa:** Trên màn hình điện thoại (`375px–430px`), chiều ngang cực kỳ hạn chế. Việc đặt 13 phần tử khiến các nút bị ép sát, rớt dòng hoặc phải cuộn ngang, gây quá tải thị giác (Visual Clutter) ngay giây đầu tiên và dễ bấm nhầm bằng ngón cái.
  - **Giải pháp đề xuất:** Tách thành: (1) Top Bar tối giản cao `52px` chỉ giữ Logo, Chuỗi ngày (`1d`), XP và Avatar/Đăng nhập; (2) Chuyển 6 mục chính xuống Thanh Điều Hướng Đáy (Fixed Bottom Navigation Bar 5 tab + menu thêm) nằm đúng vùng ngón cái.
  - **Retention Hook:** Giảm 60% nhiễu thị giác đầu trang; giúp người dùng điện thoại chuyển qua lại giữa Học tập – Luyện tập – TOEIC chỉ bằng 1 chạm ngón cái (Thumb-Zone Ergonomics).
  - **Files & Blast Radius:** `components/ui-2026/AppShell2026.jsx`, `styles/design-system-2026.css`. Cần giữ nguyên desktop header `>= 768px` và thêm `padding-bottom` tránh Bottom Nav che nội dung ở mobile.

- [x] **UX-02** | `HIGH` | UX: `9/10` | `3h` | `Wave 2` | `Area A` | Status: `FIXED (Preview)`
  - **URL:** `https://grammarpro.io.vn/toeic`
  - **Thành phần UI:** Đồng bộ trạng thái Gamification (`Sao`, `Streak`, `XP`) trên Header
  - **Hiện trạng thực tế:** Ở trang chủ `/`, Header hiển thị `'2 sao'`, chuỗi `'1d'`, `'50 XP'`. Nhưng khi bấm sang tab `'TOEIC AI'` (`/toeic`), toàn bộ chỉ số trên Header bị reset về `'0 sao'`, `'0d'`, `'0 XP'`.
  - **Tại sao cần sửa:** Trong tâm lý học Gamification, điểm XP và chuỗi ngày học (Streak) là tài sản tinh thần của người học. Thấy điểm bị về `0` khi đổi tab trên điện thoại khiến người dùng tưởng web bị lỗi mất dữ liệu, gây hẫng hụt và mất động lực học tiếp.
  - **Giải pháp đề xuất:** Đồng bộ Global State (Context + LocalStorage/Supabase) cho XP, Streak và số từ đã lưu xuyên suốt mọi route (`/` và `/toeic/*`).
  - **Retention Hook:** Bảo toàn cảm giác tích lũy liên tục (Loss Aversion & Progress Continuity), giữ người dùng yên tâm cày XP ở cả ngữ pháp lẫn TOEIC.
  - **Files & Blast Radius:** `components/ui-2026/AppShell2026.jsx`, `pages/_app.js`, `pages/toeic/*.jsx`, `lib/sync/sync-manager.js`. Tránh hydration mismatch SSR/CSR bằng cách đồng bộ sau mount (`useEffect`).

- [x] **UX-03** | `MEDIUM` | UX: `7/10` | `2h` | `Wave 2` | `Area A` | Status: `FIXED (Preview)`
  - **URL:** `https://grammarpro.io.vn/?view=gamification`
  - **Thành phần UI:** URL Routing khi chuyển giữa tab `'Thành tích'` và `'Gói VIP'`
  - **Hiện trạng thực tế:** Khi người dùng nhấp vào tab `'Gói VIP'`, nội dung trang thay đổi sang bảng giá VIP nhưng URL trên trình duyệt vẫn giữ nguyên là `?view=gamification` thay vì đổi sang `?view=vip` hoặc `/vip`.
  - **Tại sao cần sửa:** Người dùng điện thoại rất hay dùng cử chỉ vuốt cạnh màn hình (Swipe Back) hoặc bấm nút Back vật lý. URL không khớp nội dung làm hỏng lịch sử duyệt web trên điện thoại (bấm Back văng thẳng ra khỏi web) và không gửi link thẳng vào trang VIP qua Zalo/Messenger được.
  - **Giải pháp đề xuất:** Cập nhật query param rõ ràng (`/?view=vip` hoặc route riêng `/vip`) và đồng bộ với `router.push` của Next.js để hỗ trợ cử chỉ Swipe Back trên iOS/Android.
  - **Retention Hook:** Giúp chia sẻ link ưu đãi VIP qua Zalo/Messenger mượt mà và ngăn người dùng điện thoại vô tình thoát trang khi vuốt quay lại.
  - **Files & Blast Radius:** `pages/index.js`, `components/ui-2026/AppShell2026.jsx`. Đọc `router.query.view` cả lúc mount lẫn khi `router` / `popstate` thay đổi.

- [x] **UX-04** | `HIGH` | UX: `8/10` | `4h` | `Wave 3` | `Area A/E` | Status: `FIXED (Preview)`
  - **URL:** `https://grammarpro.io.vn/toeic`
  - **Thành phần UI:** Ba tầng thanh điều hướng chồng nhau (Triple Navigation Bars)
  - **Hiện trạng thực tế:** Khi vào mục `'TOEIC AI'`, người dùng thấy 6 tab trên Header chính, ngay bên dưới lại xuất hiện thêm 5 tab phụ (`Trung tâm TOEIC`, `Test Chẩn Đoán AI`, `20 Đề TOEIC New Format 2026`, `Dictation Studio`, `Sổ Tay Flashcard`), bên dưới nữa còn có thêm 3 tab con.
  - **Tại sao cần sửa:** Ba tầng tab liên tiếp chiếm tới `35–40%` chiều dọc màn hình điện thoại trước khi người dùng thấy nội dung thật. Người dùng mobile dễ bị lạc (Navigation Fatigue) và mỏi mắt vì chữ trong các thanh tab rớt dòng.
  - **Giải pháp đề xuất:** Khi đã chuyển Main Nav xuống Bottom Bar, gom 5 tab phụ của TOEIC thành thanh Horizontal Scrollable Chips mảnh (cao `40px`, `overflow-x: auto`, ẩn scrollbar, có hiệu ứng mờ 2 mép) dính ngay dưới Top Bar.
  - **Retention Hook:** Giải phóng không gian màn hình dọc trên điện thoại để lộ ngay bài test/bài học ở nửa trên màn hình (Above the Fold).
  - **Files & Blast Radius:** `pages/toeic/index.jsx`, `components/ui-2026/AppShell2026.jsx`, `styles/toeic-ui-2026.css`.

- [x] **UX-05** | `MEDIUM` | UX: `8/10` | `3h` | `Wave 2` | `Area A` | Status: `FIXED (Preview)`
  - **URL:** `https://grammarpro.io.vn/`
  - **Thành phần UI:** Badge `'Đã đồng bộ'` và nút icon Sách/Mặt trời không có nhãn rõ ràng
  - **Hiện trạng thực tế:** Cụm bên phải Header hiển thị badge `'Đã đồng bộ'` ngay cả khi người dùng là `'Khách (Chưa đăng nhập)'`, kèm icon sách và mặt trời đứng sát nhau không có chú thích.
  - **Tại sao cần sửa:** Báo `'Đã đồng bộ'` khi chưa đăng nhập gây hiểu lầm rằng dữ liệu đã lưu lên mây (thực tế xóa trình duyệt mobile hoặc mở từ in-app browser Zalo/Facebook sẽ mất hết). Ngoài ra trên màn hình cảm ứng không có thao tác rê chuột (Hover) để xem tooltip.
  - **Giải pháp đề xuất:** Khi chưa đăng nhập, đổi trạng thái thành chip vàng `'Lưu tiến trình (1 chạm)'` mở Bottom Sheet đăng nhập Google; gộp nút đổi Theme Sáng/Tối vào menu Cá nhân.
  - **Retention Hook:** Tạo động lực đăng nhập tự nhiên trên điện thoại để bảo vệ chuỗi ngày học và XP vừa kiếm được.
  - **Files & Blast Radius:** `components/sync/SyncStatusIndicator.jsx`, `components/ui-2026/AppShell2026.jsx`. Giữ nguyên logic sync thực tế khi user đã đăng nhập.

---

### Area B — Tổng quan (Home)

- [x] **UX-06** | `HIGH` | UX: `9/10` | `1h` | `Wave 1` | `Area B` | Status: `FIXED (Preview)`
  - **URL:** `https://grammarpro.io.vn/`
  - **Thành phần UI:** Lỗi chính tả tiêu đề bài học chính: `'Chương 1: Thi hiện tại đơn'`
  - **Hiện trạng thực tế:** Tại Thẻ điều hướng nhanh số 1 và Thẻ `'BÀI HỌC TIẾP THEO'` ở ngay trung tâm trang Tổng quan, tiêu đề đang viết là `'Chương 1: Thi hiện tại đơn'` (thiếu dấu huyền ở chữ `'Thì'`).
  - **Tại sao cần sửa:** Đây là nền tảng dạy Ngữ pháp (GrammarPro). Trên màn hình điện thoại, thẻ `'HỌC TIẾP HÔM NAY'` nằm ngay vị trí đầu tiên đập vào mắt; một lỗi chính tả ở tiêu đề lớn nhất làm giảm mạnh độ tin cậy học thuật chỉ trong 3 giây đầu.
  - **Giải pháp đề xuất:** Sửa ngay chuỗi dữ liệu tiêu đề Chương 1 thành `'Chương 1: Thì hiện tại đơn'` ở toàn bộ cơ sở dữ liệu / file constant trang chủ.
  - **Retention Hook:** Củng cố niềm tin tức thì về sự chỉn chu, chuyên nghiệp của nền tảng giáo dục ngay từ màn hình đầu tiên trên di động.
  - **Files & Blast Radius:** Kiểm tra `data/ui/preview_data.json`, `data/grammar.json`, `pages/index.js`. Chỉ sửa đúng label hiển thị, không đổi ID/slug bài học.

- [x] **UX-07** | `HIGH` | UX: `10/10` | `6h` | `Wave 4` | `Area B` | Status: `FIXED (Preview)`
  - **URL:** `https://grammarpro.io.vn/`
  - **Thành phần UI:** Mật độ thông tin quá tải trên trang chủ (7 khối lớn xếp chồng)
  - **Hiện trạng thực tế:** Trang Tổng quan đang hiển thị cùng lúc: Banner chào mừng + Chuỗi 7 ngày + 3 thẻ điều hướng nhanh + Thanh tab con + 4 thẻ thống kê + 2 thẻ Bài học & SM-2 + Bảng xếp hạng Live.
  - **Tại sao cần sửa:** Trên màn hình dọc điện thoại, 7 khối này xếp chồng tạo thành một trang dài hơn 5 lần chiều cao màn hình với hơn 10 nút CTA cạnh tranh nhau. Theo Định luật Hick (Hick's Law), người dùng mobile bị tê liệt quyết định và thoát ra.
  - **Giải pháp đề xuất:** Thiết kế lại luồng Progressive Disclosure cho Mobile: Màn hình đầu (Above the Fold) chỉ tập trung vào 1 thẻ Hero duy nhất `'Làm 3 câu bắt bệnh ngữ pháp (60 giây)'` hoặc `'Học tiếp Chương 1'`. Thu gọn 4 thẻ thống kê thành 1 dải Bento 2x2 gọn gàng.
  - **Retention Hook:** Đưa người dùng điện thoại vào hành động học đầu tiên trong vòng dưới 10 giây (Time-to-First-Action), yếu tố sống còn để giữ chân D1.
  - **Files & Blast Radius:** `pages/index.js`, `styles/design-system-2026.css`. Nên tách component mobile riêng để không làm rối layout Desktop đang ổn định.

- [x] **UX-08** | `HIGH` | UX: `9/10` | `4h` | `Wave 4` | `Area B` | Status: `FIXED (Preview)`
  - **URL:** `https://grammarpro.io.vn/`
  - **Thành phần UI:** Trạng thái `'0 / 53'`, `'0 / 2939'`, `'0%'` xuất hiện dày đặc với người mới
  - **Hiện trạng thực tế:** Người dùng mới vào thấy hàng loạt con số 0: `'0% hoàn thành'`, `'0 / 53 bài học'`, `'0 / 2939 câu đã giải đúng'`, `'0 / 10 câu bài tập (0%)'`, `'Thành thạo: 0/53'`.
  - **Tại sao cần sửa:** Người dùng điện thoại thường học tranh thủ trong các khoảng thời gian ngắn (`5–10` phút trên xe buýt, giờ nghỉ). Nhìn thấy con số khổng lồ `'0 / 2939 câu'` tạo cảm giác quá tải và nản lòng ngay từ đầu.
  - **Giải pháp đề xuất:** Áp dụng hiệu ứng Endowed Progress (Tiến trình được tặng trước): Khởi tạo sẵn `'Bước 1/3: Khởi động (33%)'` và chia nhỏ mục tiêu hiển thị thành `'Mục tiêu Hôm nay: Hoàn thành 5 câu nhanh (3 phút)'` thay vì phơi bày `0/2939`.
  - **Retention Hook:** Kích hoạt hiệu ứng tâm lý Zeigarnik (muốn hoàn thành nốt phần dang dở), tăng tỷ lệ bắt đầu bài học đầu tiên trên di động lên gấp đôi.
  - **Files & Blast Radius:** `pages/index.js`, `lib/gamification/xp-level-engine.js`. Chỉ đổi cách trình bày progress cho người mới, không sai lệch số liệu thật trong DB.

- [x] **UX-09** | `MEDIUM` | UX: `8/10` | `2h` | `Wave 2` | `Area B` | Status: `FIXED (Preview)`
  - **URL:** `https://grammarpro.io.vn/`
  - **Thành phần UI:** Khối Bảng Xếp Hạng (Leaderboard) hiển thị tên tài khoản rác (`'#2 test'`, `'#4 le thi a'`)
  - **Hiện trạng thực tế:** Trong khối `'Bảng Xếp Hạng Thành Tích (LIVE)'`, vị trí `#1` là `'Elon Must (425 XP)'`, `#2` là `'test (285 XP)'`, `#3` là `'vnduy'`, `#4` là `'le thi a'`.
  - **Tại sao cần sửa:** Hiển thị tài khoản tên `'test'` ngay vị trí Á quân làm lộ cảm giác web đang trong giai đoạn thử nghiệm, giảm tính cạnh tranh thực tế và sự sôi động của cộng đồng học viên.
  - **Giải pháp đề xuất:** Lọc ẩn các tài khoản dev/test khỏi truy vấn Leaderboard công khai; bổ sung avatar minh họa sinh động và ghim thanh thứ hạng của chính người dùng ở đáy khối (`'Bạn cần thêm 50 XP để lọt Top 10 hôm nay!'`).
  - **Retention Hook:** Tạo hiệu ứng Social Proof chân thực và kích thích tâm lý đua top (Competitive Drive) mỗi ngày trên điện thoại.
  - **Files & Blast Radius:** `pages/api/gamification/leaderboard.js`, `components/gamification/LeaderboardPanel.jsx`. Không xóa user trong DB, chỉ lọc ở tầng query công khai.

- [x] **UX-10** | `MEDIUM` | UX: `7/10` | `5h` | `Wave 4` | `Area B` | Status: `FIXED (Preview)`
  - **URL:** `https://grammarpro.io.vn/`
  - **Thành phần UI:** Lưới 3 cột × 4 hàng (12 Chuyên đề) và 5 nút Target Score trong các tab con
  - **Hiện trạng thực tế:** Trong tab `'Phân tích 12 Chuyên đề'` và `'Khám phá AI & TOEIC'`, các lưới 3–4 cột cùng dãy 5 nút chọn mục tiêu (`Target 500+` đến `990+`) và 3 nút CTA dài nằm ngang.
  - **Tại sao cần sửa:** Trên màn hình dọc điện thoại, việc xếp 12 thẻ thành 1 cột dọc dài khiến người dùng phải vuốt cuộn 4–5 màn hình mới hết; cụm 5 nút Target Score và 3 nút CTA dài bị rớt dòng lộn xộn.
  - **Giải pháp đề xuất:** Chuyển danh sách 12 chuyên đề trên mobile sang dạng Accordion theo 3 chặng (`Nền tảng -> Trung cấp -> Nâng cao`) hoặc Swipeable Horizontal Cards; chuyển 5 nút Target Score thành thanh kéo Touch Slider mượt mà.
  - **Retention Hook:** Tương tác kéo thanh trượt bằng ngón tay để chọn điểm mục tiêu TOEIC mang lại cảm giác cá nhân hóa tức thì và thú vị hơn bấm nút tĩnh.
  - **Files & Blast Radius:** `pages/index.js`, `components/toeic/ToeicHeroBanner.jsx`.

---

### Area C — Học tập (12 Chương)

- [x] **UX-11** | `HIGH` | UX: `10/10` | `5h` | `Wave 3` | `Area C` | Status: `FIXED (Preview)`
  - **URL:** `https://grammarpro.io.vn/`
  - **Thành phần UI:** Sidebar mục lục 12 chuyên đề (2 cột: Sidebar trái + Nội dung phải)
  - **Hiện trạng thực tế:** Giao diện Học tập chia 2 cột: Sidebar trái chứa ô tìm kiếm và danh sách 12 chuyên đề mở rộng, cột phải là nội dung bài học. Có nút `'Thu gọn mục lục'` ở góc phải trên.
  - **Tại sao cần sửa:** Trên màn hình điện thoại, nếu Sidebar xếp chồng lên trên nội dung bài học thì người dùng phải cuộn qua toàn bộ danh sách 12 chương mới đọc được lý thuyết; nếu giữ 2 cột thì cột bài học bị bóp nghẹt không đọc nổi.
  - **Giải pháp đề xuất:** Trên Mobile (`< 768px`), mặc định ẩn Sidebar và thay bằng một thanh Sticky Topic Bar gọn ở đỉnh (`'Chương 1: Thì hiện tại đơn [Đổi bài v]'`). Khi chạm vào sẽ trượt lên một Bottom Sheet Drawer (cao `80vh`) để chọn bài.
  - **Retention Hook:** Đưa nội dung bài học lên ngay đầu màn hình điện thoại, chuyển bài nhanh bằng 1 tay không cần cuộn ngược lên đầu trang.
  - **Files & Blast Radius:** `pages/index.js`, `styles/design-system-2026.css`. Giữ nguyên 2-column sidebar trên desktop `>= 768px`.

- [x] **UX-12** | `HIGH` | UX: `8/10` | `4h` | `Wave 4` | `Area C` | Status: `FIXED (Preview)`
  - **URL:** `https://grammarpro.io.vn/`
  - **Thành phần UI:** 6 nút neo mục lục (`01.–06.`) và Lưới 3 cột Công thức `(+ / - / ?)`
  - **Hiện trạng thực tế:** Phần Lý thuyết hiển thị 6 nút mục lục và lưới 3 cột song song: Khẳng định `(+)` màu xanh lá, Phủ định `(-)` màu đỏ, Nghi vấn `(?)` màu xanh dương, bên dưới là nội dung dài.
  - **Tại sao cần sửa:** Đọc văn bản lý thuyết dài liên tục trên màn hình điện thoại rất dễ gây mỏi mắt (Wall of Text). Lưới 3 cột công thức khi co lại trên màn hình `375px` làm công thức `'S + V(s/es)'` bị ngắt dòng hoặc kéo dài trang.
  - **Giải pháp đề xuất:** Chuyển khối 3 công thức `(+ / - / ?)` trên mobile thành dạng Segmented Control / Swipeable Cards (vuốt ngang xem từng thể Khẳng định / Phủ định / Nghi vấn) với cỡ chữ công thức lớn (`18px` bold) và nút `'Chạm nghe phát âm ví dụ'`.
  - **Retention Hook:** Biến việc đọc lý thuyết khô khan trên điện thoại thành thao tác vuốt thẻ tương tác kiểu Micro-learning (giống Duolingo/Quizlet).
  - **Files & Blast Radius:** `pages/index.js`, `components/learning/AcademicSectionBody.jsx`.

- [x] **UX-13** | `HIGH` | UX: `10/10` | `8h` | `Wave 4` | `Area C` | Status: `FIXED (Preview)`
  - **URL:** `https://grammarpro.io.vn/`
  - **Thành phần UI:** Ô input `'Nhập câu trả lời...'` trong tab Bài tập thực hành (8)
  - **Hiện trạng thực tế:** Các câu hỏi trong EXERCISE I yêu cầu người dùng bấm vào ô text input `'Nhập câu trả lời...'` để tự gõ chữ trên bàn phím, kèm nút `'Kiểm tra'` và `'Đáp án'`.
  - **Tại sao cần sửa:** Trên điện thoại, mỗi lần chạm vào ô input, bàn phím ảo iOS/Android bật lên chiếm `50%` diện tích màn hình, che khuất đề bài, đồng thời tự động viết hoa chữ cái đầu (auto-capitalize) hoặc tự sửa từ (autocorrect) gây sai đáp án rất ức chế.
  - **Giải pháp đề xuất:** Chuyển 80% câu hỏi trên mobile sang dạng Word Bricks / Tap-to-Fill (chạm vào các thẻ từ có sẵn để ghép vào chỗ trống) hoặc chọn nhanh 3–4 chip đáp án; với ô cần gõ phím, thêm thuộc tính `autoCapitalize='none' autoCorrect='off' spellCheck='false'`.
  - **Retention Hook:** Loại bỏ hoàn toàn rào cản gõ bàn phím ảo trên điện thoại, tăng tốc độ làm bài gấp 3 lần và giữ mạch dopamine liên tục.
  - **Files & Blast Radius:** `components/question-engine/renderers/TextInputRenderer.jsx`, `components/question-engine/renderers/MultiBlankRenderer.jsx`, `QuestionExperienceEngine`. Phải giữ pass 11/11 `tests/question-engine.test.mjs`.

- [x] **UX-14** | `MEDIUM` | UX: `8/10` | `3h` | `Wave 4` | `Area C` | Status: `FIXED (Preview)`
  - **URL:** `https://grammarpro.io.vn/`
  - **Thành phần UI:** Nút `'Đánh dấu đã học xong (+25 XP)'` đặt ở ngay thẻ giới thiệu đầu bài
  - **Hiện trạng thực tế:** Nút nhận `'+25 XP'` nằm ở phần đầu bài học trước khi người dùng kịp đọc hết 6 mục lý thuyết bên dưới.
  - **Tại sao cần sửa:** Đặt nút hoàn thành ở đầu bài khiến người dùng bấm lấy XP ngay mà không đọc bài, hoặc khi cuộn đọc xong xuống tận đáy bài học trên điện thoại lại không thấy nút hoàn thành đâu để chuyển sang làm Bài tập.
  - **Giải pháp đề xuất:** Đặt thanh tiến trình đọc (Reading Progress Bar) mảnh ở đỉnh màn hình và đặt nút lớn Full-width `'Hoàn thành lý thuyết (+25 XP) & Chuyển sang Bài tập ->'` ở cuối bài học kèm hiệu ứng pháo giấy (Confetti).
  - **Retention Hook:** Tạo phần thưởng xứng đáng sau khi cuộn đọc xong (Rewarded Completion) và dẫn thẳng sang tab Bài tập thực hành không bị đứt mạch.
  - **Files & Blast Radius:** `pages/index.js`.

- [x] **UX-15** | `MEDIUM` | UX: `7/10` | `2h` | `Wave 4` | `Area C` | Status: `FIXED (Preview)`
  - **URL:** `https://grammarpro.io.vn/`
  - **Thành phần UI:** Bảng `'Ma Trận Đánh Giá 10 Nhóm Kiến Thức'` (4 cột × 10 hàng) trong tab Kiểm tra trình độ
  - **Hiện trạng thực tế:** Bên dưới Hero Card của tab Kiểm tra trình độ là một bảng dữ liệu 4 cột (`'Chuyên đề'`, `'Số câu'`, `'Tỷ lệ'`, `'Phân bổ độ khó'`) gồm 10 hàng.
  - **Tại sao cần sửa:** Bảng 4 cột nhiều chữ trên màn hình hẹp `375px` bị ép cột làm rớt dòng lộn xộn hoặc buộc cuộn ngang, trong khi người dùng trên điện thoại chỉ muốn bấm `'Bắt đầu bài kiểm tra'` ngay chứ không muốn đọc bảng ma trận kỹ thuật dài.
  - **Giải pháp đề xuất:** Thu gọn bảng Ma trận mặc định vào một Accordion `'Xem chi tiết cấu trúc 10 chuyên đề đề thi (Chạm để mở)'` và hiển thị dưới dạng danh sách thẻ gọn (Mobile Compact Cards) kèm thanh tỷ lệ trực quan.
  - **Retention Hook:** Giữ màn hình bắt đầu bài test trên điện thoại gọn gàng, tập trung 100% sự chú ý vào nút CTA `'Bắt đầu bài kiểm tra chẩn đoán'`.
  - **Files & Blast Radius:** `components/diagnostic/DiagnosticOnboarding.jsx`, `pages/index.js`.

---

### Area D — Luyện tập & Sổ từ

- [x] **UX-16** | `HIGH` | UX: `9/10` | `2h` | `Wave 3` | `Area D` | Status: `FIXED (Preview)`
  - **URL:** `https://grammarpro.io.vn/`
  - **Thành phần UI:** Modal `'Sổ từ (2)'`: Lỗi độ tương phản tiêu đề chữ tối trên nền modal tối
  - **Hiện trạng thực tế:** Khi bấm nút `'Sổ từ (2)'` mở cửa sổ popup nền tối, dòng tiêu đề `'Sổ tay từ vựng của Khách (Chưa đăng nhập)'` đang dùng màu chữ tối trên nền tối nên gần như bị chìm mất, rất khó đọc.
  - **Tại sao cần sửa:** Vi phạm nghiêm trọng chuẩn tương phản WCAG 2.2 AA (tỷ lệ tương phản `< 2:1`). Trên màn hình điện thoại khi dùng ngoài trời hoặc hạ độ sáng ban đêm, người dùng hoàn toàn không đọc được tiêu đề modal.
  - **Giải pháp đề xuất:** Đổi màu chữ tiêu đề modal sang trắng sáng (`#F8FAFC`) hoặc vàng nhạt (`#FDE68A`), đồng thời thiết kế modal Sổ từ trên mobile dưới dạng Slide-up Bottom Sheet (trượt từ đáy lên `85%` màn hình, vuốt xuống để đóng).
  - **Retention Hook:** Khắc phục lỗi hiển thị tức thì và giúp thao tác tra/ôn từ vựng trên điện thoại mượt như ứng dụng gốc (Native App).
  - **Files & Blast Radius:** `pages/index.js`, `styles/design-system-2026.css`, `components/design-system/overlays/Modal.jsx`. Verify bằng `validate-color-contrast.mjs`.

- [x] **UX-17** | `HIGH` | UX: `10/10` | `6h` | `Wave 4` | `Area D` | Status: `FIXED (Preview)`
  - **URL:** `https://grammarpro.io.vn/`
  - **Thành phần UI:** Danh sách 20 câu hỏi Quiz xếp dọc toàn bộ trên 1 trang dài
  - **Hiện trạng thực tế:** Tab `'Làm đề trắc nghiệm'` hiển thị cả 20 thẻ câu hỏi nối đuôi nhau theo chiều dọc trên cùng một trang, nút `'Nộp bài chấm điểm'` lại nằm ở thẻ đầu trang.
  - **Tại sao cần sửa:** Trên điện thoại, cuộn qua 20 thẻ câu hỏi rất mỏi ngón tay; khi làm xong câu 20 ở tận dưới đáy, người dùng lại phải cuộn ngược lên tít đầu trang mới thấy nút `'Nộp bài chấm điểm'`.
  - **Giải pháp đề xuất:** Cung cấp chế độ `'Focus Mode (Từng câu một)'` mặc định cho Mobile: Mỗi màn hình chỉ hiển thị 1 câu hỏi + thanh tiến độ trên cùng (`1/20`) + thanh nút `'Kiểm tra / Câu tiếp'` ghim cố định ở đáy màn hình (Sticky Bottom Action Bar).
  - **Retention Hook:** Trải nghiệm làm bài tập trung 100% bằng 1 tay trên điện thoại, không phải cuộn trang, tăng tỷ lệ hoàn thành trọn vẹn đề 20 câu từ `~30%` lên `>75%`.
  - **Files & Blast Radius:** `pages/index.js`, `components/question-engine/`.

- [x] **UX-18** | `HIGH` | UX: `9/10` | `3h` | `Wave 4` | `Area D` | Status: `FIXED (Preview)`
  - **URL:** `https://grammarpro.io.vn/`
  - **Thành phần UI:** Cảnh báo giới hạn dùng thử và nút khóa lặp lại dày đặc ở đầu trang Luyện tập
  - **Hiện trạng thực tế:** Ngay đầu trang Luyện tập xuất hiện liên tiếp: Badge vàng `'KHÁCH DÙNG THỬ • 20/50 CÂU (KHÔNG TRỘN ĐỀ)'`, tiêu đề `'Giới hạn 20 câu cố định'`, 2 nút bị khóa `'(Cần Login)'`, rồi lại thêm 1 banner vàng cảnh báo giới hạn kèm nút mở khóa VIP.
  - **Tại sao cần sửa:** Trên màn hình nhỏ của điện thoại, 2 khối cảnh báo giới hạn này chiếm trọn toàn bộ nửa trên màn hình (Above the Fold), đẩy câu hỏi số 1 tụt xuống dưới và tạo tâm lý bị làm phiền (Paywall Frustration) trước cả khi người dùng kịp làm thử.
  - **Giải pháp đề xuất:** Gỡ bỏ các banner cảnh báo tiêu cực ở đầu trang; cho phép người dùng điện thoại vào làm ngay câu `1–5` thật sướng tay. Chỉ hiển thị thẻ mời `'Đăng nhập 1 chạm để mở khóa trộn đề AI'` sau khi họ vừa hoàn thành 5 câu đúng liên tiếp.
  - **Retention Hook:** Áp dụng nguyên tắc `'Give Value First'` (Trao giá trị trước khi xin chuyển đổi), tăng thiện cảm và tỷ lệ đăng ký tài khoản trên di động.
  - **Files & Blast Radius:** `pages/index.js`, `components/monetization/SmartPaywallModal.jsx`.

- [x] **UX-19** | `HIGH` | UX: `9/10` | `1h` | `Wave 1` | `Area D/G` | Status: `FIXED (Preview)`
  - **URL:** `https://grammarpro.io.vn/`
  - **Thành phần UI:** Mâu thuẫn giá VIP giữa Banner Luyện tập (`'Chỉ 29k'`) và Bảng giá Gói VIP (`'39.000đ'`)
  - **Hiện trạng thực tế:** Banner vàng tại mục Luyện tập hiển thị nút CTA `'Mở khóa VIP (Chỉ 29k) ->'`, nhưng khi người dùng bấm sang mục Gói VIP thì gói thấp nhất (VIP Tháng Linh Hoạt) lại có giá là `'39.000đ'` (hoặc tính trung bình gói năm là `~8.250đ/tháng`).
  - **Tại sao cần sửa:** Sự bất nhất về con số giá (`'29k'` so với `'39k'`) gây cảm giác thiếu minh bạch (Bait-and-Switch), làm giảm tỷ lệ chốt đơn ở bước thanh toán cuối cùng trên điện thoại.
  - **Giải pháp đề xuất:** Đồng bộ chính xác thông điệp giá ở mọi điểm chạm: Đổi thành `'Mở khóa VIP (Chỉ từ 8.250đ/tháng)'` hoặc khớp đúng gói `'39k/tháng'` theo bảng giá chính thức.
  - **Retention Hook:** Xây dựng niềm tin tuyệt đối về giá cả minh bạch (Ethical Pricing), tăng tỷ lệ chuyển đổi sang trang thanh toán.
  - **Files & Blast Radius:** `pages/index.js:7299`, `components/monetization/MonetizationHub.jsx`.

---

### Area E — TOEIC AI Hub

- [x] **UX-20** | `HIGH` | UX: `8/10` | `3h` | `Wave 3` | `Area E` | Status: `FIXED (Preview)`
  - **URL:** `https://grammarpro.io.vn/toeic/diagnostic`
  - **Thành phần UI:** Gợi ý phím cứng `'Phím 1'` – `'Phím 4'` và Bảng câu hỏi 5x2 cột bên phải trên trang Test Chẩn Đoán
  - **Hiện trạng thực tế:** Trong màn hình `/toeic/diagnostic`, 4 đáp án A-B-C-D hiển thị nhãn phụ `'Phím 1'`, `'Phím 2'`, `'Phím 3'`, `'Phím 4'` và cột phải chiếm `30%` màn hình để hiện lưới số câu `1–10`.
  - **Tại sao cần sửa:** Người dùng điện thoại thao tác bằng màn hình cảm ứng, hoàn toàn không có bàn phím cứng để bấm Phím `1–4`. Nhãn này vừa thừa vừa làm hẹp chiều ngang câu đáp án. Ngoài ra cột bảng câu hỏi bên phải bị đẩy tuốt xuống đáy trên mobile.
  - **Giải pháp đề xuất:** Dùng CSS/Media Query ẩn nhãn `'Phím 1–4'` trên thiết bị cảm ứng (`@media (hover: none)`); gom bảng điều hướng 10 câu thành dải chấm tiến độ ngang (Compact Progress Dots) ngay trên đỉnh thẻ câu hỏi.
  - **Retention Hook:** Giao diện làm test trên điện thoại sạch sẽ, chuyên nghiệp như app luyện thi TOEIC gốc trên App Store / Google Play.
  - **Files & Blast Radius:** `components/toeic/ToeicDiagnosticSession.jsx`, `styles/toeic-ui-2026.css`.

- [x] **UX-21** | `MEDIUM` | UX: `8/10` | `4h` | `Wave 4` | `Area E` | Status: `FIXED (Preview)`
  - **URL:** `https://grammarpro.io.vn/toeic/mistakes-srs`
  - **Thành phần UI:** Hướng dẫn `'Nhấp thẻ hoặc phím Space để lật'` và lưới đáp án 2x2 trong Sổ Tay Flashcard
  - **Hiện trạng thực tế:** Màn hình `/toeic/mistakes-srs` hiển thị dòng hướng dẫn `'Nhấp thẻ hoặc phím Space để lật'` và xếp 4 đáp án A-D thành lưới 2 cột × 2 hàng.
  - **Tại sao cần sửa:** Trên điện thoại không có phím Space; lưới đáp án 2 cột khiến các câu trả lời tiếng Anh dài bị gãy thành 3–4 dòng hẹp rất khó đọc nhanh và dễ chạm nhầm.
  - **Giải pháp đề xuất:** Đổi văn bản hướng dẫn trên mobile thành `'Chạm vào thẻ để lật • Vuốt trái/phải để qua thẻ'`; chuyển 4 đáp án thành 1 cột dọc full-width (cao `>= 48px`/nút) để dễ đọc và dễ chạm bằng ngón cái.
  - **Retention Hook:** Tận dụng cử chỉ vuốt tự nhiên trên smartphone (Tinder-style SRS Swipe), biến việc ôn câu sai thành trò chơi gây nghiện.
  - **Files & Blast Radius:** `pages/toeic/mistakes-srs.jsx:208`, `styles/toeic-ui-2026.css`.

- [x] **UX-22** | `HIGH` | UX: `10/10` | `7h` | `Wave 3` | `Area E` | Status: `FIXED (Preview)`
  - **URL:** `https://grammarpro.io.vn/toeic/dictation`
  - **Thành phần UI:** Màn hình Dictation Studio có 6 tầng điều khiển xếp chồng trước ô nhập liệu
  - **Hiện trạng thực tế:** Trong `/toeic/dictation`, người dùng phải đi qua: Thanh chọn Test -> Nút chế độ Điền từ/Chép câu -> Trình phát Audio + Sóng âm + Tốc độ -> Hàng lọc Part -> Hàng cuộn Track `1-11` -> Khung văn bản có ô input inline.
  - **Tại sao cần sửa:** Khi người dùng điện thoại bấm vào ô input để nghe chép chính tả, bàn phím ảo bật lên che mất nửa dưới màn hình, đẩy trình phát Audio (nút Play/Pause) trôi khuất lên trên khiến họ không thể vừa gõ vừa bấm nghe lại.
  - **Giải pháp đề xuất:** Ghim cố định một Mini Audio Player Bar (Nút Lùi 3s, Play/Pause, Tốc độ, Gợi ý từ) dính ngay phía trên bàn phím ảo / đáy màn hình khi đang ở chế độ gõ Dictation trên điện thoại.
  - **Retention Hook:** Giải quyết triệt để nỗi đau lớn nhất khi luyện nghe chép chính tả trên điện thoại, giữ người dùng luyện liên tục nhiều Track.
  - **Files & Blast Radius:** `components/toeic/DictationStudio.jsx`, `pages/toeic/dictation.jsx`, `styles/toeic-ui-2026.css`.

- [x] **UX-23** | `MEDIUM` | UX: `9/10` | `5h` | `Wave 4` | `Area E` | Status: `FIXED (Preview)`
  - **URL:** `https://grammarpro.io.vn/toeic`
  - **Thành phần UI:** Khối tương tác `'AI Sentence X-Ray'` quá phức tạp trên màn hình nhỏ
  - **Hiện trạng thực tế:** Khối AI Sentence X-Ray chứa 3 tab lớn, công tắc bật/tắt, câu phân tích nhiều màu, hộp đen SENTENCE X-RAY, bảng so sánh 2 cột (Cách học cũ vs AI X-Ray), 4 thẻ lợi ích và 3 nút CTA.
  - **Tại sao cần sửa:** Đây là tính năng `'Wow'` đắt giá nhất của sản phẩm, nhưng trên điện thoại việc nhồi quá nhiều bảng biểu giải thích xung quanh làm người dùng mỏi mắt trước khi kịp chạm thử vào câu X-Ray.
  - **Giải pháp đề xuất:** Trên mobile, đưa thẳng khung tương tác `'Chạm thử vào từng từ trong câu dưới đây để quét tia X-Ray AI'` lên đầu tiên; ẩn bảng so sánh Cách học cũ/mới vào một nút mở rộng `'Vì sao X-Ray hiệu quả gấp 3 lần?'`.
  - **Retention Hook:** Cho người dùng điện thoại trực tiếp `'chơi thử'` với công nghệ AI ngay lập tức (Interactive Aha-Moment), tăng mạnh khao khát sở hữu gói VIP.
  - **Files & Blast Radius:** `components/toeic/SentenceXRayCard.jsx`, `pages/toeic/index.jsx`.

- [x] **UX-24** | `MEDIUM` | UX: `8/10` | `4h` | `Wave 4` | `Area E` | Status: `FIXED (Preview)`
  - **URL:** `https://grammarpro.io.vn/toeic/tests`
  - **Thành phần UI:** Danh sách 20 Đề TOEIC hiển thị 18 đề khóa VIP viền cam nét đứt liên tiếp
  - **Hiện trạng thực tế:** Trang `/toeic/tests` mở miễn phí Đề `01–02`, còn từ Đề `03` đến Đề `20` hiển thị liên tiếp các thẻ khóa VIP viền cam trên lưới 3 cột.
  - **Tại sao cần sửa:** Trên điện thoại khi lưới 3 cột chuyển thành 1 cột dọc, người dùng phải cuộn qua 8 thẻ đề bị khóa liên tiếp trông rất giống nhau và mang cảm giác bị chặn.
  - **Giải pháp đề xuất:** Hiển thị nổi bật Đề `01 & 02` (Miễn phí) ở trên cùng kèm chế độ `'Làm nhanh Mini-Test 20 câu trên điện thoại'`; thêm tính năng `'Xem trước 5 câu đầu (Preview)'` cho các đề VIP thay vì khóa cứng toàn bộ thẻ.
  - **Retention Hook:** Cho phép nếm thử chất lượng đề mới ngay trên điện thoại (Curiosity Gap), kích thích nâng cấp VIP tự nguyện hơn.
  - **Files & Blast Radius:** `pages/toeic/tests/index.jsx`, `components/toeic/premium/ToeicFeatureGate.jsx`.

---

### Area F — Thành tích (Gamification)

- [x] **UX-25** | `MEDIUM` | UX: `8/10` | `3h` | `Wave 4` | `Area F` | Status: `FIXED (Preview)`
  - **URL:** `https://grammarpro.io.vn/?view=gamification`
  - **Thành phần UI:** Bộ sưu tập 20 Huy hiệu đang ở trạng thái khóa xám nhạt (`'0 / 20'`) và nhãn tiếng Anh
  - **Hiện trạng thực tế:** Khối `'Bộ Sưu Tập Huy Hiệu (0 / 20)'` dùng 5 nút lọc bằng tiếng Anh (`'Learning Consistency'`, `'Grammar Mastery'`...) và hiển thị hàng loạt thẻ huy hiệu màu xám khóa kín.
  - **Tại sao cần sửa:** Người dùng Việt Nam đang xem giao diện tiếng Việt nhưng bộ lọc lại để tiếng Anh dài (gây tràn nút trên màn hình điện thoại). Hơn nữa, 20 ô xám xịt chưa có huy hiệu nào sáng lên làm giảm sự hào hứng.
  - **Giải pháp đề xuất:** Việt hóa ngắn gọn 5 nút lọc (`'Tất cả'`, `'Chăm chỉ'`, `'Thông thạo'`, `'Chính xác'`, `'Cột mốc'`) dưới dạng Horizontal Chips; tặng ngay Huy hiệu đầu tiên `'Người Khởi Hành'` sáng rực rỡ ngay khi làm xong câu hỏi đầu tiên.
  - **Retention Hook:** Kích hoạt cơ chế `'First Win'` (Chiến thắng đầu tay) để người học muốn sưu tầm tiếp huy hiệu thứ 2.
  - **Files & Blast Radius:** `components/gamification/GamificationHub.jsx`. Kiểm tra `tests/gamification-engine.test.mjs`.

- [x] **UX-26** | `MEDIUM` | UX: `8/10` | `2h` | `Wave 4` | `Area F` | Status: `FIXED (Preview)`
  - **URL:** `https://grammarpro.io.vn/?view=gamification`
  - **Thành phần UI:** 4 Thử thách Ngày & Tuần (Daily Missions) đều ở mức `0%` và chưa có nút `'Làm ngay'`
  - **Hiện trạng thực tế:** Trong khối `'Thử Thách Ngày & Tuần'`, 4 thẻ nhiệm vụ (`+50 XP`) chỉ hiển thị thanh tiến độ `0%` tĩnh mà không có nút dẫn trực tiếp tới màn hình thực hiện nhiệm vụ đó.
  - **Tại sao cần sửa:** Trên điện thoại, khi người dùng đọc nhiệm vụ `'Hoàn thành 1 bài học ngữ pháp (+50 XP)'`, nếu họ phải tự mò lại menu Học tập để tìm bài thì 50% sẽ bỏ cuộc giữa chừng.
  - **Giải pháp đề xuất:** Thêm nút hành động trực tiếp `'Làm ngay ->'` (cao `40px`, nổi bật bên phải mỗi thẻ nhiệm vụ) để chạm 1 lần là nhảy thẳng tới bài tập/đề quiz tương ứng.
  - **Retention Hook:** Khép kín vòng lặp `Trigger -> Action -> Reward` (Hook Model) ngay trên màn hình điện thoại, biến trang Thành tích thành bệ phóng hành động.
  - **Files & Blast Radius:** `components/gamification/GamificationHub.jsx`, `pages/index.js`.

---

### Area G — Gói VIP & Chuyển đổi

- [x] **UX-27** | `HIGH` | UX: `9/10` | `4h` | `Wave 4` | `Area G` | Status: `FIXED (Preview)`
  - **URL:** `https://grammarpro.io.vn/?view=vip` (hiện tại là `?view=gamification`)
  - **Thành phần UI:** Bảng giá 4 gói VIP (`39k`, `69k`, `99k`, `199k`) xếp 4 cột ngang
  - **Hiện trạng thực tế:** Trang Gói VIP hiển thị 4 thẻ giá (Tháng `39k`, 3 Tháng `69k`, Năm `99k` - Best Value, Trọn Đời `199k`). Trên mobile khi xếp dọc từ trên xuống theo thứ tự thì gói `39k` và `69k` xuất hiện trước, đẩy gói chiến lược `'VIP Năm 99k (Best Value)'` xuống dưới màn hình.
  - **Tại sao cần sửa:** Theo tâm lý học định giá (Pricing Anchoring), trên màn hình dọc điện thoại, người dùng thường chỉ nhìn kỹ 1–2 thẻ đầu tiên. Nếu gói chủ lực (`99k/năm`) bị khuất bên dưới, giá trị đơn hàng trung bình (AOV) sẽ giảm.
  - **Giải pháp đề xuất:** Trên Mobile, đảo thứ tự đưa gói `'VIP Năm 99.000đ (Best Value - Chỉ 8.250đ/tháng)'` lên vị trí đầu tiên kèm viền phát sáng và ghim thanh `'Mở khóa VIP ngay (Hỗ trợ QR VietQR 1 chạm)'` ở đáy màn hình.
  - **Retention Hook:** Tối ưu hóa tỷ lệ chọn gói Năm/Trọn đời trên thiết bị di động và thanh toán siêu tốc qua app ngân hàng trên điện thoại.
  - **Files & Blast Radius:** `components/monetization/MonetizationHub.jsx`.

- [x] **UX-28** | `LOW` | UX: `7/10` | `3h` | `Wave 4` | `Area G` | Status: `FIXED (Preview)`
  - **URL:** `https://grammarpro.io.vn/?view=vip`
  - **Thành phần UI:** Bảng so sánh chi tiết 3 cột (`'TÍNH NĂNG'`, `'GÓI FREE'`, `'THÀNH VIÊN VIP'`) quá dài
  - **Hiện trạng thực tế:** Cuối trang VIP có cả khối so sánh trực quan 2 cột lẫn bảng so sánh chi tiết 3 cột liệt kê hàng chục dòng tính năng học thuật.
  - **Tại sao cần sửa:** Hai khối so sánh lặp lại cùng một thông điệp. Trên màn hình hẹp của điện thoại, bảng 3 cột chữ dày đặc rất khó đọc và làm trang kéo dài lê thê.
  - **Giải pháp đề xuất:** Hợp nhất thành 1 bảng so sánh Mobile-First duy nhất gồm 5 lợi ích sát sườn nhất (Mở khóa toàn bộ 2.939 câu & 20 đề TOEIC, AI Sentence X-Ray không giới hạn, Giải thích 5 bước gốc rễ, Sổ tay SRS tự động, Không quảng cáo) kèm FAQ dạng Accordion.
  - **Retention Hook:** Làm nổi bật rõ giá trị cốt lõi trong 5 giây đọc lướt trên điện thoại, thúc đẩy quyết định nâng cấp nhanh chóng.
  - **Files & Blast Radius:** `components/monetization/MonetizationHub.jsx`.

---

## 4. VÒNG 2 (DEEP-DIVE): 16 Lỗi Tương tác sâu, Chấm bài, Dark Mode & Chuyển đổi (`DD-01` → `DD-16`)

- [x] **DD-01** | `HIGH` | UX: `10/10` | `3h` | `Wave 1` | `Area E` | Status: `FIXED (Preview)`
  - **URL:** `https://grammarpro.io.vn/toeic/tests/ETS2024/1?mode=full`
  - **Thành phần UI:** Câu 101 Đề 01 TOEIC: Chấm SAI đáp án đúng (`'his'`) và tự điền sai ngữ pháp (`'him'`)
  - **Hiện trạng thực tế:** Câu 101: `'Former Sendai Company CEO Ken Nakata spoke about [ ? ] career experiences.'` Khi chọn đáp án đúng là `B ('his')`, bảng theo dõi phía trên lại tô ĐỎ báo sai (`'101·B'`) và tự điền đại từ tân ngữ `'him'` vào trước danh từ (`'spoke about him career experiences'`), trong khi bảng câu hỏi bên dưới lại tô XANH ô 101.
  - **Tại sao cần sửa:** Đây là lỗi chí mạng về dữ liệu đáp án (Answer Key Mapping) và trạng thái chấm điểm. Người học TOEIC thấy câu cơ bản nhất (Tính từ sở hữu `'his'` + Danh từ `'career experiences'`) bị chấm sai thành `'him'` sẽ lập tức nghi ngờ độ chính xác của toàn bộ 4.000 câu AI.
  - **Giải pháp đề xuất:** Kiểm tra lại mảng `correctAnswer` (0-indexed vs 1-indexed hoặc lệch key A/B/C/D) của Đề ETS2024 Test 1 Câu 101 và đồng bộ hàm kiểm tra trạng thái đúng/sai giữa Bảng Theo Dõi Toàn Đề ở trên với Bảng câu hỏi ở dưới.
  - **Retention Hook:** Bảo vệ tuyệt đối uy tín học thuật (Academic Integrity) — yếu tố quyết định để người học dám xuống tiền mua gói VIP.
  - **Files & Blast Radius:** `pages/toeic/tests/[series]/[testNum].jsx`, `lib/toeic/toeic-repository.js`, `data/toeic/`, `pages/api/toeic/exams/submit.js`.

- [x] **DD-02** | `HIGH` | UX: `10/10` | `3h` | `Wave 1` | `Area E` | Status: `FIXED (Preview)`
  - **URL:** `https://grammarpro.io.vn/toeic/mistakes-srs`
  - **Thành phần UI:** Thẻ 1/4 Sổ Tay Flashcard: Đáp án báo `'(D) updated'` nhưng Giải thích lại khẳng định `'(B) updating'`
  - **Hiện trạng thực tế:** Tại câu `'The marketing team is currently ______ new strategies...'`, khi lật mặt sau thẻ Flashcard, dòng đầu báo `'✓ Đáp án đúng: (D)'` (mặt trước D là `'updated'`), nhưng ngay bên dưới phần giải thích lại viết: `'Theo ngữ cảnh chủ động is currently implementing/updating, cần dạng V-ing bổ nghĩa'` (tức đáp án B).
  - **Tại sao cần sửa:** Sự mâu thuẫn 180 độ ngay trên cùng 1 thẻ Flashcard giữa Đáp án hiển thị và Lời giải thích khiến người học hoang mang tột độ không biết nên nhớ kiến thức nào.
  - **Giải pháp đề xuất:** Rà soát và chạy script kiểm tra tự động (Data Consistency Check) đối chiếu trường `correct_option` với nội dung trường `explanation` trên toàn bộ kho dữ liệu Flashcard SRS.
  - **Retention Hook:** Giúp người học tin tưởng tuyệt đối vào lời giải thích của AI khi ôn tập câu sai trên điện thoại.
  - **Files & Blast Radius:** `pages/toeic/mistakes-srs.jsx`, `data/toeic/` (nguồn dữ liệu mẫu/SRS).

- [x] **DD-03** | `HIGH` | UX: `9/10` | `3h` | `Wave 1` | `Area C` | Status: `FIXED (Preview)`
  - **URL:** `https://grammarpro.io.vn/`
  - **Thành phần UI:** Tab Bài tập thực hành (Câu 2): Hộp `'Gợi ý quy tắc'` làm lộ luôn đáp án và Gợi ý ôn tập sai thì
  - **Hiện trạng thực tế:** Khi làm sai Câu 2 (`'We usually ___ dinner...'`), hộp vàng `'Gợi ý quy tắc'` viết thẳng: `'Chủ ngữ We động từ giữ nguyên mẫu eat'` (lộ luôn đáp án trước khi học viên thử lại). Sau đó khi bấm `'Đáp án'`, mục `'Đề Xuất Lộ Trình Củng Cố'` lại dẫn sang bài `'Thì hiện tại hoàn thành'` thay vì `'Thì hiện tại đơn'`.
  - **Tại sao cần sửa:** Gợi ý (Hint) mà nói thẳng đáp án sẽ triệt tiêu tư duy tự sửa lỗi của người học. Nghiêm trọng hơn, thuật toán Remedial Engine gắn nhầm link bài học (sai Hiện tại đơn nhưng bắt đi ôn Hiện tại hoàn thành) làm rối loạn lộ trình học.
  - **Giải pháp đề xuất:** (1) Sửa nội dung Hint chỉ gợi ý dấu hiệu nhận biết (`'Chú ý trạng từ tần suất usually + Chủ ngữ số nhiều We'`); (2) Sửa mapping `topic_id` của câu hỏi về đúng bài `TENSE_PRES_SIMPLE`.
  - **Retention Hook:** Giữ đúng triết lý sư phạm `'Gợi mở từng bước'` và dẫn người học quay lại đúng bài lý thuyết cần củng cố.
  - **Files & Blast Radius:** `lib/explanation/remedial-engine.js`, `components/question-engine/states/AfterWrong.jsx`, `data/ui/preview_data.json`.

- [x] **DD-04** | `HIGH` | UX: `9/10` | `3h` | `Wave 1` | `Area E` | Status: `FIXED (Preview)`
  - **URL:** `https://grammarpro.io.vn/toeic/dictation`
  - **Thành phần UI:** Dictation Studio: Lộ đáp án `'[Câu 1: (B)]'` ngay đầu dòng và nút `'Hiện Đáp Án'` tính luôn là Hoàn thành 100%
  - **Hiện trạng thực tế:** Ở Track 1, ngay đầu đoạn văn chép chính tả hiện rõ chữ `'[Câu 1: (B)]'` làm lộ đáp án trước khi nghe. Ngoài ra, khi người dùng bấm `'Hiện Đáp Án'` để xem, hệ thống tự điền xanh cả `8/8` ô và bật thông báo chúc mừng `'✓ HOÀN THÀNH TRACK E26-T01-01!'` mà không có nút `'Ẩn đáp án để tự làm lại'`.
  - **Tại sao cần sửa:** Việc bấm xem đáp án mà được tính luôn là `'Hoàn thành xuất sắc 8/8 ô'` làm mất giá trị của phần thưởng chiến thắng (Fake Achievement) và khiến người học không thể ẩn đáp án đi để tự gõ lại bằng trí nhớ.
  - **Giải pháp đề xuất:** (1) Dùng Regex ẩn chuỗi `[Câu X: (A/B/C/D)]` ở chế độ đang nghe; (2) Khi bấm `'Hiện Đáp Án'`, đánh dấu trạng thái là `'Đang xem đáp án (Chưa tính hoàn thành)'` kèm nút `'Ẩn đáp án & Gõ lại từ đầu'`.
  - **Retention Hook:** Tạo động lực chinh phục thực chất trong Dictation Studio, kích thích người học nghe lại và tự gõ đúng 100%.
  - **Files & Blast Radius:** `components/toeic/DictationStudio.jsx:321`.

- [x] **DD-05** | `HIGH` | UX: `10/10` | `4h` | `Wave 2` | `Area D` | Status: `FIXED (Preview)`
  - **URL:** `https://grammarpro.io.vn/`
  - **Thành phần UI:** Nút `'Nộp bài chấm điểm'` nộp thẳng không hỏi xác nhận & Đẩy cả 19 câu chưa làm vào Sổ tay câu sai
  - **Hiện trạng thực tế:** Trong đề 20 câu, khi mới thử làm 1 câu mà vô tình chạm vào nút `'Nộp bài chấm điểm'` (hoặc muốn nộp sớm), hệ thống chấm điểm ngay lập tức (`1/20 = 5%`) và đẩy toàn bộ 19 câu chưa kịp chạm tới vào `'Sổ tay câu sai (19)'`.
  - **Tại sao cần sửa:** Trên màn hình cảm ứng điện thoại, việc chạm nhầm nút rất dễ xảy ra. Đẩy 19 câu `'chưa làm'` vào chung với các câu `'làm sai thực sự'` làm ô nhiễm hoàn toàn dữ liệu Sổ tay câu sai (Spaced Repetition bị quá tải bởi các câu chưa học).
  - **Giải pháp đề xuất:** (1) Bật Bottom Sheet xác nhận khi nộp bài còn câu trống (`'Bạn còn 19 câu chưa làm. Nộp luôn hay Làm tiếp?'`); (2) Chỉ lưu vào `'Sổ tay câu sai'` những câu người dùng ĐÃ trả lời nhưng SAI; tách riêng các câu bỏ trống thành trạng thái `'Chưa làm (Skipped)'`.
  - **Retention Hook:** Giữ cho `'Sổ tay câu sai'` luôn tinh gọn, phản ánh đúng lỗ hổng kiến thức thực tế của người học.
  - **Files & Blast Radius:** `pages/index.js`, `pages/api/learning/events.js`, `lib/explanation/spaced-repetition.js`. Phải đồng bộ schema Guest LocalStorage + Supabase.

- [x] **DD-06** | `HIGH` | UX: `9/10` | `2h` | `Wave 1` | `Area E` | Status: `FIXED (Preview)`
  - **URL:** `https://grammarpro.io.vn/toeic/tests`
  - **Thành phần UI:** Nút `'Luyện Full Đề 200 Câu (Listening & Reading 120p)'` nhưng bấm vào chỉ có 100 câu Reading (`75p`)
  - **Hiện trạng thực tế:** Tại danh sách 20 Đề TOEIC, thẻ Đề 01 ghi rõ `'Luyện Full Đề 200 Câu (Listening Part 1-4 & Reading Part 5-7, 120p)'`, nhưng khi bấm vào `/toeic/tests/ETS2024/1?mode=full` thì chỉ có 100 câu Reading (Câu `101–200`, `75 phút`), hoàn toàn không có câu `1–100` Listening.
  - **Tại sao cần sửa:** Kỳ vọng của người dùng khi bấm `'Full Đề 200 Câu'` là được làm từ Part 1 (Nghe) đến Part 7 (Đọc). Việc vào phòng thi chỉ thấy câu 101 trở đi khiến họ tưởng web bị lỗi mất nửa đề thi.
  - **Giải pháp đề xuất:** Đổi nhãn nút trên thẻ Đề 01 thành `'Luyện Full Reading 100 Câu (Part 5–7 • 75p)'` và `'Luyện Nghe Dictation (Part 1–4)'` cho đúng thực tế dữ liệu hiện có, hoặc bổ sung tab chuyển Part 1–4 trong phòng thi.
  - **Retention Hook:** Quản trị kỳ vọng người dùng (Expectation Management) minh bạch, tránh cảm giác hụt hẫng khi vào phòng thi thử.
  - **Files & Blast Radius:** `pages/toeic/tests/index.jsx`.

- [x] **DD-07** | `HIGH` | UX: `9/10` | `4h` | `Wave 4` | `Area C/E` | Status: `FIXED (Preview)`
  - **URL:** `https://grammarpro.io.vn/`
  - **Thành phần UI:** Nút `'Nghe câu'` (Bài tập) và nút `'Play'` (Dictation Studio) không có phản hồi trạng thái đang phát
  - **Hiện trạng thực tế:** Khi người dùng bấm vào nút `'Nghe câu'` ở bài tập ngữ pháp hoặc nút Play tròn màu xanh ở Dictation Studio, giao diện đứng im (icon Play không đổi sang Pause/Loading, sóng âm tĩnh, không có bộ đếm giây `00:05 / 00:18`).
  - **Tại sao cần sửa:** Trên điện thoại (đặc biệt khi người dùng đang để chế độ Im lặng / Silent Mode trên iPhone hoặc mạng 4G đang tải file mp3 chậm 1–2 giây), không thấy nút đổi trạng thái khiến họ tưởng nút bị liệt và bấm liên tục nhiều lần.
  - **Giải pháp đề xuất:** Thêm trạng thái Loading Spinner khi đang tải audio, đổi icon sang Pause + hiệu ứng sóng âm nhấp nháy khi đang phát, kèm thanh tua (Seekbar) và thông báo nhỏ nếu trình duyệt chặn phát âm thanh.
  - **Retention Hook:** Mang lại phản hồi xúc giác & thị giác tức thì (Immediate Micro-feedback) đúng chuẩn ứng dụng luyện nghe hiện đại.
  - **Files & Blast Radius:** `components/audio/AudioPlayer.jsx`, `lib/audio/speech.service.js`, `components/toeic/DictationStudio.jsx`.

- [x] **DD-08** | `MEDIUM` | UX: `8/10` | `1h` | `Wave 2` | `Area D` | Status: `FIXED (Preview)`
  - **URL:** `https://grammarpro.io.vn/`
  - **Thành phần UI:** Lỗi giữ nguyên vị trí cuộn giữa trang (Scroll Restoration Bug) khi chuyển giữa các Tab
  - **Hiện trạng thực tế:** Khi người dùng cuộn xuống giữa/cuối trang ở mục `'Học tập'` rồi bấm chuyển sang tab `'Luyện tập'`, trang mới không tự động cuộn lên đầu (`scrollTop = 0`) mà giữ nguyên vị trí lưng chừng ở câu số 8–10.
  - **Tại sao cần sửa:** Trên màn hình điện thoại nhỏ, nhảy sang tab mới mà thấy mình đang ở giữa danh sách câu hỏi (không thấy tiêu đề trang hay bộ lọc chủ đề ở đầu) gây mất phương hướng nghiêm trọng.
  - **Giải pháp đề xuất:** Tích hợp `window.scrollTo({ top: 0, behavior: 'smooth' })` mỗi khi người dùng chuyển đổi giữa các tab state (`view` / sub-tab) trên giao diện.
  - **Retention Hook:** Đảm bảo luồng điều hướng trên điện thoại luôn mạch lạc, rõ điểm bắt đầu của từng màn hình.
  - **Files & Blast Radius:** `pages/index.js`.

- [x] **DD-09** | `MEDIUM` | UX: `7/10` | `2h` | `Wave 2` | `Area A` | Status: `FIXED (Preview)`
  - **URL:** `https://grammarpro.io.vn/`
  - **Thành phần UI:** Nút icon `'Quyển sách'` trên Header bấm vào chỉ đổi màu viền nhẹ, không rõ chức năng
  - **Hiện trạng thực tế:** Trên Header bên cạnh nút đổi Theme có một nút icon hình Quyển sách. Khi bấm vào, nút chỉ đổi nền/viền sang xanh cyan nhạt nhưng không mở ra bất kỳ popup, ngăn kéo hay thông báo nào trên trang Tổng quan.
  - **Tại sao cần sửa:** Theo nguyên tắc Affordance của Don Norman, một nút bấm nằm ở vị trí đắc địa nhất (Global Header) mà bấm vào không thấy điều gì xảy ra sẽ gây bối rối và chiếm chỗ vô ích trên màn hình điện thoại.
  - **Giải pháp đề xuất:** Nếu đây là nút bật/tắt `'Chế độ đọc / Từ điển tra nhanh (Click-to-Translate)'`, hãy hiển thị một Toast thông báo rõ ràng khi bấm (`'Đã bật Từ điển 1 chạm: Chạm vào từ tiếng Anh bất kỳ để tra nghĩa'`) hoặc ẩn nút này ở những trang không có bài đọc.
  - **Retention Hook:** Biến một nút `'bí ẩn'` thành tính năng trợ giúp đắc lực được người dùng khám phá và sử dụng thường xuyên.
  - **Files & Blast Radius:** `components/ui-2026/AppShell2026.jsx`, `pages/index.js`.

- [x] **DD-10** | `HIGH` | UX: `8/10` | `2h` | `Wave 1` | `Area C/E` | Status: `FIXED (Preview)`
  - **URL:** `https://grammarpro.io.vn/toeic/mistakes-srs`
  - **Thành phần UI:** Lỗi hiển thị ký tự `'[ô vuông lỗi font]'` (Tofu Glyph) tại hàng loạt nút bấm quan trọng
  - **Hiện trạng thực tế:** Xuất hiện ký tự `'[ô vuông lỗi font]'` tại: (1) Mặt trước & sau thẻ Flashcard; (2) Nút `'Xem thêm Điều kiện & Lỗi sai (Sơ cấp)'`; (3) Nút `'Thử lại'` trong Bài tập; (4) Nút `'Xem Bảng Giá & Quyền Lợi VIP'`; (5) Các nút trong Bài kiểm tra chẩn đoán 30 câu & Sentence X-Ray.
  - **Tại sao cần sửa:** Ký tự `'[ô vuông lỗi font]'` xảy ra khi chuỗi văn bản chứa mã Unicode/Emoji hoặc icon font không tồn tại trong bộ font đang tải trên thiết bị. Lỗi này làm giao diện trông bị lỗi mã hóa ký tự (Encoding Bug) trên các dòng điện thoại khác nhau.
  - **Giải pháp đề xuất:** Tìm và thay thế toàn bộ ký tự Unicode bị lỗi bằng SVG Icon chuẩn từ thư viện `lucide-react` (ví dụ: `<RotateCcw />` cho Thử lại, `<ChevronDown />` cho Xem thêm, `<ArrowRight />` cho nút VIP).
  - **Retention Hook:** Đảm bảo 100% icon hiển thị sắc nét, đồng nhất trên cả iOS, Android và mọi trình duyệt di động.
  - **Files & Blast Radius:** `pages/toeic/mistakes-srs.jsx`, `components/toeic/SentenceXRayCard.jsx`, `components/diagnostic/DiagnosticAnalysisDashboard.jsx`, `components/monetization/MonetizationHub.jsx`, `pages/index.js`. Kiểm tra lại bằng `validate-zero-os-emoji.mjs`.

- [x] **DD-11** | `MEDIUM` | UX: `8/10` | `3h` | `Wave 4` | `Area D` | Status: `FIXED (Preview)`
  - **URL:** `https://grammarpro.io.vn/`
  - **Thành phần UI:** Icon Watermark trang trí đè chồng lên chữ `'(Khóa 30 câu nâng cao)'` và sai tên gọi `'Trắc nghiệm'`
  - **Hiện trạng thực tế:** Ở đầu trang Luyện tập, hình watermark trang trí bên phải bị đè chồng lên dòng chữ `'(Khóa 30 câu nâng cao)'`. Đồng thời tab mang tên `'Làm đề trắc nghiệm'` nhưng 20 câu bên dưới đều là dạng `'Điền vào chỗ trống'` (Essay/Fill-in-blank) chứ không có 4 đáp án A-B-C-D.
  - **Tại sao cần sửa:** Trên màn hình hẹp của điện thoại, các icon trang trí đặt `position: absolute` rất dễ đè lên chữ gây lem nhem. Ngoài ra người dùng bấm vào `'Làm đề trắc nghiệm'` vì muốn chọn nhanh A-B-C-D nhưng lại bị bắt gõ chữ.
  - **Giải pháp đề xuất:** (1) Thêm `opacity: 0.08; pointer-events: none; z-index: 0` cho icon watermark hoặc ẩn trên mobile; (2) Bổ sung nút chuyển đổi chế độ `'Trắc nghiệm A-B-C-D (Chọn nhanh)'` và `'Tự luận (Điền từ)'` ngay đầu bài.
  - **Retention Hook:** Đáp ứng đúng kỳ vọng `'Trắc nghiệm chạm nhanh'` của người dùng di động, giữ giao diện sạch đẹp không đè chữ.
  - **Files & Blast Radius:** `pages/index.js`.

- [x] **DD-12** | `MEDIUM` | UX: `8/10` | `3h` | `Wave 2` | `Area A/G` | Status: `FIXED (Preview)`
  - **URL:** `https://grammarpro.io.vn/?view=gamification`
  - **Thành phần UI:** Lỗi Dark Mode chói mắt trên trang VIP & Lệch tông màu Modal Đăng nhập
  - **Hiện trạng thực tế:** Khi bật Dark Mode, khung minh họa bên trong thẻ `'Gói FREE (Cơ bản)'` trên trang VIP vẫn giữ nền trắng/xám sáng nguyên bản gây chói mắt. Ngược lại, khi đang ở Light Mode thì bấm nút `'Đăng nhập'` lại bật ra modal nền tối đen kèm nhãn chữ xám tối khó đọc.
  - **Tại sao cần sửa:** Sự thiếu đồng nhất giữa Light Mode và Dark Mode làm đứt gãy trải nghiệm thị giác, đặc biệt với người dùng điện thoại hay học vào buổi tối trên giường.
  - **Giải pháp đề xuất:** Rà soát các lớp `dark:bg-slate-800 dark:text-slate-100` (hoặc semantic CSS tokens) cho thẻ Gói FREE và đồng bộ Modal Đăng nhập/Đăng ký theo đúng biến CSS Theme hiện tại (hoặc nâng độ sáng nhãn chữ trong modal tối lên `#E2E8F0`).
  - **Retention Hook:** Trải nghiệm học đêm (Night Study Mode) êm dịu cho mắt, giữ người dùng học lâu hơn vào khung giờ `21h–23h`.
  - **Files & Blast Radius:** `components/monetization/MonetizationHub.jsx`, `components/auth/UnifiedAuthModal.jsx`, `styles/design-system-2026.css`. Verify bằng `validate-color-contrast.mjs`.

- [x] **DD-13** | `HIGH` | UX: `10/10` | `4h` | `Wave 2` | `Area A` | Status: `FIXED (Preview)`
  - **URL:** `https://grammarpro.io.vn/`
  - **Thành phần UI:** Modal Đăng nhập/Đăng ký thiếu nút `'Đăng nhập 1 chạm bằng Google'` và nút `'Hiện mật khẩu'`
  - **Hiện trạng thực tế:** Form Đăng nhập và Đăng ký hiện chỉ cho nhập Email + Mật khẩu thủ công, không có nút `'Tiếp tục với Google'` và ô mật khẩu không có icon con mắt để kiểm tra ký tự vừa gõ.
  - **Tại sao cần sửa:** Trên bàn phím điện thoại, việc phải gõ địa chỉ email dài + gõ mật khẩu 2 lần (mà không nhìn thấy ký tự để biết có bị dính chữ viết hoa đầu dòng hay không) khiến hơn 60% người dùng di động bỏ cuộc ngay tại màn hình đăng ký.
  - **Giải pháp đề xuất:** Tích hợp `Supabase Google OAuth` (`'Tiếp tục với Google trong 1 chạm'`) đặt ở vị trí to nhất trên đỉnh Modal, và thêm nút Toggle Eye Icon (`type='text' / 'password'`) cho các ô mật khẩu.
  - **Retention Hook:** Tăng tỷ lệ hoàn tất đăng ký tài khoản trên điện thoại lên gấp 2.5 lần nhờ loại bỏ hoàn toàn việc gõ mật khẩu.
  - **Files & Blast Radius:** `components/auth/UnifiedAuthModal.jsx`, `lib/supabase/client.js`. Đảm bảo `redirectTo` chuẩn cho cả localhost và `https://grammarpro.io.vn`.

- [x] **DD-14** | `HIGH` | UX: `9/10` | `4h` | `Wave 1 (Done) & Wave 4` | `Area G` | Status: `FIXED (Preview)`
  - **URL:** `https://grammarpro.io.vn/?view=gamification`
  - **Thành phần UI:** Sai toán học khuyến mãi (`'Giảm từ 1.188.000đ xuống 99.000đ = Tiết kiệm 41%'`) & Chặn xem QR thanh toán
  - **Hiện trạng thực tế:** Thẻ `'VIP Năm Chuyên Sâu'` ghi giá bán `99.000đ`, giá gốc gạch ngang `1.188.000đ` (thực tế giảm tới `91.6%`), nhưng badge lại ghi `Tiết kiệm 41%` (`41%` là so với việc mua lẻ từng tháng `39k × 12 = 468k`, hoặc tính nhầm). Ngoài ra khách chưa đăng nhập bấm mua bị chặn bắt đăng ký trước chứ chưa thấy cổng thanh toán VietQR.
  - **Tại sao cần sửa:** Con số phần trăm giảm giá không khớp với giá gạch ngang ngay bên dưới làm người mua tinh ý cảm thấy con số bị `'thổi phồng ảo'`. Đồng thời bắt đăng ký tài khoản nhiều bước trước khi cho xem mã QR thanh toán làm rớt khách mua xung động (Impulse Buyers).
  - **Giải pháp đề xuất:** (1) **[Wave 1]** Sửa giá gốc gạch ngang của gói Năm thành `468.000đ` (`12 tháng × 39k`) và ghi rõ `Tiết kiệm 79% (Chỉ 8.250đ/tháng)` cho thật hợp lý; (2) **[Wave 4]** Cho phép bấm `'Mua ngay'` mở thẳng Bottom Sheet nhập Email + Quét mã VietQR trên cùng 1 màn hình (Tự động tạo tài khoản sau khi quét QR).
  - **Retention Hook:** Tối ưu hóa luồng `'1-Tap VietQR Checkout'` trên điện thoại và xây dựng niềm tin tuyệt đối vào con số khuyến mãi.
  - **Files & Blast Radius:** `components/monetization/MonetizationHub.jsx`, `pages/api/monetization/overview.js`, `pages/api/monetization/checkout.js`. Chạy `tests/monetization-engine.test.mjs` & giữ nguyên Sepay webhook.

- [x] **DD-15** | `HIGH` | UX: `9/10` | `3h` | `Wave 2` | `Area E` | Status: `FIXED (Preview)`
  - **URL:** `https://grammarpro.io.vn/toeic`
  - **Thành phần UI:** Số liệu thống kê mâu thuẫn trên Hero Card TOEIC: `'0 Câu Đã Làm (78.5%)'` và lệch số `750` vs `990`
  - **Hiện trạng thực tế:** Trên Hero Card trang `/toeic` (và tab Khám phá AI ở trang chủ), khi người dùng chọn chip `Target 750+`, ô dưới ghi `750 Mục Tiêu Đặt Ra`, nhưng vòng cung lớn bên phải vẫn đóng đinh ở số `990 TARGET SCORE`. Ngay bên cạnh, ô thống kê ghi `0 Câu Đã Làm (78.5%)` và `625 Điểm Dự Đoán (IRT)` dù chưa làm câu nào.
  - **Tại sao cần sửa:** Chưa làm câu nào (`0 Câu Đã Làm`) mà đã có tỷ lệ chính xác `78.5%` và điểm dự đoán `625` khiến người dùng nhận ra ngay đây là số liệu giả gắn cứng (Hardcoded Dummy Data), làm giảm sự tin cậy vào trí tuệ nhân tạo IRT.
  - **Giải pháp đề xuất:** (1) Ràng buộc vòng cung điểm lớn cập nhật động theo đúng nút Target người dùng vừa chạm (`500+ -> 990+`); (2) Khi số câu làm `= 0`, hiển thị trạng thái mời gọi: `'Chưa đo (? Điểm) — Chạm làm 10 câu để AI dự đoán'` thay vì hiện sẵn `625` điểm và `78.5%`.
  - **Retention Hook:** Tạo sự tò mò (Information Gap Theory): Người dùng sẽ muốn làm ngay bài test chẩn đoán để mở khóa con số điểm dự đoán thực của mình.
  - **Files & Blast Radius:** `components/toeic/ToeicHeroBanner.jsx`, `pages/toeic/index.jsx`, `pages/index.js`.

- [x] **DD-16** | `HIGH` | UX: `9/10` | `4h` | `Wave 3` | `Area E` | Status: `FIXED (Preview)`
  - **URL:** `https://grammarpro.io.vn/toeic/tests/ETS2024/1?mode=full`
  - **Thành phần UI:** Phòng thi Đề 01 TOEIC xếp chồng 2 bảng điều hướng câu hỏi làm chật cứng màn hình điện thoại
  - **Hiện trạng thực tế:** Khi vào làm Đề 01 (`/toeic/tests/ETS2024/1?mode=full`), phía trên thẻ câu hỏi xuất hiện cùng lúc 2 bảng số câu: `Bảng Theo Dõi Toàn Đề (101–200)` VÀ bảng `Câu: 101–130` ngay bên dưới, chiếm hết `60%` chiều dọc màn hình trước khi tới nội dung Câu 101.
  - **Tại sao cần sửa:** Trên màn hình điện thoại, việc phải nhìn qua 130 ô số nhỏ li ti xếp chồng ở phần đầu trang khiến câu hỏi chính và 4 đáp án A-B-C-D bị đẩy tụt xuống sát mép dưới màn hình, mỗi lần chuyển câu mắt phải tìm lại vị trí đọc.
  - **Giải pháp đề xuất:** Trên giao diện phòng thi Mobile, thu gọn toàn bộ bảng danh sách 100 câu vào một nút bấm `Danh sách câu (101/200) [Mở bảng v]` trên thanh Header phòng thi; dành trọn `85%` diện tích màn hình cho Câu hỏi và 4 đáp án A-B-C-D.
  - **Retention Hook:** Trải nghiệm phòng thi TOEIC trên điện thoại thoáng đãng, tập trung cao độ, không bị ngợp bởi ma trận 100 ô số.
  - **Files & Blast Radius:** `pages/toeic/tests/[series]/[testNum].jsx`, `components/toeic/ui/ToeicQuestionPalette.jsx`.

---

## 5. VÒNG 3 (EDGE CASES & END-OF-FLOW): 11 Lỗi Từ điển, IRT 3 Chặng & Lộ trình (`EC-01` → `EC-11`)

- [x] **EC-01** | `HIGH` | UX: `10/10` | `4h` | `Wave 2` | `Area C` | Status: `FIXED (Preview)`
  - **URL:** `https://grammarpro.io.vn/`
  - **Thành phần UI:** Popup Tra từ nhanh (Dictionary Popup): Mục `'NGHĨA TIẾNG VIỆT'` hiển thị lặp lại chính từ tiếng Anh
  - **Hiện trạng thực tế:** Khi bôi đen/chạm vào từ tiếng Anh trong bài học (ví dụ `'people'`), popup từ điển mở ra hiển thị IPA `'/ˈpiːpəl/'`, định nghĩa tiếng Anh, nhưng ở dòng `'NGHĨA TIẾNG VIỆT'` lại in ra chữ `'people'` thay vì nghĩa tiếng Việt (`'người / con người'`). Nếu bôi đen lệch chữ (`'omework alr'`), cả IPA lẫn nghĩa tiếng Việt đều in nguyên chuỗi lỗi.
  - **Tại sao cần sửa:** Trên điện thoại, người học dùng tính năng Tra từ 1 chạm chủ yếu để biết nhanh nghĩa tiếng Việt. Việc hiện lại đúng từ tiếng Anh vừa tra làm tính năng từ điển mất đi 80% giá trị sử dụng thực tế.
  - **Giải pháp đề xuất:** (1) Kết nối đúng trường `vietnamese_meaning` từ từ điển nội bộ hoặc API dịch nghĩa tiếng Việt; (2) Dùng Regex tự động `trim()` và lấy trọn vẹn từ gần nhất (`word boundary`) khi người dùng chạm/bôi đen trên màn hình cảm ứng.
  - **Retention Hook:** Biến tính năng Chạm-để-tra-từ thành `'vũ khí'` giữ chân người học đọc hiểu ngữ pháp và lưu từ vựng liên tục trên điện thoại.
  - **Files & Blast Radius:** `pages/api/dictionary.js`, `pages/index.js`, `components/learning/AcademicRichText.jsx`.

- [x] **EC-02** | `MEDIUM` | UX: `7/10` | `1h` | `Wave 2` | `Area C` | Status: `FIXED (Preview)`
  - **URL:** `https://grammarpro.io.vn/`
  - **Thành phần UI:** Popup Tra từ nhanh không tự động đóng khi chuyển sang Chương/Bài học khác
  - **Hiện trạng thực tế:** Khi đang mở popup tra từ ở Chương 1 rồi bấm chuyển sang Chương 2 hoặc Chương 5, popup tra từ của bài cũ vẫn treo lơ lửng đè lên nội dung bài học mới.
  - **Tại sao cần sửa:** Trên màn hình nhỏ của điện thoại, một popup cũ chiếm `40%` màn hình không tự đóng khi đổi trang gây vướng víu và làm người dùng tưởng giao diện bị đơ.
  - **Giải pháp đề xuất:** Gắn `useEffect` lắng nghe sự kiện đổi `chapterId / lessonId` hoặc sự kiện `scroll / touch outside` để tự động đóng (`setPopupOpen(false)`) ngay khi chuyển bài.
  - **Retention Hook:** Giữ luồng chuyển bài học trên điện thoại mượt mà, sạch sẽ.
  - **Files & Blast Radius:** `pages/index.js`.

- [x] **EC-03** | `HIGH` | UX: `8/10` | `2h` | `Wave 1` | `Area C` | Status: `FIXED (Preview)`
  - **URL:** `https://grammarpro.io.vn/`
  - **Thành phần UI:** Chương 05 & Chương 12: Rò rỉ thẻ thô (`'Adj Adv'`) trong câu ví dụ và mã Enum (`'PRACTICE_SENTENCE_TRANSFORMATION'`)
  - **Hiện trạng thực tế:** Tại Chương 05 (Văn phong), câu ví dụ hiển thị dính liền thẻ ngữ pháp thô: `'My brother studies well. Adj Adv'`. Tại Chương 12 (Bài tập tổng hợp), badge hiển thị nguyên mã code `'PRACTICE_SENTENCE_TRANSFORMATION'` kèm dòng `'0 Công thức • 0 Ví dụ'`.
  - **Tại sao cần sửa:** Hiển thị mã biến lập trình (`UPPER_SNAKE_CASE`) và thông số `'0 Công thức • 0 Ví dụ'` tạo cảm giác các chương cuối của khóa học chưa được biên soạn xong, làm giảm giá trị cảm nhận khi người dùng cân nhắc mua VIP.
  - **Giải pháp đề xuất:** (1) Tách thẻ `Adj / Adv` thành các Pill Badge có màu sắc riêng thay vì nối chuỗi thuần; (2) Ánh xạ mã `PRACTICE_SENTENCE_TRANSFORMATION` sang nhãn tiếng Việt `'Luyện tập Chuyển đổi câu'` và ẩn dòng `'0 Công thức'` đối với chương Thực hành.
  - **Retention Hook:** Đảm bảo toàn bộ 12 chương từ đầu đến cuối đều hoàn thiện chỉn chu, đồng nhất chất lượng.
  - **Files & Blast Radius:** `data/ui/preview_data.json` (`9885, 9899, 20400, 25717+`), `lib/diagnostic/adaptive.learning.engine.js`, `lib/diagnostic/roadmap.generator.js`, `lib/knowledge/knowledge-graph.js`, `pages/index.js`. Map enum ở tầng UI để không phá logic backend.

- [x] **EC-04** | `HIGH` | UX: `9/10` | `2h` | `Wave 2` | `Area E` | Status: `FIXED (Preview)`
  - **URL:** `https://grammarpro.io.vn/toeic/diagnostic`
  - **Thành phần UI:** Test Chẩn Đoán AI (3 Chặng): Rò rỉ số câu `'Đã làm'` từ Chặng 1 sang Chặng 2 & 3 và Hardcode chữ màn hình chờ
  - **Hiện trạng thực tế:** Khi hoàn thành 2 câu ở Chặng 1 rồi bấm sang Chặng 2 (chưa làm câu nào của Chặng 2), bảng trạng thái đã báo sẵn `'2/10 câu • Đã làm (2)'`. Khi chuyển từ Chặng 2 sang Chặng 3, màn hình loading vẫn ghi cứng: `'Đang phân tích Chặng 1 & chuẩn bị câu hỏi thích ứng Chặng 2...'`.
  - **Tại sao cần sửa:** Người học đang làm bài kiểm tra thích ứng AI 3 chặng mà thấy số câu đã làm nhảy lộn xộn và thông báo kẹt ở `'Chặng 1 -> Chặng 2'` sẽ nghĩ thuật toán thích ứng chỉ là kịch bản giả.
  - **Giải pháp đề xuất:** (1) Reset bộ đếm câu đã làm theo từng chặng (`stageAnswers[currentStage].length`); (2) Truyền biến động `Đang phân tích Chặng ${stage} & chuẩn bị câu hỏi Chặng ${stage + 1}...` vào màn hình chuyển chặng.
  - **Retention Hook:** Củng cố niềm tin vào thuật toán AI Adaptive thực sự đang phân tích câu trả lời sau mỗi chặng.
  - **Files & Blast Radius:** `components/toeic/ToeicDiagnosticSession.jsx`, `pages/toeic/diagnostic.jsx`.

- [x] **EC-05** | `HIGH` | UX: `10/10` | `3h` | `Wave 1` | `Area E` | Status: `FIXED (Preview)`
  - **URL:** `https://grammarpro.io.vn/toeic/diagnostic`
  - **Thành phần UI:** Câu 1 Chặng 3 Test Chẩn Đoán AI: Hiển thị nhầm đoạn văn Email Reading Part 7 phía trên câu hỏi ngắn Part 5
  - **Hiện trạng thực tế:** Khi vào Câu 1 của Chặng 3, phía trên câu hỏi điền từ ngắn (Part 5) lại xuất hiện nguyên một bức thư điện tử dài (`'Esplin Electronics / Sweeter Specialties'`) hoàn toàn không liên quan tới câu hỏi bên dưới; còn Câu 10 thì hiện mã thô `'READING_COMPREHENSION • #164'`.
  - **Tại sao cần sửa:** Trên màn hình điện thoại, đoạn email thừa chiếm hết toàn bộ màn hình đầu tiên khiến người học tốn 2 phút đọc email xong kéo xuống mới phát hiện câu hỏi ở dưới không hề liên quan tới email đó — gây ức chế cực lớn trong lúc đang tính giờ.
  - **Giải pháp đề xuất:** Kiểm tra điều kiện render `question.passage`: Chỉ hiển thị khung đoạn văn khi câu hỏi thực sự thuộc nhóm Đọc hiểu đoạn văn (`part === 6 || part === 7`) và có `passage_id` khớp với câu hỏi hiện tại.
  - **Retention Hook:** Tránh làm người học mất oan thời gian đọc đoạn văn thừa trên màn hình nhỏ của điện thoại.
  - **Files & Blast Radius:** `components/toeic/ToeicDiagnosticSession.jsx`, `pages/api/toeic/diagnostic/stage.js`.

- [x] **EC-06** | `HIGH` | UX: `9/10` | `3h` | `Wave 1` | `Area E` | Status: `FIXED (Preview)`
  - **URL:** `https://grammarpro.io.vn/toeic/diagnostic`
  - **Thành phần UI:** Báo cáo Kết quả Test Chẩn Đoán AI: Gợi ý học `'Nghe hiểu Part 1-4'` dù bài test chỉ toàn câu Ngữ pháp/Đọc
  - **Hiện trạng thực tế:** Sau khi nộp bài Test Chẩn Đoán AI (vốn chỉ gồm các câu trắc nghiệm đọc/ngữ pháp, không có câu nghe nào), mục `'Top 3 Chủ Điểm Cần Focus Ngay'` ở màn hình kết quả lại xếp `#1` là `'Nghe hiểu Part 3 & Part 4'` và `#2` là `'Nghe hiểu Part 1 & Part 2'`, kèm dòng mô tả cứng: `'Khắc phục các bẫy ngữ pháp thường gặp'`.
  - **Tại sao cần sửa:** Không kiểm tra kỹ năng Nghe câu nào nhưng kết luận học viên yếu nhất phần Nghe (lại kèm mô tả `'bẫy ngữ pháp'`) làm lộ điểm yếu trong logic chấm điểm của AI Advisor.
  - **Giải pháp đề xuất:** Chỉ xếp hạng `'Top 3 Chủ Điểm Cần Focus'` dựa trên tập các chủ điểm (`tested_skills`) thực sự xuất hiện và bị làm sai trong bài kiểm tra vừa nộp; đồng thời viết mô tả riêng cho từng nhóm kỹ năng.
  - **Retention Hook:** Tăng tính thuyết phục của bản báo cáo chẩn đoán AI để người học bấm vào học ngay theo lộ trình gợi ý.
  - **Files & Blast Radius:** `pages/api/toeic/diagnostic/submit.js`, `components/toeic/DiagnosticRadarDashboard.jsx`, `lib/toeic/data-science/`.

- [x] **EC-07** | `HIGH` | UX: `10/10` | `2h` | `Wave 1` | `Area E` | Status: `FIXED (Preview)`
  - **URL:** `https://grammarpro.io.vn/toeic/diagnostic`
  - **Thành phần UI:** Tab `'Lộ Trình 7 Milestones Vượt Trạm'` hiển thị toàn bộ bằng mã ID cơ sở dữ liệu thô (`GRM_POS_NOUN`, `LC_P3_P4...`)
  - **Hiện trạng thực tế:** Tại màn hình Kết quả Test Chẩn Đoán AI, khi mở tab `'Lộ Trình 7 Milestones Vượt Trạm'`, toàn bộ các chủ điểm cần học ở cả 7 trạm đều hiển thị bằng mã code nội bộ: `GRM_POS_NOUN`, `GRM_POS_ADJ`, `GRM_POS_ADV`, `LC_P3_P4_CONVERSATION_TALK`, `GRM_PRON_CASE`, `GRM_VERB_SVA`.
  - **Tại sao cần sửa:** Người học phổ thông nhìn thấy hàng loạt mã kỹ thuật tiếng Anh viết hoa gạch dưới (`GRM_VERB_SVA`) sẽ hoàn toàn không hiểu mình cần học bài gì, làm hỏng màn hình chốt sale/giữ chân quan trọng nhất sau bài test.
  - **Giải pháp đề xuất:** Tạo hàm tra cứu `getSkillDisplayName(skillCode)` ánh xạ toàn bộ mã `GRM_*` và `LC_*` sang tên chuyên đề tiếng Việt thân thiện (ví dụ: `GRM_VERB_SVA -> 'Sự hòa hợp Chủ ngữ & Động từ'`) kèm link bấm vào học trực tiếp.
  - **Retention Hook:** Biến Lộ trình 7 Trạm thành bản kế hoạch hành động rõ ràng, dễ hiểu và bấm vào học tiếp được ngay trên điện thoại.
  - **Files & Blast Radius:** `components/toeic/MilestoneSkillTree.jsx`, `components/toeic/DiagnosticRadarDashboard.jsx`, `data/toeic/grammar_taxonomy.json`.

- [x] **EC-08** | `MEDIUM` | UX: `8/10` | `2h` | `Wave 1` | `Area E` | Status: `FIXED (Preview)`
  - **URL:** `https://grammarpro.io.vn/toeic/diagnostic`
  - **Thành phần UI:** Sai lệch Điểm Mục Tiêu (`650` vs `750`) và công thức Phần trăm Tiến độ (`45/650 = 10%`) trên Báo cáo IRT
  - **Hiện trạng thực tế:** Màn hình báo cáo IRT hiển thị `'Điểm TOEIC Dự Đoán: 45 / 990'`, `'Mục tiêu của bạn: 650'` (dù ngoài trang chủ đang chọn mục tiêu `750+`) và ghi `'Tiến độ Mục tiêu: 10%'` (trong khi `45 / 650` chỉ là `6.9%`, tức đang bị `Math.max(10, ...)` hoặc tính sai).
  - **Tại sao cần sửa:** Sự thiếu nhất quán giữa mục tiêu người dùng đã chọn (`750`) và mục tiêu trong báo cáo (`650`) làm giảm cảm giác hệ thống ghi nhớ cá nhân hóa cho từng học viên.
  - **Giải pháp đề xuất:** Đọc giá trị `targetScore` từ Global User Store (`750`) vào màn hình kết quả và tính chính xác phần trăm tiến độ `Math.round((predictedScore / targetScore) * 100)`.
  - **Retention Hook:** Tạo sự liền mạch xuyên suốt từ bước Chọn mục tiêu -> Làm bài test -> Nhận lộ trình cá nhân hóa.
  - **Files & Blast Radius:** `components/toeic/DiagnosticRadarDashboard.jsx`, `pages/api/toeic/diagnostic/submit.js`.

- [x] **EC-09** | `MEDIUM` | UX: `8/10` | `2h` | `Wave 1` | `Area E` | Status: `FIXED (Preview)`
  - **URL:** `https://grammarpro.io.vn/toeic/tests/ETS2024/2?mode=part5`
  - **Thành phần UI:** Chế độ luyện lẻ `'Part 5 (30 câu)'` của Đề 02 vẫn hiển thị thời gian `'75 Phút'` và `'Bảng Câu Hỏi (101–200)'`
  - **Hiện trạng thực tế:** Khi người dùng chọn luyện riêng `Part 5 (30c)` của Đề 02 (`/toeic/tests/ETS2024/2?mode=part5`), nút bắt đầu và đồng hồ đếm ngược vẫn để `75 Phút` (thời gian của cả 100 câu Reading) và tiêu đề bảng câu hỏi vẫn ghi `101–200` dù bên trong chỉ có câu `101–130`.
  - **Tại sao cần sửa:** Người dùng điện thoại chọn luyện lẻ Part 5 vì họ chỉ có `10–15` phút rảnh. Thấy đồng hồ `75` phút và nhãn `101–200` gây nhầm lẫn rằng họ đang phải làm nguyên đề dài.
  - **Giải pháp đề xuất:** Cấu hình thời gian và nhãn động theo `mode`: Khi `mode=part5` (30 câu), đặt thời gian tiêu chuẩn là `12 Phút` (hoặc `15 Phút`) và đổi nhãn thành `Bảng Câu Hỏi Part 5 (101–130)`.
  - **Retention Hook:** Khuyến khích thói quen luyện đề chia nhỏ (Micro-practice 12 phút/lần) cực kỳ phù hợp với hành vi dùng điện thoại.
  - **Files & Blast Radius:** `pages/toeic/tests/[series]/[testNum].jsx`.

- [x] **EC-10** | `HIGH` | UX: `9/10` | `2h` | `Wave 1` | `Area E` | Status: `FIXED (Preview)`
  - **URL:** `https://grammarpro.io.vn/toeic/tests/ETS2024/2?mode=part5`
  - **Thành phần UI:** Nút `'Nộp Bài & Chấm Điểm'` trong phòng thi TOEIC dùng hộp thoại `window.confirm()` thô của trình duyệt
  - **Hiện trạng thực tế:** Trong khi bài Kiểm tra chẩn đoán 30 câu ở mục Học tập đã có Modal xác nhận nộp bài tùy chỉnh rất đẹp, thì phòng thi 20 Đề TOEIC lại gọi hàm `window.confirm('Còn 29 câu chưa làm!...')` mặc định của trình duyệt.
  - **Tại sao cần sửa:** Hộp thoại `window.confirm()` hệ thống trông thô kệch, lệch tông hoàn toàn với thiết kế hiện đại của web, không hiển thị được nút `'Lưu nháp để làm tiếp sau'` và dễ bị chặn trong một số WebView trên điện thoại (Zalo/Facebook in-app browser).
  - **Giải pháp đề xuất:** Thay thế `window.confirm()` bằng đúng component `<ConfirmSubmitModal />` (hoặc Mobile Bottom Sheet) có 2 nút rõ ràng: `'Làm tiếp các câu còn trống'` và `'Nộp bài & Xem phân tích điểm'`.
  - **Retention Hook:** Đảm bảo luồng nộp bài hoạt động ổn định 100% ngay cả khi người dùng mở link web trực tiếp từ trong ứng dụng Zalo hoặc Messenger.
  - **Files & Blast Radius:** `pages/toeic/tests/[series]/[testNum].jsx:204,416` *(đồng thời kiểm tra luôn `components/diagnostic/DiagnosticTestSession.jsx:197`)*.

- [x] **EC-11** | `MEDIUM` | UX: `8/10` | `3h` | `Wave 2` | `Area C` | Status: `FIXED (Preview)`
  - **URL:** `https://grammarpro.io.vn/`
  - **Thành phần UI:** Màn hình Kết quả Chẩn đoán Ngữ pháp 30 câu thiếu Biểu đồ Radar trực quan như đã giới thiệu ở Hero Card
  - **Hiện trạng thực tế:** Ở màn hình giới thiệu bài Kiểm tra trình độ 30 câu có hình minh họa Biểu đồ Radar rất bắt mắt, nhưng khi làm xong 30 câu và vào màn hình kết quả thì chỉ có danh sách chữ dài (`Ma Trận Năng Lực 10 Chuyên Đề`), không có biểu đồ Radar tổng quan.
  - **Tại sao cần sửa:** Sau khi bỏ ra `15–20` phút làm 30 câu trên điện thoại, người học mong chờ một hình ảnh đồ họa trực quan (Visual Payoff) để chụp màn hình khoe bạn bè hoặc nhìn ngay ra hình dáng năng lực của mình.
  - **Giải pháp đề xuất:** Tái sử dụng component `<RadarChart />` (đang có sẵn bên TOEIC Diagnostic) để vẽ biểu đồ mạng nhện 6–10 nhóm ngữ pháp ngay đầu màn hình kết quả kèm nút `'Tải ảnh / Chia sẻ kết quả'`.
  - **Retention Hook:** Tạo khoảnh khắc tự hào và lan truyền tự nhiên (Viral Social Sharing) khi học viên chia sẻ biểu đồ năng lực của mình lên mạng xã hội.
  - **Files & Blast Radius:** `components/diagnostic/DiagnosticAnalysisDashboard.jsx`, `components/toeic/DiagnosticRadarDashboard.jsx`.

---

## 6. 10 Cơ chế Lôi cuốn & Giữ chân Người dùng Mobile (`RET-01` → `RET-10`)

| Mã | Tên Cơ chế | Khu vực | Nguyên lý Tâm lý | Kịch bản Trải nghiệm Mobile (How It Works) | Tại sao giữ chân lâu hơn? | KPI kỳ vọng |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **RET-01** | **60-Second Interactive Onboarding** (Không bắt login ngay) | Trang chủ (Tổng quan) | Ikea Effect & Time-to-Value | Người mới vào mobile được mời làm ngay 3 câu bắt bệnh ngữ pháp siêu ngắn (45 giây), sau câu 3 tiết lộ điểm mạnh/yếu bằng AI X-Ray. | Tăng tỷ lệ kích hoạt (Activation Rate) ngay phiên đầu tiên. | Bounce Rate giảm `~35%` |
| **RET-02** | **Endowed Progress Effect** (Tặng trước Tiến trình) | Tổng quan & Học tập | Zeigarnik & Endowed Progress | Tặng sẵn 50 XP khởi đầu kèm thanh `'Cấp độ 1: 50/100 XP (50%)'` thay vì `'0/53 bài (0%)'`. | Thúc đẩy hoàn thành trọn vẹn bài học đầu tiên trong 5 phút đầu. | Hoàn thành Bài 1 tăng `~50%` |
| **RET-03** | **Word Bricks** thay cho Gõ bàn phím ảo | Học tập & Luyện tập | Giảm ma sát (Fitts's Law) | Thay ô input gõ chữ bằng các thẻ từ (Word Chips) chạm ghép nhanh bằng 1 ngón cái + micro-feedback + âm `'Ting'`. | Loại bỏ mệt mỏi khi bật/tắt bàn phím ảo, giữ phiên học 10–15 câu liên tục. | Session Duration tăng `~2.2x` |
| **RET-04** | **One-Question Focus Mode** | Luyện tập & TOEIC Diagnostic | Flow State | Mỗi câu hỏi vừa khít 1 khung nhìn dọc không cuộn trang; chọn xong trượt lên giải thích ngắn + `'Câu tiếp theo ->'`. | Học tập trung khi đi xe buýt / giải lao ngắn 5 phút. | Hoàn thành 20 câu từ `~30% -> >75%` |
| **RET-05** | **Bảo vệ Streak & Google Sign-In 1 chạm** | Header & Thành tích | Loss Aversion | Cuối phiên học nhắc nhẹ: `'Bạn vừa tích lũy 75 XP & chuỗi 1 ngày! Lưu lại bằng Google trong 1 chạm'`. | Chuyển đổi khách sang user đăng nhập tự nguyện, không phải gõ mật khẩu. | Sign-up Conversion tăng `~45%` |
| **RET-06** | **Trải nghiệm thử AI Sentence X-Ray 1 chạm** | Tổng quan & TOEIC Hub | Aha-Moment Discovery | Cho chạm trực tiếp vào bất kỳ từ nào trong câu mẫu để tia X-Ray bóc tách S-V-bẫy ngay lập tức. | Khẳng định sự khác biệt của GrammarPro so với web chép đề tĩnh. | Click xem VIP tăng `~60%` |
| **RET-07** | **Cầu nối `'Sai đâu Ôn đó'`** (Hint 2 tầng + Remedial Engine) | Học tập, Luyện tập & SRS | Immediate Feedback Loop | Sai lần 1 hiện Hint tầng 1 (không lộ đáp án) để tự sửa lấy 50% XP; sai tiếp mới giải thích và trỏ đúng bài gốc rễ. | Biến thất vọng khi làm sai thành cơ hội gỡ điểm ngay. | D1 Retention tăng `~28%` |
| **RET-08** | **Mini Audio Player ghim cố định** + Sóng âm thực | TOEIC Dictation Studio | Tương tác đa nhiệm màn hình nhỏ | Ghim thanh Audio (Lùi 3s, Play/Pause, Tốc độ, Gợi ý) ngay trên bàn phím ảo khi gõ Dictation. | Dùng Dictation 540 Tracks thực sự bằng 1 tay trên điện thoại. | Quay lại Dictation/tuần tăng `~45%` |
| **RET-09** | **Mở khóa Điểm IRT thực & Lộ trình 7 Trạm Việt hóa** | TOEIC Hub & Thành tích | Curiosity Gap | Ẩn số `625` giả sau lớp khóa `'Làm 5 câu để mở khóa Điểm Dự Đoán'`, hiện Lộ trình 7 Trạm tiếng Việt + `'Luyện ngay Trạm 1'`. | Kích thích tò mò hoàn thành bài chẩn đoán và học tiếp Trạm 1. | Hoàn thành Test & học tiếp tăng `~55%` |
| **RET-10** | **Ethical Paywall & 1-Tap VietQR Checkout** | Gói VIP & Chuyển đổi | Reference Framing & Low Friction | Đồng bộ giá chuẩn; đặt gói Năm `99k` làm tâm điểm (`~270đ/ngày`), mở QR thanh toán 1 bước không bắt đăng ký rườm rà trước. | Bắt trọn khoảnh khắc chốt đơn siêu tốc qua app ngân hàng mobile. | Paid Conversion tăng `~35%` |

---

## 7. 8 Quy chuẩn Kỹ thuật Giao diện Mobile (`SPEC-01` → `SPEC-08`)

| Mã | Hạng mục Hệ thống | Hiện trạng trên `grammarpro.io.vn` | Thông số Chuẩn hóa cho Mobile (`375px–430px`) | Lợi ích Trải nghiệm Người dùng |
| :--- | :--- | :--- | :--- | :--- |
| **SPEC-01** | **Viewport & Grid** | Desktop 3–4 cột (`1280px–1440px`) | Mobile Single-Column Grid (`375px–430px`), Padding 2 bên: `16px`, Gap: `12px–16px`. | `Horizontal Overflow = 0px` trên mọi iPhone & Android. |
| **SPEC-02** | **Primary Navigation** | Top Sticky Pill Bar 6 mục + 7 badge/nút | Fixed Bottom Navigation Bar (`64px` + Safe Area Bottom), 5 icon có nhãn: Tổng quan, Học tập, Luyện tập, TOEIC AI, Cá nhân/VIP. | Đặt 100% điều hướng chính vào Thumb Zone, giải phóng cạnh trên. |
| **SPEC-03** | **Mobile Top Bar** | Chứa logo, menu, đồng bộ, sao, theme, streak, XP, đăng nhập | Compact Top Header (`52px`): Trái Logo thu gọn, Phải chỉ hiện Streak, XP và Lưu tiến trình / Avatar. | Giữ nhận diện thương hiệu mà không rối mắt. |
| **SPEC-04** | **Touch Targets** | Nút neo `01–06`, lọc Part/Track, icon nhỏ (`~28–32px`) | Chiều cao/rộng tối thiểu mọi nút, chip, ô đáp án: `>= 44px × 44px` (Apple HIG & WCAG 2.2), gap `>= 8px`. | Loại bỏ tình trạng bấm nhầm nút trên cảm ứng. |
| **SPEC-05** | **Typography & SVG Icons** | Một số nút hiện `[ô vuông lỗi font]` (Tofu glyph), chữ nhỏ | `H1: 22–24px`; `H2: 18–20px`; `Body/Input: >= 16px` (chống iOS Safari zoom); thay 100% ký tự Unicode lỗi bằng SVG `lucide-react`. | Triệt tiêu `[ô vuông lỗi font]` và không bị Safari tự zoom khi gõ. |
| **SPEC-06** | **Bottom Sheet Drawer** | Sidebar cố định trái hoặc 2 bảng 100 ô số xếp chồng | Slide-up Bottom Sheet (`max-height: 80vh`, Drag Handle + Backdrop Blur) mở khi chạm thanh tiêu đề bài/câu hỏi. | Giải phóng 85% diện tích màn hình dọc cho nội dung chính. |
| **SPEC-07** | **Question Card & Input** | Cuộn dọc 20 câu hoặc 2 cột kèm `Phím 1–4` | Full-width Focus Card: 4 đáp án 1 cột (`>= 48px`), ẩn gợi ý phím cứng trên `@media (hover: none)`, tắt `autocorrect`. | Tăng tốc đọc & chọn đáp án bằng 1 tay trên điện thoại. |
| **SPEC-08** | **Theme & Custom Modals** | Modal `'Sổ từ'` chữ tối nền tối; TOEIC dùng `window.confirm()` | Đồng bộ biến CSS Theme mọi Modal & Card (`contrast >= 4.5:1`); thay 100% `window.confirm()` bằng Custom React Bottom Sheet Modal. | Hoạt động mượt mà ngay cả trong Zalo/Facebook In-App Browser. |

---

## 8. Checklist Kiểm thử Bắt buộc Sau Mỗi Wave Fix

- [ ] `node scripts/design/generate-token-report.mjs` *(0 token / contrast / z-index / OS-emoji violations)*
- [ ] `node --test tests/question-engine.test.mjs tests/analytics-m47.test.mjs tests/gamification-engine.test.mjs tests/monetization-engine.test.mjs`
- [ ] `git diff --exit-code data/` *(trừ các dòng sửa typo/mapping dữ liệu được duyệt tường minh)*
- [ ] `npm run build` *(Exit `0`)*
- [ ] `VISUAL_BASE_URL=http://localhost:3005 node tests/visual-regression.spec.mjs --capture` *(`20/20` viewport × theme `PASS`)*
