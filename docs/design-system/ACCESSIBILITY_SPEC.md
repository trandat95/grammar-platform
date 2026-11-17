# ♿ ACCESSIBILITY GOVERNANCE (`WCAG 2.2 AA`)

> Mọi tính năng mới hoặc nâng cấp UI đều phải vượt qua kiểm định trợ năng bằng bàn phím, Screen Reader và đo tương phản tự động.

---

## 1. Bảng Chuẩn Tương Phản Phân Cấp (Không Áp Máy Móc `4.5:1` Cho Mọi Thứ)

| Loại Phần tử | Ngưỡng Tương Phản Tối Thiểu (WCAG 2.2 AA) | Áp dụng cho |
| :--- | :---: | :--- |
| **Normal Text** (`< 18pt` / `< 14pt bold`) | **`>= 4.5 : 1`** | Thân bài lý thuyết, đáp án, placeholder quan trọng, chữ trên 55% Banner Scrim. |
| **Large Text** (`>= 18pt` hoặc `>= 14pt bold`) | **`>= 3.0 : 1`** | Tiêu đề lớn `h1/h2`, số KPI lớn trang Dashboard. |
| **UI Components & Graphical Objects** | **`>= 3.0 : 1`** | Viền input, trạng thái selected của Radio Card, Focus Ring, icon trạng thái, biểu đồ SVG Radar. |

---

## 2. Tiêu Chuẩn Điều Khiển & Trợ Năng Tương Tác

1. **Touch Target:** Tối thiểu `44 × 44px` trên thiết bị cảm ứng (`@media (pointer: coarse)`), `48px` chiều cao cho `RadioChoiceCard`.
2. **Full Keyboard Navigation:**
   - `Tab` / `Shift+Tab` di chuyển logic, Focus Ring nhìn rõ cả Light (`#2563EB`) và Dark (`#38BDF8`) + `scroll-padding-top: 76px` (Focus Not Obscured `2.4.11`).
   - **Radio Group:** Hỗ trợ `ArrowUp` / `ArrowDown` / `ArrowLeft` / `ArrowRight` và `Space` / `Enter`.
   - **Modal & Drawer:** Focus Trap chuẩn, `Esc` đóng ngay và **trả focus về phần tử kích hoạt ban đầu**.
3. **Semantic HTML & ARIA:** Đúng `role="radiogroup"`, `role="radio"`, `aria-checked`, `aria-modal`, `aria-live="polite"` cho kết quả đúng/sai.
4. **Text Zoom `200%` & Reflow:** Tăng font/zoom trình duyệt `200%` không mất nút bấm hay chồng chữ.
5. **Reduced Motion:** Tôn trọng 100% `@media (prefers-reduced-motion: reduce)` và user setting trong `gamificationPreferences`.
