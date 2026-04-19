"""Stratified sampling of JSONL rows by surface length bins."""

from __future__ import annotations

import json
import random
from collections import defaultdict
from pathlib import Path
from typing import Any

from wordlists_v2.gates import row_matches_deck


def _bin_len(n: int) -> str:
    if n <= 2:
        return "1-2"
    if n <= 4:
        return "3-4"
    if n <= 8:
        return "5-8"
    return "9+"


def run_stratified_sample(
    jsonl_in: Path,
    jsonl_out: Path,
    deck_slug: str,
    *,
    max_rows: int,
    seed: int = 42,
    freq_key: str | None = None,
) -> int:
    """Filter by deck, then sample up to *max_rows* with length-bin stratification."""
    rows: list[dict[str, Any]] = []
    with jsonl_in.open(encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            r = json.loads(line)
            if not row_matches_deck(r, deck_slug):
                continue
            rows.append(r)

    if not rows:
        jsonl_out.parent.mkdir(parents=True, exist_ok=True)
        jsonl_out.write_text("", encoding="utf-8")
        return 0

    rng = random.Random(seed)
    if len(rows) <= max_rows:
        picked = rows[:]
        rng.shuffle(picked)
    else:
        bins: dict[str, list[dict[str, Any]]] = defaultdict(list)
        for r in rows:
            bins[_bin_len(len(str(r.get("surface", ""))))].append(r)
        names = sorted(bins.keys())
        per = max_rows // len(names)
        picked: list[dict[str, Any]] = []
        for bn in names:
            pool = bins[bn]
            if freq_key:
                pool = sorted(pool, key=lambda r: float(r.get(freq_key, 0)), reverse=True)
            pool = pool[:]
            rng.shuffle(pool)
            picked.extend(pool[:per])
        rng.shuffle(picked)
        picked = picked[:max_rows]

    jsonl_out.parent.mkdir(parents=True, exist_ok=True)
    with jsonl_out.open("w", encoding="utf-8") as fout:
        for r in picked:
            fout.write(json.dumps(r, ensure_ascii=False) + "\n")
    return len(picked)
