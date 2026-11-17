import fs from "node:fs";
import path from "node:path";

const css = fs.readFileSync(path.join(process.cwd(), "styles/design-system-2026.css"), "utf8");

function extractBlock(selectorRegex) {
  const m = css.match(selectorRegex);
  if (!m) return {};
  const map = {};
  const re = /(--ds-[a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{6})\s*;/g;
  let kv;
  while ((kv = re.exec(m[1])) !== null) {
    map[kv[1]] = kv[2].toLowerCase();
  }
  return map;
}

function hexToRgb(h) {
  const clean = h.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(clean.slice(i, i + 2), 16));
}

function luminance(rgb) {
  return rgb
    .map((v) => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    })
    .reduce((acc, val, i) => acc + val * [0.2126, 0.7152, 0.0722][i], 0);
}

function contrast(h1, h2) {
  const l1 = luminance(hexToRgb(h1));
  const l2 = luminance(hexToRgb(h2));
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

const light = extractBlock(/:root,\s*\[data-theme="light"\]\s*\{([\s\S]*?)\}/);
const dark = extractBlock(/\[data-theme="dark"\]\s*\{([\s\S]*?)\}/);

const checks = [];
for (const [mode, t] of [
  ["light", light],
  ["dark", dark],
]) {
  const textKeys = ["--ds-text", "--ds-text-secondary", "--ds-text-muted", "--ds-accent", "--ds-success", "--ds-warning", "--ds-danger"];
  for (const bgKey of ["--ds-bg", "--ds-card"]) {
    for (const fgKey of textKeys) {
      checks.push({ mode, pair: `${fgKey} on ${bgKey}`, fg: t[fgKey], bg: t[bgKey], min: 4.5 });
    }
  }
  for (const btnKey of ["--ds-btn-primary", "--ds-btn-success", "--ds-btn-danger", "--ds-btn-warning"]) {
    checks.push({ mode, pair: `--ds-text-on-accent on ${btnKey}`, fg: t["--ds-text-on-accent"], bg: t[btnKey], min: 4.5 });
  }
}

let failed = 0;
console.log("=== M4.1 Dynamic CSS Contrast Audit (WCAG 2.2 AA) ===");
for (const c of checks) {
  if (!c.fg || !c.bg) {
    console.error(`FAIL [missing token]: ${c.mode} ${c.pair}`);
    failed++;
    continue;
  }
  const ratio = contrast(c.fg, c.bg);
  if (ratio < c.min) {
    console.error(`FAIL [${c.mode}] ${c.pair}: ${ratio.toFixed(2)}:1 < ${c.min}:1 (${c.fg} on ${c.bg})`);
    failed++;
  }
}

console.log(`Checked ${checks.length} live CSS pairs across Light & Dark modes. Failures: ${failed}`);
if (failed > 0) process.exit(1);
console.log("PASS: All live CSS pairs satisfy WCAG 2.2 AA.");
