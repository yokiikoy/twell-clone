import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { GameMode } from "@typewell-jr/engine";
import { parseDetailLogText } from "@typewell-jr/engine";

function main() {
  const argv = process.argv.slice(2);
  const modeIdx = argv.indexOf("--mode");
  let defaultMode: GameMode = "kihon";
  const files = argv.filter((a, i) => {
    if (a === "--mode") return false;
    if (argv[i - 1] === "--mode") return false;
    return true;
  });
  if (modeIdx >= 0 && argv[modeIdx + 1]) {
    defaultMode = argv[modeIdx + 1] as GameMode;
  }
  if (files.length < 1) {
    console.error(
      "Usage: npx tsx scripts/dictionary/parse-detail-log.ts <log.txt> [--mode kihon|kanji|katakana|kanyoku]"
    );
    process.exit(1);
  }
  const file = resolve(files[0]!);
  const text = readFileSync(file, "utf8");
  const json = parseDetailLogText(text, defaultMode);
  process.stdout.write(JSON.stringify(json, null, 2) + "\n");
}

main();
