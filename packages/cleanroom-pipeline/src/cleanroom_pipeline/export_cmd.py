"""Export Web-style JSON array from scored JSONL with optional stroke filter."""

from __future__ import annotations

import json
import math
import statistics
import sys
from pathlib import Path

from cleanroom_pipeline.deck_filters import row_matches_deck


def _reference_array_len(reference_path: Path) -> int:
    data = json.loads(reference_path.read_text(encoding="utf-8"))
    if not isinstance(data, list):
        raise SystemExit("reference JSON must be a JSON array")
    if len(data) < 1:
        raise SystemExit("reference JSON array must be non-empty")
    return len(data)


def pick_export_count(
    n_candidates: int,
    target_len: int,
    tolerance: float = 0.15,
) -> tuple[int, int, int]:
    """How many rows to keep after sort, given a reference length *target_len*.

    Goal: output length near *target_len* while staying in
    ``[floor(target*(1-tol)), ceil(target*(1+tol))]`` when enough candidates exist.

    Returns ``(take, band_low, band_high)``.
    """
    if target_len < 1:
        raise SystemExit("target length must be positive")
    if tolerance < 0 or tolerance > 1:
        raise SystemExit("tolerance must be in [0, 1]")
    low = max(1, math.floor(target_len * (1.0 - tolerance)))
    high = math.ceil(target_len * (1.0 + tolerance))
    if n_candidates >= target_len:
        take = target_len
    else:
        take = n_candidates
    return take, low, high


def run_export(
    master_path: Path,
    out_path: Path,
    deck_slug: str,
    max_rows: int | None = None,
    stroke_sigma: float = 2.5,
    reference_json: Path | None = None,
    count_tolerance: float = 0.15,
) -> int:
    rows_in: list[dict] = []
    with master_path.open(encoding="utf-8") as fin:
        for line in fin:
            line = line.strip()
            if not line:
                continue
            rows_in.append(json.loads(line))

    empty_out = json.dumps([], ensure_ascii=False, indent=2)

    if not rows_in:
        print("export: warning: no input rows; writing empty array", file=sys.stderr)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(empty_out, encoding="utf-8")
        return 0

    rows_in = [r for r in rows_in if row_matches_deck(r, deck_slug)]
    if not rows_in:
        print(
            f"export: warning: no rows match deck row filter for {deck_slug}; writing empty array",
            file=sys.stderr,
        )
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(empty_out, encoding="utf-8")
        return 0

    def stroke_of(r: dict) -> float | None:
        v = r.get("mozc_min_strokes")
        if v is None:
            return None
        return float(v)

    strokes = [stroke_of(r) for r in rows_in if stroke_of(r) is not None]
    low, high = None, None
    if len(strokes) >= 2:
        mu = statistics.mean(strokes)
        sd = statistics.pstdev(strokes)
        low = mu - stroke_sigma * sd
        high = mu + stroke_sigma * sd

    filtered: list[dict] = []
    for r in rows_in:
        s = stroke_of(r)
        if low is not None and high is not None and s is not None:
            if s < low or s > high:
                continue
        filtered.append(r)

    def _sim(r: dict) -> float:
        if "semantic_similarity" in r:
            return float(r["semantic_similarity"])
        return float(r.get("char_similarity", 0.0))

    filtered.sort(key=_sim, reverse=True)

    if reference_json is not None and max_rows is not None:
        print(
            "export: warning: --max-rows is ignored when reference_json is set",
            file=sys.stderr,
        )

    if reference_json is not None:
        target = _reference_array_len(reference_json)
        take, band_low, band_high = pick_export_count(len(filtered), target, count_tolerance)
        if take < band_low:
            print(
                f"export: warning: only {take} rows pass filters (band [{band_low}, {band_high}] for reference len {target})",
                file=sys.stderr,
            )
        filtered = filtered[:take]
    elif max_rows is not None:
        filtered = filtered[: max_rows]

    slug = deck_slug.strip()
    code_prefix = slug if slug.startswith("cr-") else f"cr-{slug}"

    out: list[dict] = []
    for i, r in enumerate(filtered):
        out.append(
            {
                "surface": r["surface"],
                "reading": str(r.get("reading", "")).lower(),
                "code": f"{code_prefix}-{i}",
                "index": i,
            }
        )

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    return len(out)
