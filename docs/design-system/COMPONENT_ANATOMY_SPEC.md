# 🧱 COMPONENT ANATOMY & 12 UI STATES SPECIFICATION

> Chuẩn hóa cấu trúc bên trong của từng component để tránh tình trạng mỗi màn hình dựng 1 kiểu Button, Card hay Modal khác nhau.

---

## 1. Anatomy 8 Chiều Bắt Buộc

Mọi component dùng chung đều phải định nghĩa đủ: **1. Structure (Anatomy)** • **2. Visual Hierarchy** • **3. Typography** • **4. Spacing** • **5. Color Tokens** • **6. Interaction States** • **7. Responsive Behavior** • **8. Light/Dark + Accessibility**.

---

## 2. Phân Loại Component Chuẩn Hóa

### A. Buttons (7 Biến Thể × 6 States)
- **Variants:** `Primary` (hành động chính), `Secondary` (hành động phụ nền elevated), `Tertiary / Ghost` (link/nhẹ), `Destructive` (xóa/hủy VIP), `IconButton` (tròn/vuông tối thiểu `36–44px`), `LoadingButton` (spinner + disable click), `DisabledButton`.
- **States:** `Default`, `Hover`, `Active` (`scale(0.98)`), `Focus` (`2px solid` + `3px` halo), `Disabled` (`opacity: 0.55`, `cursor: not-allowed`), `Loading` (`aria-busy="true"`, chống double-submit).

### B. Cards (7 Chủng Loại Duy Nhất)
1. **Dashboard KPI Card:** Metric label (`11–12px` uppercase) + Big Number (`Google Sans` bold) + 1 dòng xu hướng phụ.
2. **Learning Card:** Lesson overview / Cheat-Sheet / Rule + Example + Audio button.
3. **Course / Chapter Card:** Chapter icon + Title (`2-line clamp`) + Progress bar + `%` pill.
4. **Question Card:** Xem [`QUESTION_EXPERIENCE_ENGINE.md`](../learning-experience/QUESTION_EXPERIENCE_ENGINE.md).
5. **Achievement Card:** Unified badge artwork + Title + Tier pill + Progress / Locked state (`opacity: 0.72`).
6. **VIP Feature Card:** Plan title + Price + Benefits list + FTC-transparent badge (`0 ngày trial`).
7. **AI Insight Card:** Pill chẩn đoán + Nhận xét dựa trên dữ liệu thật + 1 CTA `Ôn tập ngay`.

### C. Modals (5 Chủng Loại Qua `FocusTrapModal2026.jsx` / `Modal.jsx`)
*(Ghi chú chuyển tiếp: hiện codebase có cả `components/ui-2026/FocusTrapModal2026.jsx` và `components/design-system/overlays/Modal.jsx` cùng ở `zIndex: 1200` — dùng cả 2 làm wrapper hợp lệ trong M4.1–M4.5 và hợp nhất thành 1 ở `M4.6`.)*
1. `Confirmation Modal` (bao gồm StepUp & 2-Click Cancel VIP) • 2. `Information Modal` (`#vocab-modal`, Auth/Profile) • 3. `Result Modal` (`GamificationCelebrationModal`) • 4. `Smart Paywall Modal` (`SmartPaywallModal`) • 5. `Diagnostic Result Modal`.

---

## 3. Hợp Đồng 12 UI States Cho Mọi Màn Hình Chính

| Nhóm | States Bắt Buộc | Quy chuẩn Triển khai |
| :--- | :--- | :--- |
| **Interactive** | `Default`, `Hover`, `Active`, `Focus`, `Disabled` | Đạt chuẩn tương phản cả Light (`#F8FAFC`) và Dark (`#09090B`). |
| **Async & Data** | `Loading`, `Skeleton` (`Zero-CLS`), `Partial Data`, `Empty`, `Error`, `Success` | Không trả `null` trắng trang khi thiếu data; mọi `EmptyState` gắn Mascot + 1 CTA rõ ràng. |
| **Environment** | `Offline` | Hiện rõ trạng thái hàng đợi IndexedDB qua `SyncStatusIndicator`. |
