# Grammar Engine Design System (`V3.1 Unified` — M4.6 Consolidated)

> **Cập nhật Điều hướng:** Hệ Design System chuẩn hóa `BRAND-UX-V3.1` với kiến trúc Token Single Source of Truth, Thư viện Component hợp nhất và chính sách **100% Zero OS Color Emoji**. Xem bộ tài liệu chuẩn:
> [`DESIGN_TOKEN_CONTRACT.md`](./DESIGN_TOKEN_CONTRACT.md) • [`COMPONENT_ANATOMY_SPEC.md`](./COMPONENT_ANATOMY_SPEC.md) • [`RESPONSIVE_BEHAVIOR_SPEC.md`](./RESPONSIVE_BEHAVIOR_SPEC.md) • [`ACCESSIBILITY_SPEC.md`](./ACCESSIBILITY_SPEC.md) • [`ZERO_OS_EMOJI_MIGRATION_PLAN.md`](./ZERO_OS_EMOJI_MIGRATION_PLAN.md).

## 1. Kiến trúc Token 3 Tầng (`lib/tokens/` & `styles/tokens.css`)
- **Layer 1 (`PRIMITIVE_TOKENS`)**: Thang màu gốc (`slate`, `zinc`, `blue`, `sky`, `emerald`, `amber`, `red`) và Z-Index Layer Cake chuẩn hóa.
- **Layer 2 (`DESIGN_TOKENS` / `getThemeTokens(isLight)`)**: Semantic CSS tokens `--ds-*` đồng bộ tuyệt đối Light Mode & Dark Mode với tỷ lệ tương phản **$\ge 4.5:1$** (WCAG 2.2 AA).
- **Layer 3 (`getComponentTokens(isLight)`)**: Component tokens cho `Button`, `Input`, `Card`, `Modal`, `Tooltip`, `ToeicButton`, `ToeicBadge`.
- **Typography & Spacing (`typography.tokens.js`, `spacing.tokens.js`)**: Thang fluid `clamp()` 10 cấp độ, 4px Spacing Grid (`space1` = 4px ... `space16` = 64px), Breakpoints chuẩn và Motion Tokens hỗ trợ `@media (prefers-reduced-motion: reduce)`.

## 2. Thư viện Component & Vector Icon System (`components/design-system/` & `components/ui-2026/`)
Import thống nhất từ `components/design-system`:
- **Buttons:** `Button` (`primary | secondary | outline | ghost | danger | success`, hỗ trợ `icon`, `leftIcon`, `rightIcon`), `IconButton`, `ButtonGroup`.
- **Forms:** `Input`, `Select`, `Textarea`, `Checkbox`, `Switch`.
- **Feedback & States:** `Badge`, `Alert` (tích hợp vector `<KitIcon>`), `Progress`, `Tooltip`, `Skeleton` (Zero CLS), `EmptyState`.
- **Layout & Overlays:** `Card`, `Container`, `Grid` (`min(..., 100%)` mobile overflow-safe), `Divider`, `Modal` (hợp nhất Focus Trap + Escape + khôi phục focus, `FocusTrapModal2026` chuyển tiếp về `Modal`).
- **Zero OS Emoji Vector System (`KitIcon` & `StatusDot`):** Toàn bộ UI sử dụng 60+ icon SVG nét vector đồng nhất từ `components/ui-2026/KitIcon.jsx` và chấm trạng thái `<StatusDot />` — **nghiêm cấm OS Color Emojis** trong UI buttons, cards, badges, headers, toolbars và modals.

## 3. Quy tắc Quản trị & Kiểm thử Tự động (Governance CI)
1. **Zero Raw HEX (`M4.6`):** Không hardcode mã màu HEX trong `components/**` và `pages/**`; luôn dùng biến semantic `var(--ds-*)` hoặc `getThemeTokens(isLight)`.
2. **Zero OS Color Emojis:** Không dùng ký tự pictographic/OS color emoji trong UI JSX; dùng `<KitIcon name="..." />` hoặc `<StatusDot />`.
3. **Chạy toàn bộ 5 Design CI Validators:**
   ```bash
   node scripts/design/generate-token-report.mjs
   ```
   Bao gồm: `validate-design-tokens.mjs` (root & scoped), `validate-color-contrast.mjs` (`36/36` WCAG AA), `validate-z-index.mjs`, và `validate-zero-os-emoji.mjs`.
4. **Visual Regression & Responsive Overflow Check:** `node tests/visual-regression.spec.mjs --capture` (`20/20` Viewports × Themes).
5. **WCAG 2.2 AA:** Đảm bảo `scroll-padding-top: 76px` tránh header che focus indicator (`2.4.11`) và kích thước tương tác tối thiểu `24x24px` (`44x44px` trên thiết bị cảm ứng `pointer: coarse` — `2.5.8`).
