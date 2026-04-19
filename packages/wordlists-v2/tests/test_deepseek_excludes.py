import json
from pathlib import Path

from wordlists_v2.deepseek_excludes import load_lane_surface_reading_excludes, row_key
from wordlists_v2.export_deck import run_export


def test_load_and_filter_row(tmp_path: Path) -> None:
    excl_path = tmp_path / "ex.json"
    excl_path.write_text(
        json.dumps(
            {
                "entries": [
                    {"lane": "cr-kan6", "surface": "東京", "reading": "toukyou"},
                ]
            },
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )
    s = load_lane_surface_reading_excludes(excl_path)
    assert ("cr-kan6", "東京", "toukyou") in s

    jl = tmp_path / "in.jsonl"
    jl.write_text(
        json.dumps(
            {
                "surface": "東京",
                "reading": "toukyou",
                "cr_kan_lane": "cr-kan6",
            },
            ensure_ascii=False,
        )
        + "\n"
        + json.dumps(
            {
                "surface": "大阪",
                "reading": "oosaka",
                "cr_kan_lane": "cr-kan6",
            },
            ensure_ascii=False,
        )
        + "\n",
        encoding="utf-8",
    )
    out = tmp_path / "out.json"
    n = run_export(
        jl,
        out,
        "cr-kan6",
        use_deepseek_excludes=True,
        exclude_keys_path=excl_path,
    )
    assert n == 1
    data = json.loads(out.read_text(encoding="utf-8"))
    assert len(data) == 1
    assert data[0]["surface"] == "大阪"


def test_row_key_matches_export_reading_case() -> None:
    k = row_key("cr-kata1", {"surface": "アイ", "reading": "AI"})
    assert k[2] == "ai"
