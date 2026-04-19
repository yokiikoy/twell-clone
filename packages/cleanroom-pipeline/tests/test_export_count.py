"""Tests for export row-count alignment to a reference JSON array."""

from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from cleanroom_pipeline.export_cmd import pick_export_count, run_export  # noqa: E402


class TestPickExportCount(unittest.TestCase):
    def test_default_tolerance_brackets(self) -> None:
        take, low, high = pick_export_count(1000, 1000, 0.15)
        self.assertEqual((take, low, high), (1000, 850, 1150))

    def test_fewer_candidates_than_target_but_in_band(self) -> None:
        take, low, high = pick_export_count(900, 1000, 0.15)
        self.assertEqual(low, 850)
        self.assertEqual(high, 1150)
        self.assertEqual(take, 900)

    def test_below_band(self) -> None:
        take, low, high = pick_export_count(100, 1000, 0.15)
        self.assertEqual(take, 100)
        self.assertLess(take, low)


class TestRunExportReference(unittest.TestCase):
    def setUp(self) -> None:
        self._td = tempfile.TemporaryDirectory()
        self.tmp = Path(self._td.name)

    def tearDown(self) -> None:
        self._td.cleanup()

    def _row(self, surface: str, sim: float, strokes: float = 10.0) -> dict:
        return {
            "surface": surface,
            "reading": "x",
            "semantic_similarity": sim,
            "mozc_min_strokes": strokes,
        }

    def test_reference_len_selects_top_similarity(self) -> None:
        master = self.tmp / "m.jsonl"
        ref = self.tmp / "ref.json"
        out = self.tmp / "out.json"
        ref.write_text(json.dumps([{}] * 3), encoding="utf-8")
        lines = [
            self._row("東一", 0.1),
            self._row("南二", 0.9),
            self._row("西三", 0.5),
            self._row("北四", 0.8),
        ]
        master.write_text("\n".join(json.dumps(r) for r in lines) + "\n", encoding="utf-8")

        n = run_export(master, out, "kan1", reference_json=ref, stroke_sigma=2.5)
        self.assertEqual(n, 3)
        data = json.loads(out.read_text(encoding="utf-8"))
        self.assertEqual([d["surface"] for d in data], ["南二", "北四", "西三"])

    def test_export_code_prefix_no_double_cr(self) -> None:
        master = self.tmp / "m.jsonl"
        out = self.tmp / "out.json"
        verb = {
            "surface": "走る",
            "reading": "hashiru",
            "semantic_similarity": 0.9,
            "mozc_min_strokes": 10.0,
            "sn_token_count": 1,
            "sn_first_head": "動詞",
        }
        other = {
            "surface": "いろはに",
            "reading": "irohani",
            "semantic_similarity": 0.5,
            "mozc_min_strokes": 10.0,
            "sn_token_count": 1,
            "sn_first_head": "名詞",
        }
        master.write_text(
            json.dumps(verb, ensure_ascii=False) + "\n" + json.dumps(other, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )
        n = run_export(master, out, "cr-jou1", max_rows=1, stroke_sigma=2.5, reference_json=None)
        self.assertEqual(n, 1)
        data = json.loads(out.read_text(encoding="utf-8"))
        self.assertEqual(data[0]["code"], "cr-jou1-0")
        self.assertEqual(data[0]["surface"], "走る")


if __name__ == "__main__":
    unittest.main()
