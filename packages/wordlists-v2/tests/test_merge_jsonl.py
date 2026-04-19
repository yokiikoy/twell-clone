from __future__ import annotations

import json
from pathlib import Path

from wordlists_v2.merge_jsonl import merge_jsonl_sources


def test_merge_dedupes_surface_first_wins(tmp_path: Path) -> None:
    a = tmp_path / "a.jsonl"
    b = tmp_path / "b.jsonl"
    out = tmp_path / "m.jsonl"
    a.write_text(
        json.dumps({"surface": "猫", "reading": "neko", "x": 1}, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    b.write_text(
        json.dumps({"surface": "猫", "reading": "other", "x": 2}, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    n = merge_jsonl_sources([a, b], out)
    assert n == 1
    row = json.loads(out.read_text(encoding="utf-8").strip())
    assert row["reading"] == "neko"
