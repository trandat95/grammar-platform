# 🧩 DESIGN-TO-CODE GOVERNANCE & HANDOFF SPECIFICATION

> **Nguyên tắc tối thượng:** AI tạo hình ảnh minh họa, còn **toàn bộ UI bắt buộc xây dựng bằng React Components & CSS Variables thực tế**.

---

## 1. 8 Handoff Deliverables Bắt Buộc Cho Mọi Thiết Kế Mới

1. **UI Screenshots:** Đủ `1440px`, `768px`, `375px` ở cả Light & Dark Mode.
2. **Component Specification:** Tham chiếu trực tiếp [`COMPONENT_ANATOMY_SPEC.md`](../design-system/COMPONENT_ANATOMY_SPEC.md).
3. **Design Tokens Mapping:** Ánh xạ từng màu/khoảng cách/radius sang CSS Variables (`--ds-*`).
4. **Responsive Specification:** Quy tắc co giãn grid, hide/collapse và mobile dock/drawer.
5. **Interaction Specification:** Mô tả rõ `Before/During/After` và micro-interaction (`prefers-reduced-motion`).
6. **Asset Mapping:** Đường dẫn chuẩn & kích thước khai báo trong `components/ui-2026/assetMap.js`.
7. **Accessibility Specification:** Keyboard focus order, ARIA roles, target size `>= 44px` trên touch.
8. **React Implementation Notes:** Chỉ rõ tái sử dụng component nào trong codebase hiện tại.

---

## 2. Ranh Giới Tái Sử Dụng & Cấm Kỵ Kỹ Thuật

- **Bắt buộc tái sử dụng:** `AppShell2026.jsx`, `FocusTrapModal2026.jsx`, `lib/tokens/*`, `StructuredExplanation.jsx`, các Service/API & IndexedDB sync hiện hành.
- **Phân loại thay đổi:**
  - *Visual Improvement / UX Improvement:* Được phép đề xuất trong Phase B.
  - *Functional Change* (đổi luồng điều hướng, API, quota, scoring, giá VIP): **Bắt buộc xin phê duyệt riêng**, cấm tự gộp vào sửa giao diện.
- **Cấm tuyệt đối khi thiết kế UI:**
  - Không dùng ảnh AI chứa chữ hoặc UI giả thay cho HTML/CSS thực.
  - Không đặt text quan trọng vào file ảnh Hero Banner.
  - Không tự vẽ lại Logo SVG `GrammarPro.io.vn` bằng image generator.
  - Không dùng video nền tự động hoặc hiệu ứng 3D nặng gây suy giảm **LCP / CLS / INP**.
  - Không dùng kích thước cố định làm tràn ngang ở `320px–375px`.
