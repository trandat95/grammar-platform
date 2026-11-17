# 📸 VISUAL REGRESSION & IMPLEMENTATION FIDELITY SPEC (`GATE B`)

> Không để AI tự đánh giá code đã giống thiết kế. Toàn bộ **Gate B** kiểm chứng khách quan trên **Vercel Preview URL** đối chiếu trực tiếp với Design Reference đã duyệt tại Gate A.

---

## 1. Công Cụ & Quy Trình So Sánh Thực Thi Được (Tooling Alignment)

Vì `package.json` hiện không cài sẵn `@playwright/test` để giữ bundle nhẹ:
- **Tùy chọn 1 (Sanctioned On-Demand Runner):** Mở rộng script sẵn có [`tests/visual-regression.spec.mjs`](../../tests/visual-regression.spec.mjs) *(đã hỗ trợ dynamic `import("playwright")`)* và chạy bằng `npx playwright` hoặc CI container riêng có Chromium mà **không bắt buộc thêm devDependency vào `package.json`** trừ khi Product Owner duyệt ở `M4.5`.
- **Tùy chọn 2 (Built-in Browser Subagent / Chrome DevTools):** Chụp full-page & element screenshots ở `1440px`, `768px`, `375px` (Light & Dark) và chạy pixel-diff / geometry DOM checks trực tiếp trên Preview URL.

---

## 2. Tiêu Chí Chấm Điểm Khách Quan (`>= 90 / 100`)

1. Chụp screenshots ở trạng thái ổn định (bật `prefers-reduced-motion: reduce`, đợi font `Google Sans Text` & ảnh load xong, mask các khối dữ liệu động như số XP/Streak live).
2. **Ngưỡng Đạt Bắt Buộc:**
   - **Pixel Diff (`pixelDiffPct`):** **`<= 2.0%`** trên vùng tĩnh so với Design Reference đã duyệt.
   - **7 Chiều Trọng Số (`>= 90 / 100`):** Layout & Grid Alignment (`20%`), Typography Scale & Weight (`15%`), Semantic Color Light/Dark (`15%`), Spacing Rhythm (`15%`), Component Anatomy Reuse (`15%`), Responsive Reflow (`10%`), Interactive States (`Hover/Focus/Selected`, `10%`).
   - **Hard Blocker:** Bất kỳ **Critical Layout Defect** nào (tràn ngang `scrollWidth > innerWidth`, che nút đóng Drawer `375px`, chữ mất tương phản trên Banner, Mascot có viền halo trắng trên Dark Mode) → **FAIL GATE B**, quay lại Rework Loop (tối đa 2 lần) theo [`DESIGN_APPROVAL_PROTOCOL.md`](../governance/DESIGN_APPROVAL_PROTOCOL.md).
