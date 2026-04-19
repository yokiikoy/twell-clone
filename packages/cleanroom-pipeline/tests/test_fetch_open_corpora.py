"""fetch-open-corpora helpers (no network)."""

from __future__ import annotations

import bz2
import gzip
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from cleanroom_pipeline.fetch_open_corpora_cmd import (  # noqa: E402
    _load_manifest,
    _process_bz2_tsv,
    _process_gzip_xml,
)


class TestOpenCorporaManifest(unittest.TestCase):
    def test_manifest_has_expected_ids(self) -> None:
        m = _load_manifest()
        ids = {a["id"] for a in m["artifacts"]}
        self.assertIn("tatoeba_jpn_sentences", ids)
        self.assertIn("jmdict_eng_xml", ids)


class TestArchiveHandlers(unittest.TestCase):
    def test_bz2_tsv_roundtrip(self) -> None:
        raw = ("id\tlang\ttext\n1\tjpn\t\u3053\u3093\u306b\u3061\u306f\n").encode("utf-8")
        comp = bz2.compress(raw)
        with tempfile.TemporaryDirectory() as td:
            arc = Path(td) / "x.bz2"
            arc.write_bytes(comp)
            out = Path(td) / "out.tsv"
            _process_bz2_tsv(arc, out)
            self.assertEqual(out.read_bytes(), raw)

    def test_gzip_xml_roundtrip(self) -> None:
        raw = b"<?xml version='1.0'?><r></r>\n"
        buf = gzip.compress(raw)
        with tempfile.TemporaryDirectory() as td:
            arc = Path(td) / "x.gz"
            arc.write_bytes(buf)
            out = Path(td) / "out.xml"
            _process_gzip_xml(arc, out)
            self.assertEqual(out.read_bytes(), raw)


if __name__ == "__main__":
    unittest.main()
