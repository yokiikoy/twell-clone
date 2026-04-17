/**
 * LitStr 列から (日本語表層)(ローマ字 1+)(内部コード) を復元する。
 * VB デコンパイル `*.bas`（CP932）向け。Phase B 共通ロジック。
 */

export const EXTRACT_BAS_TRIPLES_SCHEMA_VERSION = 1 as const;

export interface BasTriple {
  surface: string;
  reading: string;
  code: string;
}

export function isRomajiKeys(s: string): boolean {
  return /^[a-z-]+$/.test(s);
}

export function isInternalCode(s: string): boolean {
  return /^[0-9a-zA-ZxXNjvutbdzV]+$/.test(s);
}

export function hasJapaneseSurface(s: string): boolean {
  return /[\u3040-\u30ff\u3400-\u9fff\uff66-\uff9f]/.test(s);
}

/**
 * `LitStr` の値だけの配列（出現順）から triple を抽出。
 * `reading` は VB 側の先頭ローマ字列（表記揺れの先頭）。
 */
export function extractTriplesFlexible(lit: readonly string[]): BasTriple[] {
  const out: BasTriple[] = [];
  let i = 0;
  while (i < lit.length) {
    if (!hasJapaneseSurface(lit[i]!)) {
      i++;
      continue;
    }
    const start = i;
    const surface = lit[i++]!;
    const romajis: string[] = [];
    while (i < lit.length && isRomajiKeys(lit[i]!)) {
      romajis.push(lit[i]!.toLowerCase());
      i++;
    }
    if (i >= lit.length) break;
    if (romajis.length === 0 || !isInternalCode(lit[i]!)) {
      i = start + 1;
      continue;
    }
    const code = lit[i++]!;
    out.push({
      surface,
      reading: romajis[0]!,
      code,
    });
  }
  return out;
}

export interface BasTriplesEnvelope {
  schemaVersion: typeof EXTRACT_BAS_TRIPLES_SCHEMA_VERSION;
  source: string;
  count: number;
  triples: Array<BasTriple & { index: number }>;
}

export function toEnvelope(
  source: string,
  triples: BasTriple[]
): BasTriplesEnvelope {
  const withIndex = triples.map((t, index) => ({ ...t, index }));
  return {
    schemaVersion: EXTRACT_BAS_TRIPLES_SCHEMA_VERSION,
    source,
    count: withIndex.length,
    triples: withIndex,
  };
}
