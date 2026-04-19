"""Emit JSON array of {slug, mode} for cleanroom CR lanes (used by generate-wordlists.ps1)."""

from __future__ import annotations

import json

from cleanroom_pipeline.cr_lanes import CR_LANE_SLUGS
from cleanroom_pipeline.deck_filters import engine_mode_for_deck_slug


def main() -> None:
    rows = [
        {"slug": lane_id, "mode": engine_mode_for_deck_slug(lane_id)}
        for lane_id in CR_LANE_SLUGS
    ]
    print(json.dumps(rows))


if __name__ == "__main__":
    main()
