"""Attach manifest-backed lane columns from optional TSV gazettes (kan/koto MVP)."""

from __future__ import annotations

import json
import unicodedata
from pathlib import Path
from typing import Any


def _nfc(s: str) -> str:
    return unicodedata.normalize("NFC", str(s).strip())


def load_surface_lane_tsv(path: Path) -> dict[str, str]:
    """Map NFC surface -> lane slug (e.g. ``cr-kan6``, ``cr-koto4``).

    Lines: ``surface<TAB>lane`` (``#`` comments and blanks ignored).
    """
    m: dict[str, str] = {}
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        parts = line.split("\t")
        if len(parts) < 2:
            continue
        surf = _nfc(parts[0])
        lane = parts[1].strip()
        if surf and lane:
            m[surf] = lane
    return m


def load_surface_lane_with_optional_meta(path: Path) -> dict[str, tuple[str, str | None]]:
    """``surface -> (lane_slug, optional_meta)`` from TSV (2 or 3 columns per line)."""
    m: dict[str, tuple[str, str | None]] = {}
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        parts = line.split("\t")
        if len(parts) < 2:
            continue
        surf = _nfc(parts[0])
        lane = parts[1].strip()
        meta = parts[2].strip() if len(parts) >= 3 and parts[2].strip() else None
        if surf and lane:
            m[surf] = (lane, meta)
    return m


def run_enrich_lane_column(
    in_path: Path,
    out_path: Path,
    column: str,
    gazette_tsv: Path | None,
    *,
    meta_column: str | None = None,
) -> int:
    """Stream JSONL; when *gazette_tsv* is set, set *column* from surface lookup.

    If *meta_column* is set and the gazette row has a third TSV column, set *meta_column* too.
    """
    lookup2: dict[str, tuple[str, str | None]] | None = None
    lookup1: dict[str, str] | None = None
    if gazette_tsv is not None:
        if meta_column:
            lookup2 = load_surface_lane_with_optional_meta(gazette_tsv)
        else:
            lookup1 = load_surface_lane_tsv(gazette_tsv)
    n = 0
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with in_path.open(encoding="utf-8") as fin, out_path.open("w", encoding="utf-8") as fout:
        for line in fin:
            line = line.strip()
            if not line:
                continue
            row: dict[str, Any] = json.loads(line)
            if lookup1 is not None:
                surf = _nfc(str(row.get("surface", "")))
                hit = lookup1.get(surf)
                if hit is not None:
                    row[column] = hit
            elif lookup2 is not None:
                surf = _nfc(str(row.get("surface", "")))
                hit = lookup2.get(surf)
                if hit is not None:
                    lane, meta = hit
                    row[column] = lane
                    if meta_column and meta is not None:
                        row[meta_column] = meta
            fout.write(json.dumps(row, ensure_ascii=False) + "\n")
            n += 1
    return n
