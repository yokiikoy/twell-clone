from __future__ import annotations

import json
from pathlib import Path

from wordlists_v2.build_manifest import write_build_manifest


def test_write_build_manifest(tmp_path: Path) -> None:
    prov = tmp_path / "prov.json"
    prov.write_text('{"artifacts":[]}', encoding="utf-8")
    out = tmp_path / "BUILD_MANIFEST.json"
    write_build_manifest(out, steps=["a", "b"], source_provenance_path=prov, extra={"k": 1})
    d = json.loads(out.read_text(encoding="utf-8"))
    assert d["steps"] == ["a", "b"]
    assert d["k"] == 1
    assert "source_provenance" in d
