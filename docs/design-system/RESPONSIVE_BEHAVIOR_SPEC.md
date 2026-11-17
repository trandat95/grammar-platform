# 📱 RESPONSIVE BEHAVIOR & MOBILE ERGONOMICS SPECIFICATION

> Đảm bảo trải nghiệm học và làm bài mượt mà bằng 1 tay trên mọi kích thước thiết bị từ `320px` đến `1440px`.

---

## 1. Ma Trận 9 Viewport Kiểm Thử Bắt Buộc

| Viewport Width | Thiết bị Đại diện | Cấu trúc Shell & Yêu cầu |
| :---: | :--- | :--- |
| **`320px`** | Điện thoại màn hình nhỏ | `0px` tràn ngang; padding gọn `12px`; câu chữ tự wrap. |
| **`360px`** | Android phổ biến | Đủ touch target `>= 44–48px`; không cắt chữ nút bấm. |
| **`375px`** | iPhone SE / Mini | **Study Drawer (`220`) + Mobile Bar (`225`)** hoạt động không bị backdrop (`210`) che nút đóng. |
| **`390px`** | iPhone chuẩn | Safe-area bottom cho Mobile Bottom Nav (`calc(56px + env(safe-area-inset-bottom))`). |
| **`430px`** | Mobile lớn | Radio Cards `A/B/C/D` & TOEIC Exam Dock thoải mái ngón cái. |
| **`768px`** | Tablet Portrait | Grid 2 cột vừa vặn; Drawer dạng slide-over. |
| **`1024px`** | Tablet Landscape / Small Laptop | Hiện Study Sidebar cạnh nội dung chính (`256px`). |
| **`1280px`** | Laptop Standard | Header Desktop `56px` không rớt dòng/che nút. |
| **`1440px`** | Desktop Wide | Focus Reading Mode giới hạn `max-width: 780px` khi collapse sidebar. |

---

## 2. Ràng Buộc Tương Tác Mobile Bắt Buộc

1. **Bàn phím ảo (Virtual Keyboard):** Khi focus vào `<input>` tự luận hoặc ô tìm kiếm trên iOS/Android, input đang nhập **không bị bàn phím hay Mobile Bottom Nav che khuất**.
2. **No Scroll Jump on Modal/Drawer:** Đóng/mở `FocusTrapModal2026` hoặc Study Drawer **không được làm trang cuộn về đầu (`y = 0`)**.
3. **State Preservation:** Đáp án đang chọn hoặc đang gõ dở không bị mất khi user mở/đóng Drawer tra mục lục bài học.
4. **Prevent Double-Submit:** Nút `Kiểm tra` / `Nộp bài` phải khóa trong lúc xử lý hoặc chống click đúp liên tiếp.
5. **Safe Area iOS:** Toàn bộ Bottom Nav & Sticky Exam Dock phải chừa `env(safe-area-inset-bottom)`.
