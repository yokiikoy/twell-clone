"""Build ``heuristics/deepseek_review_rewrites.json`` from DeepSeek review (category 1 → 辞書形変換キー).

レビューで「活用・語形」とされた行を、パイプライン内で Sudachi の辞書形へ寄せるときの **(lane, surface, reading)** キー一覧を書き出す。

既定はカテゴリ **1** のみ。`python scripts/cleanroom/gen_deepseek_rewrites.py`

変換そのものは ``wordlists_v2.dict_form_rewrite.apply_dictionary_form_rewrites``（ingest の ``normalized`` 列を優先）。
"""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path


def _repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def main(argv: list[str] | None = None) -> None:
    root = _repo_root()
    default_in = root / "packages" / "wordlists-v2" / "output" / "llm_review" / "deepseek_review.json"
    default_out = root / "packages" / "wordlists-v2" / "heuristics" / "deepseek_review_rewrites.json"

    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--input", type=Path, default=default_in, help="deepseek_review.json path")
    p.add_argument("--out", type=Path, default=default_out, help="output JSON path")
    p.add_argument(
        "--categories",
        type=int,
        nargs="+",
        default=[1],
        help="issue categories to emit as rewrite keys (default: 1)",
    )
    args = p.parse_args(argv)

    if not args.input.is_file():
        raise SystemExit(f"missing input: {args.input}")

    data = json.loads(args.input.read_text(encoding="utf-8"))
    issues = data.get("issues")
    if not isinstance(issues, list):
        raise SystemExit("invalid deepseek_review.json: expected issues array")

    want = set(args.categories)
    entries: list[dict[str, str]] = []
    seen: set[tuple[str, str, str]] = set()
    for it in issues:
        if not isinstance(it, dict):
            continue
        cat = it.get("category")
        try:
            c = int(cat)
        except (TypeError, ValueError):
            continue
        if c not in want:
            continue
        lane = str(it.get("lane", "")).strip()
        surface = str(it.get("surface", "")).strip()
        reading = str(it.get("reading", "")).strip()
        if not lane or not surface:
            continue
        if not lane.startswith("cr-jou"):
            continue
        key = (lane, surface, reading.lower())
        if key in seen:
            continue
        seen.add(key)
        entries.append({"lane": lane, "surface": surface, "reading": reading})

    args.out.parent.mkdir(parents=True, exist_ok=True)
    out_obj = {
        "meta": {
            "source": str(args.input.resolve()),
            "rewrite_categories": sorted(want),
            "entry_count": len(entries),
            "note": "Pipeline replaces surface with Sudachi lemma (normalized) when key matches; reading from cutlet.",
            "generated_at": datetime.now(timezone.utc).isoformat(),
        },
        "entries": entries,
    }
    args.out.write_text(json.dumps(out_obj, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {len(entries)} entries -> {args.out}")


if __name__ == "__main__":
    main()
