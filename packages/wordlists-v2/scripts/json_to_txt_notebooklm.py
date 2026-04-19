#!/usr/bin/env python3
"""Copy twelljr-cr-*.json to same-named .txt (UTF-8) for NotebookLM and similar tools."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path


def _repo_root() -> Path:
    return Path(__file__).resolve().parents[3]


def main(argv: list[str] | None = None) -> int:
    root = _repo_root()
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument(
        "--input-dir",
        type=Path,
        default=root / "apps" / "web" / "public" / "cleanroom",
        help="Directory containing twelljr-cr-*.json",
    )
    p.add_argument(
        "--out-dir",
        type=Path,
        default=root / "packages" / "wordlists-v2" / "output" / "notebooklm",
        help="Output directory for .txt copies",
    )
    args = p.parse_args(argv)

    indir = args.input_dir.resolve()
    outdir = args.out_dir.resolve()
    outdir.mkdir(parents=True, exist_ok=True)

    files = sorted(indir.glob("twelljr-cr-*.json"))
    if not files:
        print(f"json_to_txt_notebooklm: no twelljr-cr-*.json under {indir}", file=sys.stderr)
        return 1

    total_bytes = 0
    for src in files:
        text = src.read_text(encoding="utf-8")
        dst = outdir / (src.stem + ".txt")
        dst.write_text(text, encoding="utf-8")
        total_bytes += dst.stat().st_size

    print(
        f"json_to_txt_notebooklm: files={len(files)} total_bytes={total_bytes} -> {outdir}",
        file=sys.stderr,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
