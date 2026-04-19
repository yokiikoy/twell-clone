"""Rewrite flagged 活用形 rows to Sudachi 辞書形 (lemma) before join-strokes."""

from __future__ import annotations

import json
import sys
import unicodedata
from pathlib import Path

from sudachipy import dictionary

from wordlists_v2.corpus_utils import make_cutlet, surface_reading_row
from wordlists_v2.deepseek_excludes import row_key
from wordlists_v2.gates import row_matches_deck
from wordlists_v2.ingest_core import normalize_surface
from wordlists_v2.sudachi_morph import morph_envelope


def default_rewrites_path() -> Path:
    return Path(__file__).resolve().parents[2] / "heuristics" / "deepseek_review_rewrites.json"


def load_rewrite_keys(path: Path) -> set[tuple[str, str, str]]:
    raw = json.loads(path.read_text(encoding="utf-8"))
    entries = raw.get("entries")
    if not isinstance(entries, list):
        raise SystemExit(f"invalid rewrites file (missing entries array): {path}")
    out: set[tuple[str, str, str]] = set()
    for e in entries:
        if not isinstance(e, dict):
            continue
        lane = str(e.get("lane", "")).strip()
        surf = unicodedata.normalize("NFC", str(e.get("surface", "")).strip())
        rd = unicodedata.normalize("NFC", str(e.get("reading", "")).strip()).lower()
        if lane and surf:
            out.add((lane, surf, rd))
    return out


def _nfc(s: str) -> str:
    return unicodedata.normalize("NFC", str(s).strip())


def apply_dictionary_form_rewrites(
    jsonl_path: Path,
    deck_slug: str,
    *,
    keys_path: Path | None = None,
    use_rewrites: bool = True,
) -> tuple[int, int]:
    """In-place rewrite of JSONL: matching rows use Sudachi 辞書形 + new reading.

    Returns ``(lines_written, rows_changed)``.
    """
    slug = deck_slug.strip()
    if not use_rewrites or not slug.startswith("cr-jou"):
        return 0, 0

    p = keys_path if keys_path is not None else default_rewrites_path()
    if not p.is_file():
        return 0, 0

    keys = load_rewrite_keys(p)
    if not keys:
        return 0, 0

    dic = dictionary.Dictionary(dict="core")
    tok = dic.create()
    katsu = make_cutlet()

    lines_in: list[str] = []
    with jsonl_path.open(encoding="utf-8") as fin:
        for line in fin:
            line = line.strip()
            if line:
                lines_in.append(line)

    if not lines_in:
        return 0, 0

    changed = 0
    seen_surface: set[str] = set()
    out_lines: list[str] = []

    for line in lines_in:
        orig = json.loads(line)
        r = dict(orig)
        k = row_key(slug, r)

        if k in keys:
            old_s = str(r.get("surface", "")).strip()
            norm = r.get("normalized")
            if isinstance(norm, str) and norm.strip():
                lemma = norm.strip()
            else:
                lemma = normalize_surface(tok, old_s)

            if lemma and lemma != old_s:
                sr = surface_reading_row(katsu, lemma)
                if sr is None:
                    print(
                        f"dict_form_rewrite: skip (no reading) deck={slug} {old_s!r} -> {lemma!r}",
                        file=sys.stderr,
                    )
                else:
                    new_surface, new_reading = sr
                    cand = dict(r)
                    cand["surface"] = new_surface
                    cand["reading"] = new_reading
                    cand["normalized"] = lemma
                    cand.update(morph_envelope(tok, new_surface))
                    if row_matches_deck(cand, slug):
                        r = cand
                        changed += 1
                    else:
                        print(
                            f"dict_form_rewrite: revert (gate) deck={slug} {old_s!r} -> {new_surface!r}",
                            file=sys.stderr,
                        )

        sk = _nfc(str(r.get("surface", "")))
        if not sk or sk in seen_surface:
            continue
        seen_surface.add(sk)
        out_lines.append(json.dumps(r, ensure_ascii=False))

    jsonl_path.write_text("\n".join(out_lines) + ("\n" if out_lines else ""), encoding="utf-8")
    return len(out_lines), changed
