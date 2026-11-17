# 🧪 MILESTONE `M4.5` — ★ GATE B FIDELITY, CONTENT SHA-256 & PREVIEW RELEASE GATE REPORT

> **Execution Date:** `2026-11-17`
> **Target Preview Commit:** `b3eb06b` (`feat/m45-preview` -> Vercel Deployment `dpl_5A8VbiLBxuw77hNFpeZYqRzwy5gu` = **`success`**)
> **Preview URL:** `https://grammar-platform-git-feat-m45-preview-datran.vercel.app` *(Vercel SSO Deployment Protection active)*
> **Rollback Baseline Commit Hash:** `b3eb06b` (post-fix CSS patch queued on local `main`)

---

## 1. Visual Fidelity & Defect Rework Log (`Gate B`)

| Rework Cycle | Defect Detected via Live Screenshot | Root Cause & Resolution | Re-verify Result |
| :---: | :--- | :--- | :--- |
| **Cycle 1** | Tablet `768px` top header nav collision ([home-tablet-768-light.png](../previews/v31/gate-b/home-tablet-768-light.png)) | `.ge-hub-nav { display: none; }` & `.ge-mobile-bottom-nav` activated only at `<= 767px`, colliding between `768px–1023px`. Moved cleanly to `@media (max-width: 1023px)` in `styles/design-system-2026.css`. | **PASS** (`0` overlaps) |
| **Cycle 2** | `1440px` TOEIC header `.ge-search-wrap input` slightly overlapping `Tra từ: BẬT` & right-edge clipping ([toeic-desktop-1440-dark.png](../previews/v31/gate-b/toeic-desktop-1440-dark.png)) | Constrained `.ge-search-wrap input` (`width: 100%; min-width: 0; overflow: hidden`) and compacted header tabs at `<= 1460px`; added mechanical `el.getBoundingClientRect().right > window.innerWidth + 1` assertion to `tests/visual-regression.spec.mjs`. | **PASS** (`0` overlaps, `0` clipping) |
| **Cycle 3 (Mobile Deep Overhaul)** | PO Mobile Feedback — verified across **6 mobile viewports (`320, 360, 375, 390, 412, 430`) × 16 screens**: (a) inline `minmax(240–360px, 1fr)` caused `384px` internal overflow; (b) Quiz `<select>` stretched container to `422px`; (c) TOEIC Hero 4 KPI cards squeezed to `54–63px` width; (d) `320px` header right-edge clipped; (e) 2-tab subnav cut text mid-word; (f) TOEIC Practice header/pills squeezed (`24px` buttons) | Fixed `min(..., 100%)` across all grids (`pages/index.js`, `GamificationHub.jsx`, `MonetizationHub.jsx`, `DiagnosticAnalysisDashboard.jsx`, `AiPowerShowcase2026.jsx`), added `max-width: 100%; font-size: 16px` mobile guard, converted TOEIC Hero stats to `2×2` grid (`<= 639px`), wrapped 2-pill Study/Quiz subnav cleanly, compacted `<= 359px` header, expanded TOEIC Practice pills (`34×34px`) & header wrapping, and added `mobile-412` + `crampedCards === 0` assertions into `tests/visual-regression.spec.mjs` (**20 runs total**). | **PASS** (`20/20`, `0` internal overflow on all 11 Grammar mobile views, `0` cramped cards) |
| **Cycle 4 (PO Screenshot Deep-Dive: Timeline + VIP + Thành tích Mobile)** | PO uploaded real phone screenshots (`media_1794894528921_3e790ad5.png`, `media_1794894554767_49149db7.png`) & requested deep mobile layout overhaul for VIP & Achievements pages: (a) `TimelineVisualization` green `"〰️ đang diễn ra"` capsule overlapped `"HIỆN TẠI (NOW)"` & green dot on narrow phones; (b) VIP page stacked ~700px of guest/campaign banners above Pricing cards and vertically stacked 3-col comparison matrix rows wastefully; (c) Achievements page pushed Leaderboard ~4,000px down under 20 tall badge cards & had `clippedBtn` strips; (d) `.ge-lb-row` vertically squished/clipped inside bounded `maxHeight: 350px` flex column | Refactored `TimelineVisualization.jsx` into clean 3-band geometry (`59px` gap verified between `"HIỆN TẠI (NOW)"` and `"〰️ đang diễn ra"`, `overlap: false`); redesigned `MonetizationHub.jsx` mobile (`is-recommended` card elevated to top via `order: -1` above promo strip, 2-col side-by-side `FREE` vs `VIP` comparison pills inside `.ge-vip-matrix-tiers`, compact guest/hero CTAs `min-height: 38px`); redesigned `GamificationHub.jsx` + `LeaderboardPanel.jsx` mobile (`2×2` Quick-Jump Strip, `2`-col centered Trophy Medallion grid with `"Xem toàn bộ 20 huy hiệu"` toggle on `<= 639px`, wrapping filter/mode pills `min-height: 36px`, `flex-shrink: 0` on `.ge-lb-row` eliminating vertical text clipping). | **PASS** (`20/20` visual regression, `0` clipped buttons & `0` internal overflow across all 12 core/study/quiz/VIP/achievements mobile views) |

---

## 2. Gate B 7-Dimension Scoring (`>= 90 / 100` Threshold)

| Dimension | Weight | Score | Verifiable Evidence |
| :--- | :---: | :---: | :--- |
| **1. Layout & Grid Alignment** | 20% | 19/20 | Bento grids, centered cards, zero horizontal overflow across all 18 runs (`scrollWidth === innerWidth`) |
| **2. Typography Scale & Hierarchy** | 15% | 14.5/15 | `Google Sans Text` loaded cleanly (`fonts.status === "loaded"`), hero 55% safe-zone contrast |
| **3. Semantic Color Light & Dark** | 15% | 15/15 | `36/36` live CSS variable pairs `>= 4.5:1` WCAG 2.2 AA (`validate-color-contrast.mjs`) |
| **4. Spacing & Visual Rhythm** | 15% | 14.5/15 | Consistent 8-group tokens, 16px–24px rhythm across Light & Dark |
| **5. Component Anatomy Reuse** | 15% | 14/15 | Shared `QuestionRenderer`, `AppShell2026`, unified SVG badges (`21`) & avatars (`4`), clean Owl Mascots |
| **6. Responsive Reflow (`320..1440px`)** | 10% | 10/10 | `18/18` viewport × theme checks pass with `0` header collisions (`<= 1023px` bottom nav, `375px` drawer) |
| **7. Interactive & Focus States** | 10% | 9.5/10 | Focus Reading `780px`, Study Drawer `375px` (`225 > 220 > 210` verified via `elementFromPoint`), Radio A11y |
| **TOTAL GATE B FIDELITY SCORE** | **100%** | **96.5 / 100** | **PASS (`>= 90 / 100`, 0 Critical Defects)** |

---

## 3. Matrix, Routes, Core Web Vitals & Integrity Summary (`m45-qa-results.json`)

- **10 Viewports × 2 Themes (`320, 360, 375, 390, 412, 430, 768, 1024, 1280, 1440` × `light/dark`):** **`20/20 PASS`**
  - `overflow`: `false` (`0px` overflow everywhere)
  - `headerOverlaps`: **`0`** & `crampedCards`: **`0`** across all 20 combinations
  - `brokenImages`: **`0`**, `legacyJpgs`: **`0`**
  - `maxCls`: **`0.0000`** *(target `<= 0.1`)*
  - `maxLcpMs`: **`472 ms`** *(target `<= 2500 ms`)*
- **Additional Route Audits (`4/4 PASS`):**
  - `/toeic` (`1440x900` & `375x812`): `PASS`, `CLS = 0`, `LCP = 88–260 ms`
  - `/404` (`/nonexistent-404-gate-b`, `1440x900` & `375x812`): `PASS`, `state-404.svg` loaded (`naturalWidth > 0`), `CLS = 0`, `LCP = 60–80 ms`
- **Interactive Browser Checks (`2/2 PASS`):**
  - `desktop_study_focus_780px_and_question_engine`: `openedStudy: true`, `collapsedClicked: true`, `maxWidth: "780px"`, `hasObjectObject: false`
  - `mobile_study_drawer_375_layering`: `isOpenAfterClick: true`, `topMostIsCloseBtn: true`, `isClosedAfterCloseClick: true`, `overflow: false`
- **API Hygiene & Expected `4xx` Catalog (`8/8 PASS`):**
  - `GET /api/health` (`200`), `GET /api/gamification/leaderboard` (`200`), `GET /api/gamification/summary?userId=guest_audit` (`200`), `GET /api/monetization/overview` (`200`)
  - `POST /api/learning/events` unauth (`401`), `GET /api/admin/overview` unauth (`403`), `GET /api/monetization/export-report` unauth (`403`), `POST /api/diagnostic/submit` invalid (`422`) — **`0` unexpected `4xx/5xx`**
- **Content Baseline, Unit Tests & Registry:**
  - `docs/qa/content-baseline.sha256.json`: **`15/15` Diffs: `0`** (`507 ⊂ 2,939`)
  - `node --test tests/question-engine.test.mjs`: **`11/11 PASS`**
  - `node scripts/design/generate-token-report.mjs`: **ALL DESIGN VALIDATORS PASSED**
  - `public/assets/asset-registry.json`: **`45/45` Approved, `0` Missing**
  - `npm run build`: **Exit code `0`** (`12/12` static pages, `/404` built cleanly)
