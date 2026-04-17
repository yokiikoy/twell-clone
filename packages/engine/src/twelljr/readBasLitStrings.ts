import { readFileSync } from "node:fs";
import iconv from "iconv-lite";

/** `twjrdecomp/*.bas` を CP932 として読み、`LitStr "..."` の値だけを出現順に返す。 */
export function readBasLitStrings(absBasPath: string): string[] {
  const buf = readFileSync(absBasPath);
  const text = iconv.decode(buf, "cp932");
  const re = /LitStr "([^"]*)"/g;
  const strings: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    strings.push(m[1]!);
  }
  return strings;
}
