#!/usr/bin/env node
/**
 * Layer 3 Visual Upgrade Script (from TOEIC_1000_Flashcard_Web_Integration_Spec.md):
 * Replaces the 48 shared topic-level Unsplash placeholders with 1,000 unique,
 * scene-matched photos from Pexels API (or Pixabay API), then regenerates
 * public/data/toeic-flashcards/* and updates Supabase `toeic_flashcards`.
 *
 * Usage:
 *   PEXELS_API_KEY=your_key node scripts/toeic/sync-pexels-images.mjs
 *   # or
 *   PIXABAY_API_KEY=your_key node scripts/toeic/sync-pexels-images.mjs
 */
import fs from "node:fs";
import path from "node:path";

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY;

if (!PEXELS_API_KEY && !PIXABAY_API_KEY) {
  console.error("Missing PEXELS_API_KEY or PIXABAY_API_KEY environment variable.");
  process.exit(1);
}

const ROOT = process.cwd();
const litePath = path.join(ROOT, "data", "toeic", "flashcards_lite.json");
const db = JSON.parse(fs.readFileSync(litePath, "utf8"));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let updated = 0;

for (const card of db.flashcards) {
  try {
    if (PEXELS_API_KEY && card.visual_media?.pexels_search_endpoint) {
      const res = await fetch(card.visual_media.pexels_search_endpoint, {
        headers: { Authorization: PEXELS_API_KEY },
      });
      if (res.ok) {
        const data = await res.json();
        const url = data?.photos?.[0]?.src?.medium;
        if (url) {
          card.visual_media.cdn_thumbnail_url = url;
          updated += 1;
        }
      }
      await sleep(180);
    } else if (PIXABAY_API_KEY && card.visual_media?.pixabay_search_endpoint) {
      const res = await fetch(`${card.visual_media.pixabay_search_endpoint}&key=${encodeURIComponent(PIXABAY_API_KEY)}`);
      if (res.ok) {
        const data = await res.json();
        const url = data?.hits?.[0]?.webformatURL;
        if (url) {
          card.visual_media.cdn_thumbnail_url = url;
          updated += 1;
        }
      }
      await sleep(180);
    }
  } catch (err) {
    console.warn(`Skip #${card.id} (${card.word}):`, err.message);
  }
}

fs.writeFileSync(litePath, JSON.stringify(db));
console.log(`Updated ${updated}/${db.flashcards.length} unique flashcard images. Run prepare-flashcard-corpus.mjs & seed-toeic-flashcards.mjs next.`);
