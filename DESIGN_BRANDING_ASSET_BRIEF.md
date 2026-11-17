> ⚠️ **TRẠNG THÁI TÀI LIỆU: `SUPERSEDED BY BRAND-UX-V3.1` (THAM KHẢO Ý TƯỞNG GỐC — KHÔNG DÙNG LÀM SPEC SINH ẢNH)**  
> Toàn bộ định dạng ảnh (`.webp` Banners, PNG alpha Mascots, canvas vuông `apple-touch-icon.png`, Asset Registry SHA-256 & Approval Gate) hiện tuân theo **Single Source of Truth duy nhất** tại [`docs/governance/ASSET_PRODUCTION_GOVERNANCE.md`](./docs/governance/ASSET_PRODUCTION_GOVERNANCE.md) & [`docs/governance/MASTER_ART_DIRECTION.md`](./docs/governance/MASTER_ART_DIRECTION.md).

# 🎨 Design Brief & Brand Style Guide: `GrammarPro.io.vn`

> **Mục đích tài liệu:** Quy chuẩn phong cách đồ họa (**Visual Language**) và danh sách toàn bộ tài nguyên hình ảnh cần thiết kế riêng cho **GrammarPro.io.vn**. Tài liệu được chuẩn hóa theo các hệ thống thiết kế tham chiếu bên dưới để team Design nắm bắt đúng tinh thần ngay lập tức và xuất file khớp 100% với mã nguồn (`components/ui-2026/assetMap.js`).

---

## 1. Hệ Thống Tham Chiếu Phong Cách (Style References)

Team Design vui lòng tham chiếu trực tiếp 4 nhóm phong cách sau để đảm bảo toàn bộ ấn phẩm **đồng nhất 1 ngôn ngữ, hiện đại, nhẹ máy và không mang cảm giác "ảnh AI tạo sẵn"**:

| Thành phần đồ họa | Phong cách áp dụng | Repo / Nguồn tham chiếu chuẩn |
| :--- | :--- | :--- |
| **Brand DNA & Bảng màu** | Royal Navy + Electric Blue + Cyan Accent, tách bạch Light/Dark Mode | [`ui-ux-pro-max-skill`](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) • [`hue`](https://github.com/dominikmartn/hue) |
| **Bố cục Banner & Mobile First** | Thoáng, nhiều khoảng trắng, chừa vùng an toàn cho chữ, tối ưu chạm iOS | [`apple-design-skill`](https://github.com/dickwu/apple-design-skill) • [`power-design`](https://github.com/ItsssssJack/power-design) |
| **Icon Điều Hướng, Công Cụ & Chuyên Đề** | Vector nét mảnh đồng nhất (`stroke-width: 1.8px`, `round` cap/join) | [`lucide-icons/lucide`](https://github.com/lucide-icons/lucide) • [`animateicons`](https://github.com/Avijit07x/animateicons) |
| **Mascot, Huy Hiệu & Minh Họa Tính Năng** | Flat / Soft 2.5D Vector, nét bo tròn thân thiện, nền trong suốt | [`MengTo/Skills`](https://github.com/MengTo/Skills) • [`spotkit`](https://github.com/Devesh-Shirsath/spotkit) |

---

## 2. Quy Chuẩn Brand DNA & Nguyên Tắc "Anti-AI Look"

### Bảng màu thương hiệu (`Brand Palette`)
- **Primary Gradient:** `#1E3A8A` (Royal Navy) → `#2563EB` (Electric Blue)
- **Accent Tươi:** `#06B6D4` (Cyan sáng — dùng cho điểm nhấn AI/X-Ray)
- **VIP & Streak:** `#FBBF24` → `#F59E0B` (Vàng hổ phách)
- **Success / Đúng:** `#10B981` (Xanh ngọc)
- **Tương thích 2 chế độ nền:** Light Mode (`#F8FAFC` / `#FFFFFF`) và Dark Mode (`#0F172A` / `#1E293B`).

### Nguyên tắc BẮT BUỘC (Do & Don't theo `power-design` & `apple-design-skill`)
- ✅ **NÊN:** Dùng minh họa Vector/Flat 2.5D có hình khối sạch, ít chi tiết vụn, nhìn rõ ở kích thước nhỏ trên màn hình điện thoại `375px`.
- ✅ **NÊN:** Xuất SVG nền trong suốt cho Icon/Mascot/Huy hiệu để đổi màu mượt giữa Light & Dark Mode.
- ❌ **TRÁNH:** Không vẽ "bộ não phát sáng neon", "robot cầm sách kiểu AI stock", hoặc ảnh người chụp AI nhiều chi tiết rối mắt.
- ❌ **TRÁNH:** Không đặt chi tiết đồ họa đậm màu vào **55% vùng bên trái của Banner** (đây là vùng đặt chữ tiêu đề và nút bấm).

---

## 3. Danh Sách Chi Tiết Các Giao Diện Cần Thiết Kế Hình Ảnh

### Nhóm 1: Logo, Favicon, App Icons & Ảnh Chia Sẻ Link (Ưu tiên P0)

| Hạng mục | Vị trí hiển thị | Kích thước & Format | Đường dẫn trong Code | Phong cách & Yêu cầu |
| :--- | :--- | :--- | :--- | :--- |
| **Logo Chính (Ngang)** | Header, Modal Đăng nhập, Footer | SVG (`height ~36px`, tỷ lệ ~4:1) | `public/logo-grammarpro.svg` | Icon chữ **G** + tia sáng nhỏ + chữ `GrammarPro` + pill `.io.vn`. Có bản chữ tối (Light) & chữ sáng (Dark). |
| **Favicon & App Icon** | Tab trình duyệt, PWA Android | SVG + PNG (`32×32`, `192×192`, `512×512`) | `public/favicon.svg` | Chỉ lấy biểu tượng **G+**, độ tương phản cao, nhìn sắc nét ở `16×16px`. |
| **iOS Home Icon** | Khi user bấm "Thêm vào MH chính" trên iPhone | **PNG nền đặc `180×180px`** | `public/apple-touch-icon.png` *(bắt buộc)* | iOS Safari không nhận SVG cho icon màn hình chính; nền bo góc gradient Royal Blue + logo **G+** trắng ở giữa. |
| **OG Social Banner** | Preview khi gửi link `grammarpro.io.vn` qua Zalo/FB | PNG/JPG `1200×630px` (< 250KB) | `public/og-grammarpro.png` | Logo + tagline ngắn *"Học Ngữ Pháp & Luyện Thi TOEIC 2026"* + 1 khối minh họa Flat bên phải. |

---

### Nhóm 2: Linh Vật Thương Hiệu — Brand Mascot (Ưu tiên P0)

> **Phong cách tham chiếu:** `MengTo/Skills` (Flat Vector / Soft 2.5D thân thiện như Duolingo/Prep). Thiết kế **1 nhân vật đại diện cho `GrammarPro.io.vn`** (gợi ý: nhân vật/linh vật mang huy hiệu **G+**) với **5 biểu cảm**:

| Biểu cảm | Màn hình sử dụng | Kích thước & Format | Đường dẫn đề xuất |
| :--- | :--- | :--- | :--- |
| **1. Chào mừng / Học bài** | Modal Đăng nhập, Màn hình chào, Hướng dẫn | SVG (`240×240px`) | `public/assets/mascot/mascot-welcome.svg` |
| **2. Chúc mừng / Chiến thắng** | Hoàn thành bài test, Lên cấp (`GamificationCelebrationModal.jsx`) | SVG (`240×240px`) | `public/assets/mascot/mascot-celebrate.svg` |
| **3. Động viên (Khi làm sai)** | Màn hình Sổ tay câu sai, Kết quả bài test điểm thấp | SVG (`200×200px`) | `public/assets/mascot/mascot-encourage.svg` |
| **4. Gợi ý VIP (Vương miện)** | Smart Paywall Modal, Trang Gói VIP, Bức tường Câu 21–50 | SVG (`240×240px`) | `public/assets/mascot/mascot-vip.svg` |
| **5. Trạng thái trống (Empty)** | Sổ từ vựng / Sổ câu sai trống, Bộ lọc không có kết quả | SVG (`180×180px`) | `public/assets/mascot/mascot-empty.svg` |
| **6. Avatar Trợ Lý AI** | Khung chat Gia sư AI (`AiAdvisorDrawer.jsx`, `AITutorDrawer.jsx`) | SVG (`128×128px`) | `public/assets/mascot/mascot-ai-coach.svg` |

---

### Nhóm 3: 5 Hero Banners Chính (Ưu tiên P1 — Thay thế ảnh stock hiện tại)

> **Phong cách tham chiếu:** `spotkit` + `power-design` (Minh họa Vector/Abstract sạch sẽ thay cho ảnh chụp AI).
> **Bố cục chuẩn:** 55% bên trái trơn/chuyển sắc nhẹ để đặt text; 45% bên phải đặt cụm đồ họa chính.

| # | Màn hình sử dụng | Đường dẫn (`BANNER_PATHS`) | Kích thước & Format | Chủ đề minh họa |
| :-: | :--- | :--- | :--- | :--- |
| **1** | **Trang chủ (Dashboard)** | `public/assets/banners/01-hero-dashboard-vn-foreign.jpg` | `1440×420px` (WebP/JPG < 120KB) | Sổ tay ngữ pháp, ngọn lửa Streak và đường tiến độ đi lên bên phải. |
| **2** | **Kiểm tra trình độ** | `public/assets/banners/02-diagnostic-roadmap-ai.jpg` | `1440×420px` (WebP/JPG < 120KB) | La bàn định hướng và 3 chặng bậc thang tăng điểm. |
| **3** | **Thành tích & Xếp hạng** | `public/assets/banners/03-gamification-streak-community.jpg` | `1440×420px` (WebP/JPG < 120KB) | Cúp vàng, bục xếp hạng Top 3 và huy hiệu kim cương. |
| **4** | **Trang Nâng Cấp VIP** | `public/assets/banners/04-vip-ai-study-coach.jpg` | `1440×420px` (WebP/JPG < 120KB) | Viên kim cương VIP xanh-vàng và chìa khóa mở khóa kho đề. |
| **5** | **TOEIC AI Hub (`/toeic`)** | `public/assets/banners/05-toeic-adaptive-ai.jpg` | `1440×420px` (WebP/JPG < 120KB) | Tai nghe Listening, thẻ đề đọc và mục tiêu điểm 450 → 990. |

---

### Nhóm 4: Đồ Họa Minh Họa Tính Năng & Chuyển Đổi VIP (Ưu tiên P1)

> **Phong cách tham chiếu:** `Devesh-Shirsath/spotkit` (SVG Product Illustrations đồng nhất 1 hệ thống).

| Hạng mục | Vị trí hiển thị | Đường dẫn | Kích thước & Format | Mô tả |
| :--- | :--- | :--- | :--- | :--- |
| **Thẻ Gói FREE** | `MonetizationHub.jsx` | `public/assets/vip/free-tier-showcase.svg` | SVG (`320×180px`) | Minh họa gọn nhẹ gói học thử cơ bản (tông xám xanh trung tính). |
| **Thẻ Gói VIP** | `MonetizationHub.jsx` | `public/assets/vip/vip-tier-showcase.svg` | SVG (`320×180px`) | Minh họa mở khóa toàn bộ 2.939 câu + 20 đề TOEIC 2026 (tông xanh-vàng nổi bật). |
| **Minh họa Soi Câu X-Ray** | Tab "Khám phá AI" (`AiPowerShowcase2026.jsx`) | `public/assets/banners/xray-preview.svg` | SVG (`600×280px`) | Thẻ câu tiếng Anh có gạch chân Chủ–Vị, gạch chéo bẫy nhiễu trực quan. |
| **Minh họa Lỗi / 404** | Trang `404` & Mất kết nối | `public/assets/mascot/state-404.svg` | SVG (`220×220px`) | Mascot cầm kính lúp tìm trang bị lạc. |

---

### Nhóm 5: 6 Cấp Độ & 20 Huy Hiệu Thành Tích (Ưu tiên P2 — Đồng bộ 100% Vector)

> **Phong cách tham chiếu:** `MengTo/Skills` + `animateicons`. Hiện `public/assets/badges/` đang trộn lẫn `.jpg` và `.svg`, cần làm lại đồng bộ **100% SVG nền trong suốt** (hoặc PNG 2.5D trong suốt):

- **6 Icon Cấp Độ (`public/assets/icons/levels/`, `64×64px` SVG):**
  - `level-01-beginner-sprout.svg` (Mầm non) • `level-02-explorer-compass.svg` (La bàn) • `level-03-fighter-swords.svg` (Song kiếm) • `level-04-expert-mortarboard.svg` (Mũ cử nhân) • `level-05-master-crown.svg` (Vương miện) • `level-06-legend-diamond.svg` (Kim cương).
- **5 Khung Hạng Huy Hiệu (`public/assets/icons/badges/`, `64×64px` SVG):**
  - `badge-tier-01-bronze.svg` → `badge-tier-04-diamond.svg` + `badge-tier-05-mystery-locked.svg`.
- **20 Huy Hiệu Riêng (`public/assets/badges/`, `160×160px`):**
  - `first_step`, `daily_learner_3`, `streak_7_days`, `warrior_30_days`, `consistency_master_100`, `night_owl_hidden`, `tense_explorer`, `master_13_tenses`, `conditional_expert`, `passive_voice_master`, `grammar_legend_12`, `perfect_score`, `sharp_shooter`, `error_hunter`, `comeback_king`, `lightning_master_hidden`, `quiz_starter`, `century_club`, `knowledge_collector`, `review_master`, `mystery_locked`.

---

### Nhóm 6: Bộ Icon Hệ Thống, 12 Chuyên Đề & 8 Sơ Đồ Ngữ Pháp (Ưu tiên P2)

> **Phong cách tham chiếu:** `lucide-icons/lucide` (SVG `viewBox="0 0 24 24"`, `stroke-width="1.8"`, `stroke-linecap="round"`, `stroke-linejoin="round"`).

1. **6 Icon Điều Hướng Chính (`public/assets/icons/navigation/` + `KitIcon.jsx`):**
   - Tổng quan (`hub-01-overview`), Ngữ pháp (`hub-02-study-diagnostic`), Luyện tập (`hub-03-practice-quiz`), TOEIC (`tool-diag`), Thành tích (`hub-04-achievements`), Gói VIP (`hub-05-vip-diamond`), Quản trị (`hub-06-admin-shield`).
2. **6 Icon Công Cụ (`public/assets/icons/tools/`):**
   - `tool-audio-pronounce.svg`, `tool-click-dictionary.svg`, `tool-quick-search.svg`, `tool-sync-cloud.svg`, `tool-theme-toggle.svg`, `tool-vocab-star.svg`.
3. **12 Icon Chuyên Đề Ngữ Pháp (`public/assets/icons/chapters/`, `48×48px` SVG):**
   - `ch-01-tenses.svg` → `ch-12-comprehensive-test.svg`.
4. **8 Sơ Đồ Tư Duy Ngữ Pháp (`public/assets/icons/visualizations/`, `320×160px` SVG):**
   - `viz-01-timeline-13-tenses.svg`, `viz-02-decision-tree-conditionals.svg`, `viz-03-passive-transformation.svg`, `viz-04-reported-speech-flow.svg`, `viz-05-relative-clause-tree.svg`, `viz-06-comparison-scale.svg`, `viz-07-modal-certainty-matrix.svg`, `viz-08-word-family-tree.svg`.

---

### Nhóm 7: 4 Avatar Mặc Định Học Viên (Ưu tiên P3)

- **Vị trí:** Hồ sơ cá nhân & Bảng xếp hạng (`LeaderboardPanel.jsx`).
- **Đường dẫn:** `public/assets/avatars/avatar-01-vn-student-female.jpg`, `avatar-02-uk-mentor-male.jpg`, `avatar-03-vn-learner-male.jpg`, `avatar-04-us-coach-female.jpg`.
- **Phong cách:** Vector/Cartoon vuông `256×256px` nền pastel nhẹ, đồng bộ nét vẽ với Mascot.

---

## 4. Checklist Nghiệm Thu File Bàn Giao

- [ ] **P0:** Logo + Favicon + `apple-touch-icon.png` (`180×180`) + OG Image (`1200×630`) + 6 biểu cảm Mascot.
- [ ] **P1:** 5 Hero Banners (`1440×420`, < 120KB, vùng chữ 55% bên trái sạch) + Thẻ Free/VIP + Minh họa X-Ray + 404.
- [ ] **P2:** Đồng bộ 100% Vector cho 6 Level + 20 Huy hiệu + 12 Chuyên đề + 8 Sơ đồ + Bộ Icon điều hướng (`stroke-width: 1.8`).
- [ ] **P3:** 4 Avatar mặc định (`256×256`).
- [ ] **Kiểm tra chéo:** Mọi SVG đã nén sạch, nền trong suốt, hiển thị rõ trên cả **Light Mode (`#FFFFFF`)** và **Dark Mode (`#0F172A`)**.
