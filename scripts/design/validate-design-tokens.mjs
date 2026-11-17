import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const REQUIRED_TOKENS = [
  "--ds-bg-primary",
  "--ds-bg-secondary",
  "--ds-text-primary",
  "--ds-text-on-accent",
  "--ds-border-default",
  "--ds-interactive-primary",
  "--ds-error",
  "--ds-danger",
  "--ds-space-1",
  "--ds-space-4",
  "--ds-radius-md",
  "--ds-radius-lg",
  "--ds-shadow-card",
  "--ds-duration-fast",
  "--ds-z-modal",
  "--ds-z-toast",
];

const M41_OWNED_TARGETS = [
  "styles/toeic-ui-2026.css",
  "components/diagnostic",
  "components/grammar-visualization/TimelineVisualization.jsx",
];

const ADVISORY_M46_TARGETS = [
  "components/ui-2026",
  "components/toeic",
];

// Whitelisted files/patterns (vector graphics, chart palettes, fallback constants)
const ALLOWED_FILES = new Set(["lib/tokens/design-tokens.js"]);

function walkFiles(target) {
  const full = path.join(ROOT, target);
  if (!fs.existsSync(full)) return [];
  const stat = fs.statSync(full);
  if (stat.isFile()) return [target];
  const out = [];
  for (const entry of fs.readdirSync(full, { withFileTypes: true })) {
    const rel = path.join(target, entry.name).replace(/\\/g, "/");
    if (entry.isDirectory()) out.push(...walkFiles(rel));
    else if (/\.(css|js|jsx|mjs)$/.test(entry.name)) out.push(rel);
  }
  return out;
}

const cssContent = fs.readFileSync(path.join(ROOT, "styles/design-system-2026.css"), "utf8");
const missingTokens = REQUIRED_TOKENS.filter((t) => !cssContent.includes(`${t}:`));

const hexRe = /#[0-9a-fA-F]{3,8}\b/g;

function scanTargets(targets, severity) {
  const out = [];
  for (const target of targets) {
    for (const relFile of walkFiles(target)) {
      if (ALLOWED_FILES.has(relFile)) continue;
      const lines = fs.readFileSync(path.join(ROOT, relFile), "utf8").split(/\r?\n/);
      lines.forEach((lineText, idx) => {
        const trimmed = lineText.trim();
        if (trimmed.startsWith("//") || trimmed.startsWith("*")) return;
        let match;
        while ((match = hexRe.exec(lineText)) !== null) {
          const val = match[0];
          const isChartOrSvg =
            relFile.includes("Radar") ||
            lineText.includes("stroke=") ||
            lineText.includes("stopColor=") ||
            lineText.includes("rgba");
          if (isChartOrSvg) continue;
          out.push({ severity, file: relFile, line: idx + 1, value: val });
        }
      });
    }
  }
  return out;
}

const ownedViolations = scanTargets(M41_OWNED_TARGETS, "CRITICAL");
const advisoryBacklog = scanTargets(ADVISORY_M46_TARGETS, "ADVISORY_M46");

console.log("=== M4.1 Design Token Validator ===");
console.log(`Required CSS Contract Tokens: ${REQUIRED_TOKENS.length - missingTokens.length}/${REQUIRED_TOKENS.length}`);
if (missingTokens.length) console.error("Missing tokens:", missingTokens);
console.log(`M4.1 Owned Scope Violations: ${ownedViolations.length}`);
for (const v of ownedViolations) console.error(`[${v.severity}] ${v.file}:${v.line} -> ${v.value}`);
console.log(`M4.6 Consolidation Backlog (outside M4.1 scope): ${advisoryBacklog.length}`);

if (missingTokens.length > 0 || ownedViolations.length > 0) {
  process.exit(1);
}
console.log("PASS: 0 token violations in M4.1 owned scope.");
