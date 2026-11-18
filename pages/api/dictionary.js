import { attachCorrelationId, checkApiRateLimit } from "../../lib/api/security-guard";

export default async function handler(req, res) {
  const correlationId = attachCorrelationId(req, res);

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method not allowed", correlationId });
  }

  const rate = checkApiRateLimit(req, res, { keyPrefix: "dictionary", maxRequests: 60, correlationId });
  if (!rate.allowed) return;

  const { word } = req.query || {};

  if (!word || typeof word !== "string") {
    return res.status(400).json({ error: "Word parameter is required", correlationId });
  }

  // Clean word: remove surrounding non-letters, trim, bound length to prevent abuse
  const cleanWord = word
    .trim()
    .replace(/^[^a-zA-Z0-9-]+|[^a-zA-Z0-9-]+$/g, "")
    .toLowerCase()
    .slice(0, 64);

  if (!cleanWord) {
    return res.status(400).json({ error: "Invalid word format", correlationId });
  }

  res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=604800");

  try {
    // 1. Fetch from Google Translate GTX for Vietnamese translation & parts of speech
    const gtxUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&dt=bd&q=${encodeURIComponent(cleanWord)}`;
    
    // 2. Fetch from Free Dictionary API for IPA phonetics, native audio mp3, definitions
    const dictUrl = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`;

    const [gtxRes, dictRes] = await Promise.allSettled([
      fetch(gtxUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        signal: AbortSignal.timeout(4000)
      }),
      fetch(dictUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        signal: AbortSignal.timeout(4000)
      })
    ]);

    let vietnamese = '';
    let detailedMeanings = [];
    let phonetic = '';
    let audioUrl = '';
    let partOfSpeech = '';
    let englishDefinition = '';
    let examples = [];

    // Parse GTX response
    if (gtxRes.status === 'fulfilled' && gtxRes.value.ok) {
      try {
        const gtxData = await gtxRes.value.json();
        if (Array.isArray(gtxData) && gtxData[0] && gtxData[0][0]) {
          vietnamese = gtxData[0][0][0] || '';
        }
        if (Array.isArray(gtxData) && gtxData[1]) {
          detailedMeanings = gtxData[1].map(item => ({
            pos: item[0], // e.g. 'noun', 'verb'
            meanings: (item[1] || []).slice(0, 4)
          }));
        }
      } catch (e) {
        console.error('Error parsing GTX data:', e);
      }
    }

    // Parse Free Dictionary response
    if (dictRes.status === 'fulfilled' && dictRes.value.ok) {
      try {
        const dictData = await dictRes.value.json();
        if (Array.isArray(dictData) && dictData.length > 0) {
          const entry = dictData[0];
          phonetic = entry.phonetic || '';

          // Look for phonetics text & audio
          if (Array.isArray(entry.phonetics)) {
            for (const p of entry.phonetics) {
              if (!phonetic && p.text) phonetic = p.text;
              if (!audioUrl && p.audio) {
                // Ensure audio url starts with http
                audioUrl = p.audio.startsWith('//') ? 'https:' + p.audio : p.audio;
              }
            }
          }

          // Meanings
          if (Array.isArray(entry.meanings) && entry.meanings.length > 0) {
            const firstMeaning = entry.meanings[0];
            if (!partOfSpeech) partOfSpeech = firstMeaning.partOfSpeech || '';
            if (Array.isArray(firstMeaning.definitions) && firstMeaning.definitions.length > 0) {
              englishDefinition = firstMeaning.definitions[0].definition || '';
              if (firstMeaning.definitions[0].example) {
                examples.push(firstMeaning.definitions[0].example);
              }
            }
          }
        }
      } catch (e) {
        console.error('Error parsing Dict data:', e);
      }
    }

    // Fallback: If GTX returned identical English word or empty, try detailedMeanings -> MyMemory EN->VI -> core map
    const CORE_EN_VI_FALLBACK = {
      people: 'người, con người, dân tộc',
      homework: 'bài tập về nhà',
      already: 'đã, rồi',
      study: 'học tập, nghiên cứu',
      grammar: 'ngữ pháp',
      sentence: 'câu',
      example: 'ví dụ',
      usually: 'thường xuyên',
      seldom: 'hiếm khi',
    };

    if (!vietnamese || vietnamese.trim().toLowerCase() === cleanWord) {
      const dmVi = detailedMeanings
        .flatMap((d) => d.meanings || [])
        .find((m) => m && String(m).trim().toLowerCase() !== cleanWord);
      if (dmVi) {
        vietnamese = dmVi;
      } else {
        try {
          const mmRes = await fetch(
            `https://api.mymemory.translated.net/get?q=${encodeURIComponent(cleanWord)}&langpair=en|vi`,
            { signal: AbortSignal.timeout(3000) }
          );
          if (mmRes.ok) {
            const mmJson = await mmRes.json();
            const translated = String(mmJson?.responseData?.translatedText || '').trim();
            if (translated && translated.toLowerCase() !== cleanWord) {
              vietnamese = translated;
            }
          }
        } catch {}
      }
    }

    if (!vietnamese || vietnamese.trim().toLowerCase() === cleanWord) {
      vietnamese = CORE_EN_VI_FALLBACK[cleanWord] || englishDefinition || cleanWord;
    }

    // Fallback part of speech if empty but detailedMeanings exists
    if (!partOfSpeech && detailedMeanings.length > 0) {
      partOfSpeech = detailedMeanings[0].pos;
    }

    // Fallback phonetic if empty
    if (!phonetic) {
      phonetic = `/${cleanWord}/`;
    }

    // Return aggregated result
    return res.status(200).json({
      word: cleanWord,
      originalWord: word,
      phonetic,
      vietnamese: vietnamese || cleanWord,
      partOfSpeech: partOfSpeech || 'word',
      detailedMeanings,
      audioUrl: audioUrl || null,
      englishDefinition,
      examples,
      source: 'Dictionary API + Google Translate'
    });
  } catch (err) {
    console.error('Dictionary API error:', err);
    return res.status(500).json({
      error: 'Failed to look up word',
      word: cleanWord,
      phonetic: `/${cleanWord}/`,
      vietnamese: cleanWord
    });
  }
}
