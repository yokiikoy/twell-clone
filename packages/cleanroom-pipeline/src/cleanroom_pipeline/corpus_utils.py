"""Shared helpers for TSV corpus rows (surface + ASCII reading)."""

from __future__ import annotations

import re
import string
import sys
from pathlib import Path
from typing import Any


def looks_japanese_surface(surface: str) -> bool:
    if not surface or len(surface) > 64:
        return False
    if any(c in surface for c in "ゝゞ々〃ヽヾ"):
        return False
    for ch in surface:
        o = ord(ch)
        if 0x3040 <= o <= 0x30FF or 0x4E00 <= o <= 0x9FFF or 0x3400 <= o <= 0x4DBF:
            return True
    return False


def normalize_romaji(raw: str) -> str:
    t = raw.strip().lower()
    for c in string.whitespace:
        t = t.replace(c, "")
    t = t.replace("-", "").replace("'", "").replace("’", "")
    t = re.sub(r"[^a-z]", "", t)
    return t


def make_cutlet() -> Any:
    import cutlet  # type: ignore[import-untyped]
    import unidic_lite  # type: ignore[import-untyped]

    dic_dir = Path(unidic_lite.DICDIR).resolve()
    if not dic_dir.is_dir():
        raise SystemExit(f"unidic-lite dictionary not found at {dic_dir}")
    mecab_d = str(dic_dir).replace("\\", "/")
    if " " in mecab_d and sys.platform == "win32":
        mecab_d = f'"{mecab_d}"'
    return cutlet.Cutlet(mecab_args=f"-d{mecab_d}")


def surface_reading_row(katsu: Any, surface: str) -> tuple[str, str] | None:
    if not looks_japanese_surface(surface):
        return None
    try:
        roma_raw = katsu.romaji(surface)
    except Exception:
        return None
    reading = normalize_romaji(roma_raw)
    if len(reading) < 1:
        return None
    return surface, reading
