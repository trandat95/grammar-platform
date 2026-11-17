import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SCAN_TARGETS = [
  "styles/design-system-2026.css",
  "styles/toeic-ui-2026.css",
  "components/diagnostic",
  "components/ui-2026",
  "components/design-system",
];

function walk(target) {
  const full = path.join(ROOT, target);
  if (!fs.existsSync(full)) return [];
  const stat = fs.statSync(full);
  if (stat.isFile()) return [target];
  const out = [];
  for (const e of fs.readdirSync(full, { withFileTypes: true })) {
    const rel = path.join(target, e.name).replace(/\\/g, "/");
    if (e.isDirectory()) out.push(...walk(rel));
    else if (/\.(css|js|jsx|mjs)$/.test(e.name)) out.push(rel);
  }
  return out;
}

const issues = [];
const zRe = /z(?:-index|Index)\s*:\s*(\d+)/g;

for (const target of SCAN_TARGETS) {
  for (const rel of walk(target)) {
    const lines = fs.readFileSync(path.join(ROOT, rel), "utf8").split(/\r?\n/);
    lines.forEach((txt, i) => {
      let m;
      while ((m = zRe.exec(txt)) !== null) {
        const val = Number(m[1]);
        if (val > 1400) {
          issues.push({ severity: "CRITICAL", file: rel, line: i + 1, val, note: "Exceeds Toast layer (1400)" });
        }
      }
    });
  }
}

console.log("=== M4.1 Z-Index Contract Audit ===");
if (issues.length) {
  for (const x of issues) {
    console.error(`[${x.severity}] ${x.file}:${x.line} -> z=${x.val} (${x.note})`);
  }
  process.exit(1);
}
console.log("PASS: 0 z-index > 1400 violations in M4.1 scope. (Note: pages/index.js:3696 dict-popup=1300 queued for M4.4A per scope lock.)");
