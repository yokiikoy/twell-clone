"""Compare master.jsonl candidate distributions to Lane A reference summary."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from cleanroom_pipeline.deck_filters import row_matches_deck
from cleanroom_pipeline.reference_features import aggregate_surfaces, load_summary


def _iter_master_rows(master_path: Path) -> list[dict]:
    out: list[dict] = []
    with master_path.open(encoding="utf-8") as fin:
        for line in fin:
            line = line.strip()
            if not line:
                continue
            out.append(json.loads(line))
    return out


def _master_surfaces_for_deck(rows: list[dict], deck_slug: str) -> list[str]:
    return [str(r.get("surface", "")) for r in rows if row_matches_deck(r, deck_slug)]


def build_coverage_summary(
    master_path: Path,
    reference_summary_path: Path,
    deck_filter: str | None = None,
) -> dict[str, Any]:
    ref = load_summary(reference_summary_path)
    ref_decks: dict[str, Any] = ref.get("decks") or {}
    all_rows = _iter_master_rows(master_path)
    slugs = sorted(ref_decks.keys())
    if deck_filter:
        slugs = [s for s in slugs if s == deck_filter]
    out_decks: dict[str, Any] = {}
    for slug in slugs:
        m_surfaces = _master_surfaces_for_deck(all_rows, slug)
        out_decks[slug] = {
            "master_candidates_after_deck_filter": len(m_surfaces),
            "master_total_surfaces": len(all_rows),
            "aggregates": aggregate_surfaces(slug, "master.jsonl", m_surfaces, None),
        }
        lane = ref_decks.get(slug) or {}
        out_decks[slug]["reference_lane_a_n"] = lane.get("n", 0)
        out_decks[slug]["reference_surface_length_p50"] = (lane.get("surface_length") or {}).get("p50")
    return {
        "master_path": str(master_path.resolve()),
        "reference_summary_path": str(reference_summary_path.resolve()),
        "decks": out_decks,
    }


def render_coverage_report_md(cov: dict[str, Any], heuristic_report_hint: str) -> str:
    lines: list[str] = []
    lines.append("# Master vs Lane A — coverage report")
    lines.append("")
    lines.append(f"- Master: `{cov.get('master_path', '')}`")
    lines.append(f"- Reference summary: `{cov.get('reference_summary_path', '')}`")
    lines.append(f"- Pair with: `{heuristic_report_hint}`")
    lines.append("")
    lines.append("| deck | master_pass_filter | ref_n | master len p50 | ref len p50 |")
    lines.append("|------|-------------------|-------|----------------|-------------|")
    for slug in sorted((cov.get("decks") or {}).keys()):
        d = cov["decks"][slug]
        agg = d.get("aggregates") or {}
        sl = agg.get("surface_length") or {}
        ref_p50 = d.get("reference_surface_length_p50")
        lines.append(
            f"| {slug} | {d.get('master_candidates_after_deck_filter', 0)} | "
            f"{d.get('reference_lane_a_n', 0)} | {sl.get('p50', '')} | {ref_p50} |"
        )
    lines.append("")
    lines.append(
        "If `master_pass_filter` is **0** but `ref_n` is large, the bottleneck is usually "
        "**corpus inventory**, missing Sudachi `sn_*` fields for `cr-jou`/`cr-kata`, "
        "missing `enrich-kan` / `enrich-koto` columns for `cr-kan*` / `cr-koto*`, "
        "or legacy surface thresholds in `deck_filters.py` (non-`cr-*` slugs only)."
    )
    lines.append("")
    return "\n".join(lines) + "\n"


def run_compare_coverage(
    master_path: Path,
    reference_profiles_path: Path,
    output_md: Path | None,
    deck: str | None,
) -> dict[str, Any]:
    cov = build_coverage_summary(master_path, reference_profiles_path, deck_filter=deck)
    if output_md is not None:
        output_md.parent.mkdir(parents=True, exist_ok=True)
        hint = str(
            (reference_profiles_path.parent / "HEURISTIC_REPORT.md").resolve()
        ).replace("\\", "/")
        output_md.write_text(render_coverage_report_md(cov, hint), encoding="utf-8")
    return cov
