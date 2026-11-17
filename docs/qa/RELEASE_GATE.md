# 🚀 PERFORMANCE BUDGET, API SCOPE & RELEASE GATE (`M4.5`)

> Đảm bảo GrammarPro không chỉ đẹp mà còn **nhanh, ổn định, không rò lỗi API và an toàn tuyệt đối khi ra Production**.

---

## 1. Performance & Core Web Vitals Budget (Kèm Font CLS Check)

| Chỉ số | Mục tiêu Bắt Buộc (Vercel Preview & Prod) | Biện pháp Thực thi & Đo Kiểm |
| :--- | :---: | :--- |
| **LCP** *(Largest Contentful Paint)* | **`<= 2.5s`** | Hero Banners dùng `.webp`, preload banner hero ở màn hình đầu nếu cần |
| **INP** *(Interaction to Next Paint)* | **`<= 200ms`** | Micro-interaction `120–180ms`, không khóa luồng bấm Radio Cards |
| **CLS** *(Cumulative Layout Shift)* | **`<= 0.1`** (`Zero-CLS`) | Khai báo `width`/`height` hoặc `aspect-ratio` trên mọi ảnh/Skeleton; kiểm tra explicit tác động của Google Fonts link trong `pages/_app.js` (fallback metrics / `font-display`) |
| **Below-fold Assets** | Lazy Loading | `Mascot` & ảnh below-the-fold bật `loading="lazy"` |
| **Initial JS** | Kiểm soát ngân sách bundle | Không cài thêm thư viện UI/Animation nặng vào runtime dependencies |

- **Phương thức đo thực thi được (không yêu cầu cài `lighthouse` vào `package.json`):** Chạy `npx lighthouse <PREVIEW_URL> --only-categories=performance,accessibility --output=json` hoặc Chrome DevTools Performance trace trên **Vercel Preview URL**.

---

## 2. API Scope & Expected 4xx Error Catalog

Không đặt quy tắc mù `"0 lỗi HTTP 400"`; phân tách rõ **lỗi hệ thống bất ngờ** vs **4xx hợp lệ theo thiết kế**:
- **Expected 4xx Responses (Kiểm chứng đúng mã & message):**
  - `401 Unauthorized` khi chưa đăng nhập gọi endpoint yêu cầu session.
  - `403 Forbidden` khi User thường gọi Admin API hoặc `FREE` gọi `/api/monetization/export-report`.
  - `400 Bad Request` khi user cố tình submit payload thiếu field/sai format trong negative test.
- **Hard Requirement:** **`0` unexpected `4xx` / `5xx` errors** khi sử dụng bình thường trên các flow chuẩn (ví dụ: không lỗi `400`/`406` trên `/api/gamification/summary`, `/api/gamification/leaderboard`, `/api/monetization/overview`).

---

## 3. Quy Trình Preview → Main & Rollback Plan

1. Đẩy nhánh feature/staging để tạo **Vercel Preview URL**.
2. Chạy đủ **Gate B Visual Regression + 9 Viewports QA + Content SHA-256 + Core Web Vitals + API Check** trên Preview URL (xác nhận trực tiếp từ Product Owner).
3. Chỉ sau khi Preview đạt **PASS 100%** mới merge vào `main` và verify `READY` trên `https://grammarpro.io.vn`.
4. Luôn ghi sẵn `baseline commit hash` (theo `MILESTONE_HANDOVER_PROTOCOL.md`) để `git revert --no-edit <hash>` tức thì nếu Production có sự cố.
