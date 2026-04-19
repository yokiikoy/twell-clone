"""Load lane+surface+reading keys to drop from export (LLM review follow-up)."""

from __future__ import annotations

import json
import unicodedata
from pathlib import Path


def default_exclude_path() -> Path:
    """Committed file under ``packages/wordlists-v2/heuristics/``."""
    return Path(__file__).resolve().parents[2] / "heuristics" / "deepseek_review_excludes.json"


def _nfc(s: str) -> str:
    return unicodedata.normalize("NFC", str(s).strip())


def load_lane_surface_reading_excludes(path: Path) -> set[tuple[str, str, str]]:
    """Return {(lane, surface_nfc, reading_lower_nfc), ...}."""
    raw = json.loads(path.read_text(encoding="utf-8"))
    entries = raw.get("entries")
    if not isinstance(entries, list):
        raise SystemExit(f"invalid excludes file (missing entries array): {path}")
    out: set[tuple[str, str, str]] = set()
    for e in entries:
        if not isinstance(e, dict):
            continue
        lane = str(e.get("lane", "")).strip()
        surf = _nfc(str(e.get("surface", "")))
        rd = _nfc(str(e.get("reading", ""))).lower()
        if lane and surf:
            out.add((lane, surf, rd))
    return out


def row_key(deck_slug: str, row: dict) -> tuple[str, str, str]:
    """Match ``export_deck.run_export`` normalization."""
    lane = str(deck_slug).strip()
    surf = _nfc(str(row.get("surface", "")))
    rd = _nfc(str(row.get("reading", ""))).lower()
    return (lane, surf, rd)
