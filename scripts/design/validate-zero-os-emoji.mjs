import fs from "node:fs";
import path from "node:path";

/**
 * M4.6 Zero OS Emoji Validator
 * Scans all UI source files under `pages/` and `components/` for remaining OS Color Emojis.
 * Strictly ignores `data/` educational curriculum files and code comments (`//`, `/*`).
 *
 * Modes:
 *   --strict (or default in CI after M4.6 Wave 4): exits 1 if any OS Color Emoji remains.
 *   --report: prints per-file breakdown and total count without failing (useful mid-migration).
 */

const ROOT = process.cwd();
const TARGET_DIRS = ["pages", "components"];
const REPORT_ONLY = process.argv.includes("--report");

// Extended_Pictographic covers all color OS emojis (🔒, 🔥, ⚡, ✅, ⚠️, 🏆, 🟢, etc.)
// Filter out non-emoji legal/typography symbols (©, ®, ™)
const EMOJI_RE = /[\p{Extended_Pictographic}]/gu;
const TYPOGRAPHY_EXEMPT = new Set(["©", "®", "™", "↗", "→", "←", "↑", "↓"]);

function walk(dir) {
  const full = path.join(ROOT, dir);
  if (!fs.existsSync(full)) return [];
  const out = [];
  for (const entry of fs.readdirSync(full, { withFileTypes: true })) {
    const rel = path.join(dir, entry.name).replace(/\\/g, "/");
    if (entry.isDirectory()) out.push(...walk(rel));
    else if (/\.(js|jsx)$/.test(entry.name)) out.push(rel);
  }
  return out;
}

const violations = [];

for (const dir of TARGET_DIRS) {
  for (const rel of walk(dir)) {
    const lines = fs.readFileSync(path.join(ROOT, rel), "utf8").split(/\r?\n/);
    let inBlockComment = false;
    lines.forEach((raw, idx) => {
      const trimmed = raw.trim();
      if (trimmed.startsWith("/*")) inBlockComment = true;
      if (inBlockComment) {
        if (trimmed.includes("*/")) inBlockComment = false;
        return;
      }
      if (trimmed.startsWith("//") || trimmed.startsWith("*")) return;
      // Ignore pure JSX comments `{/* ... */}`
      const cleaned = raw.replace(/\{\/\*[\s\S]*?\*\/\}/g, "");
      const matches = (cleaned.match(EMOJI_RE) || []).filter((ch) => !TYPOGRAPHY_EXEMPT.has(ch));
      if (matches.length > 0) {
        violations.push({
          file: rel,
          line: idx + 1,
          emojis: [...new Set(matches)].join(" "),
          count: matches.length,
        });
      }
    });
  }
}

const byFile = {};
let totalCount = 0;
for (const v of violations) {
  byFile[v.file] = (byFile[v.file] || 0) + v.count;
  totalCount += v.count;
}

console.log("=== M4.6 Zero OS Emoji Audit (pages/ & components/) ===");
console.log(`Files with OS Emojis: ${Object.keys(byFile).length} | Total Instances: ${totalCount}`);
if (totalCount > 0) {
  const top = Object.entries(byFile).sort((a, b) => b[1] - a[1]).slice(0, 20);
  console.log("Top remaining files:");
  for (const [f, cnt] of top) {
    console.log(`  - ${f}: ${cnt}`);
  }
}

if (!REPORT_ONLY && totalCount > 0) {
  console.error("FAIL: UI code still contains OS color emojis.");
  process.exit(1);
}

console.log(REPORT_ONLY ? "REPORT COMPLETE." : "PASS: 0 OS color emojis in UI source!");
