#!/usr/bin/env tsx
/**
 * Read JSONL (one object per line: surface, reading, optional mode),
 * append mozc_min_strokes using `jouTriplesToWordEntries` + `mozcMinStrokesForHiraganaLine`.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { GameMode } from "../src/types.js";
import { mozcMinStrokesForTriple } from "../src/cleanroom/joinStrokes.js";

const here = fileURLToPath(new URL(".", import.meta.url));

const GAME_MODES: readonly GameMode[] = ["kihon", "katakana", "kanji", "kanyoku"];

function parseArgs() {
  const argv = process.argv.slice(2);
  let input = "";
  let output = "";
  let modeOverride: GameMode | undefined;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--input" && argv[i + 1]) input = argv[++i]!;
    else if (argv[i] === "--output" && argv[i + 1]) output = argv[++i]!;
    else if (argv[i] === "--mode" && argv[i + 1]) {
      const m = argv[++i]! as GameMode;
      if (!GAME_MODES.includes(m)) {
        console.error(`--mode must be one of: ${GAME_MODES.join(", ")}`);
        process.exit(1);
      }
      modeOverride = m;
    }
  }
  if (!input || !output) {
    console.error(
      "Usage: tsx scripts/cleanroom-join-strokes.ts --input master.jsonl --output master_strokes.jsonl [--mode kihon|katakana|kanji|kanyoku]"
    );
    process.exit(1);
  }
  return {
    input: resolve(here, "..", input),
    output: resolve(here, "..", output),
    modeOverride,
  };
}

function strokeForRow(row: {
  surface: string;
  reading: string;
  mode?: GameMode;
}): number | null {
  const mode: GameMode = row.mode ?? "kihon";
  try {
    return mozcMinStrokesForTriple(row.surface, row.reading, mode);
  } catch {
    // Rare surfaces (e.g. iteration mark ゝ) can make emiel refuse the kana line; export treats null as "no stroke filter".
    return null;
  }
}

function main() {
  const { input, output, modeOverride } = parseArgs();
  const text = readFileSync(input, "utf8");
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const out: string[] = [];
  for (const line of lines) {
    const row = JSON.parse(line) as Record<string, unknown>;
    const mode: GameMode =
      modeOverride ?? (row.mode as GameMode | undefined) ?? "kihon";
    const mozc = strokeForRow({
      surface: String(row.surface ?? ""),
      reading: String(row.reading ?? ""),
      mode,
    });
    out.push(JSON.stringify({ ...row, mode, mozc_min_strokes: mozc }));
  }
  writeFileSync(output, out.join("\n") + "\n", "utf8");
}

main();
