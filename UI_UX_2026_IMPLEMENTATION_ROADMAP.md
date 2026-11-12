# 🗺️ ROADMAP TRIỂN KHAI UI/UX 2026 (2026 MODERN EDTECH REDESIGN TRACKER)

> **Tài liệu gốc:** [`implementation_guide_2026.md`](./implementation_guide_2026.md) • **Audit nền tảng:** [`UI_UX_DESIGN_REVIEW.md`](./UI_UX_DESIGN_REVIEW.md)  
> **Bộ Kit tài nguyên:** `grammar-engine-ui-ux-2026-kit/` (4 Hero Banners + 1 Showcase Preview, 5 Avatars, 43 Vector SVG Icons, 2 Blueprint SVGs, `design-tokens-2026.json`, `design-system-2026.css`, `AppShell2026.jsx`, `FocusTrapModal2026.jsx`)  
> **Quy tắc bất biến:** Bảo toàn 100% học liệu (12 chương / 53 bài / 2,939 câu), tuân thủ **WCAG 2.2 AA (28/28 cặp `>= 4.5:1`)**, **FTC Anti-Dark-Pattern** (không countdown giả, hủy VIP 2 chạm), **Zero Horizontal Overflow** trên 4 breakpoint (`1440 / 1280 / 768 / 375`), và mọi validator Python hiện hành (`2.9`, `2.10`, `2.12`, `design-tokens`).

---

## 📊 TỔNG QUAN TIẾN ĐỘ THEO GIAI ĐOẠN

| Mã Giai đoạn | Tên Hạng mục | Khắc phục Lỗi | Mức ưu tiên | Trạng thái |
| :---: | :--- | :--- | :---: | :---: |
| **UI-2026.1** | Asset Provisioning, CSS Variables 2026 & `_app.js` Integration | `P0` Breakpoints, `P1` Tokens | **P0** | ✅ Hoàn thành |
| **UI-2026.2** | Responsive 5-Hub App Shell, Mobile Bottom Nav & Slide-Over Study Drawer | `P0` Header 16-item overflow, `P0` Sidebar 320px | **P0** | ✅ Hoàn thành |
| **UI-2026.3** | FocusTrap Modal Migration (`#auth`, `#vocab`, `#new-user`) & `#dict-popup` Bottom Sheet | `P1` Legacy Modals Focus Trap & Mobile Popover | **P1** | ✅ Hoàn thành |
| **UI-2026.4** | Tích hợp 4 Hero Banners, Avatars, 43 SVG Icons & Dashboard Zone A / B Bento | `P1` Dashboard Cognitive Overload, `P2` OS Emoji | **P1** | ✅ Hoàn thành |
| **UI-2026.5** | Tuân thủ Text Envelope (`749` stem / `165` formula / `>4` examples collapse) | Text Truncation & Mobile Reading Layout | **P1** | ✅ Hoàn thành |
| **UI-2026.6** | Khử Toàn bộ Mã Màu HEX Cứng (`pages/index.js` + `grammar-viz`, `diagnostic`, `explanation`, `audio` ➔ `var(--ds-*)` & `T.*`) | `P1` Token Debt (`0` hex violations) | **P1** | ✅ Hoàn thành |
| **UI-2026.7** | Automated QA Gate, Git Commit/Push & Live Vercel Production Verification | WCAG AA, Zero Overflow, Live URL Audit | **P0** | ✅ Hoàn thành |

---

## 📋 CHI TIẾT TASK CHECKLIST & TIÊU CHÍ NGHIỆM THU

### 🔹 UI-2026.1 — Asset Provisioning, Token System & Global CSS (P0)
- [x] **UI-2026.1.1:** Copy `assets/banners/01..04*.jpg` (4 hero banners) và `assets/avatars/*` (5 ảnh) sang `public/assets/banners/` & `public/assets/avatars/`.
- [x] **UI-2026.1.2:** Copy toàn bộ **43 Vector SVG Icons** (`6` navigation, `6` tools, `6` levels, `5` badges, `12` chapters, `8` visualizations) sang `public/assets/icons/` (cập nhật `currentColor` sang `#64748B` ở standalone `<img>` SVGs).
- [x] **UI-2026.1.3:** Copy `assets/ui-previews-svg/*.svg` và `05-ui-ux-2026-responsive-showcase.jpg` sang `docs/previews/`.
- [x] **UI-2026.1.4:** Copy `tokens/design-tokens-2026.json` sang `lib/tokens/design-tokens-2026.json` và tạo `styles/design-system-2026.css` (bổ sung `--ds-btn-*` tương phản `#ffffff`, `.ge-subnav-bar`, `.ge-bento-zone-tabs`, `.ge-hero-banner-*`, `.ge-drawer-backdrop`, `.ge-study-shell.is-collapsed`, `.ge-formula-box`).
- [x] **UI-2026.1.5:** Import `../styles/design-system-2026.css` ngay sau `../styles/design-system.css` trong `pages/_app.js` (giữ nguyên Anti-FOUC `<script>`).

### 🔹 UI-2026.2 — Responsive 5-Hub App Shell, Mobile Bottom Nav & Study Drawer (P0)
- [x] **UI-2026.2.1:** Xây dựng `components/ui-2026/AppShell2026.jsx` hỗ trợ đủ:
  - **5 Hub chính** (`dashboard`, `study`/`diagnostic`, `quiz`/`mistakes`, `gamification`, `vip` + `admin` khi `ADMIN`).
  - Bảo toàn **hover/focus prefetch** (`prefetchGamificationData`, `prefetchMonetizationData`), badge số câu sai, `SyncStatusIndicator` popover đầy đủ, Search box gọn + nút toggle Tra từ + Sổ từ + Đổi theme + Streak + XP + Account Pill (hiển thị tên).
  - Tự động ẩn Desktop Header Nav trên `< 768px` và bật **Bottom Navigation Bar 5 nút** (`height: 60px`, `>= 44×44px`).
- [x] **UI-2026.2.2:** Thêm **Segmented Sub-Bar** bên trong Hub `Học & Chẩn đoán` (`12 Chuyên đề (53 bài)` ↔ `🎯 Đánh Giá 30 Câu & Lộ Trình 4 Tuần`) và Hub `Luyện tập & Ôn sai` (`Quiz Engine 50 câu & 50/30/20` ↔ `Sổ tay câu sai`).
- [x] **UI-2026.2.3:** Chuyển Sidebar Study Mode sang **Collapsible `280px` Desktop / `256px` Laptop** (nút `◧ Chế độ Đọc tập trung`) và **Slide-over Drawer + `.ge-mobile-chapter-bar` Sticky Pill** trên Mobile/Tablet (`< 1024px`) kèm backdrop đóng khi bấm ra ngoài.

### 🔹 UI-2026.3 — FocusTrap Modal Migration & `#dict-popup` Mobile Bottom Sheet (P1)
- [x] **UI-2026.3.1:** Tạo `components/ui-2026/FocusTrapModal2026.jsx` hỗ trợ `id`, `data-no-dict`, Focus Trap (`Tab`/`Shift+Tab`), đóng bằng `Esc` + click backdrop, và khôi phục focus.
- [x] **UI-2026.3.2:** Chuyển đổi 3 Legacy Modals trong `pages/index.js` (`#auth-modal`, `#new-user-modal`, `#vocab-modal`) sang `<FocusTrapModal2026>`.
- [x] **UI-2026.3.3:** Cập nhật `#dict-popup` hỗ trợ responsive **Bottom Sheet** trên Mobile `<= 767px`, phím `Esc` để đóng và `<KitIcon name="tool-audio" />` phát âm.

### 🔹 UI-2026.4 — 4 Hero Banners, Avatars, 43 SVG Icons & Dashboard Zone A / B (P1)
- [x] **UI-2026.4.1:** Dashboard (`View 0`): Tích hợp banner `/assets/banners/01-hero-dashboard-vn-foreign.jpg` + lớp phủ `.ge-hero-banner-scrim` và chia **2 Zone Bento** (*Hôm nay & Mục tiêu* — Recommendation, SM-2 Due Cards, Diagnostic CTA, 4 KPIs; *Phân tích & 12 Chuyên đề* — Mastery Intelligence Radar/Curve/Heatmap & Lưới 12 Chương; *Hiển thị tất cả*).
- [x] **UI-2026.4.2:** Study Sidebar & Dashboard Chapter Cards: Gắn 12 Vector Badges `/assets/icons/chapters/ch-01..12-*.svg`.
- [x] **UI-2026.4.3:** Diagnostic & AI Coach (`View 1`): Gắn `/assets/banners/02-diagnostic-roadmap-ai.jpg` vào `DiagnosticOnboarding.jsx` và avatar `/assets/avatars/avatar-02-uk-mentor-male.jpg` / `avatar-04-us-coach-female.jpg` vào `AiAdvisorDrawer.jsx`.
- [x] **UI-2026.4.4:** Gamification Hub (`View 5`): Gắn `/assets/banners/03-gamification-streak-community.jpg`, thay Level Icons bằng `level-01..06-*.svg`, Badge Tiers bằng `badge-tier-01..05-*.svg` (che huy hiệu bí ẩn bằng `badge-tier-05-mystery-locked.svg`), và dùng `/assets/avatars/avatar-*.jpg` cho top ranking preview.
- [x] **UI-2026.4.5:** VIP Hub (`View 6`): Gắn `/assets/banners/04-vip-ai-study-coach.jpg` vào Behavioral Value Banner (với `.ge-hero-banner-scrim` đạt WCAG AA) và `.ge-vip-matrix-row` responsive trên mobile.

### 🔹 UI-2026.5 — Tuân thủ Text Envelope & Trải nghiệm Đọc Dài (P1)
- [x] **UI-2026.5.1:** Áp dụng `.ge-formula-box` (`Geist Mono`, `white-space: pre-wrap`, `overflow-x: auto`, `.is-pos` / `.is-neg` / `.is-q`) cho công thức dài tới `165` ký tự.
- [x] **UI-2026.5.2:** Bổ sung cơ chế thu gọn **Ví dụ trong Quy tắc (`rule.examples.length > 4`)**: mặc định hiện 4 ví dụ đầu + nút `Xem thêm N ví dụ ▾` / `Thu gọn ví dụ ▴`.
- [x] **UI-2026.5.3:** Áp dụng `.ge-lesson-title-clamp` (`-webkit-line-clamp: 2`), tiêu đề mục `flex-wrap: wrap`, và đề bài/giải thích không cố định `height`.

### 🔹 UI-2026.6 — Khử Toàn bộ Mã Màu HEX Cứng (P1)
- [x] **UI-2026.6.1:** Refactor `components/explanation/StructuredExplanation.jsx` & `components/audio/AudioPlayer.jsx` sang `var(--ds-*)` / `T.*` + `<KitIcon name="tool-audio" />` + `<FocusTrapModal2026>`.
- [x] **UI-2026.6.2:** Refactor toàn bộ 12 files trong `components/grammar-visualization/*` sang `var(--ds-*)` / `T.*` và gắn 8 icon `viz-01..08-*.svg` trong `GrammarVisualization.jsx`.
- [x] **UI-2026.6.3:** Refactor toàn bộ 7 files trong `components/diagnostic/*` sang `var(--ds-*)` / `T.*` (`0` hex vi phạm, `<FocusTrapModal2026>` trong `DiagnosticTestSession.jsx`).
- [x] **UI-2026.6.4:** Refactor toàn bộ mã màu HEX cứng trong `pages/index.js` sang `var(--ds-*)` (xác minh `0` mã hex ngoài `#ffffff`, đồng thời gia cố `var(--ds-btn-*)` cho nút chữ trắng ở Dark Mode).
- [x] **UI-2026.6.5:** Cập nhật & kiểm định `scripts/validate-design-tokens.py` quét toàn bộ thư mục UI (`components/ui-2026`, `diagnostic`, `grammar-visualization`, `explanation`, `audio`, `pages/index.js`) — đạt **0 HEX violations**.

### 🔹 UI-2026.7 — QA Compliance Gate & Vercel Production Verification (P0)
- [x] **UI-2026.7.1:** Chạy `validate-design-tokens.py`, `validate-mastery-engine.py`, `validate-gamification-engine.py`, `validate-monetization-engine.py`, kiểm tra 39 `/assets/...` và relative imports — tất cả PASS 100%.
- [x] **UI-2026.7.2:** Commit & Push lên GitHub `main`, theo dõi Vercel Deploy đạt `READY` (`sin1`, commit `2147c20` -> `dpl_9oexLHN69HVVz8fv3abN9ogQKRj1`).
- [x] **UI-2026.7.3:** Kiểm tra HTTP `200` trên Production (`https://grammar-platform.vercel.app`) cho 12 endpoint & static assets (`/assets/banners/...`, `/assets/avatars/...`, `/assets/icons/...`, `/api/...`), đối chiếu CSS bundle + tokens Light/Dark chuẩn WCAG AA và hoàn tất checkbox `[x]` cuối cùng.
- [x] **UI-2026.7.4 (UX Refinement):** Chuyển toàn bộ font chữ sang **Google Sans Text / Google Sans (Product Sans)**, căn lề thẳng hàng `.ge-subnav-bar` + `.ge-study-shell` và chống tràn ngang header ở `<= 1400px`, Việt hóa tiêu đề điều hướng rõ ràng, và sửa `GrammarVisualization` / `TimelineVisualization` chỉ hiển thị ở bài học khớp mô hình + tự động focus đúng thì đang học.
- [x] **UI-2026.7.5 (Pedagogical Explanation & VIP Gating Upgrade):** Hợp nhất còn **3 cấp độ giải thích rõ ràng (`Cơ bản` [mặc định ~30s] ➔ `Sơ cấp` [~45s] ➔ `🔒 Nâng cao (VIP)` [~90s])**, loại bỏ cấp `Trung cấp` trùng lặp, mặc định mở sẵn tab `Cơ bản` khi xem đáp án, khóa nội dung `Nâng cao` cho tài khoản `VIP/ADMIN` (người dùng FREE bấm sẽ mở Smart Paywall), đồng thời bổ sung phân tích riêng cho `WORD_FORMATION`, `CONDITIONALS`, `PASSIVE_VOICE`, v.v.
- [x] **UI-2026.7.6 (Admin Zero-Code VIP Pricing Control):** Bổ sung trình chỉnh sửa **Giá bán (`price_vnd`), Giá niêm yết (`compare_at_vnd`), Số ngày dùng thử (`trial_days`) & Trạng thái mở bán** trực tiếp trong `AdminMonetizationPanel.jsx`, đồng bộ Database Supabase (`POST /api/admin/monetization`) và xóa cache catalog tức thì ở `pages/api/monetization/overview.js` + `MonetizationHub.jsx` mà không cần sửa code hay redeploy.
- [x] **UI-2026.7.7 (Modal Input Focus, Admin RLS Write Context & Coupons Suite):** Sửa triệt để lỗi mất focus khi nhập liệu trong `Modal.jsx` và `FocusTrapModal2026.jsx` (ổn định dependency `onClose` qua `useRef`, chỉ auto-focus lần đầu mở modal); sửa lỗi `compare_at_vnd` + lỗi RLS `Cannot coerce the result to a single JSON object` bằng cách áp dụng Migration `007_admin_monetization_rls.sql` (cấp quyền `INSERT/UPDATE/DELETE` cho `public.is_admin()`) và truyền `req` JWT vào `getAdminClient(req)` trên toàn bộ Admin APIs (`server.js`, `middleware.js`, `monetization.js`, `overview.js`, `policy.js`, `users.js`), đồng thời hoàn thiện trình tạo/quản lý mã giảm giá (`discount_coupons`).
- [x] **UI-2026.7.8 (Forgot Password, Password Recovery, Confirm Password & Instant Sign-Up Flow):** Bổ sung `resetPasswordForEmail`, `updatePassword` (`updateUser`), `withAuthTimeout` (chống treo 504 SMTP), và `onAuthStateChange` vào `services/auth.service.js` + `lib/supabase/client.js`; nâng cấp Auth Modal trong `pages/index.js` thêm ô xác nhận **Nhập lại mật khẩu** bắt buộc khớp khi đăng ký mới, luồng **Quên mật khẩu?** (`forgot`), lắng nghe sự kiện `PASSWORD_RECOVERY` / `?type=recovery` để mở form **Đặt lại mật khẩu mới** (`reset`), và đồng bộ token phiên đăng nhập ngay khi đăng ký thành công.
