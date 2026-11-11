#!/usr/bin/env node
/**
 * Milestone 2.6.11: Node Automated Design System Token & Contrast Validator
 */
import fs from "node:fs";
import path from "node:path";
import { DESIGN_TOKENS } from "../lib/tokens/design-tokens.js";

function relLuminance(hex) {
  const clean = hex.replace("#", "").slice(0, 6);
  const rgb = [0, 2, 4].map((i) => parseInt(clean.slice(i, i + 2), 16) / 255);
  const [r, g, b] = rgb.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const l1 = relLuminance(a);
  const l2 = relLuminance(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

const issues = [];
for (const mode of ["light", "dark"]) {
  const T = DESIGN_TOKENS[mode];
  for (const surf of ["bg", "card"]) {
    for (const fg of ["text", "textSecondary", "textMuted", "accent", "success", "warning", "danger"]) {
      const ratio = contrast(T[fg], T[surf]);
      if (ratio < 4.5) {
        issues.push(`${mode}.${fg} on ${surf} = ${ratio.toFixed(2)}:1 (< 4.5:1)`);
      }
    }
  }
}

if (issues.length > 0) {
  console.error("Design token contrast failures:", issues);
  process.exit(1);
}
console.log("Design token contrast audit PASSED across Light and Dark modes (all >= 4.5:1).");
