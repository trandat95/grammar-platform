# 🧪 DESIGN & FUNCTIONAL QA MATRIX (`M4.5`)

> **Mục tiêu:** Đảm bảo 100% các luồng học, thi, thanh toán và giao diện Light/Dark hoạt động không lỗi trên đủ 9 kích thước màn hình.

## 1. Ma Trận 9 Viewport × 2 Theme × 5 User Roles

- **Viewports (9):** `320px`, `360px`, `375px`, `390px`, `430px`, `768px`, `1024px`, `1280px`, `1440px`.
- **Themes (2):** `Light Mode ([data-theme="light"])`, `Dark Mode ([data-theme="dark"])`.
- **Roles (5):** `Guest`, `FREE` (chưa chạm limit), `FREE` (chạm Câu `5+` / limit Quiz), `VIP`, `ADMIN`.

## 2. Checklist Tương Tác Trọng Yếu Bắt Buộc Pass

| Khu vực | Kịch bản Kiểm thử Thực tế | Tiêu chí Pass |
| :--- | :--- | :--- |
| **Dashboard** | Hero Streak, 3 Core Actions, SM-2 Queue, Radar 12 trục, Leaderboard | `0px` tràn ngang; `0` hydration error |
| **Study Drawer (`375px`)** | Mở `Chọn chuyên đề ☰` → chọn bài khác → bấm `Đóng mục lục ✕` / bấm backdrop | Nút đóng không bị backdrop che; không mất scroll/state |
| **Study Reading (`1440px`)** | Collapse sidebar → Focus Reading Mode (`780px`), Cheat-Sheet, 8 SVG Models | Công thức `165` chars & rule `258` chars đọc sạch |
| **Question Engine** | Test đủ **10 Fixtures** (148 MC inline, multi-blank, transformation, long `749` stem) | Radio `>= 48px`, Arrow+Space, `0` double-submit |
| **Modals & Dict Popup** | Mở `#auth-modal`, `#vocab-modal`, `SmartPaywallModal`, rồi thử click chữ bên ngoài | Focus Trap giữ focus; `#dict-popup` không nổi trên Modal |
| **VIP & SePay** | Kiểm tra `FREE_QUESTIONS_PER_EXERCISE = 4`, `0` trial 7 ngày, QR SePay, Hủy VIP 2 chạm | `0` dark pattern/countdown giả; bảo toàn `ADMIN` guard |
| **TOEIC Hub (`/toeic`)** | Hero Banner, Exam Dock trên `375px`, Sentence X-Ray, Dictation, AI Tutor | Dùng chung CSS Token Contract từ `design-system-2026.css` |
