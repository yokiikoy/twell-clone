"""Tests for enrich-kan / enrich-koto TSV attachment."""

from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from cleanroom_pipeline.enrich_gazette_cmd import run_enrich_lane_column  # noqa: E402


class TestEnrichGazette(unittest.TestCase):
    def setUp(self) -> None:
        self._td = tempfile.TemporaryDirectory()
        self.tmp = Path(self._td.name)

    def tearDown(self) -> None:
        self._td.cleanup()

    def test_gazette_sets_column(self) -> None:
        inp = self.tmp / "in.jsonl"
        gaz = self.tmp / "g.tsv"
        out = self.tmp / "out.jsonl"
        inp.write_text(
            json.dumps({"surface": "foo", "reading": "a"}, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )
        gaz.write_text("foo\tcr-kan2\n", encoding="utf-8")
        n = run_enrich_lane_column(inp, out, "cr_kan_lane", gaz)
        self.assertEqual(n, 1)
        row = json.loads(out.read_text(encoding="utf-8").strip())
        self.assertEqual(row["cr_kan_lane"], "cr-kan2")

    def test_three_column_annotate(self) -> None:
        inp = self.tmp / "in.jsonl"
        gaz = self.tmp / "g.tsv"
        out = self.tmp / "out.jsonl"
        inp.write_text(
            json.dumps({"surface": "foo", "reading": "a"}, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )
        gaz.write_text("foo\tcr-koto4\tyoji\n", encoding="utf-8")
        n = run_enrich_lane_column(
            inp, out, "cr_koto_lane", gaz, meta_column="koto_kind"
        )
        self.assertEqual(n, 1)
        row = json.loads(out.read_text(encoding="utf-8").strip())
        self.assertEqual(row["cr_koto_lane"], "cr-koto4")
        self.assertEqual(row["koto_kind"], "yoji")

    def test_no_gazette_pass_through(self) -> None:
        inp = self.tmp / "in.jsonl"
        out = self.tmp / "out.jsonl"
        line = json.dumps({"surface": "x", "reading": "y"}, ensure_ascii=False)
        inp.write_text(line + "\n", encoding="utf-8")
        n = run_enrich_lane_column(inp, out, "cr_kan_lane", None)
        self.assertEqual(n, 1)
        self.assertEqual(out.read_text(encoding="utf-8").strip(), line)


if __name__ == "__main__":
    unittest.main()
