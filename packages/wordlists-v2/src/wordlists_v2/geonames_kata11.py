"""Optional: extract katakana-only place names from GeoNames cities15000.txt."""

from __future__ import annotations

from pathlib import Path

from wordlists_v2.gates import is_katakana_continuous_surface


def run_geonames_katakana_places_tsv(
    cities15000_txt: Path,
    out_tsv: Path,
    *,
    max_rows: int = 10_000,
) -> int:
    """Write surface<TAB> (empty reading) for katakana strings from name, asciiname, alternatenames.

    GeoNames cities15000 is CC-licensed with attribution; see
    https://www.geonames.org/
    """
    if not cities15000_txt.is_file():
        return 0

    n = 0
    out_tsv.parent.mkdir(parents=True, exist_ok=True)
    with cities15000_txt.open(encoding="utf-8", errors="replace") as fin, out_tsv.open(
        "w", encoding="utf-8"
    ) as fout:
        for line in fin:
            if n >= max_rows:
                break
            parts = line.rstrip("\n").split("\t")
            if len(parts) < 4:
                continue
            candidates: list[str] = []
            for raw in (parts[1], parts[2]):
                t = raw.strip()
                if t:
                    candidates.append(t)
            alts = parts[3].strip()
            if alts:
                for chunk in alts.split(","):
                    t = chunk.strip()
                    if t:
                        candidates.append(t)
            for name in dict.fromkeys(candidates):
                if n >= max_rows:
                    break
                if not is_katakana_continuous_surface(name):
                    continue
                fout.write(f"{name}\t\n")
                n += 1
            if n >= max_rows:
                break
    return n
