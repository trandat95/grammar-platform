/**
 * Studio-grade 3D Asset & Pastel Backdrop Processor (v2 — Zero Pearl Erosion, Zero Floor-Shadow Pill)
 * - Ultra-strict pure-white exterior BFS (dist <= 9, chroma <= 5) so pearl-white 3D rims stay 100% intact
 * - Automatic detached floor-shadow removal (removes faint horizontal bottom shadow ellipses so Dark Mode has zero white pills underneath)
 * - Gentle 2px anti-aliased edge feathering + color decontamination for seamless Light & Dark Mode rendering
 * - Auto-crops & centers onto square 512x512 transparent WebP in public/assets/cards/3d/
 * - Optimizes 5 atmospheric 16:9 Pastel Glass backdrops to 1440x810 WebP in public/assets/banners/pastel/
 */
import fs from "fs";
import path from "path";
import sharp from "sharp";

const ROOT = process.cwd();
const RAW_CARDS_DIR = path.join(ROOT, "public", "assets", "cards", "raw");
const OUT_CARDS_DIR = path.join(ROOT, "public", "assets", "cards", "3d");
const RAW_BANNERS_DIR = path.join(ROOT, "public", "assets", "banners", "raw");
const OUT_BANNERS_DIR = path.join(ROOT, "public", "assets", "banners", "pastel");
const QA_DIR = path.join(ROOT, ".tmp-asset-qa");

fs.mkdirSync(OUT_CARDS_DIR, { recursive: true });
fs.mkdirSync(OUT_BANNERS_DIR, { recursive: true });
fs.mkdirSync(QA_DIR, { recursive: true });

async function process3DIcon(inPath, outPath) {
  const { data, info } = await sharp(inPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height } = info;
  const total = width * height;
  const rgba = new Uint8ClampedArray(data);

  const whiteDist = new Float32Array(total);
  const chroma = new Float32Array(total);
  for (let i = 0; i < total; i++) {
    const idx = i * 4;
    const r = rgba[idx];
    const g = rgba[idx + 1];
    const b = rgba[idx + 2];
    const dr = 255 - r;
    const dg = 255 - g;
    const db = 255 - b;
    whiteDist[i] = Math.sqrt(dr * dr + dg * dg + db * db);
    chroma[i] = Math.max(r, g, b) - Math.min(r, g, b);
  }

  // Pass 1: Strict exterior pure-white BFS (NEVER crosses into shaded pearl-white 3D rims!)
  const visited = new Uint8Array(total);
  const isBg = new Uint8Array(total);
  const queue = new Int32Array(total);
  let head = 0;
  let tail = 0;

  const isPureWhiteBg = (i) => whiteDist[i] <= 7.5 && chroma[i] <= 4.5;

  for (let x = 0; x < width; x++) {
    for (const y of [0, height - 1]) {
      const i = y * width + x;
      if (!visited[i] && isPureWhiteBg(i)) {
        visited[i] = 1;
        isBg[i] = 1;
        queue[tail++] = i;
      }
    }
  }
  for (let y = 1; y < height - 1; y++) {
    for (const x of [0, width - 1]) {
      const i = y * width + x;
      if (!visited[i] && isPureWhiteBg(i)) {
        visited[i] = 1;
        isBg[i] = 1;
        queue[tail++] = i;
      }
    }
  }

  while (head < tail) {
    const cur = queue[head++];
    const x = cur % width;
    const y = (cur - x) / width;
    if (x > 0) {
      const n = cur - 1;
      if (!visited[n] && isPureWhiteBg(n)) { visited[n] = 1; isBg[n] = 1; queue[tail++] = n; }
    }
    if (x < width - 1) {
      const n = cur + 1;
      if (!visited[n] && isPureWhiteBg(n)) { visited[n] = 1; isBg[n] = 1; queue[tail++] = n; }
    }
    if (y > 0) {
      const n = cur - width;
      if (!visited[n] && isPureWhiteBg(n)) { visited[n] = 1; isBg[n] = 1; queue[tail++] = n; }
    }
    if (y < height - 1) {
      const n = cur + width;
      if (!visited[n] && isPureWhiteBg(n)) { visited[n] = 1; isBg[n] = 1; queue[tail++] = n; }
    }
  }

  // Pass 1b: Strictly pure #FDFDFD-#FFFFFF enclosed backdrop cutouts (trophy handles, headphone arch, prism loops)
  // Using whiteDist <= 4.5 && chroma <= 3 guarantees pearl-white surfaces (dist >= 12) are NEVER touched!
  const holeVisited = new Uint8Array(total);
  const holeQueue = new Int32Array(total);
  for (let i = 0; i < total; i++) {
    if (isBg[i] || holeVisited[i]) continue;
    if (whiteDist[i] <= 4.5 && chroma[i] <= 3) {
      let hHead = 0;
      let hTail = 0;
      holeVisited[i] = 1;
      holeQueue[hTail++] = i;
      let pureCount = 0;
      while (hHead < hTail) {
        const cur = holeQueue[hHead++];
        if (whiteDist[cur] <= 5) pureCount++;
        const x = cur % width;
        const y = (cur - x) / width;
        if (x > 0) { const n = cur - 1; if (!isBg[n] && !holeVisited[n] && whiteDist[n] <= 8.5 && chroma[n] <= 5) { holeVisited[n] = 1; holeQueue[hTail++] = n; } }
        if (x < width - 1) { const n = cur + 1; if (!isBg[n] && !holeVisited[n] && whiteDist[n] <= 8.5 && chroma[n] <= 5) { holeVisited[n] = 1; holeQueue[hTail++] = n; } }
        if (y > 0) { const n = cur - width; if (!isBg[n] && !holeVisited[n] && whiteDist[n] <= 8.5 && chroma[n] <= 5) { holeVisited[n] = 1; holeQueue[hTail++] = n; } }
        if (y < height - 1) { const n = cur + width; if (!isBg[n] && !holeVisited[n] && whiteDist[n] <= 8.5 && chroma[n] <= 5) { holeVisited[n] = 1; holeQueue[hTail++] = n; } }
      }
      if (hTail >= 320 && pureCount >= 180) {
        for (let k = 0; k < hTail; k++) isBg[holeQueue[k]] = 1;
      }
    }
  }

  // Pass 1c: Detect and remove detached faint floor-shadow ellipses (wide flat pale shadow blobs below object)
  const compVisited = new Uint8Array(total);
  const compQueue = new Int32Array(total);
  for (let i = 0; i < total; i++) {
    if (isBg[i] || compVisited[i]) continue;
    let cHead = 0;
    let cTail = 0;
    compVisited[i] = 1;
    compQueue[cTail++] = i;
    let cMinX = width, cMaxX = 0, cMinY = height, cMaxY = 0;
    let maxWd = 0;
    let sumWd = 0;
    let maxChroma = 0;

    while (cHead < cTail) {
      const cur = compQueue[cHead++];
      const x = cur % width;
      const y = (cur - x) / width;
      if (x < cMinX) cMinX = x;
      if (x > cMaxX) cMaxX = x;
      if (y < cMinY) cMinY = y;
      if (y > cMaxY) cMaxY = y;
      const wd = whiteDist[cur];
      const ch = chroma[cur];
      if (wd > maxWd) maxWd = wd;
      if (ch > maxChroma) maxChroma = ch;
      sumWd += wd;

      if (x > 0) { const n = cur - 1; if (!isBg[n] && !compVisited[n]) { compVisited[n] = 1; compQueue[cTail++] = n; } }
      if (x < width - 1) { const n = cur + 1; if (!isBg[n] && !compVisited[n]) { compVisited[n] = 1; compQueue[cTail++] = n; } }
      if (y > 0) { const n = cur - width; if (!isBg[n] && !compVisited[n]) { compVisited[n] = 1; compQueue[cTail++] = n; } }
      if (y < height - 1) { const n = cur + width; if (!isBg[n] && !compVisited[n]) { compVisited[n] = 1; compQueue[cTail++] = n; } }
    }

    const cw = cMaxX - cMinX + 1;
    const chH = cMaxY - cMinY + 1;
    const avgWd = sumWd / cTail;
    const aspect = cw / Math.max(1, chH);
    const isBottomBand = cMinY > height * 0.72;
    const isFaintShadow = isBottomBand && maxWd < 115 && avgWd < 55 && maxChroma < 65 && aspect > 2.0;
    const isTinySpeck = cTail < 18 && maxWd < 35;

    if (isFaintShadow || isTinySpeck) {
      for (let k = 0; k < cTail; k++) isBg[compQueue[k]] = 1;
    }
  }

  // Pass 1d: Also melt away soft attached floor-shadow haze under feet/base (y >= 77% height, pale tint, connected to exterior)
  for (let pass = 0; pass < 24; pass++) {
    let bHead = 0, bTail = 0;
    for (let i = 0; i < total; i++) {
      if (isBg[i]) continue;
      const y = (i / width) | 0;
      if (y < height * 0.77) continue;
      if (whiteDist[i] <= 52 && chroma[i] <= 26) {
        const x = i % width;
        const touchesBg =
          (x > 0 && isBg[i - 1]) ||
          (x < width - 1 && isBg[i + 1]) ||
          (y > 0 && isBg[i - width]) ||
          (y < height - 1 && isBg[i + width]);
        if (touchesBg) queue[bTail++] = i;
      }
    }
    if (bTail === 0) break;
    while (bHead < bTail) isBg[queue[bHead++]] = 1;
  }

  // Pass 2: Gentle 2px boundary anti-aliasing & white fringe decontamination
  const distFromBg = new Uint8Array(total);
  distFromBg.fill(255);
  let dHead = 0, dTail = 0;
  for (let i = 0; i < total; i++) {
    if (isBg[i]) {
      distFromBg[i] = 0;
      queue[dTail++] = i;
    }
  }
  while (dHead < dTail) {
    const cur = queue[dHead++];
    const d = distFromBg[cur];
    if (d >= 3) continue;
    const x = cur % width;
    const y = (cur - x) / width;
    if (x > 0) { const n = cur - 1; if (distFromBg[n] > d + 1) { distFromBg[n] = d + 1; queue[dTail++] = n; } }
    if (x < width - 1) { const n = cur + 1; if (distFromBg[n] > d + 1) { distFromBg[n] = d + 1; queue[dTail++] = n; } }
    if (y > 0) { const n = cur - width; if (distFromBg[n] > d + 1) { distFromBg[n] = d + 1; queue[dTail++] = n; } }
    if (y < height - 1) { const n = cur + width; if (distFromBg[n] > d + 1) { distFromBg[n] = d + 1; queue[dTail++] = n; } }
  }

  let minX = width, minY = height, maxX = 0, maxY = 0;
  for (let i = 0; i < total; i++) {
    const idx = i * 4;
    if (isBg[i]) {
      rgba[idx + 3] = 0;
      continue;
    }

    const ed = distFromBg[i];
    if (ed === 1 || ed === 2) {
      const wd = whiteDist[i];
      // Soft feather ONLY right on the 1-2px silhouette edge where anti-aliasing blends with white
      const alpha = ed === 1
        ? Math.max(0, Math.min(1, (wd - 6) / 28))
        : Math.max(0.25, Math.min(1, (wd - 4) / 20));
      rgba[idx + 3] = Math.round(alpha * 255);
      if (alpha > 0.08 && alpha < 0.96) {
        const inv = 1 - alpha;
        const denom = Math.max(alpha, 0.35);
        rgba[idx] = Math.max(0, Math.min(255, Math.round((rgba[idx] - inv * 255) / denom)));
        rgba[idx + 1] = Math.max(0, Math.min(255, Math.round((rgba[idx + 1] - inv * 255) / denom)));
        rgba[idx + 2] = Math.max(0, Math.min(255, Math.round((rgba[idx + 2] - inv * 255) / denom)));
      }
    }

    if (rgba[idx + 3] > 32) {
      const x = i % width;
      const y = (i - x) / width;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }

  const cropW = Math.max(1, maxX - minX + 1);
  const cropH = Math.max(1, maxY - minY + 1);
  const pad = Math.round(Math.max(cropW, cropH) * 0.04);
  const left = Math.max(0, minX - pad);
  const top = Math.max(0, minY - pad);
  const right = Math.min(width - 1, maxX + pad);
  const bottom = Math.min(height - 1, maxY + pad);

  const infoOut = await sharp(Buffer.from(rgba), {
    raw: { width, height, channels: 4 },
  })
    .extract({
      left,
      top,
      width: right - left + 1,
      height: bottom - top + 1,
    })
    .resize(476, 476, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .extend({
      top: 18,
      bottom: 18,
      left: 18,
      right: 18,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .webp({ quality: 92, alphaQuality: 98, effort: 5 })
    .toFile(outPath);

  return infoOut.size;
}

async function processBackdrop(inPath, outPath) {
  const info = await sharp(inPath)
    .resize(1440, 810, { fit: "cover", position: "right" })
    .webp({ quality: 86, effort: 5 })
    .toFile(outPath);
  return info.size;
}

async function generateContactSheet(cardFiles) {
  const cols = 5;
  const rows = Math.ceil(cardFiles.length / cols);
  const cell = 180;
  const W = cols * cell;
  const H = rows * cell;

  for (const [mode, bg] of [
    ["dark", { r: 14, g: 21, b: 40, alpha: 1 }],
    ["light", { r: 236, g: 244, b: 255, alpha: 1 }],
  ]) {
    const composites = [];
    for (let i = 0; i < cardFiles.length; i++) {
      const f = cardFiles[i];
      const resized = await sharp(path.join(OUT_CARDS_DIR, f))
        .resize(cell - 24, cell - 24, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();
      composites.push({
        input: resized,
        left: (i % cols) * cell + 12,
        top: Math.floor(i / cols) * cell + 12,
      });
    }
    await sharp({
      create: { width: W, height: H, channels: 4, background: bg },
    })
      .composite(composites)
      .png()
      .toFile(path.join(QA_DIR, `qa-3d-sheet-${mode}.png`));
  }
}

async function main() {
  const rawCards = fs.readdirSync(RAW_CARDS_DIR).filter((f) => /\.(jpg|jpeg|png)$/i.test(f)).sort();
  const outCardNames = [];
  for (const file of rawCards) {
    const base = file.replace(/\.(jpg|jpeg|png)$/i, "");
    const outName = `${base}.webp`;
    const size = await process3DIcon(path.join(RAW_CARDS_DIR, file), path.join(OUT_CARDS_DIR, outName));
    outCardNames.push(outName);
    console.log(`  ✓ ${outName} (${(size / 1024).toFixed(1)} KB)`);
  }

  const rawBanners = fs.readdirSync(RAW_BANNERS_DIR).filter((f) => /\.(jpg|jpeg|png)$/i.test(f)).sort();
  for (const file of rawBanners) {
    const base = file.replace(/\.(jpg|jpeg|png)$/i, "");
    const outName = `${base}.webp`;
    const size = await processBackdrop(path.join(RAW_BANNERS_DIR, file), path.join(OUT_BANNERS_DIR, outName));
    console.log(`  ✓ ${outName} (${(size / 1024).toFixed(1)} KB)`);
  }

  await generateContactSheet(outCardNames);
  console.log("QA sheets updated!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
