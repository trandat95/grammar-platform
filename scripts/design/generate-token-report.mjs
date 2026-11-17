import { spawnSync } from "node:child_process";

const scripts = [
  "scripts/validate-design-tokens.mjs",
  "scripts/design/validate-design-tokens.mjs",
  "scripts/design/validate-color-contrast.mjs",
  "scripts/design/validate-z-index.mjs",
  "scripts/design/validate-zero-os-emoji.mjs",
];

let allPass = true;
for (const script of scripts) {
  console.log(`\n--- Running ${script} ---`);
  const res = spawnSync("node", [script], { stdio: "inherit" });
  if (res.status !== 0) allPass = false;
}

if (!allPass) {
  console.error("\nTOKEN REPORT: FAILED");
  process.exit(1);
}
console.log("\nTOKEN REPORT: ALL DESIGN VALIDATORS PASSED");
