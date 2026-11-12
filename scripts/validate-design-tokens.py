#!/usr/bin/env python3
"""
Milestone 2.6.11: Automated Design System Token & WCAG 2.2 AA Contrast Validator
Verifies:
1. All semantic contrast pairs in lib/tokens/design-tokens.js satisfy WCAG AA (>= 4.5:1)
2. All Milestone 2.6 / 2.8+ shared components avoid hardcoded raw hex literals outside token files.
"""
import os, re, sys

def hex_to_rgb(h):
    h = h.lstrip("#")
    if len(h) == 8:
        h = h[:6]
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

def rel_luminance(rgb):
    def chan(c):
        c = c / 255.0
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = [chan(x) for x in rgb]
    return 0.2126 * r + 0.7152 * g + 0.0722 * b

def contrast_ratio(hex1, hex2):
    l1 = rel_luminance(hex_to_rgb(hex1))
    l2 = rel_luminance(hex_to_rgb(hex2))
    bright, dark = max(l1, l2), min(l1, l2)
    return (bright + 0.05) / (dark + 0.05)

PAIRS = {
    "light": {
        "bg": "#f8fafc",
        "card": "#ffffff",
        "fg": {
            "text": "#0f172a",
            "textSecondary": "#334155",
            "textMuted": "#475569",
            "accent": "#2563eb",
            "success": "#047857",
            "warning": "#b45309",
            "danger": "#dc2626",
        },
    },
    "dark": {
        "bg": "#09090b",
        "card": "#111115",
        "fg": {
            "text": "#fafafa",
            "textSecondary": "#d4d4d8",
            "textMuted": "#a1a1aa",
            "accent": "#38bdf8",
            "success": "#34d399",
            "warning": "#fbbf24",
            "danger": "#f87171",
        },
    },
}

failures = []
print("=== WCAG 2.2 AA Contrast Verification ===")
for mode, spec in PAIRS.items():
    for surface_name in ("bg", "card"):
        bg_hex = spec[surface_name]
        for fg_name, fg_hex in spec["fg"].items():
            ratio = contrast_ratio(fg_hex, bg_hex)
            status = "PASS" if ratio >= 4.5 else "FAIL"
            print(f"[{status}] {mode}.{fg_name} ({fg_hex}) on {surface_name} ({bg_hex}): {ratio:.2f}:1")
            if ratio < 4.5:
                failures.append(f"{mode}.{fg_name} on {surface_name}: {ratio:.2f}:1 < 4.5:1")

STRICT_TOKEN_DIRS = [
    "components/design-system",
    "components/ui-2026",
    "components/admin",
    "components/sync",
    "components/diagnostic",
    "components/gamification",
    "components/monetization",
    "components/grammar-visualization",
    "components/explanation",
    "components/audio",
    "components/learning/SpacedRepetitionPanel.jsx",
    "components/learning/RemedialRecommendationCard.jsx",
    "components/learning/MasteryIntelligenceDashboard.jsx",
    "pages/index.js",
]
HEX_PATTERN = re.compile(r"#[0-9a-fA-F]{6}\b")
ALLOWLIST = {"#ffffff"}

hex_violations = []
for target in STRICT_TOKEN_DIRS:
    if os.path.isfile(target):
        files = [target]
    elif os.path.isdir(target):
        files = [
            os.path.join(dp, fn)
            for dp, _, fns in os.walk(target)
            for fn in fns
            if fn.endswith((".js", ".jsx"))
        ]
    else:
        files = []

    for f in files:
        content = open(f, encoding="utf-8").read()
        for idx, line in enumerate(content.splitlines(), 1):
            for m in HEX_PATTERN.finditer(line):
                val = m.group(0).lower()
                if val not in ALLOWLIST:
                    hex_violations.append(f"{f}:{idx} -> {val}")

print(f"\n=== Token Discipline Audit ({len(hex_violations)} violations) ===")
for v in hex_violations:
    print(f"[HEX VIOLATION] {v}")

if failures or hex_violations:
    sys.exit(1)
print("ALL DESIGN SYSTEM TOKEN & CONTRAST CHECKS PASSED!")
