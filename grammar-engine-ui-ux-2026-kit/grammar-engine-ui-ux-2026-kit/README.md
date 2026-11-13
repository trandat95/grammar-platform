# 🚀 TÀI LIỆU ĐẶC TẢ & HƯỚNG DẪN TRIỂN KHAI UI/UX 2026 (IMPLEMENTATION HANDOFF GUIDE)

> **Dự án:** Grammar Engine (`v1.4 PRO` ➔ `2026 Modern EdTech Edition`) — Nền tảng Học & Luyện Ngữ pháp Tiếng Anh Thích ứng (*Giáo trình Mai Lan Hương & Hà Thanh Uyên*)  
> **Tech Stack Mục tiêu:** Next.js `14.2.15` (Pages Router) • React `18.3.1` • CSS Variables + Token Architecture (`lib/tokens/`) • Pure SVG Interactive Visualizations • IndexedDB Offline-First (`public/sw.js`)  
> **Gói tài nguyên đi kèm:** `grammar-engine-ui-ux-2026-kit.zip` (Bao gồm trọn bộ Banners người Việt & người nước ngoài, Avatars, 42 Custom Vector SVG Icons, Sơ đồ Kiến trúc UI SVG, `design-tokens-2026.json`, `design-system-2026.css`, và React Component mẫu).

---

## 1. TỔNG QUAN CÁC VẤN ĐỀ KỸ THUẬT ĐƯỢC GIẢI QUYẾT TRIỆT ĐỂ TRONG BẢN 2026

Dựa trên số liệu kiểm toán thực tế từ `UI_UX_DESIGN_REVIEW.md` (`data/ui/preview_data.json` & `data/ui/quiz_bank.json`), bộ thiết kế 2026 giải quyết dứt điểm **7 điểm ma sát P0 / P1 / P2** mà không phá vỡ bất kỳ quy tắc nghiệp vụ bất biến nào:

| Mức độ | Điểm ma sát ở phiên bản cũ | Giải pháp Kiến trúc UI/UX 2026 (Có sẵn trong gói ZIP) | Tệp thực thi trong ZIP |
| :---: | :--- | :--- | :--- |
| **🔴 P0** | **Thiếu hoàn toàn Responsive Media Queries** (`0` câu lệnh `@media (max-width: ...)` cho Mobile `375px` & Tablet `768px`). | Thiết lập hệ thống **4 Breakpoints chuẩn** (`1440px` Desktop Wide, `1280px` Laptop, `768px–1023px` Tablet, `375px–767px` Mobile) kèm lưới Bento co giãn mượt mà. | `styles/design-system-2026.css` |
| **🔴 P0** | **Sticky Header `56px` nhồi nhét 16 phần tử tương tác** gây tràn ngang (`horizontalOverflow`) trên màn `< 1280px`. | **Gộp 7–8 tab cũ thành 5 Hub nhận thức** trên Desktop (*Tổng quan*, *Học & Chẩn đoán*, *Luyện tập & Ôn sai*, *Thành tích*, *VIP*, cộng *Quản trị* khi `role === 'ADMIN'`). Trên Mobile `375px`, tự động chuyển thành **Bottom Navigation Bar 5 nút** (`height: 60px`, vùng chạm `>= 44×44px`). | `components-react-2026/AppShell2026.jsx` |
| **🔴 P0** | **Sidebar `#chapter-sidebar` cố định `320px`** làm cột bài học trên Mobile `375px` chỉ còn `55px`. | Chuyển sang **Collapsible Sidebar `280px`** trên Desktop (`256px` trên Laptop `1280px`) và biến thành **Slide-over Drawer + Thanh Sticky Chapter Pill** trên Tablet/Mobile (`< 1024px`). | `styles/design-system-2026.css` & `AppShell2026.jsx` |
| **🟠 P1** | **2,205 mã màu HEX cứng** nằm rải rác trong `grammar-visualization/*` (`1,121`), `pages/index.js` (`696`), `diagnostic/*` (`202`). | Ánh xạ toàn bộ sang biến ngữ nghĩa `var(--ds-*)` đạt chuẩn tương phản **WCAG 2.2 AA (`28/28` cặp `>= 4.5:1`)** cho cả Light Mode (`#f8fafc`) và Dark Mode (`#09090b`). | `tokens/design-tokens-2026.json` |
| **🟠 P1** | **Legacy Modals thiếu Focus Trap & phím `Esc`** (`#auth-modal`, `#vocab-modal`, `#new-user-modal`, `#dict-popup`). | Cung cấp component chuẩn `FocusTrapModal2026.jsx` tự động khóa vòng lặp phím `Tab`, đóng bằng `Esc`, hoàn trả focus, và biến `#dict-popup` thành **Bottom Sheet** trên Mobile `375px`. | `components-react-2026/FocusTrapModal2026.jsx` |
| **🟡 P1** | **Trùng nhãn Tab & Quá tải dọc trên Dashboard** (7 khối lớn + 12 Card chương xếp chồng). | Phân tách Dashboard thành **2 Zone Bento rõ rệt**: **Zone A (Above-the-Fold):** Chuỗi Streak, Hàng đợi thẻ SM-2 đến hạn & Mục tiêu ngày; **Zone B (Tab/Accordion):** Radar 12 trục, Đường cong quên lãng & Bản đồ 12 Chuyên đề. | `assets/ui-previews-svg/01-app-shell-responsive-4-breakpoints.svg` |
| **🟢 P2** | **Emoji OS lệch chuẩn (`🎯 🏆 💎 🛡️ 📖 🔥`) & Ô nhập câu hỏi đơn điệu** | Thay toàn bộ Emoji OS bằng **42 Vector SVG Icons `24×24px` / `32×32px`** đồng nhất; chuẩn hóa Card câu hỏi hỗ trợ đề dài `749` ký tự, công thức `165` ký tự và Lời giải 5 bước `1,190` ký tự. | `assets/icons/*` & `02-question-cards-pedagogical-5step.svg` |

---

## 2. CẤU TRÚC THƯ MỤC GÓI BÀN GIAO (`grammar-engine-ui-ux-2026-kit.zip`)

Khi giải nén `grammar-engine-ui-ux-2026-kit.zip` và copy vào thư mục `public/assets/` cũng như `styles/` và `components/` của dự án Next.js, đội ngũ Frontend sẽ có đầy đủ:

| Đường dẫn trong gói ZIP | Đích tích hợp trong Next.js | Số lượng | Mô tả chi tiết tài nguyên |
| :--- | :--- | :---: | :--- |
| `assets/banners/01-hero-dashboard-vn-foreign.jpg` | `public/assets/banners/` | 1 | **Hero Banner Dashboard (16:9):** Học viên đại học Việt Nam và Mentor bản xứ nước ngoài tương tác trên bảng Hologram Timeline ngữ pháp & Radar 12 trục. |
| `assets/banners/02-diagnostic-roadmap-ai.jpg` | `public/assets/banners/` | 1 | **Banner Chẩn đoán & Lộ trình (16:9):** Học viên Việt Nam và Coach quốc tế phân tích đồ thị Knowledge Graph 30 câu & Lộ trình 4 tuần. |
| `assets/banners/03-gamification-streak-community.jpg` | `public/assets/banners/` | 1 | **Banner Cộng đồng & Thành tích (16:9):** Nhóm học viên Việt Nam & bạn bè quốc tế ăn mừng cột mốc Streak cùng huy hiệu 3D. |
| `assets/banners/04-vip-ai-study-coach.jpg` | `public/assets/banners/` | 1 | **Banner VIP Hub & AI Coach (16:9, Dark Mode):** Học viên Việt Nam luyện phát âm chuẩn IPA sóng âm cùng giảng viên bản xứ & biểu tượng kim cương VIP. |
| `assets/banners/05-ui-ux-2026-responsive-showcase.jpg` | `docs/previews/` | 1 | **Mockup Tổng thể UI 2026 (16:9):** Trình diễn song song màn hình Desktop `1440px` (Light Mode) và Mobile `375px` (Dark Mode). |
| `assets/avatars/00-avatars-vn-intl-grid.jpg` & `avatar-01..04.jpg` | `public/assets/avatars/` | 5 | **Bộ Avatar Học viên Việt Nam & Giảng viên Quốc tế:** Dùng cho AI Study Coach, Testimonial, Bảng xếp hạng và Hồ sơ mẫu. |
| `assets/icons/navigation/hub-01..06.svg` | `public/assets/icons/navigation/` | 6 | **6 Icon Điều hướng Hub chính:** Tổng quan, Học & Chẩn đoán, Luyện tập Quiz, Thành tích, VIP Diamond, Quản trị Admin Shield. |
| `assets/icons/tools/tool-*.svg` | `public/assets/icons/tools/` | 6 | **6 Icon Công cụ Nhanh trên Header:** Đồng bộ Cloud (`SyncStatusIndicator`), Tìm kiếm nhanh, Click-Dict, Đổi Theme, Sổ từ vựng, Loa phát âm Audio. |
| `assets/icons/levels/level-01..06-*.svg` | `public/assets/icons/levels/` | 6 | **6 Biểu trưng Cấp độ Chính thức (Level Bands):** Beginner (`Lv 1-5`), Explorer (`Lv 6-10`), Fighter (`Lv 11-20`), Expert (`Lv 21-30`), Master (`Lv 31-40`), Legend (`Lv 41+`). |
| `assets/icons/badges/badge-tier-01..05-*.svg` | `public/assets/icons/badges/` | 5 | **5 Huy hiệu Thành tích:** Bronze, Silver, Gold, Diamond và Mystery Locked Badge (che metadata khi chưa mở khóa). |
| `assets/icons/visualizations/viz-01..08-*.svg` | `public/assets/icons/visualizations/` | 8 | **8 Icon Mô hình Trực quan Ngữ pháp:** Trục thời gian 13 thì, Cây điều kiện, Biến đổi bị động, Câu gián tiếp, Mệnh đề quan hệ, Thang so sánh, Ma trận Modal, Cây họ từ. |
| `assets/icons/chapters/ch-01..12-*.svg` | `public/assets/icons/chapters/` | 12 | **12 Badge Chuyên đề Ngữ pháp (`01`–`12`):** Thiết kế bằng font `Geist Mono` với bảng màu phân biệt từng chương. |
| `assets/ui-previews-svg/*.svg` | `docs/previews/` | 2 | **Bản vẽ Kỹ thuật Vector SVG:** Đặc tả kích thước 4 Breakpoints, Card câu hỏi 749 ký tự, Lời giải 5 bước, `#dict-popup` và Smart Paywall. |
| `tokens/design-tokens-2026.json` | `lib/tokens/design-tokens-2026.json` | 1 | **Bộ Token 3 Tầng (JSON):** Đầy đủ Light/Dark Mode, Breakpoints, Containers, Typography Scale 10 bậc. |
| `styles/design-system-2026.css` | `styles/design-system-2026.css` | 1 | **Global Responsive Stylesheet:** Chứa toàn bộ biến CSS, Media Queries 4 Breakpoints, Focus Ring, Touch Target `44×44px` và Reduced Motion. |
| `components-react-2026/*.jsx` | `components/ui-2026/` | 2 | **React Component mẫu:** `AppShell2026.jsx` (Header 5-Hub + Drawer + Bottom Nav) và `FocusTrapModal2026.jsx` (WCAG Dialog). |

---

## 3. QUY TẮC TEXT ENVELOPE & KÍCH THƯỚC KHUNG CHỨA (BẮT BUỘC TUÂN THỦ KHI CODE)

Khi đội Frontend tích hợp giao diện mới vào dữ liệu thật từ `preview_data.json` và `quiz_bank.json`, **tuyệt đối không dùng chiều cao cố định (`height` cứng) hoặc `white-space: nowrap`** trên các thành phần chứa nội dung sau:

| Thành phần Dữ liệu | Độ dài Thực tế (Min / Avg / P95 / Max) | Quy tắc CSS & Layout Bắt buộc |
| :--- | :--- | :--- |
| **Tên Bài học (`title_vi`)** | Min `5` • Avg `25.6` • P95 `51` • **Max `66` ký tự** | Trong Sidebar `280px`, đặt `line-height: 1.35`, cho phép xuống dòng tối đa **2 dòng** (`display: -webkit-box; -webkit-line-clamp: 2`). |
| **Tiêu đề Mục (`section.title`)** | Min `5` • Avg `34.0` • P95 `75` • **Max `115` ký tự** | Dùng `flex-wrap: wrap` trên thanh Header của mỗi mục lý thuyết; không ép 1 dòng. |
| **Nội dung Quy tắc (`rule.content`)** | Min `0` • Avg `54.1` • P95 `154` • **Max `258` ký tự** | Kèm trung bình `1.3` ví dụ (cá biệt có rule chứa tới **22 ví dụ!**). Nếu `examples.length > 4`, hiển thị 4 ví dụ đầu và nút `Xem thêm N ví dụ ▾` để tránh kéo dài trang. |
| **Công thức (`formula.text`)** | Min `5` • Avg `44.3` • P95 `120` • **Max `165` ký tự** | Dùng class `.ge-formula-box` (`font-family: 'Geist Mono'`, `overflow-x: auto`, `white-space: pre-wrap`, viền trái `4px` phân màu `(+)` xanh lá `#047857`, `(-)` đỏ `#dc2626`, `(?)` xanh dương `#2563eb`). |
| **Đề câu hỏi (`question.stem`)** | Min `8` • Avg `53.6` • P95 `86` • **Max `749` ký tự** | 95% câu ngắn `<= 86` ký tự, nhưng có câu đoạn văn dài **749 ký tự**. Khung đề câu hỏi dùng `font-size: 1rem`, `line-height: 1.65`, tự giãn chiều cao. |
| **Gợi ý mở đầu (`starter_prompt`)** | Có trong **347 câu hỏi** | Hiển thị hộp cảnh báo vàng (`background: var(--ds-warning-bg)`, `border: 1.5px solid var(--ds-warning-border)`) ngay trên ô `<input type="text">` với nhãn `BẮT ĐẦU VỚI:`. |
| **Lời giải 5 bước (`explanation`)** | Min `184` • Avg `303.6` • P95 `396` • **Max `1,190` ký tự** | Luôn giữ đủ **5 khối sư phạm** trong `StructuredExplanation`: (1) Signal ➔ (2) Rule ➔ (3) Dịch nghĩa & Audio ➔ (4) Common Mistakes ➔ (5) Exam Tips + thanh chuyển độ sâu `Basic / Intermediate / Advanced`. |

---

## 4. HƯỚNG DẪN TÍCH HỢP TỪNG BƯỚC CHO ĐỘI FRONTEND (NEXT.JS 14.2.15)

### Bước 1: Nhập CSS Responsive & Bộ Token 2026 vào `pages/_app.js`

1. Copy `styles/design-system-2026.css` vào thư mục `styles/` của dự án và import ngay sau `styles/design-system.css` trong `pages/_app.js`:
   ```javascript
   import '../styles/design-system.css';
   import '../styles/design-system-2026.css';
   ```
2. Giữ nguyên đoạn inline script chống chớp trắng (Anti-FOUC) trong `pages/_app.js` để đọc `localStorage.getItem('grammar_theme')` và gán `document.documentElement.setAttribute('data-theme', theme)` trước khi React hydrate.

### Bước 2: Thay thế Sticky Header 16 phần tử bằng `AppShell2026.jsx`

Trong `pages/index.js` (vùng dòng `3185–3650`), thay thế thanh `<header>` cũ và `<aside id="chapter-sidebar" style={{ width: "320px" }}>` bằng `AppShell2026`:
- **Gộp Tab thông minh:**
  - Khi người dùng chọn Hub **`Học & Chẩn đoán`**, hiển thị Segmented Sub-bar nhỏ gọn ở đầu trang cho phép chuyển nhanh giữa `📖 12 Chuyên đề (53 bài)` và `🎯 Chẩn đoán 30 câu & Lộ trình 4 tuần`.
  - Khi người dùng chọn Hub **`Luyện tập & Ôn sai`**, hiển thị Segmented Sub-bar chuyển giữa `⚡ Quiz Engine (Đề Thích Ứng 50/30/20)` và `📓 Sổ tay câu sai`.
- **Tự động thích ứng trên Mobile `375px`:**
  - Thanh `<nav className="ge-hub-nav">` trên Header tự động ẩn đi qua CSS `@media (max-width: 767px)` và nhường chỗ cho `<nav className="ge-mobile-bottom-nav">` cố định dưới đáy màn hình với 5 nút chuẩn `44×44px`.
  - Ở chế độ `study`, thanh `.ge-mobile-chapter-bar` ghim ngay dưới Header giúp học viên mở Drawer chọn bài học chỉ với 1 chạm mà không chiếm diện tích đọc lý thuyết.

### Bước 3: Tích hợp Bộ Hình ảnh/Banner (Người Việt & Người Nước Ngoài) vào 4 Màn hình Trọng tâm

Copy thư mục `assets/banners/` và `assets/avatars/` vào `public/assets/` và gắn vào 4 khu vực tương ứng:

1. **Dashboard Hero Banner (`View 0 — Lộ trình & Streak`):**
   - Sử dụng `/assets/banners/01-hero-dashboard-vn-foreign.jpg` làm ảnh minh họa nền/cột phải cho khối Hero Banner chào mừng học viên, kết hợp lớp phủ gradient `linear-gradient(90deg, var(--ds-card) 45%, rgba(17,17,21,0.25) 100%)` để nổi bật chuỗi Streak `🔥 N ngày` và lịch 7 ngày (`CN..T7`).
2. **Diagnostic Onboarding (`View 1 — DiagnosticOnboarding.jsx`):**
   - Sử dụng `/assets/banners/02-diagnostic-roadmap-ai.jpg` trong Hero Card giới thiệu bài thi Chẩn đoán 30 câu (20 phút) và đồ thị Knowledge Graph Root Cause.
   - Sử dụng `/assets/avatars/avatar-02-uk-mentor-male.jpg` và `/assets/avatars/avatar-04-us-coach-female.jpg` làm avatar đại diện cho **AI Study Coach (`AiAdvisorDrawer`)** để tạo cảm giác gần gũi, sinh động như học cùng cố vấn quốc tế.
3. **Gamification Hub (`View 5 — 🏆 Thành tích`):**
   - Sử dụng `/assets/banners/03-gamification-streak-community.jpg` làm banner đầu trang cho khu vực Thử thách Ngày/Tuần & Bảng xếp hạng.
   - Thay thế các icon cấp độ emoji bằng 6 file SVG trong `/assets/icons/levels/level-01..06-*.svg` và 5 file huy hiệu trong `/assets/icons/badges/badge-tier-01..05-*.svg`.
4. **VIP Upgrade Hub (`View 6 — 💎 Nâng cấp VIP`):**
   - Sử dụng `/assets/banners/04-vip-ai-study-coach.jpg` trong khối **Behavioral Psychology Value Banner** để truyền tải trực quan giá trị của tính năng Luyện phát âm chuẩn bản xứ, AI Study Coach và mở khóa trọn bộ 2,939 câu hỏi.

### Bước 4: Khử 2,205 Mã Màu HEX Cứng trong `grammar-visualization/*` & `StructuredExplanation`

Khi refactor 8 component trong `components/grammar-visualization/`:
- Thay thế các mã màu nền cứng (`#18181b`, `#27272a`, `#f8fafc`) bằng `var(--ds-bg-elevated)`, `var(--ds-border)`, `var(--ds-bg)`.
- Thay thế các mã màu chữ xám cứng (`#d4d4d8`, `#a1a1aa`, `#71717a`) vốn làm mờ chữ ở Light Mode bằng `var(--ds-text-secondary)` và `var(--ds-text-muted)`.
- Gắn 8 icon SVG chuyên biệt từ `/assets/icons/visualizations/viz-01..08-*.svg` vào Header của từng sơ đồ tương tác.

---

## 5. CHECKLIST KIỂM ĐỊNH TRƯỚC KHI DEPLOY (QA & COMPLIANCE GATE)

Trước khi merge nhánh UI/UX 2026 lên Production (`https://grammar-platform.vercel.app`), chạy đầy đủ 5 bước kiểm định sau:

- [ ] **1. Kiểm định Tương phản WCAG 2.2 AA:** Chạy `python scripts/validate-design-tokens.py` đảm bảo `28/28` cặp màu trong cả Light Mode và Dark Mode đều đạt `>= 4.5:1`.
- [ ] **2. Kiểm định Không Tràn Ngang (Zero Horizontal Overflow):** Mở DevTools kiểm tra lần lượt ở 4 kích thước `1440×900`, `1280×800`, `768×1024`, và `375×812` (`document.documentElement.scrollWidth <= window.innerWidth`).
- [ ] **3. Kiểm định Bàn phím & Trợ năng:** Bấm `Tab` qua Sticky Header đảm bảo không phần tử nào bị che khuất (`scroll-padding-top: 76px`); mở `#auth-modal`, `#vocab-modal`, `SmartPaywallModal` và bấm `Esc` để kiểm tra Focus Trap.
- [ ] **4. Kiểm định Đạo đức FTC Anti-Dark-Pattern:** Xác nhận trên `SmartPaywallModal` và tab `VIP` không có đồng hồ đếm ngược giả, hiển thị rõ giá sau dùng thử (`99,000đ/tháng` hoặc `699,000đ/năm`), không chen ngang khi đang làm dở 10 câu miễn phí đầu chương, và luồng Hủy VIP hoạt động đúng trong **2 chạm** kèm cam kết giữ nguyên 100% XP, Streak & Sổ tay câu sai.
- [ ] **5. Kiểm định Offline-First & SWR Prefetch:** Ngắt mạng trong DevTools (`Offline`), làm thử 3 câu bài tập chương và kiểm tra `SyncStatusIndicator` chuyển sang `⚪ Offline` / `🟠 Chờ gửi (3)` mượt mà mà không mất dữ liệu.
