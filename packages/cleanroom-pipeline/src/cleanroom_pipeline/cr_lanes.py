"""Canonical cleanroom lane ids (29): cr-jou1..8, cr-kata1..11, cr-kan1..6, cr-koto1..4."""

from __future__ import annotations

CR_LANE_SLUGS: list[str] = (
    [f"cr-jou{i}" for i in range(1, 9)]
    + [f"cr-kata{i}" for i in range(1, 12)]
    + [f"cr-kan{i}" for i in range(1, 7)]
    + [f"cr-koto{i}" for i in range(1, 5)]
)
