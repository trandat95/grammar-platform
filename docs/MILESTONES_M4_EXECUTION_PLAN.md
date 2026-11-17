# 📋 MILESTONES `M4.0 → M4.7` — CHI TIẾT PHẠM VI, FILE & ACCEPTANCE CRITERIA

> Tài liệu này quy định **phạm vi file được phép sửa**, **điều kiện tiên quyết** và **danh sách Acceptance Criteria đếm được (`Passed X/X`)** cho từng Milestone trong `BRAND-UX-V3.1`, liên kết 1-1 với [`MILESTONE_HANDOVER_PROTOCOL.md`](./governance/MILESTONE_HANDOVER_PROTOCOL.md).

---

## 🔹 `M4.0` — UX Research & Experience Strategy (`P0` • Design Agent)
- **Dependencies:** Baseline `main` đã lock. **Allowed Files:** `docs/learning-experience/*` (chỉ bổ sung spec hành trình, **cấm sửa code**).
- **Scope:** Chuẩn hóa 5 Core User Journeys (*First-Time/Guest, Daily Study, Mistake/SM-2, TOEIC 2026, VIP/SePay Conversion*) và bản đồ vị trí 6 Mascot + 3-State Question UX.
- **Acceptance Criteria (`3/3`):**
  1. Cả 5 User Journeys map đầy đủ điểm chạm & trạng thái lỗi/trống.
  2. Quy định rõ nơi KHÔNG đặt Mascot (KPI cards, giữa câu hỏi đang làm).
  3. Product Owner phê duyệt bằng văn bản trước khi sang `M4.1`.

---

## 🔹 `M4.1` — Foundation, 8-Group Token Bridge & Dark Mode Audit (`P0` • Implementation Agent)
- **Dependencies:** `M4.0` PASS. **Allowed Files:** `UI_UX_DESIGN_REVIEW.md`, `styles/design-system-2026.css`, `styles/toeic-ui-2026.css`, `lib/tokens/*`, `scripts/design/*` *(tạo mới tại M4.1)*, `components/diagnostic/*`, `components/grammar-visualization/TimelineVisualization.jsx`, `docs/qa/content-baseline.sha256.json`.
- **Scope:**
  1. Hiệu đính `UI_UX_DESIGN_REVIEW.md` khớp codebase (`FREE = 4`, `0` trial 7 ngày, SePay VietQR, `151` MC trong `quiz_bank.json`, `507 ⊂ 2,939`, `AppShell2026`).
  2. Lưu baseline `docs/qa/content-baseline.sha256.json` trước khi động chạm UI/Component.
  3. Hoàn thiện 8 nhóm CSS variables trong `design-system-2026.css` (`--ds-space-*`, `--ds-radius-*`, `--ds-shadow-*`, `--ds-duration-*`, `--ds-z-*`, `--ds-text-on-accent`, `--ds-danger` làm chuẩn) + nối `toeic-ui-2026.css` kế thừa; khử `#ffffff` hardcode sai ngữ nghĩa.
  4. Xây dựng bộ kiểm định thực thi được trong `scripts/design/` (nâng cấp từ `scripts/validate-design-tokens.py` + `validate-z-index.py` + `validate-color-contrast.py` + report file/dòng/giá trị vi phạm).
  5. Chạy Dark Mode & 12-State Visual Audit cho toàn bộ Card, Modal, Drawer, Tooltip, Input, Dropdown, Progress, Skeleton, Empty, Banner, Illustration.
- **Acceptance Criteria (`5/5`):**
  1. `docs/qa/content-baseline.sha256.json` được tạo và khớp `100%` data gốc.
  2. `scripts/design/` chạy ra `0` Critical HEX/Token violations & `0` contrast failures (`>= 4.5:1` text thường, `>= 3:1` chữ lớn & UI boundaries).
  3. `UI_UX_DESIGN_REVIEW.md` không còn sai lệch số liệu với code thực tế.
  4. Audit xác nhận rõ coexistence policy giữa `T.*` (`lib/tokens/`) và `var(--ds-*)`.
  5. `npm run build` exit code `0`; zero business logic changes.

---

## 🔹 `M4.2` — Master Art Direction Lock, 3 Prototypes & Master Mascot (`P0` • Design Agent)
- **Dependencies:** `M4.1` PASS. **Allowed Files:** `docs/governance/MASTER_ART_DIRECTION.md`, `public/apple-touch-icon.png`, `public/assets/brand/*`, `public/og-grammarpro.png`, `public/assets/mascot/master-mascot.png`, thư mục preview tham chiếu (`docs/previews/v31/*`).
- **Scope:**
  1. Điền & khóa hoàn chỉnh `docs/governance/MASTER_ART_DIRECTION.md` (10 mục) + Logo Clear Space guide (giữ nguyên `public/logo-grammarpro.svg`).
  2. Tạo Concept Exploration (`3` Concepts × `2` màn `Dashboard + Study` = `6` sketches) để Product Owner chọn `1` Concept duy nhất.
  3. Thiết kế **3 Priority Design Prototypes** (`Dashboard`, `Grammar Study`, `TOEIC Exam` × `1440px` & `375px` × Light/Dark = `12` frames) + Component Anatomy & Token Mapping.
  4. Tạo PWA & Social touchpoints (`apple-touch-icon.png` canvas vuông `180×180`, `icon-192.png`, `icon-512.png`, `og-grammarpro.png` PNG/JPG `1200×630`) + `master-mascot.png` (`512×512` alpha sạch).
- **Acceptance Criteria (`4/4` — ★ GATE A):**
  1. `MASTER_ART_DIRECTION.md` hoàn chỉnh & khóa tỷ lệ Mascot.
  2. `master-mascot.png` + PWA/OG icons qua kiểm tra alpha/halo trên `#FFFFFF` và `#09090B`.
  3. **Gate A đạt `>= 90/100`** với **xác nhận duyệt trực tiếp từ Product Owner** (`0` lỗi Critical).
  4. Không vi phạm business logic / FTC; chỉ khi đạt mới mở khóa `M4.3` & `M4.4A`.

---

## 🔹 `M4.3` — Asset Library Generation & Registry (`P1` • Design Agent — Chạy Song Song `M4.4A`)
- **Dependencies:** `Gate A` PASS. **Allowed Files:** `public/assets/mascot/*`, `public/assets/banners/*`, `public/assets/badges/*`, `public/assets/avatars/*`, `public/assets/vip/*`, `public/assets/asset-registry.json`.
- **Scope:** Sinh `6` biểu cảm Mascot từ `master-mascot.png` (không vẽ lại từ đầu), `5` Hero Banners `.webp` (`1440×420`, mục tiêu `<= 100KB` / max `150KB`, 55% safe-zone trái), `xray-preview.svg`, `state-404.svg`, cập nhật `free/vip-tier-showcase.svg` (`4` câu/bài, `0` trial), đồng nhất **21 Badges** + **4 Avatars** (xóa `00-avatars-vn-intl-grid.jpg`), ghi đủ 12-field metadata trong `public/assets/asset-registry.json` ở trạng thái `pending_po_review` chờ PO chốt `approved`.
- **Acceptance Criteria (`4/4`):**
  1. Đủ 100% file trong `asset-registry.json` kèm `sha256`, `fileSize`, `dimensions`, và PO approval.
  2. Alpha/Halo & Contrast check trên Light (`#FFF`) và Dark (`#09090B`) đạt 100%.
  3. Toàn bộ Banner đạt 55% safe-zone text contrast `>= 4.5:1`.
  4. Không chứa text giả / watermark / logo AI tự vẽ.

---

## 🔹 `M4.4A` — UX Core, `QuestionExperienceEngine` & Mobile Drawer (`P0` • Implementation Agent)
- **Dependencies:** `Gate A` PASS. **Allowed Files:** `components/question-engine/*`, `styles/design-system-2026.css`, `pages/index.js`, `components/ui-2026/AppShell2026.jsx`, `components/diagnostic/DiagnosticQuestionReview.jsx`, `tests/question-engine.test.mjs`.
- **Scope:**
  1. Xây dựng `components/question-engine/` dùng chung cho Study Exercises & Grammar Quiz (Audited MC ID Registry + safe `TextInputRenderer` fallback + 3 States `BeforeAnswer / AfterCorrect / AfterWrong` + fallback trung thực khi thiếu `Common Mistakes` + persistence không mất đáp án).
  2. Viết test runner chuẩn Node (`tests/question-engine.test.mjs` dùng `node:test` / `assert`) phủ đủ **10 Test Fixtures** bắt buộc.
  3. Vá Mobile Study Drawer (`375×812`): `.ge-mobile-chapter-bar` (`225`) > `.ge-chapter-sidebar` (`220`) > `.ge-drawer-backdrop` (`210`), `overflow-x: hidden`, giữ nguyên scroll/input khi đóng mở.
  4. Kích hoạt Focus Reading Mode `max-width: 780px` và chuẩn hóa `#dict-popup` (`z:250`, auto-close khi mở Modal) + `DiagnosticQuestionReview` (`z:1200`).
- **Acceptance Criteria (`5/5`):**
  1. `node tests/question-engine.test.mjs` PASS **10/10** fixtures; scoring & `answers[]` không đổi.
  2. Study & Quiz đều dùng chung `components/question-engine/` (0 logic trùng lặp).
  3. Mobile Drawer `375×812` & `320px` đóng/mở trơn tru, `0px` tràn ngang, không che nút đóng.
  4. `#dict-popup` không bao giờ đè lên Modal đang mở.
  5. `npm run build` exit code `0`.

---

## 🔹 `M4.4B` — Asset Integration, Emotional Mascot & PWA/404 (`P1` • Implementation Agent)
- **Dependencies:** `M4.3` APPROVED + `M4.4A` PASS. **Allowed Files:** `components/ui-2026/assetMap.js`, `components/ui-2026/KitIcon.jsx`, `components/ui-2026/AiPowerShowcase2026.jsx`, `components/toeic/ToeicHeroBanner.jsx` (cập nhật fallback line 85), `components/auth/*`, `components/gamification/*`, `components/monetization/*`, `components/diagnostic/*`, `pages/_app.js`, `pages/404.js`, `pages/index.js`, `public/manifest.json`.
- **Scope:** Nối toàn bộ asset `.webp`/`.png`/`.svg` đã duyệt vào `assetMap.js`, gắn `Skeleton` Zero-CLS & 6 biểu cảm Mascot vào đúng khoảnh khắc UX, nhúng `xray-preview.svg`, thay OS Emoji điều hướng bằng `KitIcon`, cấu hình `apple-touch-icon.png` + `og:image` + `manifest.json`, tạo `pages/404.js`.
- **Acceptance Criteria (`4/4`):**
  1. Chỉ import asset có `status: "approved"` trong `asset-registry.json`.
  2. Mọi ảnh đều khai báo `width`/`height` hoặc `aspect-ratio` (Zero-CLS) & `loading="lazy"` cho ảnh below-the-fold.
  3. `0` tham chiếu tới file `.jpg` banner cũ hoặc `00-avatars-vn-intl-grid.jpg`.
  4. `npm run build` exit code `0`.

---

## 🔹 `M4.5` — Gate B Fidelity, Content SHA-256 & Preview Release Gate (`P0` • Implementation + QA Agent)
- **Dependencies:** `M4.4B` PASS. **Allowed Files:** `docs/qa/*`, `tests/visual-regression.spec.mjs`, reports QA (chỉ sửa fix bug nếu Gate B phát hiện defect).
- **Scope:** Deploy lên **Vercel Preview URL**, chạy Content Integrity (`docs/qa/content-baseline.sha256.json`), 9 Viewports (`320..1440px`) × 2 Themes × 5 Roles, Gate B Visual Comparison (`pixelDiffPct <= 2.0%`, Fidelity `>= 90/100`), Accessibility Keyboard/Zoom `200%`, Core Web Vitals (`LCP <= 2.5s`, `INP <= 200ms`, `CLS <= 0.1`), API Hygiene (`0` unexpected 4xx/5xx; test đủ Expected 4xx Catalog).
- **Acceptance Criteria (`6/6` — ★ GATE B + RELEASE GATE):**
  1. Content SHA-256 baseline khớp `100%` (`507 ⊂ 2,939`).
  2. **Gate B Visual Fidelity `>= 90/100`** (`pixelDiffPct <= 2%`) & PO Sign-off.
  3. `9` Viewports × `2` Themes PASS (`scrollWidth <= innerWidth`, keyboard/safe-area ok).
  4. Core Web Vitals & Font CLS `<= 0.1` đạt chuẩn trên Preview.
  5. Security, Auth, SePay, FTC (`FREE = 4`, `0` trial) & API Expected 4xx test PASS.
  6. Merge `main` có baseline commit rollback sẵn sàng & verify `READY` trên `grammarpro.io.vn`.

---

## 🔹 `M4.6` — Design System Consolidation (`P1` • Implementation Agent)
- **Dependencies:** `M4.5` PASS. **Allowed Files:** `components/design-system/*`, `components/ui-2026/*`, `components/toeic/ui/*`, `docs/design-system/README.md`, optional `/design-showcase` (dev/admin-only).
- **Scope:** Hợp nhất các primitive trùng chức năng (Button, Card, Modal/FocusTrap, EmptyState, Skeleton, Alert) về 1 Contract dùng chung cho Grammar + TOEIC; xóa file thừa chỉ sau khi grep chứng minh `0` dependency (Rule 05).
- **Acceptance Criteria (`3/3`):** `0` component trùng chức năng; `npm run build` & `M4.5` smoke regression PASS; `docs/design-system/README.md` đồng bộ `V3.1`.

---

## 🔹 `M4.7` — FTC-Safe UX & Conversion Analytics (`P1` • Implementation Agent)
- **Dependencies:** `M4.5` PASS. **Allowed Files:** `lib/learning/behavioral-engine.js`, `pages/api/learning/events.js`, UI triggers trong `pages/index.js` & `components/admin/*`.
- **Scope:** Nối 8 KPI theo `LEARNING_ANALYTICS_SCHEMA.md` qua endpoint `POST /api/learning/events` hiện có (bảo đảm deduplication `event_id`, privacy data minimization, `UTC+7` cohorts, consent & RLS hiện hành — không tự ý đổi DB schema trừ khi PO duyệt).
- **Acceptance Criteria (`3/3`):** `8/8` KPI ghi nhận đúng schema & deduplicate; `0` PII/nội dung câu trả lời lọt vào `properties`; `0` dark pattern trong A/B paywall.
