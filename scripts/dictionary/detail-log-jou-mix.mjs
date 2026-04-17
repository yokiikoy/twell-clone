/**
 * Shared helpers: CP932 DetailLog word parse + wordlist (surface, reading) index.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import iconv from "iconv-lite";

/** @typedef {"kihon" | "katakana" | "kanji" | "kanyoku"} GameMode */

const DETAIL_LINE =
  /^(?<key>.?)\s+(?<time>\d+)\s+(?<loss>\d+)\s*(?<word>[^\r\n]*)$/;

export function parseWordsCp932(buf) {
  const text = iconv.decode(buf, "cp932");
  const lines = text.split(/\r?\n/);
  let i = 0;
  if (lines[0]?.trim() && !lines[0].includes("Time")) i = 1;
  if (lines[i]?.includes("Time")) i += 1;
  const words = [];
  let readingChars = [];
  let currentSurface = null;
  const flush = () => {
    if (!currentSurface) return;
    const reading = readingChars.join("").toLowerCase();
    readingChars = [];
    if (reading.length > 0) words.push({ surface: currentSurface, reading });
    currentSurface = null;
  };
  for (; i < lines.length; i++) {
    const raw = lines[i];
    if (!raw?.trim()) continue;
    const m = raw.match(DETAIL_LINE);
    if (!m?.groups) continue;
    const key = (m.groups.key ?? "").trim();
    const wordCol = (m.groups.word ?? "").trim();
    if (wordCol) {
      flush();
      currentSurface = wordCol;
    }
    if (key && /^[a-zA-Z-]$/.test(key)) readingChars.push(key.toLowerCase());
  }
  flush();
  const dedup = new Map();
  for (const w of words) dedup.set(`${w.surface}\0${w.reading}`, w);
  return [...dedup.values()];
}

function buildIndex(rows, deckId, map) {
  for (const r of rows) {
    const k = `${r.surface}\0${r.reading}`;
    if (!map.has(k)) map.set(k, new Set());
    map.get(k).add(deckId);
  }
}

/**
 * @param {string} root repo root (parent of apps/web/public)
 * @param {{ file: string; deckId: number }[]} specs
 * @returns {Map<string, Set<number>>}
 */
export function loadTripleToDecksFromSpecs(root, specs) {
  const load = (name) =>
    JSON.parse(readFileSync(resolve(root, "apps/web/public", name), "utf8"));
  /** @type {Map<string, Set<number>>} */
  const tripleToDecks = new Map();
  for (const { file, deckId } of specs) {
    buildIndex(load(file), deckId, tripleToDecks);
  }
  return tripleToDecks;
}

/** @returns {Map<string, Set<number>>} */
export function loadTripleToDecks(root) {
  return loadTripleToDecksFromSpecs(root, [
    { file: "twelljr-jou1.json", deckId: 1 },
    { file: "twelljr-jou2.json", deckId: 2 },
    { file: "twelljr-jou3.json", deckId: 3 },
  ]);
}

/**
 * First meaningful line of CP932 buffer → game mode (matches engine detailLogParse).
 * @param {Buffer} buf
 * @returns {GameMode}
 */
export function inferGameModeFromCp932Buffer(buf) {
  const text = iconv.decode(buf, "cp932");
  const lines = text.split(/\r?\n/);
  const line0 =
    lines[0]?.trim() && !lines[0].includes("Time") ? lines[0] : "";
  if (line0.includes("基本常用語")) return "kihon";
  if (line0.includes("カタカナ")) return "katakana";
  if (line0.includes("漢字")) return "kanji";
  if (line0.includes("慣用") || line0.includes("ことわざ")) return "kanyoku";
  return "kihon";
}

/**
 * @param {{ surface: string; reading: string }[]} logWords
 * @param {Map<string, Set<number>>} tripleToDecks
 */
export function histogramForLogWords(logWords, tripleToDecks) {
  let unknown = 0;
  let ambiguous = 0;
  /** @type {Map<string, number>} */
  const comboCounts = new Map();
  const trialDecks = new Set();
  for (const w of logWords) {
    const k = `${w.surface}\0${w.reading}`;
    const ds = tripleToDecks.get(k) ?? new Set();
    if (ds.size === 0) unknown++;
    if (ds.size > 1) ambiguous++;
    const label = [...ds].sort((a, b) => a - b).join("+") || "none";
    comboCounts.set(label, (comboCounts.get(label) ?? 0) + 1);
    for (const d of ds) trialDecks.add(d);
  }
  return { unknown, ambiguous, comboCounts, trialDecks };
}
