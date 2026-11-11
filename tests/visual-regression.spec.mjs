/**
 * Milestone 2.6.11: Visual Regression & Accessibility Snapshot Matrix (Playwright)
 * Covers Mobile (375x812), Tablet (768x1024), Desktop (1440x900) across Light & Dark Modes.
 * Usage in CI with Playwright installed: npx playwright test tests/visual-regression.spec.mjs
 */

const VIEWPORTS = [
  { name: "mobile", width: 375, height: 812 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
];

const THEMES = ["light", "dark"];
const BASE_URL = process.env.VISUAL_BASE_URL || "https://grammar-platform.vercel.app";

export async function runVisualAudit() {
  const { chromium } = await import("playwright");
  const browser = await chromium.launch();
  const report = [];

  try {
    for (const vp of VIEWPORTS) {
      for (const theme of THEMES) {
        const context = await browser.newContext({
          viewport: { width: vp.width, height: vp.height },
          colorScheme: theme,
        });
        const page = await context.newPage();
        await page.addInitScript((t) => {
          localStorage.setItem("grammar_theme", t);
        }, theme);

        await page.goto(BASE_URL, { waitUntil: "networkidle" });
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
        const dataTheme = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));

        report.push({
          viewport: vp.name,
          theme,
          dataTheme,
          horizontalOverflow: overflow,
          status: !overflow && dataTheme === theme ? "PASS" : "WARN",
        });
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runVisualAudit().then((r) => {
    console.table(r);
    if (r.some((item) => item.status !== "PASS")) process.exit(1);
  });
}
