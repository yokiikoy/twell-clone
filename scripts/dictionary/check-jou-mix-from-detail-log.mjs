/**
 * One-off: cross-check a CP932 DetailLog vs twelljr-jou{1,2,3}.json (surface+reading).
 * Usage: node scripts/dictionary/check-jou-mix-from-detail-log.mjs <path-to-DetailLog.txt>
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  loadTripleToDecks,
  parseWordsCp932,
  histogramForLogWords,
} from "./detail-log-jou-mix.mjs";

const logPath = resolve(process.argv[2] ?? "");
if (!logPath) {
  console.error("Usage: node .../check-jou-mix-from-detail-log.mjs <DetailLog.txt>");
  process.exit(1);
}

const root = resolve(import.meta.dirname, "../..");
const tripleToDecks = loadTripleToDecks(root);

const buf = readFileSync(logPath);
const logWords = parseWordsCp932(buf);
const { unknown, ambiguous, comboCounts, trialDecks } = histogramForLogWords(
  logWords,
  tripleToDecks
);

console.log("DetailLog path:", logPath);
console.log("Words in log (dedup surface+reading):", logWords.length);
console.log("unknown (no exact triple in Jou1–3 JSON):", unknown);
console.log("ambiguous (same surface+reading in multiple decks):", ambiguous);
console.log("distinct decks hit in this file:", [...trialDecks].sort().join(", ") || "(none)");
console.log("histogram (deck combo -> word count):");
console.log(
  Object.fromEntries([...comboCounts.entries()].sort((a, b) => b[1] - a[1]))
);
