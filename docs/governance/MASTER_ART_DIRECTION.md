# 🎨 MASTER ART DIRECTION (`M4.2` — CONCEPT A + SCHOLAR OWL CYAN EDITION)

> **Trạng thái:** `APPROVED AT GATE A — LOCKED CONCEPT A + SCHOLAR OWL CYAN (M4.2)`  
> **Concept Gốc Đã Chọn:** **Concept A — Premium EdTech SaaS** (kèm [`12 Master Prototypes`](../previews/v31/GATE_A_DESIGN_PACKAGE.md)).  
> **Định vị Thương hiệu:** **Premium AI-Powered Learning Platform** (`GrammarPro.io.vn`) — *Thông minh, Đáng tin cậy, Học thật — Tiến bộ thật*.

---

## 10 Hạng Mục Khóa Cứng Toàn Hệ Thống

### 1. Brand Personality
- **4 Trụ tính cách:** **Intelligent** (phân tích sâu, có phương pháp) • **Premium** (tinh tế, gọn gàng kiểu SaaS hiện đại) • **Trustworthy** (chính xác học thuật *Mai Lan Hương & Hà Thanh Uyên*, minh bạch chuẩn FTC) • **Encouraging** (ấm áp đồng hành khi học viên gặp câu khó).

### 2. Color Philosophy
- **Primary Gradient:** Royal Navy (`#1E3A8A`) → Electric Blue (`#2563EB`) — nền tảng tin cậy và điều hướng chính.
- **Secondary Brand Accent:** Bright Cyan (`#06B6D4` / `#0891B2`) — đại diện cho AI X-Ray & trí tuệ phân tích (*màu chủ đạo của Mascot Cú Tri Thức*).
- **Highlight / Milestone Accent:** Amber Gold (`#F59E0B`) — ngôi sao AI Spark (`✦`), Streak & Huy hiệu thành tích.
- **Canvas Surfaces:** Light Mode (`#F8FAFC` canvas, `#FFFFFF` card, `#E2E8F0` border) • Dark Mode (`#09090B` canvas, `#111115` card, `#272733` border).

### 3. Typography Hierarchy
- **Headings / Display:** `Google Sans` (`letter-spacing: -0.02em`, weight `700–800`).
- **Reading / Academic Body:** `Google Sans Text` (`line-height: 1.5–1.65`, tối ưu đọc quy tắc `258` chars & lời giải `1,190` chars).
- **Formulas & IPA:** `JetBrains Mono` / monospace căn đều cho công thức dài tới `165` chars.

### 4. Illustration Style
- **Ngôn ngữ duy nhất:** **Soft 2.5D Clean Geometric Vector** — hình khối bo tròn sắc nét, độ nổi nhẹ (soft rim light), nền trong suốt sạch sẽ. Cấm trộn ảnh chụp siêu thực hay 3D rườm rà nhiều chi tiết vụn.

### 5. Mascot Anatomy & Proportions — **Cú Tri Thức (`Scholar Owl`, Tông Cyan)**
- **Reference Gốc:** [`public/assets/mascot/master-mascot.png`](../../public/assets/mascot/master-mascot.png).
- **Tỷ lệ khóa cứng:** Tỷ lệ đầu : thân **`1.15 : 1`**, dáng đứng cân đối mặt trước hơi nghiêng nhẹ, đôi mắt to biểu cảm thông minh (kèm gọng kính học giả mảnh tối giản tông Navy/Cyan), lông cánh xếp lớp gọn tông **Cyan (`#06B6D4` / `#22D3EE`) + Royal Navy (`#1E3A8A`) + bụng kem sáng (`#F0F9FF`)**, huy hiệu tia sáng **Amber (`#F59E0B`)** nhỏ trên đỉnh mũ/lông mào hoặc ngực.
- **Quy tắc sinh biến thể (`M4.3`):** Bắt buộc giữ nguyên đầu/mắt/gọng kính/màu sắc của `master-mascot.png` — chỉ đổi biểu cảm mắt, dáng cánh tay và vật phụ nhỏ (`chìa khóa VIP`, `tai nghe AI`, `kính lúp`, `sổ tay`, `cúp/pháo giấy`).

### 6. Brand Logo & Clear Space Guidelines
- **Logo Gốc (Bất biến):** Giữ nguyên `public/logo-grammarpro.svg`, `public/favicon.svg`, và `components/ui-2026/GrammarProLogo.jsx` (chữ **G** trắng + tick **`✓`** Cyan + AI Spark **`✦`** Amber trên nền Navy→Blue→Cyan). **Cấm AI tự vẽ lại logo.**
- **Minimum Size:** Chiều cao emblem tối thiểu `24px` trên UI (`16px` chỉ riêng favicon).
- **Clear Space:** Tối thiểu `8px` (`0.25 × emblem`) khoảng trống xung quanh ở mọi kích thước.
- **PWA iOS Icon (`apple-touch-icon.png`):** Canvas vuông **`180×180px` nền đặc** (không tự cắt bo góc để iOS tự render chuẩn).

### 7. Iconography Guidelines & Zero OS Emoji Policy
- Toàn bộ icon điều hướng & công cụ chính dùng **Unified SVG Stroke System** (`viewBox 0 0 24 24`, `strokeWidth 1.8`, `strokeLinecap="round"`, `strokeLinejoin="round"`) qua [`KitIcon.jsx`](../../components/ui-2026/KitIcon.jsx) (đã triển khai 18 icon điều hướng/công cụ ở `M4.4B`).
- **Mở rộng bắt buộc tại `M4.6`:** Loại bỏ hoàn toàn **OS Color Emoji** trong tất cả UI buttons, cards, badges, headers và alerts trên `pages/**` & `components/**` (mở rộng thêm `+28` icon micro + `<StatusDot />` theo [`ZERO_OS_EMOJI_MIGRATION_PLAN.md`](../design-system/ZERO_OS_EMOJI_MIGRATION_PLAN.md)), giữ nguyên `data/**` (`15/15 Diffs: 0`).

### 8. Card, Surface & Light/Dark Direction
- **Light Mode:** Card `#FFFFFF`, viền hairline `1px solid #E2E8F0`, shadow siêu mảnh (`0 1px 2px rgba(15,23,42,0.05)`).
- **Dark Mode:** Card `#111115`, viền `1px solid #272733`, nâng cấp bậc bằng sắc độ bề mặt thay vì shadow đen nặng.
- **Banner 55/45 Safe Zone:** `55%` bên trái giữ độ thoáng phẳng dưới `--ds-banner-scrim` để text đạt WCAG AA `>= 4.5:1` trên cả Light & Dark.

### 9. Visual Do / Don't Guidelines
- ✅ **NÊN:** Khối hình tối giản, nhận diện tốt ở `375px`, nền trong suốt sạch edge trên cả `#FFFFFF` và `#09090B`.
- ❌ **TRÁNH:** Không vẽ não phát sáng neon, robot cầm sách cliché, chữ tiếng Anh/Việt giả trong ảnh AI, không đặt Mascot vào KPI Card hay màn hình đang làm câu hỏi.

### 10. Design Consistency Rules
- Mọi màn hình mới bắt buộc kế thừa trực tiếp từ **Concept đã duyệt & 3 Master Prototypes (`Dashboard`, `Grammar Study`, `TOEIC Exam`)**; mọi UI dựng bằng React + `var(--ds-*)` CSS tokens.
