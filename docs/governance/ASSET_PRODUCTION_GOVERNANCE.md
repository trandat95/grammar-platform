# 🖼️ ASSET PRODUCTION & QUALITY GOVERNANCE

> **Mục tiêu:** Quản lý chặt nguồn gốc, độ đồng nhất phong cách, hiệu năng tải và trạng thái phê duyệt của toàn bộ tài nguyên hình ảnh (`M4.2` + `M4.3`).

---

## 1. Quy Trình Kiểm Soát 7 Bước (Asset Quality Gate)

```text
[1. Generation (từ Master Ref)] ➔ [2. Visual Consistency] ➔ [3. Anatomy Check]
   ➔ [4. Alpha / Halo Edge QA] ➔ [5. Light (#FFF) & Dark (#09090B) QA]
   ➔ [6. Compression & Format QA] ➔ [7. Production Approval (Registry)]
```

---

## 2. Asset Registry Metadata Schema (`public/assets/asset-registry.json`)

Mọi asset đưa vào `components/ui-2026/assetMap.js` phải có bản ghi tương ứng. **Asset trạng thái `draft` bị cấm dùng trong code Production.**

```json
{
  "assetId": "mascot-encourage",
  "category": "mascot",
  "purpose": "encourage",
  "dimensions": "512x512",
  "format": "png",
  "background": "transparent",
  "themeSupport": ["light", "dark"],
  "visualReference": "master-mascot-v1",
  "version": "1.0.0",
  "status": "pending_po_review",
  "sha256": "<sha256-hex>",
  "fileSize": 48210
}
```
> *(Ghi chú: AI Agent chỉ được ghi `"pending_po_review"`; chỉ **Product Owner** mới được chuyển sang `"approved"`. Asset chưa đạt `"approved"` bị cấm dùng trên Production.)*

---

## 3. Quy Định Định Dạng, Chất Lượng & Số Lượng Chuẩn

- **Logo (`GrammarPro.io.vn`):** Giữ nguyên `public/logo-grammarpro.svg` & `GrammarProLogo.jsx`; quy định rõ *Minimum Size* (`h >= 24px`) & *Clear Space* (`>= 8px`). **Cấm generate lại chữ `G+` bằng AI.**
- **Apple Touch Icon (`public/apple-touch-icon.png`):** `180×180px`, **canvas PNG vuông nền đặc** (*không tự bo góc* vì iOS tự cắt bo tròn; tránh lộ viền góc đen/trắng).
- **Android PWA Icons (`public/assets/brand/`):** `icon-192.png` & `icon-512.png` đồng bộ `public/manifest.json`.
- **Social Sharing OG Image (`public/og-grammarpro.png`):** `1200×630px`, dùng **PNG hoặc JPEG** *(không dùng WebP cho OG vì nhiều mạng xã hội/chat app xử lý WebP không đồng nhất)*.
- **6 Mascot Biểu Cảm (`public/assets/mascot/`):** `welcome`, `celebrate`, `encourage`, `vip`, `empty`, `ai-coach` — **cùng sinh từ `master-mascot` reference** để giữ y nguyên tỷ lệ đầu/thân/mắt. Target dung lượng PNG `512×512` `<= 70KB` *(mục tiêu tối ưu, ưu tiên sạch viền/không giảm chất lượng quá mức)*.
- **5 Hero Banners (`public/assets/banners/*.webp`):** Format **WebP**, `1440×420px`, mục tiêu `<= 100KB` (max `150KB` nếu ảnh giàu chi tiết cần giữ sắc nét), **55% Safe Zone bên trái** cho text overlay chuẩn tương phản cả Light & Dark scrim. *Lưu ý chuyển đổi ở `M4.4B`:* Cập nhật đồng bộ đường dẫn từ `*-vn-foreign.jpg` sang `*.webp` trong `components/ui-2026/assetMap.js` VÀ chuỗi fallback trong `components/toeic/ToeicHeroBanner.jsx:85`.
- **21 Huy hiệu Thống nhất (`public/assets/badges/`):** Toàn bộ `20` badges thành tích + `1` `mystery_locked` (`21` assets tổng) quy về **1 phong cách thống nhất duy nhất**; xóa file thừa `00-avatars-vn-intl-grid.jpg` khỏi `avatars/`.
- **Product Illustrations (`SVG`):** `xray-preview.svg` (`600×280px`), `state-404.svg` (`240×240px`), cập nhật `free-tier-showcase.svg` & `vip-tier-showcase.svg` khớp `4 câu/bài` & `0 ngày trial`.
