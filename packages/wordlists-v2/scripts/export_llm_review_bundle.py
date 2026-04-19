#!/usr/bin/env python3
"""Concatenate apps/web/public/cleanroom/twelljr-cr-*.json into one TSV or JSONL for Gemini / LLM review."""

from __future__ import annotations

import argparse
import csv
import io
import json
import sys
from pathlib import Path


def _repo_root() -> Path:
    # packages/wordlists-v2/scripts/this_file.py -> repo root
    return Path(__file__).resolve().parents[3]


def _lane_from_stem(stem: str) -> str:
    if not stem.startswith("twelljr-"):
        return stem
    return stem[len("twelljr-") :]


def _load_deck(path: Path) -> tuple[str, list[dict[str, object]]]:
    lane = _lane_from_stem(path.stem)
    raw = path.read_text(encoding="utf-8")
    data = json.loads(raw)
    if not isinstance(data, list):
        raise SystemExit(f"expected JSON array: {path}")
    rows: list[dict[str, object]] = []
    for item in data:
        if not isinstance(item, dict):
            continue
        rows.append(item)
    return lane, rows


def run_export(
    input_dir: Path,
    out_path: Path,
    fmt: str,
) -> int:
    pattern = "twelljr-cr-*.json"
    files = sorted(input_dir.glob(pattern))
    if not files:
        print(f"export_llm_review_bundle: no files matching {pattern} under {input_dir}", file=sys.stderr)
        return 1

    out_path.parent.mkdir(parents=True, exist_ok=True)
    total = 0
    n_files = 0

    if fmt == "tsv":
        buf = io.StringIO()
        w = csv.writer(buf, delimiter="\t", lineterminator="\n", quoting=csv.QUOTE_MINIMAL)
        w.writerow(["lane", "surface", "reading", "code", "index"])
        for path in files:
            lane, items = _load_deck(path)
            n_files += 1
            for it in items:
                surface = str(it.get("surface", ""))
                reading = str(it.get("reading", ""))
                code = str(it.get("code", ""))
                idx = it.get("index", "")
                w.writerow([lane, surface, reading, code, idx])
                total += 1
        text = buf.getvalue()
        out_path.write_text(text, encoding="utf-8")
    else:
        lines: list[str] = []
        for path in files:
            lane, items = _load_deck(path)
            n_files += 1
            for it in items:
                rec = {
                    "lane": lane,
                    "surface": it.get("surface", ""),
                    "reading": it.get("reading", ""),
                    "code": it.get("code", ""),
                    "index": it.get("index", ""),
                }
                lines.append(json.dumps(rec, ensure_ascii=False))
                total += 1
        body = "\n".join(lines) + ("\n" if lines else "")
        out_path.write_text(body, encoding="utf-8")

    nbytes = out_path.stat().st_size
    print(
        f"export_llm_review_bundle: files={n_files} rows={total} bytes={nbytes} -> {out_path}",
        file=sys.stderr,
    )
    return 0


def main(argv: list[str] | None = None) -> int:
    root = _repo_root()
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument(
        "--input-dir",
        type=Path,
        default=root / "apps" / "web" / "public" / "cleanroom",
        help="Directory containing twelljr-cr-*.json (default: repo apps/web/public/cleanroom)",
    )
    p.add_argument(
        "--out",
        type=Path,
        default=root / "packages" / "wordlists-v2" / "output" / "llm_review" / "review.tsv",
        help="Output file path",
    )
    p.add_argument("--format", choices=["tsv", "jsonl"], default="tsv")
    args = p.parse_args(argv)
    return run_export(args.input_dir.resolve(), args.out.resolve(), args.format)


if __name__ == "__main__":
    raise SystemExit(main())
