#!/usr/bin/env tsx
/**
 * `twjrdecomp/Jou*.bas` … `Koto*.bas` から語 triple をすべて抽出し、
 * `wordlists-from-decomp/{envelope,web-array}/` に書き出す（本家バイナリのデコンパイル由来データ）。
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { extractTriplesFlexible, toEnvelope } from "../src/twelljr/extractBasTriples.ts";
import { readBasLitStrings } from "../src/twelljr/readBasLitStrings.ts";

const STEMS = [
  "Jou1",
  "Jou2",
  "Jou3",
  "Kan1",
  "Kan2",
  "Kan3",
  "Kata1",
  "Kata2",
  "Kata3",
  "Koto1",
  "Koto2",
] as const;

const here = dirname(fileURLToPath(import.meta.url));
const engineRoot = resolve(here, "..");
const repoRoot = resolve(engineRoot, "../..");
const outRoot = join(engineRoot, "wordlists-from-decomp");
const nextPublic = join(repoRoot, "apps/web/public");

/** `Jou1` → `twelljr-jou1.json` */
function publicJsonName(stem: string): string {
  const slug = stem.charAt(0).toLowerCase() + stem.slice(1);
  return `twelljr-${slug}.json`;
}

function main() {
  const envDir = join(outRoot, "envelope");
  const webDir = join(outRoot, "web-array");
  mkdirSync(envDir, { recursive: true });
  mkdirSync(webDir, { recursive: true });
  mkdirSync(nextPublic, { recursive: true });

  for (const stem of STEMS) {
    const basAbs = join(repoRoot, "twjrdecomp", `${stem}.bas`);
    const relSource = `twjrdecomp/${stem}.bas`;
    const strings = readBasLitStrings(basAbs);
    const triples = extractTriplesFlexible(strings);
    const envelope = toEnvelope(relSource, triples);
    writeFileSync(
      join(envDir, `${stem}.json`),
      JSON.stringify(envelope, null, 2),
      "utf8"
    );
    const rows = triples.map((t, index) => ({
      surface: t.surface,
      reading: t.reading,
      code: t.code,
      index,
    }));
    const webBody = JSON.stringify(rows, null, 2);
    writeFileSync(join(webDir, `${stem}.json`), webBody, "utf8");
    writeFileSync(join(nextPublic, publicJsonName(stem)), webBody, "utf8");
    console.error(`${stem}: ${triples.length} triples`);
  }
  console.error(`Done → ${outRoot} + ${nextPublic}`);
}

main();
