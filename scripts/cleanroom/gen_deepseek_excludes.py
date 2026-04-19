"""Build ``packages/wordlists-v2/heuristics/deepseek_review_excludes.json`` from DeepSeek review JSON.

Reads local ``deepseek_review.json`` (gitignored by default) and writes a committed exclude list
used by ``wordlists_v2.export_deck`` at pipeline time.

Default categories: **3** (固有名・センシティブ), **4** (記号・混在), **6** (希少・難読).
Category **1** (活用・語形) is **not** applied: ``cr-jou*`` lanes intentionally include stem forms.

Usage (repo root)::

    python scripts/cleanroom/gen_deepseek_excludes.py
    python scripts/cleanroom/gen_deepseek_excludes.py --input packages/wordlists-v2/output/llm_review/deepseek_review.json
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
    default_out = root / "packages" / "wordlists-v2" / "heuristics" / "deepseek_review_excludes.json"

    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--input", type=Path, default=default_in, help="deepseek_review.json path")
    p.add_argument("--out", type=Path, default=default_out, help="output JSON path")
    p.add_argument(
        "--categories",
        type=int,
        nargs="+",
        default=[3, 4, 6],
        help="issue category numbers to turn into excludes (default: 3 4 6)",
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
        key = (lane, surface, reading.lower())
        if key in seen:
            continue
        seen.add(key)
        entries.append({"lane": lane, "surface": surface, "reading": reading})

    args.out.parent.mkdir(parents=True, exist_ok=True)
    out_obj = {
        "meta": {
            "source": str(args.input.resolve()),
            "exclude_categories": sorted(want),
            "entry_count": len(entries),
            "generated_at": datetime.now(timezone.utc).isoformat(),
        },
        "entries": entries,
    }
    args.out.write_text(json.dumps(out_obj, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {len(entries)} entries -> {args.out}")


if __name__ == "__main__":
    main()
