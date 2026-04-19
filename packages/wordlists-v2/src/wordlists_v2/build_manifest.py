"""Write BUILD_MANIFEST.json for audit trail."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


def write_build_manifest(
    out_path: Path,
    *,
    steps: list[str],
    source_provenance_path: Path | None,
    extra: dict[str, Any] | None = None,
) -> None:
    doc: dict[str, Any] = {
        "schema_version": 1,
        "created_at_utc": datetime.now(timezone.utc).isoformat(),
        "steps": steps,
    }
    if source_provenance_path and source_provenance_path.is_file():
        doc["source_provenance"] = json.loads(source_provenance_path.read_text(encoding="utf-8"))
    if extra:
        doc.update(extra)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
