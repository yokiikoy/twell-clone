#!/usr/bin/env python3
"""Infer structural attributes of Lane A (committed) twelljr-*.json decks.

Thin wrapper: logic lives in ``cleanroom_pipeline.reference_features``.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

from cleanroom_pipeline.reference_features import discover_lane_a_paths, profile_lane_a_json


def main() -> None:
    root = Path(__file__).resolve().parents[3] / "apps" / "web" / "public"
    if not root.is_dir():
        print("public dir not found", root, file=sys.stderr)
        sys.exit(1)
    for slug, p in discover_lane_a_paths(root):
        pr = profile_lane_a_json(p, slug)
        raw = json.loads(p.read_text(encoding="utf-8"))
        surfaces = [str(x.get("surface", "")) for x in raw]
        sl = pr.get("surface_length") or {}
        mr = pr.get("mean_ratios") or {}
        cf = pr.get("composition_fractions") or {}
        print(f"\n## {p.name}  (n={pr['n']})")
        print(
            f"- surface length: min={sl.get('min')} p50={sl.get('p50')} "
            f"p90={sl.get('p90')} max={sl.get('max')}"
        )
        print(
            f"- mean char ratios: hiragana={mr.get('hiragana', 0):.3f} "
            f"katakana={mr.get('katakana', 0):.3f} kanji={mr.get('kanji', 0):.3f} "
            f"latin={mr.get('latin', 0):.4f}"
        )
        print(
            f"- deck_filter_pass_rate_lane_a={pr.get('deck_filter_pass_rate_lane_a', 0) * 100:.1f}%"
        )
        print(
            f"- composition: strict_hira={cf.get('strict_hiragana_only_regex', 0) * 100:.1f}% "
            f"has_kanji={cf.get('has_kanji', 0) * 100:.1f}%"
        )
        rlen = pr.get("reading_ascii_len") or {}
        if "mean" in rlen:
            print(f"- reading ascii len mean={rlen['mean']:.1f}")
        print(f"- first 4 surfaces: {surfaces[:4]}")


if __name__ == "__main__":
    main()
