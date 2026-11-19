import { attachCorrelationId, checkApiRateLimit } from "../../lib/api/security-guard";

const MEMORY_CACHE = new Map();
const MAX_CACHE_ENTRIES = 1500;

export default async function handler(req, res) {
  const correlationId = attachCorrelationId(req, res);

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method not allowed", correlationId });
  }

  const rate = checkApiRateLimit(req, res, {
    keyPrefix: "translate_sentence",
    maxRequests: 90,
    correlationId,
  });
  if (!rate.allowed) return;

  const { text } = req.query || {};
  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "Text parameter is required", correlationId });
  }

  const cleanText = text.trim().replace(/\s+/g, " ").slice(0, 650);
  if (!cleanText) {
    return res.status(400).json({ error: "Empty text", correlationId });
  }

  res.setHeader("Cache-Control", "public, s-maxage=604800, stale-while-revalidate=2592000");

  if (MEMORY_CACHE.has(cleanText)) {
    return res.status(200).json({
      success: true,
      translationVi: MEMORY_CACHE.get(cleanText),
      cached: true,
    });
  }

  try {
    const gtxUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(
      cleanText
    )}`;
    const gtxRes = await fetch(gtxUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
      signal: AbortSignal.timeout(4000),
    });

    let translationVi = "";
    if (gtxRes.ok) {
      const gtxData = await gtxRes.json();
      if (Array.isArray(gtxData) && Array.isArray(gtxData[0])) {
        translationVi = gtxData[0]
          .map((seg) => (Array.isArray(seg) && seg[0] ? seg[0] : ""))
          .join("")
          .trim();
      }
    }

    if (translationVi) {
      if (MEMORY_CACHE.size >= MAX_CACHE_ENTRIES) {
        const firstKey = MEMORY_CACHE.keys().next().value;
        MEMORY_CACHE.delete(firstKey);
      }
      MEMORY_CACHE.set(cleanText, translationVi);
    }

    return res.status(200).json({
      success: true,
      translationVi,
    });
  } catch (err) {
    return res.status(200).json({
      success: false,
      translationVi: "",
    });
  }
}
