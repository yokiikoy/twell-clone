/**
 * Batch DetailLog: infer mode from CP932 header, match twelljr jou / kata / kan / koto.
 *
 * Usage (cwd packages/engine for iconv-lite):
 *   node ../../scripts/dictionary/check-detail-log-mix-all-modes-batch.mjs <DetailLogDir> [--max N] [--out path]
 */
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import {
  inferGameModeFromCp932Buffer,
  loadTripleToDecksFromSpecs,
  parseWordsCp932,
  histogramForLogWords,
} from "./detail-log-jou-mix.mjs";

const dir = resolve(process.argv[2] ?? "");
let maxFiles = Infinity;
const maxArg = process.argv.indexOf("--max");
if (maxArg >= 0 && process.argv[maxArg + 1]) {
  maxFiles = Math.max(0, parseInt(process.argv[maxArg + 1], 10));
}
const outArg = process.argv.indexOf("--out");

if (!dir) {
  console.error(
    "Usage: node .../check-detail-log-mix-all-modes-batch.mjs <DetailLogDir> [--max N] [--out path]"
  );
  process.exit(1);
}

const root = resolve(import.meta.dirname, "../..");
const defaultOut = resolve(root, "logs/detail-log-mix-all-modes-report.txt");
const outPath =
  outArg >= 0 && process.argv[outArg + 1]
    ? resolve(process.argv[outArg + 1])
    : defaultOut;

mkdirSync(dirname(outPath), { recursive: true });

/** @param {number} deckCount */
function allDecksHit(trialDecks, deckCount) {
  for (let d = 1; d <= deckCount; d++) {
    if (!trialDecks.has(d)) return false;
  }
  return true;
}

function emptyModeAgg() {
  return {
    files: 0,
    readErrors: 0,
    totalLogWords: 0,
    totalUnknown: 0,
    totalAmbiguous: 0,
    filesAnyMatch: 0,
    filesAllDecks: 0,
    /** @type {Map<string, number>} */
    agg: new Map(),
  };
}

const modes = ["kihon", "katakana", "kanji", "kanyoku"];
/** @type {Record<string, ReturnType<typeof emptyModeAgg>>} */
const byMode = Object.fromEntries(modes.map((m) => [m, emptyModeAgg()]));
/** @type {Record<string, { deckCount: number; index: Map<string, Set<number>> }>} */
const modeConfig = {
  kihon: {
    deckCount: 3,
    index: loadTripleToDecksFromSpecs(root, [
      { file: "twelljr-jou1.json", deckId: 1 },
      { file: "twelljr-jou2.json", deckId: 2 },
      { file: "twelljr-jou3.json", deckId: 3 },
    ]),
  },
  katakana: {
    deckCount: 3,
    index: loadTripleToDecksFromSpecs(root, [
      { file: "twelljr-kata1.json", deckId: 1 },
      { file: "twelljr-kata2.json", deckId: 2 },
      { file: "twelljr-kata3.json", deckId: 3 },
    ]),
  },
  kanji: {
    deckCount: 3,
    index: loadTripleToDecksFromSpecs(root, [
      { file: "twelljr-kan1.json", deckId: 1 },
      { file: "twelljr-kan2.json", deckId: 2 },
      { file: "twelljr-kan3.json", deckId: 3 },
    ]),
  },
  kanyoku: {
    deckCount: 2,
    index: loadTripleToDecksFromSpecs(root, [
      { file: "twelljr-koto1.json", deckId: 1 },
      { file: "twelljr-koto2.json", deckId: 2 },
    ]),
  },
};

const allTxt = readdirSync(dir)
  .filter((n) => n.toLowerCase().endsWith(".txt"))
  .sort();
const files = allTxt.slice(0, maxFiles);
const progressEvery = Math.min(500, Math.max(50, Math.floor(files.length / 20)));

for (let fi = 0; fi < files.length; fi++) {
  const name = files[fi];
  if (progressEvery && fi > 0 && fi % progressEvery === 0) {
    process.stderr.write(`… ${fi}/${files.length} files\r`);
  }
  const path = join(dir, name);
  let buf;
  try {
    buf = readFileSync(path);
  } catch {
    continue;
  }
  const mode = inferGameModeFromCp932Buffer(buf);
  const st = byMode[mode];
  const { deckCount, index } = modeConfig[mode];
  st.files++;

  let logWords;
  try {
    logWords = parseWordsCp932(buf);
  } catch {
    st.readErrors++;
    continue;
  }
  const { unknown, ambiguous, comboCounts, trialDecks } = histogramForLogWords(
    logWords,
    index
  );
  st.totalUnknown += unknown;
  st.totalAmbiguous += ambiguous;
  st.totalLogWords += logWords.length;
  if (logWords.length > unknown) st.filesAnyMatch++;
  if (allDecksHit(trialDecks, deckCount)) st.filesAllDecks++;
  for (const [label, c] of comboCounts) {
    st.agg.set(label, (st.agg.get(label) ?? 0) + c);
  }
}

if (files.length) process.stderr.write(`… ${files.length}/${files.length} files\n`);

const lines = [];
const stamp = new Date().toISOString();
lines.push(`detail-log-mix-all-modes batch`);
lines.push(`generated: ${stamp}`);
lines.push(`DetailLog directory: ${dir}`);
lines.push(`.txt in dir: ${allTxt.length}, processed: ${files.length}`);
lines.push("");

for (const mode of modes) {
  const st = byMode[mode];
  const dc = modeConfig[mode].deckCount;
  lines.push(`=== ${mode} (expect ${dc} decks) ===`);
  lines.push(`files (by header): ${st.files}`);
  lines.push(`read/parse errors (attributed): ${st.readErrors}`);
  lines.push(`total dedup words: ${st.totalLogWords}`);
  lines.push(`unknown: ${st.totalUnknown}`);
  lines.push(`ambiguous: ${st.totalAmbiguous}`);
  lines.push(`files with any match: ${st.filesAnyMatch}`);
  lines.push(`files with all ${dc} decks hit: ${st.filesAllDecks}`);
  const n1 = st.agg.get("1") ?? 0;
  const n2 = st.agg.get("2") ?? 0;
  const n3 = st.agg.get("3") ?? 0;
  lines.push(
    dc === 3
      ? `single-deck 1/2/3: ${n1} / ${n2} / ${n3}`
      : `single-deck 1/2: ${n1} / ${n2}`
  );
  if (dc === 3) {
    const t = n1 + n2 + n3;
    if (t > 0) {
      lines.push(
        `ratio single-deck (1:2:3): ${(n1 / t).toFixed(3)} : ${(n2 / t).toFixed(3)} : ${(n3 / t).toFixed(3)}`
      );
    }
  } else {
    const t = n1 + n2;
    if (t > 0) {
      lines.push(`ratio single-deck (1:2): ${(n1 / t).toFixed(3)} : ${(n2 / t).toFixed(3)}`);
    }
  }
  lines.push(
    `histogram: ${JSON.stringify(Object.fromEntries([...st.agg.entries()].sort((a, b) => b[1] - a[1])))}`
  );
  lines.push("");
}

const text = lines.join("\n");
writeFileSync(outPath, text, "utf8");
process.stdout.write(text);
process.stdout.write(`\nWrote: ${outPath}\n`);
