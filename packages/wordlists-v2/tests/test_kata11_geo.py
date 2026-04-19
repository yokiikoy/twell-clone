from __future__ import annotations

from pathlib import Path

from wordlists_v2.kata11_geo import run_kata11_tsv_to_jsonl


def test_kata11_tsv_to_jsonl(tmp_path: Path) -> None:
    fix = Path(__file__).resolve().parent / "fixtures" / "kata11_sample.tsv"
    out = tmp_path / "o.jsonl"
    n = run_kata11_tsv_to_jsonl(fix, out)
    assert n >= 1
    line = out.read_text(encoding="utf-8").splitlines()[0]
    assert "cr-kata11" in line
    assert "ロンドン" in line
