#!/usr/bin/env tsx
/**
 * Phase B — generic LitStr triple extractor for any `twjrdecomp/*.bas`.
 *
 * Run from `packages/engine`: `npx tsx scripts/extract-bas-triples.ts ../../twjrdecomp/Jou2.bas 200`
 * 第2引数 `0` = 件数上限なし（`.bas` から取れる triple をすべて）
 *
 * Flags:
 *   --out <path>       Envelope JSON（schemaVersion / source / triples）。省略時は `test-fixtures/extracted-<BasStem>.json`
 *   --write-web <path> **配列のみ**（`apps/web` の既存ローダ互換）。`--out` 省略時も既定パスへ envelope は常に書き出す
 */
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import {
  extractTriplesFlexible,
  toEnvelope,
  type BasTriple,
} from "../src/twelljr/extractBasTriples.ts";
import { readBasLitStrings } from "../src/twelljr/readBasLitStrings.ts";

const here = dirname(fileURLToPath(import.meta.url));
const engineRoot = resolve(here, "..");
const repoDefaultBas = resolve(engineRoot, "../../twjrdecomp/Jou1.bas");

function parseArgs(argv: string[]) {
  let outPath: string | null = null;
  let writeWebPath: string | null = null;
  const rest: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--out" && argv[i + 1]) {
      outPath = resolve(process.cwd(), argv[++i]!);
      continue;
    }
    if (argv[i] === "--write-web" && argv[i + 1]) {
      writeWebPath = resolve(process.cwd(), argv[++i]!);
      continue;
    }
    rest.push(argv[i]!);
  }
  const basPath = resolve(process.cwd(), rest[0] ?? repoDefaultBas);
  const limitArg = rest[1] ?? "500";
  const parsed = Number(limitArg);
  const maxTriples = limitArg === "0" ? 0 : parsed || 500;
  return { basPath, maxTriples, outPath, writeWebPath };
}

function defaultOutPath(basAbs: string): string {
  const stem = basename(basAbs, ".bas");
  const dir = resolve(engineRoot, "test-fixtures");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return resolve(dir, `extracted-${stem}.json`);
}

function main() {
  const { basPath, maxTriples, outPath, writeWebPath } = parseArgs(
    process.argv.slice(2)
  );
  const strings = readBasLitStrings(basPath);
  const all = extractTriplesFlexible(strings);
  const triples: BasTriple[] =
    maxTriples === 0 ? all : all.slice(0, maxTriples);

  if (writeWebPath) {
    const rows = triples.map((t, index) => ({
      surface: t.surface,
      reading: t.reading,
      code: t.code,
      index,
    }));
    writeFileSync(writeWebPath, JSON.stringify(rows, null, 2), "utf8");
    console.error(`Wrote ${rows.length} rows (web array) to ${writeWebPath}`);
  }

  const envelopePath = outPath ?? defaultOutPath(basPath);
  const envelope = toEnvelope(basPath, triples);
  writeFileSync(envelopePath, JSON.stringify(envelope, null, 2), "utf8");
  console.error(
    `Wrote envelope (${envelope.count} triples) to ${envelopePath}`
  );
}

main();
