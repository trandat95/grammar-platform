# 🎯 `BRAND-UX-V3.1` — MASTER EXECUTION & ARCHITECTURE INDEX

> **GrammarPro is not designed to look premium only. It must deliver a premium learning experience through consistency, intelligence, usability, measurable learning progress, and technical reliability.**  
> *Every design decision must improve learning effectiveness, every visual asset must strengthen brand identity, and every code change must preserve business integrity.*

- **Thương hiệu:** `GrammarPro.io.vn` — **Premium AI-Powered Learning Platform**
- **Tài liệu nguồn song hành:** [`ROADMAP_AND_ARCHITECTURE.md`](../ROADMAP_AND_ARCHITECTURE.md) • [`UI_UX_DESIGN_REVIEW.md`](../UI_UX_DESIGN_REVIEW.md) • [`DESIGN_BRANDING_ASSET_BRIEF.md`](../DESIGN_BRANDING_ASSET_BRIEF.md)

---

## 1. SOURCE OF TRUTH & XUNG ĐỘT NGHIỆP VỤ (RESOLUTION ORDER)

Thứ tự ưu tiên bắt buộc khi có sai lệch:
`1. Production Codebase & Data thực tế` > `2. ROADMAP_AND_ARCHITECTURE.md` > `3. docs/BRAND-UX-V3.1.md & Bộ Spec con` > `4. UI_UX_DESIGN_REVIEW.md` > `5. Đề xuất mới của AI`.

**4 Sự thật Codebase Đã Khóa (Hiệu đính từ `UI_UX_DESIGN_REVIEW.md` cũ):**
1. **Dữ liệu câu hỏi:** `data/ui/preview_data.json` gồm **12 chương, 53 bài học, 507 câu bài tập chương**; toàn bộ `507` câu này nằm **bên trong** ngân hàng tổng hợp **`2,939` câu** của `data/ui/quiz_bank.json` (`overlap = 507`, tuyệt đối không cộng dồn hai file). Trong `quiz_bank.json` có **151 câu `MULTIPLE_CHOICE`** (`148` câu có lựa chọn `(opt1/opt2)` nhúng trong `stem`; `3` câu lỗi cú pháp/không dùng `(a/b)` giữ fallback `<input>`), và bên trong `preview_data.json` chứa tập con **`49` `MULTIPLE_CHOICE` (`48` inline)**.
2. **VIP & Thanh toán:** `FREE_QUESTIONS_PER_EXERCISE = 4` câu/bài tập; **đã gỡ bỏ hoàn toàn dùng thử 7 ngày** (`trial_days = 0`); thanh toán qua **SePay VA + Dynamic VietQR** (`qr.sepay.vn/img`); giữ nguyên nút hủy VIP 2 chạm & FTC Anti-Dark-Pattern.
3. **App Shell & Modals:** Đã vận hành `AppShell2026.jsx`, `FocusTrapModal2026.jsx`, `design-system-2026.css`, `toeic-ui-2026.css`. Không đập đi làm lại từ đầu.
4. **Thương hiệu:** Giữ nguyên Logo SVG `public/logo-grammarpro.svg` & `GrammarProLogo.jsx`.

---

## 2. SƠ ĐỒ MILESTONE & PHÂN TÁCH DEPENDENCY (`M4.0` → `M4.7`)

```text
M4.0 (UX Research & Strategy - P0)
  │
  ▼
M4.1 (Foundation, Token Contract & Dark Audit - P0)
  │
  ▼
M4.2 (Master Art Direction, Concept Explore & 3 Ref Prototypes + Master Mascot - P0)
  │
  ▼
★ GATE A: DESIGN APPROVAL (>= 90/100, 0 Critical)
  ├─────────────────────────┐
  ▼                         ▼
M4.3 (Asset Library - P1)  M4.4A (Question Engine Core, Mobile Drawer, UX Core - P0)
  │                         │
  └───────────┬─────────────┘
              ▼
            M4.4B (Wire Mascot, Banners, Badges & 404 Assets - P1)
              │
              ▼
★ GATE B & M4.5 (Implementation Fidelity >= 90/100, SHA-256 Content, Preview QA - P0)
              │
              ▼
M4.6 (Design System Consolidation - P1)
              │
              ▼
M4.7 (FTC-Safe Learning & Conversion Analytics - P1)
```

---

## 3. PHÂN TÁCH VAI TRÒ & QUY TRÌNH GIAO VIỆC (AUDIT → APPROVE → NEXT)

Không giao toàn bộ `M4.0..M4.7` trong một lần. Mỗi Milestone bắt buộc chạy qua **7 Stage**:
`1. Audit Codebase` → `2. Implementation Plan` → `3. Product Owner Duyệt` → `4. Execute theo từng nhóm nhỏ` → `5. Run Validation` → `6. Completion Report` → `7. Product Owner Sign-off`.

- **Design Agent:** Thực hiện `M4.0`, `M4.2`, `M4.3` (UX research, `MASTER_ART_DIRECTION.md`, prototype, sinh asset, Component Spec). **Không sửa production code.**
- **Implementation Agent:** Thực hiện `M4.1`, `M4.4A`, `M4.4B`, `M4.5`, `M4.6`, `M4.7` (CSS Tokens, `QuestionEngine`, Mobile Drawer, wiring asset, QA & Analytics). **Không tự đổi thiết kế đã duyệt tại Gate A.**
- **Product Owner (User):** Phê duyệt Gate A, Gate B, `asset-registry.json` (`status: "approved"`) và mọi *Functional Change* trước khi chạm logic nghiệp vụ. **AI bị cấm tự bật trạng thái `approved` cho bài làm của chính mình.**

**Phạm vi & Checklist chi tiết từng Milestone (`M4.0 → M4.7`):** Xem [`MILESTONES_M4_EXECUTION_PLAN.md`](./MILESTONES_M4_EXECUTION_PLAN.md).

---

## 4. CẤU TRÚC TÀI LIỆU GOVERNANCE CHUYÊN BIỆT

### Planning & Master Control (`docs/`)
- [`MILESTONES_M4_EXECUTION_PLAN.md`](./MILESTONES_M4_EXECUTION_PLAN.md) — Phạm vi file, Dependencies & Checklist nghiệm thu `X/X` cho `M4.0`..`M4.7` (tách `M4.4A` & `M4.4B`).

### Governance (`docs/governance/`)
- [`MASTER_EXECUTION_PROTOCOL.md`](./governance/MASTER_EXECUTION_PROTOCOL.md) — 10 quy tắc thép điều khiển AI Agent + *Stop on Undocumented Conflict*.
- [`MASTER_ART_DIRECTION.md`](./governance/MASTER_ART_DIRECTION.md) — Khóa phong cách thương hiệu, giải phẫu Mascot, Do/Don't *(Chờ chốt M4.2)*.
- [`DESIGN_APPROVAL_PROTOCOL.md`](./governance/DESIGN_APPROVAL_PROTOCOL.md) — Gate A (Design) & Gate B (Code Fidelity `>= 90/100`), Concept Exploration vs Prototypes.
- [`DESIGN_TO_CODE_GOVERNANCE.md`](./governance/DESIGN_TO_CODE_GOVERNANCE.md) — 8 Handoff Deliverables & ràng buộc React/CSS thực tế.
- [`ASSET_PRODUCTION_GOVERNANCE.md`](./governance/ASSET_PRODUCTION_GOVERNANCE.md) — Pipeline 7 bước, 12-field Asset Metadata (`sha256`, `status`), quy định WebP/PNG/SVG/OG/iOS Icon.
- [`MILESTONE_HANDOVER_PROTOCOL.md`](./governance/MILESTONE_HANDOVER_PROTOCOL.md) — Mẫu báo cáo bàn giao 9 mục bắt buộc cho mỗi Milestone.

### Design System (`docs/design-system/`)
- [`DESIGN_TOKEN_CONTRACT.md`](./design-system/DESIGN_TOKEN_CONTRACT.md) — Single Source of Truth `lib/tokens/` → CSS, whitelist HEX, Stacking Context Policy.
- [`COMPONENT_ANATOMY_SPEC.md`](./design-system/COMPONENT_ANATOMY_SPEC.md) — 8 chiều giải phẫu Buttons, Cards, Modals & 12 UI States.
- [`RESPONSIVE_BEHAVIOR_SPEC.md`](./design-system/RESPONSIVE_BEHAVIOR_SPEC.md) — Ma trận 9 viewport (`320..1440px`), bàn phím ảo, iOS Safe Area, Mobile Drawer.
- [`ACCESSIBILITY_SPEC.md`](./design-system/ACCESSIBILITY_SPEC.md) — WCAG 2.2 AA phân cấp (`>= 4.5:1` text thường, `>= 3:1` chữ lớn & UI boundaries), keyboard & focus trap.

### Learning Experience (`docs/learning-experience/`)
- [`QUESTION_EXPERIENCE_ENGINE.md`](./learning-experience/QUESTION_EXPERIENCE_ENGINE.md) — `components/question-engine/`, Audited MC Registry, 3-State Flow + Persistence & 10 Test Fixtures.
- [`LEARNING_UX_SPEC.md`](./learning-experience/LEARNING_UX_SPEC.md) — 8 nguyên tắc Learning UX, 6 tính năng Retention dựa trên dữ liệu thật, Mascot Emotional Mapping.
- [`LEARNING_ANALYTICS_SCHEMA.md`](./learning-experience/LEARNING_ANALYTICS_SCHEMA.md) — Event Schema JSON, công thức 8 KPI, Cohort/UTC+7, Consent & RLS.

### QA & Release (`docs/qa/`)
- [`DESIGN_QA_MATRIX.md`](./qa/DESIGN_QA_MATRIX.md) — Ma trận kiểm thử Light/Dark × 9 Viewports × 5 Roles.
- [`VISUAL_REGRESSION_SPEC.md`](./qa/VISUAL_REGRESSION_SPEC.md) — So sánh ảnh Playwright cho Gate B Fidelity (`>= 90/100`).
- [`CONTENT_INTEGRITY_SPEC.md`](./qa/CONTENT_INTEGRITY_SPEC.md) — Baseline SHA-256 manifest từ `main` (`507` preview + `2,939` quiz bank) & Answer Key parity.
- [`RELEASE_GATE.md`](./qa/RELEASE_GATE.md) — Performance Budget (`LCP <= 2.5s`, `INP <= 200ms`, `CLS <= 0.1`), Expected 4xx Catalog, Preview → `main` & Rollback.
