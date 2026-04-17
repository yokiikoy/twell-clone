#!/usr/bin/env node
/**
 * After `twelljr-jou1.json` is built from Jou1.bas (ひらがな表層),
 * upgrade **表層を漢字**へできるだけ寄せる。
 *
 * 1. `Kan1`–`Kan3` の語で、`reading`（ハイフン除去・小文字）が一意に漢字表層へ対応するものを上書き。
 * 2. まだ表層に漢字が無い行は、Jisho 非公式 API で **ひらがな表層**を検索し、`reading` が一致し
 *    かつ「Usually written using kana alone」に該当しない候補のうちスコア最大の `word` を採用。
 *    結果は `jou-jisho-kanji-cache.json` に永続化する。
 *
 * 環境変数 `SKIP_JISHO_ENRICH=1` で (2) をスキップ（オフライン）。
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import iconv from "iconv-lite";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const webPublic = resolve(repoRoot, "apps/web/public/twelljr-jou1.json");
const jishoCachePath = resolve(
  repoRoot,
  "packages/engine/test-fixtures/jou-jisho-kanji-cache.json"
);

const KAN_FILES = [
  resolve(repoRoot, "twjrdecomp/Kan1.bas"),
  resolve(repoRoot, "twjrdecomp/Kan2.bas"),
  resolve(repoRoot, "twjrdecomp/Kan3.bas"),
];

function normReading(s) {
  return String(s).toLowerCase().replace(/-/g, "");
}

function isRomajiKeys(s) {
  return /^[a-z-]+$/.test(s);
}
function isInternalCode(s) {
  return /^[0-9a-zA-ZxXNjvutbdzV]+$/.test(s);
}
function hasJapanese(s) {
  return /[\u3040-\u30ff\u3400-\u9fff\uff66-\uff9f]/.test(s);
}
function hasKanji(s) {
  return /[\u4e00-\u9fff]/.test(s);
}

function normKey(s) {
  return String(s).normalize("NFC").trim();
}

function extractTriplesFlexible(lit) {
  const out = [];
  let i = 0;
  while (i < lit.length) {
    if (!hasJapanese(lit[i])) {
      i++;
      continue;
    }
    const start = i;
    const surface = lit[i++];
    const romajis = [];
    while (i < lit.length && isRomajiKeys(lit[i])) {
      romajis.push(lit[i++].toLowerCase());
    }
    if (i >= lit.length) break;
    if (romajis.length === 0 || !isInternalCode(lit[i])) {
      i = start + 1;
      continue;
    }
    const code = lit[i++];
    out.push({ surface, reading: romajis[0], code });
  }
  return out;
}

function litStringsFromBas(abs) {
  const buf = readFileSync(abs);
  const text = iconv.decode(buf, "cp932");
  const re = /LitStr "([^"]*)"/g;
  const strings = [];
  let m;
  while ((m = re.exec(text)) !== null) strings.push(m[1]);
  return strings;
}

/** norm(reading) -> Set of Kan surfaces that include at least one ideograph */
function buildKanjiSurfaceByNormReading() {
  const map = new Map();
  for (const bas of KAN_FILES) {
    let triples;
    try {
      if (!existsSync(bas)) continue;
      triples = extractTriplesFlexible(litStringsFromBas(bas));
    } catch {
      continue;
    }
    for (const { surface, reading } of triples) {
      if (!hasKanji(surface)) continue;
      const key = normReading(reading);
      if (!map.has(key)) map.set(key, new Set());
      map.get(key).add(surface);
    }
  }
  return map;
}

function loadJishoCache() {
  try {
    return JSON.parse(readFileSync(jishoCachePath, "utf8"));
  } catch {
    return {};
  }
}

function saveJishoCache(obj) {
  writeFileSync(jishoCachePath, JSON.stringify(obj, null, 2), "utf8");
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

const KANA_ALONE = "Usually written using kana alone";

function itemUsuallyKanaAlone(item) {
  return (item.senses ?? []).some((s) => (s.tags ?? []).includes(KANA_ALONE));
}

/**
 * @param {string} keyword — ひらがな表層（例: あいさつ）
 * @returns {string | null} 漢字表層、無ければ null（かな表のままが正しい場合も null）
 */
function scoreCandidatesFromJishoData(data, readingMatch) {
  const match = normKey(readingMatch);
  /** @type {{ word: string; score: number }[]} */
  const scored = [];
  for (const item of data ?? []) {
    const kanaAlone = itemUsuallyKanaAlone(item);
    for (const jp of item.japanese ?? []) {
      if (normKey(jp.reading) !== match) continue;
      const w = jp.word;
      if (!w || !hasKanji(w)) continue;
      if (kanaAlone) continue;
      let score = 0;
      if (item.is_common) score += 4;
      score += Math.min(6, w.length);
      scored.push({ word: w, score });
    }
  }
  if (scored.length === 0) return null;
  scored.sort((a, b) => b.score - a.score);
  return scored[0].word;
}

async function jishoJsonForKeyword(keyword) {
  const url = `https://jisho.org/api/v1/search/words?keyword=${encodeURIComponent(keyword)}`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent":
        "typewell-jr-clone/0.1 (local dev; jou1 surface enrich; respectful rate limit)",
    },
  });
  if (!res.ok) return null;
  return res.json();
}

/** @param {string} surfaceHira ひらがな表層 */
async function jishoPickKanjiSurface(surfaceHira) {
  const j = await jishoJsonForKeyword(surfaceHira);
  if (!j) return null;
  return scoreCandidatesFromJishoData(j.data, surfaceHira);
}

async function main() {
  const skipJisho = process.env.SKIP_JISHO_ENRICH === "1";
  const kanjiByReading = buildKanjiSurfaceByNormReading();
  const raw = JSON.parse(readFileSync(webPublic, "utf8"));
  let fromKan = 0;
  let ambiguousKan = 0;
  let fromJisho = 0;
  const jishoCache = loadJishoCache();

  const out = [];
  for (const row of raw) {
    let surface = row.surface;
    const key = normReading(row.reading);
    const set = kanjiByReading.get(key);
    if (set && set.size > 0) {
      const kanjiSurfaces = [...set].filter(hasKanji);
      if (kanjiSurfaces.length === 1) {
        surface = kanjiSurfaces[0];
        fromKan++;
      } else if (kanjiSurfaces.length > 1) {
        ambiguousKan++;
      }
    }

    if (!hasKanji(surface) && !skipJisho) {
      const q = row.surface;
      if (!(q in jishoCache)) {
        try {
          jishoCache[q] = (await jishoPickKanjiSurface(q)) ?? "";
        } catch {
          jishoCache[q] = "";
        }
        await sleep(120);
      }
      const hit = jishoCache[q];
      if (hit && hasKanji(hit)) {
        surface = hit;
        fromJisho++;
      }
    }

    out.push({ ...row, surface });
  }

  if (!skipJisho) {
    saveJishoCache(jishoCache);
  }
  writeFileSync(webPublic, JSON.stringify(out, null, 2), "utf8");
  console.error(
    `enrich-jou1: wrote ${webPublic} (from Kan*.bas: ${fromKan}, ambiguous Kan reading: ${ambiguousKan}, from Jisho: ${fromJisho}, skipJisho=${skipJisho})`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
