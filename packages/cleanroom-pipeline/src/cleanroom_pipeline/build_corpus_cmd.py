"""Build a TSV corpus (surface<TAB>reading) from open-frequency data + romaji."""

from __future__ import annotations

from pathlib import Path

from cleanroom_pipeline.corpus_utils import looks_japanese_surface, make_cutlet, normalize_romaji


def run_build_corpus(out_path: Path, max_words: int = 150_000) -> int:
    try:
        from wordfreq import top_n_list
    except ImportError as e:
        raise SystemExit(
            "wordfreq is required: pip install wordfreq or install package with [build] extra"
        ) from e
    katsu = make_cutlet()
    out_path.parent.mkdir(parents=True, exist_ok=True)
    n_out = 0
    with out_path.open("w", encoding="utf-8") as fout:
        # Scan enough of the frequency tail that Cutlet+filters can still fill max_words
        # (a tight cap used to stop around ~8k rows when max_words=60_000).
        scan_n = min(3_000_000, max(max_words * 40, 200_000))
        for w in top_n_list("ja", n=scan_n, wordlist="best"):
            if not isinstance(w, str):
                continue
            w = w.strip()
            if "\t" in w or "\n" in w or "\r" in w:
                continue
            if not looks_japanese_surface(w):
                continue
            try:
                roma_raw = katsu.romaji(w)
            except Exception:
                continue
            reading = normalize_romaji(roma_raw)
            if len(reading) < 1:
                continue
            fout.write(f"{w}\t{reading}\n")
            n_out += 1
            if n_out >= max_words:
                break
    if n_out < 1000:
        raise SystemExit(f"too few corpus rows written: {n_out}")
    return n_out
