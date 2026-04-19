"""Filter master JSONL rows by deck surface rules."""

from __future__ import annotations

import json
import unicodedata
from pathlib import Path
from typing import Any

from cleanroom_pipeline.deck_filters import row_matches_deck
from cleanroom_pipeline.jou_morph_gates import strict_jou_verb_row


def _nfc_strip(s: str) -> str:
    return unicodedata.normalize("NFC", str(s).strip())


def _dedupe_key(row: dict[str, Any]) -> str:
    r = _nfc_strip(str(row.get("reading") or ""))
    if r:
        return r
    return _nfc_strip(str(row.get("surface") or ""))


def run_filter_deck(
    in_path: Path,
    out_path: Path,
    deck_slug: str,
    *,
    strict_jou_verb_morph: bool = False,
    dedupe_reading: bool = False,
) -> int:
    if strict_jou_verb_morph and deck_slug not in ("jou1", "cr-jou1"):
        raise ValueError("--strict-jou-verb-morph is only valid with --deck jou1 or cr-jou1")

    seen: set[str] = set()
    n = 0
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with in_path.open(encoding="utf-8") as fin, out_path.open("w", encoding="utf-8") as fout:
        for line in fin:
            line = line.strip()
            if not line:
                continue
            row = json.loads(line)
            if not row_matches_deck(row, deck_slug):
                continue
            if strict_jou_verb_morph and not strict_jou_verb_row(row):
                continue
            if dedupe_reading:
                key = _dedupe_key(row)
                if key in seen:
                    continue
                seen.add(key)
            fout.write(json.dumps(row, ensure_ascii=False) + "\n")
            n += 1
    return n
