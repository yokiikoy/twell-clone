"""Build centroid profile from Lane-A-style JSON array (local path only)."""

from __future__ import annotations

import json
from pathlib import Path

from cleanroom_pipeline.embed_simple import DIM, vec_from_json_list


def run_profile(lane_a_json: Path, deck_id: str, out_path: Path) -> None:
    raw = json.loads(lane_a_json.read_text(encoding="utf-8"))
    if not isinstance(raw, list):
        raise SystemExit("Lane A file must be a JSON array")
    centroid = vec_from_json_list(raw)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "deck": deck_id,
        "embedding": {
            "kind": "unicode_histogram_v1",
            "dim": DIM,
            "license_note": "No external embedding files; deterministic Unicode histogram. Safe for pipeline bootstrap only.",
        },
        "vector": [float(x) for x in centroid],
    }
    out_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
