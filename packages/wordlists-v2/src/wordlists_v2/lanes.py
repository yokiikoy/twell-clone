"""Canonical cr-* lane ids (must match cleanroom_pipeline.cr_lanes)."""

from __future__ import annotations

CR_LANE_SLUGS: tuple[str, ...] = (
    *(f"cr-jou{i}" for i in range(1, 9)),
    *(f"cr-kata{i}" for i in range(1, 12)),
    *(f"cr-kan{i}" for i in range(1, 7)),
    *(f"cr-koto{i}" for i in range(1, 5)),
)
