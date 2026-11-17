# 🎯 KẾ HOẠCH THAY THẾ TOÀN BỘ KÝ HIỆU OS EMOJI TRONG UI BUTTONS, CARDS & BADGES (`ZERO OS EMOJI MIGRATION — M4.6`)

> **Tài liệu trực thuộc:** [`BRAND-UX-V3.1.md`](../BRAND-UX-V3.1.md) • **Milestone thực thi:** `M4.6` *(sau khi chốt Gate B `M4.5`)*  
> **Trạng thái:** ✅ **PLAN ĐÃ DUYỆT BỔ SUNG** — Sẵn sàng triển khai khi mở khóa `M4.6`  
> **Mục tiêu cốt lõi:** Triệt tiêu 100% OS Color Emoji trong toàn bộ UI (`pages/**` & `components/**`) bằng **Unified Vector SVG System (`KitIcon.jsx` + `StatusDot` + `public/assets/icons/*`)**, bảo đảm hiển thị sắc nét đồng bộ tuyệt đối trên iOS, Android, macOS và Windows với màu theo biến CSS `var(--ds-*)` ở cả Light & Dark Mode.

---

## 1. KẾT QUẢ KIỂM TOÁN CODEBASE THỰC TẾ (`Baseline 2026-11-17`)

- **Phạm vi đã hoàn thành ở `M4.2 – M4.4B`:**
  - `components/ui-2026/KitIcon.jsx`: Đã có **18 SVG stroke icons** (`hub-overview`, `hub-study`, `hub-practice`, `hub-achievements`, `hub-vip`, `hub-admin`, `tool-search`, `tool-dict`, `tool-vocab`, `tool-audio`, `tool-theme-light`, `tool-theme-dark`, `tool-diag`, `tool-xray`, `tool-dna`, `tool-loop`, `tool-chart`, `tool-spark`).
  - `public/assets/icons/*`: Đã có **43 file SVG** (`6` Navigation, `6` Tools, `12` Chapters, `6` Levels, `5` Badge Tiers, `8` Visualizations), **21 SVG huy hiệu riêng**, **4 Avatar SVG**, và **6 Scholar Owl Mascots**.
- **Phần OS Symbols / Emoji vẫn còn trong UI Codebase (`pages/**` + `components/**`):**
  - **Tổng số file chứa OS Emoji/Glyph:** **`66` files** (`652` lần xuất hiện theo regex Unicode `U+1F300..U+1FAFF`, `U+2600..U+27BF`, `U+2300..U+23FF`).
  - **Phân loại ranh giới bắt buộc thay thế:**
    1. **NHÓM BẮT BUỘC THAY (`~543` OS Color Emojis):** Toàn bộ emoji màu phụ thuộc hệ điều hành xuất hiện trong:
       - **Buttons & CTAs:** `🔥`, `🔑`, `📝`, `⚡`, `🏅`, `🏆`, `⚙️`, `📄`, `🔄`, `🚩`, `🔊`, `🔍`, `🎯`, `🛡️`
       - **Cards, Headers, Feature Lists & Matrix:** `🔒`, `👑`, `👤`, `💡`, `📊`, `⏱️`, `📖`, `🗺️`, `📐`, `🧠`, `⚖️`, `💎`, `✨`, `📋`, `⏳`, `🎉`
       - **Status Badges & Semantic Dots:** `✅`, `⚠️`, `🟢`, `🟡`, `🔴`
    2. **NHÓM ĐƯỢC PHÉP / KHÔNG CẦN ĐỔI (Whitelist):**
       - Dữ liệu ngữ pháp gốc trong `data/**` *(Bất biến 100% — giữ nguyên SHA-256 `15/15 Diffs: 0`)*.
       - Ký tự mũi tên/dấu tích thuần typography nếu cần căn dòng text thuần (`✓`, `➔`, `✕`) — trừ các vị trí nằm trong pill badge/button trạng thái lớn sẽ nâng cấp sang SVG chuẩn khi gộp `Button` / `Badge`.

### Phân Bố Top Files Còn OS Emoji (`Actual Audit`)
| Nhóm / File | Số lượng | Trọng tâm cần thay thế |
| :--- | :---: | :--- |
| `pages/index.js` | **117** | Nút CTA, Bento Dashboard Cards, Study Header/TOC, Quiz controls, Popup buttons |
| `components/monetization/MonetizationHub.jsx` | **49** | Guest alert CTA, `FEATURE_VISUAL_META` icons, Pricing card pills, FREE vs VIP matrix badges |
| `pages/toeic/tests/[series]/[testNum].jsx` | **36** | Exam dock buttons, timer `⏱️`, flag `🚩`, status dots, modal alerts |
| `components/admin/AdminMonetizationPanel.jsx` | **30** | KPI headers, SePay action buttons, coupon/tier tables |
| `components/explanation/StructuredExplanation.jsx` | **25** | Mức độ giải thích (`🔒` VIP lock, `💡` bẫy ngữ pháp, `✅` đáp án) |
| `components/toeic/SentenceXRayCard.jsx` | **21** | Phân tích X-Ray chips, audio/grammar indicators |
| `components/ui-2026/AiPowerShowcase2026.jsx` | **20** | Feature showcase cards & badges |
| `components/gamification/GamificationHub.jsx` | **18** | Quick-Jump Strip (`⚡`, `🏅`, `🏆`, `⚙️`), Streak orb (`🔥`), Challenge cards, Expand CTA |
| `components/toeic/SplitPassageReader.jsx` + `ToeicDiagnosticSession.jsx` | **28** | Navigation/passage controls, timers, diagnostic flags |
| `components/diagnostic/*` (`4` files) | **46** | Test session buttons, Root Cause DAG badges, Roadmap cards |
| `components/grammar-visualization/*` (`3` files) | **36** | Timeline pill icons (`〰️`, `✓`), Conversion flow & Sentence tree badges |
| `components/ui-2026/AppShell2026.jsx` + `components/auth/*` + các route TOEIC còn lại | **~226** | Header Streak pill (`🔥 1d`), Login/Admin pills, TOEIC sub-pages & drawers |

---

## 2. MỞ RỘNG KIẾN TRÚC ICON VECTOR (`KitIcon.jsx` + `StatusDot.jsx`)

Kế thừa chuẩn **Unified SVG Stroke System** trong [`MASTER_ART_DIRECTION.md`](../governance/MASTER_ART_DIRECTION.md#L39-L40) (`viewBox="0 0 24 24"`, `strokeWidth="1.8"`, `strokeLinecap="round"`, `strokeLinejoin="round"`, sử dụng `var(--ds-*)` và `currentColor`), bổ sung **28 icon mới** vào `components/ui-2026/KitIcon.jsx` chia theo **5 nhóm**:

### Nhóm A — Auth, Quyền Hạn & VIP (`5 icons`)
| Emoji thay thế | `KitIcon name` | Tone token mặc định |
| :--- | :--- | :--- |
| `🔒` | `status-lock` | `currentColor` / `--ds-warning` |
| `🔑` | `action-key` | `--ds-accent` |
| `👤` | `user-avatar` | `currentColor` |
| `👑` | `vip-crown` | `--ds-warning` |
| `🛡️` | `shield-guard` | `--ds-success` / `--ds-danger` |

### Nhóm B — Gamification, Streak & Thử Thách (`6 icons`)
| Emoji thay thế | `KitIcon name` | Tone token mặc định |
| :--- | :--- | :--- |
| `🔥` | `stat-flame` | `--ds-warning` |
| `⚡` | `action-bolt` | `--ds-accent` |
| `🏆` | `reward-trophy` | `--ds-warning` |
| `🏅` | `reward-medal` | `--ds-warning` |
| `🎯` | `target-goal` | `--ds-accent` |
| `🎉` | `celebrate-spark` | `--ds-success` / `--ds-warning` |

### Nhóm C — Hành Động Điều Khiển Trên Buttons (`8 icons`)
| Emoji thay thế | `KitIcon name` | Vị trí tiêu biểu |
| :--- | :--- | :--- |
| `📝` | `action-edit` | Nút Đăng ký, Ghi chú, Làm bài |
| `🔄` | `action-refresh` | Đổi thử thách, Làm mới Sync, Retry |
| `🚩` | `action-flag` | Đánh dấu câu hỏi (Diagnostic / TOEIC Exam) |
| `📄` / `📋` | `doc-export` | Xuất báo cáo VIP API, Copy JSON/CSV |
| `⚙️` | `action-settings` | Cài đặt Privacy, Motion, Admin Config |
| `⚖️` | `compare-scale` | So sánh `FREE vs VIP`, So sánh 13 thì |
| `☰` | `menu-drawer` | Nút `Chọn chuyên đề` trên Study Header |
| `✕` / `➔` (pill icons) | `nav-close`, `nav-arrow-right` | Đóng drawer/modal, CTA điều hướng |

### Nhóm D — Học Thuật & Trạng Thái Thẻ (`8 icons`)
| Emoji thay thế | `KitIcon name` | Vị trí tiêu biểu |
| :--- | :--- | :--- |
| `✅` | `status-check-circle` | Câu đúng, Mở khóa VIP, Đã hoàn thành |
| `⚠️` | `status-warning` | Lỗi hay gặp, Alert bảo mật, Cảnh báo |
| `💡` | `tip-bulb` | Phân tích ngữ pháp, Gợi ý học tập |
| `⏱️` | `ped-timer` | Đồng hồ đếm ngược Diagnostic & TOEIC Exam |
| `⏳` | `status-hourglass` | Pending SePay webhook / Đang xử lý |
| `📖` | `ped-book` | Bài học ngữ pháp, Split Passage Reader |
| `🗺️` | `ped-map` | Lộ trình cá nhân hóa 4 tuần |
| `📐` / `🧠` | `ped-ruler`, `ped-brain` | Công thức, SM-2 / FSRS Spaced Repetition |

### Nhóm E — Component Nhẹ `<StatusDot />` (`1 primitive`)
- Thay thế toàn bộ `🟢`, `🟡`, `🔴` trong trạng thái hệ thống, kết nối sync, mức độ câu hỏi bằng `<StatusDot tone="success | warning | danger | accent" pulse={boolean} />` (8px crisp CSS circle có `aria-hidden="true"`).

---

## 3. LỘ TRÌNH TRIỂN KHAI THEO 4 WAVE TRONG `M4.6`

> **Nguyên tắc an toàn:** Mỗi Wave hoàn tất phải chạy `npm run build` (`Exit 0`), giữ nguyên `100%` text tiếng Việt, `aria-label`, event handlers, và `data/` SHA-256 (`15/15 Diffs: 0`). Dùng helper prop `leftIcon={<KitIcon name="..." size={16} />}` ngay trong unified `Button` / `Badge` / `Alert` của `M4.6`.

1. **Wave 1 — `KitIcon.jsx` Expansion + Design System Primitives + AppShell (`~170` hits):**
   - Mở rộng `KitIcon.jsx` (`+28` icons) + tạo `<StatusDot />` + hỗ trợ `icon` prop chuẩn trên `Button`, `Badge`, `Alert`.
   - Thay sạch emoji trong `AppShell2026.jsx` (`🔥 1d`, nav, header buttons), `AccountProfileCard.jsx`, `AuthModal.jsx`, `AiPowerShowcase2026.jsx`.
2. **Wave 2 — VIP & Gamification Cards/Buttons (`~80` hits):**
   - `MonetizationHub.jsx`: thay `FEATURE_VISUAL_META` icon strings thành `iconName` → render `<KitIcon />` trong container `36×36`; thay emoji trong Pricing cards, Guest bar, Duel cards, Matrix tiers, Modals (`SmartPaywallModal.jsx`).
   - `GamificationHub.jsx` + `LeaderboardPanel.jsx` + `GamificationCelebrationModal.jsx`: thay `🔥`, `⚡`, `🏅`, `🏆`, `⚙️`, `🔄`, `🎯`, `🔒` trên Quick-Jump Strip, Streak/Level/Challenge/Badge cards & Leaderboard.
3. **Wave 3 — Core Grammar Study, Quiz, Explanations & Visualizations (`~195` hits):**
   - `pages/index.js` (`Dashboard Bento Cards`, `Study Theory/Exercises`, `Quiz Hub`, `#dict-popup`, `#vocab-modal`).
   - `StructuredExplanation.jsx`, `SpacedRepetitionPanel.jsx`, `MasteryIntelligenceDashboard.jsx`, `Diagnostic/*`, `TimelineVisualization.jsx` (pill status icons), `ConversionFlowVisualization.jsx`, `SentenceTreeVisualization.jsx`, `AiAdvisorDrawer.jsx`.
4. **Wave 4 — TOEIC 2026 Suite, Admin Panels & CI Enforcement (`~207` hits):**
   - Toàn bộ `pages/toeic/**`, `components/toeic/**`, `components/admin/**`.
   - Bổ sung script **`scripts/design/validate-zero-os-emoji.mjs`** và gắn vào `scripts/design/generate-token-report.mjs`: fail build/audit nếu còn OS Color Emoji trong `pages/**` hoặc `components/**`.

---

## 4. TIÊU CHÍ NGHIỆM THU (`ACCEPTANCE CRITERIA` BỔ SUNG CHO `M4.6`)

1. **`validate-zero-os-emoji.mjs` PASS (`0` OS Color Emoji):** Không còn OS color emoji trong bất kỳ `button`, `card`, `badge`, `alert`, hoặc heading nào thuộc `pages/**` & `components/**`.
2. **Độ sắc nét & Căn chỉnh:** Toàn bộ icon nút & thẻ hiển thị bằng `KitIcon` (`14px–20px`), `flexShrink: 0`, căn giữa trục chữ (`gap: 6px`), không lệch dòng ở `320px–1440px`.
3. **Parity Light/Dark & WCAG 2.2 AA:** Mọi icon kế thừa CSS semantic tokens (`var(--ds-*)`), chạy `generate-token-report.mjs` (`36/36` contrast pairs PASS).
4. **Hợp nhất UI Primitives + Build Clean:** `npm run build` Exit `0`, `11/11` `question-engine.test.mjs` PASS, `15/15` Content SHA-256 `Diffs: 0`, `20/20` `visual-regression.spec.mjs` PASS.
