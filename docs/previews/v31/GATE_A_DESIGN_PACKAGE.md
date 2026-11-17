# ★ `GATE A` DESIGN PACKAGE — CONCEPT A (`DASHBOARD`, `STUDY`, `TOEIC` × `12` FRAMES)

> **Trạng thái Gate A:** `APPROVED BY PRODUCT OWNER (M4.2 PASS -> UNLOCKED M4.3 & M4.4A)`  
> **Concept được chọn:** **Concept A — Premium EdTech SaaS** (`Royal Navy #1E3A8A` + `Electric Blue #2563EB` + `Cyan #06B6D4` + `Amber #F59E0B`).  
> **Master Mascot:** **Cú Tri Thức (`Scholar Owl — Tông Cyan`)** — [`master-mascot.png`](../../../public/assets/mascot/master-mascot.png) • [`Alpha QA Sheet`](./master-mascot-alpha-qa.png).

---

## 1. BỘ 12 PROTOTYPE FRAMES CHO GATE A (`1440×900` & `375×812` • LIGHT & DARK)

| Màn hình | Desktop `1440×900` (Light / Dark) | Mobile `375×812` (Light / Dark) | Token & Responsive Notes (`768px` / `1280px`) |
| :--- | :--- | :--- | :--- |
| **1. Homepage / Dashboard** | [`Light`](./prototypes/proto-dashboard-1440-light.png) • [`Dark`](./prototypes/proto-dashboard-1440-dark.png) | [`Light`](./prototypes/proto-dashboard-375-light.png) • [`Dark`](./prototypes/proto-dashboard-375-dark.png) | Header `56px`, Grid `1fr 1.2fr` ở `>= 1024px`, `1fr` ở `<= 768px`, KPI `2×2`, `0` Mascot trong KPI Cards, `--ds-btn-success: #047857` |
| **2. Grammar Study** | [`Light`](./prototypes/proto-study-1440-light.png) • [`Dark`](./prototypes/proto-study-1440-dark.png) | [`Light`](./prototypes/proto-study-375-light.png) • [`Dark`](./prototypes/proto-study-375-dark.png) | Sidebar `260px` ở `>= 1024px`, Focus Reading `780px`, `.ge-mobile-chapter-bar` (`z:225`) trên Drawer (`z:220`), Radio Cards `>= 48px` (`BeforeAnswer` sạch `0` Mascot) |
| **3. TOEIC Exam** | [`Light`](./prototypes/proto-toeic-1440-light.png) • [`Dark`](./prototypes/proto-toeic-1440-dark.png) | [`Light`](./prototypes/proto-toeic-375-light.png) • [`Dark`](./prototypes/proto-toeic-375-dark.png) | Split `1.35fr 0.65fr` (`>= 1024px`), Pacing Timer Cyan, Mobile Floating Question Drawer pill trên Bottom Nav (`56px + safe-area`), `0` Mascot gây nhiễu |

---

## 2. COMPONENT BREAKDOWN & DESIGN TOKEN MAPPING (CHUNG CHO TOÀN HỆ THỐNG)

| Component / Surface | Token Contract (`design-system-2026.css`) | Anatomy & Accessibility |
| :--- | :--- | :--- |
| **Header & Bottom Nav** | `--ds-bg-sub`, `--ds-card-border`, `--ds-accent-bg`, `--ds-z-header (40)` | Chiều cao `56px`, `0px` tràn ngang từ `320px..1440px` |
| **Card Surfaces** | `--ds-card`, `--ds-card-border`, `--ds-shadow-card`, `--ds-radius-xl (16px)` | Light `#FFFFFF` + `#E2E8F0`; Dark `#111115` + `#272733` |
| **Buttons (`7 × 6` states)** | `--ds-btn-primary`, `--ds-btn-success (#047857)`, `--ds-btn-danger`, `--ds-text-on-accent` | Target tối thiểu `44px` trên mobile (`pointer: coarse`), Focus Ring `2px` |
| **Radio Choice Card** | `--ds-card-border` (default), `--ds-accent` + `--ds-accent-bg` (selected) | `min-height: 48px`, `role="radio"`, hỗ trợ Arrow Keys & Space |
| **Cheatsheet Formula Trio** | `--ds-success-bg/border` (+), `--ds-warning-bg/border` (-), `--ds-accent-bg/border` (?) | `font-family: var(--font-mono)`, `white-space: pre-wrap` đến `165` chars |

---

## 3. ASSET REGISTRY M4.2 (`pending_po_review`)
- Manifest: [`public/assets/asset-registry.json`](../../../public/assets/asset-registry.json) gồm `5` asset đã hash SHA-256: `master-mascot` (`512×512` PNG alpha), `apple-touch-icon` (`180×180` vuông), `pwa-icon-192`, `pwa-icon-512`, `og-grammarpro` (`1200×630`).
- **Mở rộng sau Gate A:** Sau khi Product Owner duyệt `Gate A >= 90/100`, `M4.3` sẽ sinh `6` biểu cảm Mascot từ `master-mascot.png`, `5` Banners `.webp`, `xray-preview.svg`, `state-404.svg`, `21` Badges & `4` Avatars; `M4.4A` triển khai `QuestionExperienceEngine` + Mobile Drawer `z-index`.
