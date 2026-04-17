/**
 * Aggregate DetailLog *.txt in a directory vs twelljr-jou{1,2,3}.json (surface+reading).
 *
 * Usage (cwd packages/engine for iconv-lite):
 *   node ../../scripts/dictionary/check-jou-mix-batch-detail-logs.mjs <DetailLogDir> [--max N]
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import {
  loadTripleToDecks,
  parseWordsCp932,
  histogramForLogWords,
} from "./detail-log-jou-mix.mjs";

const dir = resolve(process.argv[2] ?? "");
let maxFiles = Infinity;
const maxArg = process.argv.indexOf("--max");
if (maxArg >= 0 && process.argv[maxArg + 1]) {
  maxFiles = Math.max(0, parseInt(process.argv[maxArg + 1], 10));
}

if (!dir) {
  console.error(
    "Usage: node .../check-jou-mix-batch-detail-logs.mjs <DetailLogDir> [--max N]"
  );
  process.exit(1);
}

const root = resolve(import.meta.dirname, "../..");
const tripleToDecks = loadTripleToDecks(root);

const allTxt = readdirSync(dir)
  .filter((n) => n.toLowerCase().endsWith(".txt"))
  .sort();
const files = allTxt.slice(0, maxFiles);

/** @type {Map<string, number>} */
const agg = new Map();
let totalUnknown = 0;
let totalAmbiguousWordLines = 0;
let totalLogWords = 0;
let filesWith123 = 0;
let filesAnyMatch = 0;
let readErrors = 0;
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
    readErrors++;
    continue;
  }
  let logWords;
  try {
    logWords = parseWordsCp932(buf);
  } catch {
    readErrors++;
    continue;
  }
  const { unknown, ambiguous, comboCounts, trialDecks } = histogramForLogWords(
    logWords,
    tripleToDecks
  );
  totalUnknown += unknown;
  totalAmbiguousWordLines += ambiguous;
  totalLogWords += logWords.length;
  if (logWords.length > unknown) filesAnyMatch++;
  if (trialDecks.has(1) && trialDecks.has(2) && trialDecks.has(3)) filesWith123++;
  for (const [label, c] of comboCounts) {
    agg.set(label, (agg.get(label) ?? 0) + c);
  }
}

if (files.length) process.stderr.write(`… ${files.length}/${files.length} files\n`);

const n1 = agg.get("1") ?? 0;
const n2 = agg.get("2") ?? 0;
const n3 = agg.get("3") ?? 0;
const none = agg.get("none") ?? 0;
const singleDeckMatched = n1 + n2 + n3;
const matchedAllLabels = [...agg.entries()]
  .filter(([k]) => k !== "none")
  .reduce((s, [, v]) => s + v, 0);

console.log("DetailLog directory:", dir);
console.log(".txt files in dir:", allTxt.length);
console.log("processed (after --max):", files.length);
console.log("read/parse errors:", readErrors);
console.log("files with any JSON triple match:", filesAnyMatch);
console.log("files with hits on deck 1 AND 2 AND 3:", filesWith123);
console.log("— aggregate over all processed files —");
console.log("total dedup words (surface+reading):", totalLogWords);
console.log("unknown (no triple):", totalUnknown);
console.log("ambiguous (triple in >1 deck, word lines):", totalAmbiguousWordLines);
console.log("single-deck match counts 1 / 2 / 3:", n1, "/", n2, "/", n3);
if (singleDeckMatched > 0) {
  const t = singleDeckMatched;
  console.log("ratio among single-deck matches (1:2:3):", [
    (n1 / t).toFixed(3),
    (n2 / t).toFixed(3),
    (n3 / t).toFixed(3),
  ].join(" : "));
}
console.log("matched (any label except none):", matchedAllLabels);
console.log("full histogram (label -> count):");
console.log(
  Object.fromEntries([...agg.entries()].sort((a, b) => b[1] - a[1]))
);
