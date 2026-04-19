/**
 * emiel npm tarball ships broken valibot imports (pnpm-only relative paths).
 * Rewrite every matching import in emiel/dist to bare "valibot".
 */
import { readdirSync, readFileSync, statSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const roots = [
  join(here, "..", "node_modules", "emiel"),
  join(here, "..", "..", "..", "node_modules", "emiel"),
];
const emielRoot = roots.find((p) => existsSync(p));
if (!emielRoot) {
  console.warn("patch-emiel-valibot: skip (emiel not installed)");
  process.exit(0);
}

const badRe =
  /from\s+["']\.\.\/node_modules\/\.pnpm\/valibot@[^"']+["']\s*;/g;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (p.endsWith(".js")) out.push(p);
  }
  return out;
}

const dist = join(emielRoot, "dist");
if (!existsSync(dist)) {
  console.warn("patch-emiel-valibot: skip (no dist)");
  process.exit(0);
}

let n = 0;
for (const file of walk(dist)) {
  let s = readFileSync(file, "utf8");
  if (!s.includes(".pnpm/valibot@")) continue;
  s = s.replace(badRe, 'from "valibot";');
  writeFileSync(file, s, "utf8");
  n++;
}
if (n) console.log(`patch-emiel-valibot: patched ${n} files under ${dist}`);
