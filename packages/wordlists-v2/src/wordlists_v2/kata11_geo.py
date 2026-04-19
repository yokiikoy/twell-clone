"""Build JSONL rows for cr-kata11 (foreign placenames) from a TSV gazette."""

from __future__ import annotations

import json
from pathlib import Path

from sudachipy import dictionary, tokenizer

from wordlists_v2.corpus_utils import make_cutlet, surface_reading_row
from wordlists_v2.gates import is_katakana_continuous_surface
from wordlists_v2.sudachi_morph import morph_envelope


def run_kata11_tsv_to_jsonl(tsv_in: Path, out_jsonl: Path) -> int:
    """TSV columns: surface TAB reading (optional extra columns ignored). Katakana-only surfaces."""
    if not tsv_in.is_file():
        raise SystemExit(f"input not found: {tsv_in}")

    katsu = make_cutlet()
    dic = dictionary.Dictionary(dict="core")
    tok = dic.create()

    n = 0
    out_jsonl.parent.mkdir(parents=True, exist_ok=True)
    with tsv_in.open(encoding="utf-8") as fin, out_jsonl.open("w", encoding="utf-8") as fout:
        for raw in fin:
            line = raw.strip()
            if not line or line.startswith("#"):
                continue
            parts = line.split("\t")
            surface = parts[0].strip()
            reading_col = parts[1].strip() if len(parts) > 1 else ""
            if not is_katakana_continuous_surface(surface):
                continue
            if reading_col:
                reading = reading_col
            else:
                sr = surface_reading_row(katsu, surface)
                if sr is None:
                    continue
                reading = sr[1]
            rec = {
                "surface": surface,
                "normalized": surface,
                "reading": reading,
                "cr_kata_lane": "cr-kata11",
                "source": "kata11_gazette",
            }
            rec.update(morph_envelope(tok, surface))
            rec["sn_token_count"] = 1
            fout.write(json.dumps(rec, ensure_ascii=False) + "\n")
            n += 1
    return n
