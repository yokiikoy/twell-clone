import json
from pathlib import Path

from wordlists_v2.dict_form_rewrite import apply_dictionary_form_rewrites


def test_rewrite_kogi_to_kogu(tmp_path: Path) -> None:
    keys = tmp_path / "keys.json"
    keys.write_text(
        json.dumps(
            {
                "entries": [
                    {
                        "lane": "cr-jou1",
                        "surface": "漕い",
                        "reading": "koi",
                    }
                ]
            },
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )
    jl = tmp_path / "m.jsonl"
    jl.write_text(
        json.dumps(
            {
                "surface": "漕い",
                "reading": "koi",
                "normalized": "漕ぐ",
                "sn_token_count": 1,
                "sn_first_head": "動詞",
            },
            ensure_ascii=False,
        )
        + "\n",
        encoding="utf-8",
    )
    n_out, n_ch = apply_dictionary_form_rewrites(
        jl,
        "cr-jou1",
        keys_path=keys,
        use_rewrites=True,
    )
    assert n_ch == 1
    assert n_out == 1
    row = json.loads(jl.read_text(encoding="utf-8").strip())
    assert row["surface"] == "漕ぐ"
    assert row["reading"] != ""
    assert row["sn_first_head"] == "動詞"
