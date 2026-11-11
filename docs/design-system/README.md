# Grammar Engine Design System (`v2.6-enterprise`)

## 1. Kiến trúc Token 3 Tầng (`lib/tokens/`)
- **Layer 1 (`PRIMITIVE_TOKENS`)**: Thang màu gốc (`slate`, `zinc`, `blue`, `sky`, `emerald`, `amber`, `red`) và z-index.
- **Layer 2 (`DESIGN_TOKENS` / `getThemeTokens(isLight)`)**: Semantic tokens đồng bộ tuyệt đối Light Mode & Dark Mode với tỷ lệ tương phản **$\ge 4.5:1$** (WCAG 2.2 AA). Bao gồm `focusRing`, `focusOutline`, `info*`, `cardHover`, `backdrop`.
- **Layer 3 (`getComponentTokens(isLight)`)**: Component tokens cho `Button`, `Input`, `Card`, `Modal`, `Tooltip`.
- **Typography & Spacing (`typography.tokens.js`, `spacing.tokens.js`)**: Thang fluid `clamp()` 10 cấp độ, 4px Spacing Grid (`space1` = 4px ... `space16` = 64px), Breakpoints chuẩn và Motion Tokens hỗ trợ `@media (prefers-reduced-motion: reduce)`.

## 2. Thư viện Component Dùng Chung (`components/design-system/`)
Import thống nhất từ `components/design-system`:
- **Buttons:** `Button`, `IconButton`, `ButtonGroup` (`primary | secondary | ghost | danger | success`).
- **Forms:** `Input`, `Select`, `Textarea`, `Checkbox`, `Switch`.
- **Feedback:** `Badge`, `Alert`, `Progress`, `Tooltip`.
- **Layout:** `Card`, `Container`, `Grid`, `Divider`.
- **Overlays & States:** `Modal` (Focus Trap + Escape + khôi phục focus), `Skeleton` (Zero CLS), `EmptyState`.

## 3. Quy tắc Quản trị & Kiểm thử Tự động (Governance)
1. **Không hardcode mã HEX** trong các UI mới thuộc `components/design-system/`, `components/admin/`, `components/sync/`, `components/learning/`. Luôn sử dụng `getThemeTokens(isLight)`.
2. **Kiểm định Token & Tương phản WCAG AA:**
   ```bash
   python scripts/validate-design-tokens.py
   ```
3. **Visual Regression & Responsive Overflow Check:** Xem `tests/visual-regression.spec.mjs`.
4. **WCAG 2.2 AA:** Đảm bảo `scroll-padding-top: 76px` tránh header che focus indicator (`2.4.11`) và kích thước tương tác tối thiểu `24x24px` (`44x44px` trên thiết bị cảm ứng `pointer: coarse` — `2.5.8`).
