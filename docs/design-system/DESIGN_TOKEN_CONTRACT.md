# 🎨 DESIGN TOKEN CONTRACT & ENFORCEMENT (`SINGLE SOURCE OF TRUTH`)

> **Mục tiêu:** Đảm bảo Grammar Hub và TOEIC Hub dùng chung **1 hệ thống token duy nhất**; chấm dứt việc khai báo màu/radius/z-index rời rạc theo từng màn hình.

---

## 1. Kiến Trúc Luồng Token & Ranh Giới Migration (`T.*` vs `var(--ds-*)`)

```text
lib/tokens/design-tokens.js + spacing.tokens.js + typography.tokens.js
        │
        ▼
styles/design-system-2026.css  (Root CSS Variables Contract: Light & Dark)
        │
        ▼
styles/toeic-ui-2026.css       (Alias kế thừa, CẤM khai báo màu/radius độc lập)
        │
        ▼
All UI Components (Grammar + TOEIC + Modals + Question Engine)
```

- **Quy định chuyển tiếp `T.*` (`M4.1 → M4.6`):** Hiện tại `pages/index.js` và nhiều component (`diagnostic/*`, `explanation/*`) sử dụng object JS `T` từ `lib/tokens/design-tokens.js`. Trong `M4.1–M4.4`, `T.*` được phép dùng song song miễn mọi giá trị khớp 1-1 với `design-tokens.js` (không hardcode HEX ngoài `lib/tokens/`); toàn bộ code mới **ưu tiên `var(--ds-*)`**, và đến **`M4.6`** sẽ hợp nhất hoàn toàn.

---

## 2. Hợp Đồng 8 Nhóm CSS Custom Properties

- **Color Semantic:** `--ds-bg-primary` (`--ds-bg`), `--ds-bg-secondary` (`--ds-bg-sub`), `--ds-bg-elevated`, `--ds-card`, `--ds-text-primary` (`--ds-text`), `--ds-text-secondary`, `--ds-text-muted`, `--ds-text-on-accent`, `--ds-border-default` (`--ds-border`), `--ds-border-subtle`, `--ds-interactive-primary` (`--ds-accent`), `--ds-interactive-hover` (`--ds-accent-hover`), `--ds-success`, `--ds-warning`, **`--ds-danger`** *(tên chuẩn trong codebase; tạo thêm `--ds-error: var(--ds-danger)` làm alias tương thích)*, `--ds-info`.
- **Typography:** `--ds-font-sans`, `--ds-font-display`, `--ds-font-mono`, type scale từ `typography.tokens.js`.
- **Spacing (`4px` grid):** `--ds-space-1` (`4px`) .. `--ds-space-16` (`64px`).
- **Radius:** `--ds-radius-sm` (`4px`), `--ds-radius-md` (`8px`), `--ds-radius-lg` (`12px`), `--ds-radius-xl` (`16px`), `--ds-radius-full` (`9999px`).
- **Shadow:** `--ds-shadow-card`, `--ds-shadow-elevated`, `--ds-shadow-modal`, `--ds-shadow-floating`.
- **Motion:** `--ds-duration-fast` (`120ms`), `--ds-duration-normal` (`200ms`), `--ds-ease-default`.
- **Z-Index & Stacking Context:** Xem mục 3 bên dưới.

---

## 3. Overlay & Stacking Context Policy (Kế Hoạch Sửa Xung Đột Thực Tế Ở `M4.1`/`M4.4A`)

**Hiện trạng đang lệch trong code (phải sửa tại `M4.1` / `M4.4A`):**
- `FocusTrapModal2026.jsx:95` đang ở `zIndex: 1200`, nhưng `#dict-popup` (`pages/index.js:3696`) đang ở `zIndex: 1300` và `DiagnosticQuestionReview.jsx:44` đang ở `zIndex: 9999`; trong `styles/design-system-2026.css:515` `.ge-mobile-chapter-bar` là `35 < backdrop 210`.

**Target Contract Sau Khi Sửa:**
- **Layer 1 — Content & Sticky Shell:** `base (1)` < `sticky header (40)` < `dropdown (100)` < `popover/tooltip (200)`.
- **Layer 2 — Study Mobile Drawer (`< 1024px`):** `backdrop (210)` < `sidebar drawer (220)` < `mobile chapter bar (225)`.
- **Layer 3 — Contextual Dict Popup (`#dict-popup`):** **`z-index: 250`** (cả desktop lẫn mobile bottom sheet `styles/design-system-2026.css:725`); **chỉ kích hoạt trong `[data-dict-area="true"]` và tự động đóng `dictPopup` ngay khi bất kỳ Modal nào mở**.
- **Layer 4 — Blocking Overlays:** `FocusTrapModal2026 / Modal.jsx / DiagnosticQuestionReview (1200)` < `Toast / System Alert (1400)`.

---

## 4. Chính Sách Whitelist & Automation Scripts (Existing vs `M4.1` Build)

- **Phân loại vi phạm:** *Critical* (hardcode màu thương hiệu/semantic trong component), *Major* (spacing/radius lệch token), *Minor* (ngoại lệ chưa đăng ký).
- **Whitelist hợp lệ:** `lib/tokens/*`, `brand constants`, `chart palette`, `SVG vector fills`, `@media print`, và `test fixtures`.
- **Trạng thái Script Kiểm Định:**
  - **Đã có sẵn:** `scripts/validate-design-tokens.py` *(kiểm định 28 cặp WCAG AA trong bảng `PAIRS`)* và `scripts/validate-design-tokens.mjs`.
  - **Xây dựng mới trong `M4.1` (`scripts/design/`):** `validate-design-tokens.py` (mở rộng quét live `design-system-2026.css` + `toeic-ui-2026.css` + components), `validate-color-contrast.py`, `validate-component-usage.py`, `validate-z-index.py`, `validate-responsive.py`, `generate-token-report.py` — bắt buộc in **file, dòng code và giá trị vi phạm**.
