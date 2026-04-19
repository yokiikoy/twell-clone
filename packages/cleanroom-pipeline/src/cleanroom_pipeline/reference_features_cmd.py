"""CLI implementation: reference-features -> summary.json + HEURISTIC_REPORT.md."""

from __future__ import annotations

import json
from pathlib import Path

from cleanroom_pipeline.reference_features import (
    build_reference_summary,
    heuristics_yaml_path,
    package_root,
    render_heuristic_report_md,
)


def run_reference_features(input_dir: Path, output_dir: Path) -> tuple[Path, Path]:
    input_dir = input_dir.resolve()
    output_dir = output_dir.resolve()
    output_dir.mkdir(parents=True, exist_ok=True)
    summary = build_reference_summary(input_dir)
    json_path = output_dir / "summary.json"
    json_path.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    heur_rel = str(heuristics_yaml_path().relative_to(package_root())).replace("\\", "/")
    md_path = output_dir / "HEURISTIC_REPORT.md"
    md_path.write_text(render_heuristic_report_md(summary, heur_rel), encoding="utf-8")
    return json_path, md_path
