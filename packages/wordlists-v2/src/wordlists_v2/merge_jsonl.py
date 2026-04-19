"""Merge JSONL row files; dedupe by normalized surface (first source wins)."""

from __future__ import annotations

import json
import unicodedata
from pathlib import Path


def _surf_key(row: dict) -> str:
    return unicodedata.normalize("NFC", str(row.get("surface", "")).strip())


def merge_jsonl_sources(paths: list[Path], out_path: Path) -> int:
    """Concatenate JSONL files in order; skip rows whose surface was already written."""
    seen: set[str] = set()
    n = 0
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", encoding="utf-8") as fout:
        for path in paths:
            if not path.is_file():
                continue
            with path.open(encoding="utf-8") as fin:
                for line in fin:
                    line = line.strip()
                    if not line:
                        continue
                    row = json.loads(line)
                    k = _surf_key(row)
                    if not k:
                        continue
                    if k in seen:
                        continue
                    seen.add(k)
                    fout.write(json.dumps(row, ensure_ascii=False) + "\n")
                    n += 1
    return n
