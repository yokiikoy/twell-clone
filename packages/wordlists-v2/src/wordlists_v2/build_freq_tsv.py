"""Build surface<TAB>count from Tatoeba sentences via Sudachi morpheme surfaces."""

from __future__ import annotations

from pathlib import Path

from sudachipy import dictionary, tokenizer


def run_build_freq_tsv(
    tatoeba_sentences_tsv: Path,
    out_tsv: Path,
    *,
    max_lines: int | None = None,
) -> int:
    """Count Sudachi morpheme surfaces (mode C) over Tatoeba jpn lines."""
    if not tatoeba_sentences_tsv.is_file():
        raise SystemExit(f"Tatoeba file not found: {tatoeba_sentences_tsv}")

    dic = dictionary.Dictionary(dict="core")
    tok = dic.create()
    mode = tokenizer.Tokenizer.SplitMode.C

    counts: dict[str, int] = {}
    n_lines = 0
    with tatoeba_sentences_tsv.open(encoding="utf-8") as fin:
        for line in fin:
            if max_lines is not None and n_lines >= max_lines:
                break
            line = line.rstrip("\n\r")
            if not line or line.startswith("#"):
                continue
            parts = line.split("\t")
            if len(parts) < 3:
                continue
            if parts[1].strip() != "jpn":
                continue
            text = parts[2].strip()
            if not text:
                continue
            n_lines += 1
            for m in tok.tokenize(text, mode):
                s = m.surface()
                if not s:
                    continue
                counts[s] = counts.get(s, 0) + 1

    out_tsv.parent.mkdir(parents=True, exist_ok=True)
    items = sorted(counts.items(), key=lambda x: (-x[1], x[0]))
    with out_tsv.open("w", encoding="utf-8") as fout:
        for surf, c in items:
            fout.write(f"{surf}\t{c}\n")
    return len(items)
