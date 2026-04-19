"""TSV → JSONL with Sudachi normalized_form."""

from __future__ import annotations

import json
from pathlib import Path

from sudachipy import dictionary, tokenizer

from cleanroom_pipeline.sudachi_morph import morph_envelope


def normalize_surface(tok: tokenizer.Tokenizer, surface: str) -> str:
    mode = tokenizer.Tokenizer.SplitMode.C
    morphemes = tok.tokenize(surface, mode)
    if not morphemes:
        return surface
    if len(morphemes) == 1:
        return morphemes[0].normalized_form()
    return "".join(m.normalized_form() for m in morphemes)


def run_ingest(tsv_path: Path, out_path: Path) -> int:
    dic = dictionary.Dictionary(dict="core")
    tok = dic.create()
    out_path.parent.mkdir(parents=True, exist_ok=True)
    count = 0
    with tsv_path.open(encoding="utf-8") as fin, out_path.open("w", encoding="utf-8") as fout:
        for line in fin:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            parts = line.split("\t")
            surface = parts[0].strip()
            reading = parts[1].strip() if len(parts) > 1 else ""
            norm = normalize_surface(tok, surface)
            rec = {"surface": surface, "normalized": norm, "reading": reading}
            rec.update(morph_envelope(tok, surface))
            fout.write(json.dumps(rec, ensure_ascii=False) + "\n")
            count += 1
    return count
