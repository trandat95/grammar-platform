# ✅ DESIGN APPROVAL & IMPLEMENTATION FIDELITY PROTOCOL (`GATE A` & `GATE B`)

> Tách biệt rạch ròi khâu **duyệt thiết kế (`Gate A`)** và khâu **nghiệm thu code giống thiết kế (`Gate B`)**. **AI KHÔNG ĐƯỢC tự chấm đậu Gate A/Gate B hoặc tự bật `status: "approved"` — quyền phê duyệt cuối cùng thuộc về Product Owner.**

---

## 1. Concept Exploration vs Approved Design Prototypes (`M4.2` Scope)

1. **Concept Exploration (`M4.2` Bước 1 — Tối đa `6` bản phác thảo):**
   - Thử nghiệm **3 Concept** (*Concept A: Premium EdTech SaaS*, *Concept B: AI-Powered Futuristic*, *Concept C: Minimal Academic*) trên **2 màn hình lõi (`Dashboard` + `Grammar Study`)** (`3 × 2 = 6` concept sketches).
   - Product Owner chọn **duy nhất 1 Concept gốc** — tuyệt đối không pha trộn chéo cả 3 phong cách.
2. **Gate A Priority Prototypes (`M4.2` Bước 2 — Tối đa `12` frames trước Gate A):**
   - Trước Gate A, hoàn thiện **3 Master Design References** ưu tiên (**`Dashboard`**, **`Grammar Study`**, **`TOEIC Exam`**) × `2` viewports đại diện (**Desktop `1440px`** + **Mobile `375px`**) × `2` themes (**Light + Dark**) = **`12` prototype frames** + đặc tả Responsive cho `768px` & `1280px`, Component Breakdown & Token Mapping.
   - Chỉ sau khi đạt **Gate A (`>= 90/100`)** mới mở rộng nốt **5 Reference Screens** còn lại (*Multiple Choice Quiz, Diagnostic Analysis, Learning Roadmap, VIP/Smart Paywall, AI Study Coach*), kế thừa **100%** Anatomy từ 3 Master References.

---

## 2. 7 Bước Duyệt Cho Mỗi Giai Đoạn & Quy Tắc Độc Lập

`1. Design Proposal` ➔ `2. Visual Preview` ➔ `3. Component Spec` ➔ `4. Responsive Preview` ➔ `5. Light/Dark Preview` ➔ `6. Design Review` ➔ `7. Product Owner Approval`

- **Independent Approval Guard:** Agent chỉ được phép ghi `"status": "pending_po_review"` và đính kèm bảng tự kiểm tra. Chỉ **Product Owner** mới được chuyển sang `"approved"`.

---

## 3. Gate A — Design Approval Checklist (Trước `M4.3` & `M4.4A`)

| Tiêu chí | Trọng số | Ngưỡng Đạt Bắt Buộc |
| :--- | :---: | :--- |
| UX & Learning Experience *(tập trung học, giảm nhiễu, 3-state flow)* | **25%** | **Tổng điểm `>= 90 / 100`** |
| Brand Consistency *(đúng định vị GrammarPro AI EdTech SaaS)* | **20%** | **`0` lỗi Critical** |
| Visual Quality *(thẩm mỹ sạch, không AI slop, không halo)* | **15%** | Không vi phạm Business Logic / FTC |
| Responsive Design (`320..1440px`, ưu tiên mobile học dễ) | **15%** | Không layout cản trở thao tác trên Mobile |
| Accessibility *(WCAG 2.2 AA contrast & touch `>= 44px`)* | **10%** | — |
| Technical Feasibility *(dựng được bằng React + CSS tokens hiện có)* | **10%** | — |
| Asset Consistency *(nhất quán tỷ lệ & màu sắc từ Master Reference)* | **5%** | — |

---

## 4. Gate B — Design-to-Code Implementation Fidelity Gate (`M4.5`)

Kiểm chứng khách quan bằng công cụ so sánh ảnh & hình học trên Vercel Preview (xem [`VISUAL_REGRESSION_SPEC.md`](../qa/VISUAL_REGRESSION_SPEC.md)):

- **Objective Fidelity Threshold (`>= 90 / 100`):**
  - Pixel diff (sau khi mask vùng dữ liệu động & khử anti-aliasing): **`<= 2.0%`** so với Prototype chuẩn.
  - Đạt `100%` Layout Geometry Checklist (*cột grid, chiều cao Header `56px`, Focus `780px`, vị trí Mobile Bar `z:225`, Radio Card `>= 48px`*).
- **Zero Critical Defects:** `0` Critical Layout Defect, `0` Functional Regression, `0` Accessibility Regression.

---

## 5. Luồng Xử Lý Khi Gate A hoặc Gate B Thất Bại (`< 90 / 100` hoặc Có Critical Defect)

1. Ghi nhận danh sách defect cụ thể kèm screenshot & chỉ số đo sai lệch.
2. Quay lại đúng step tạo lỗi (**không được mở rộng phạm vi sang milestone kế tiếp**).
3. Chỉnh sửa tối đa **2 vòng Rework**; nếu vẫn `< 90/100` hoặc phát hiện giới hạn kỹ thuật/kiến trúc → **DỪNG KHẨN CẤP (`MASTER_EXECUTION_PROTOCOL`)** và báo cáo Product Owner xin điều chỉnh Spec.
