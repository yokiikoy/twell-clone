from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from cleanroom_pipeline.compare_coverage_cmd import run_compare_coverage
from cleanroom_pipeline.reference_features_cmd import run_reference_features


FIX = Path(__file__).resolve().parent / "fixtures"
LANE = FIX / "lane_a_tiny"
MASTER = FIX / "master_tiny.jsonl"


class TestCompareCoverage(unittest.TestCase):
    def test_compare_coverage_master_counts(self) -> None:
        with tempfile.TemporaryDirectory() as td:
            td_path = Path(td)
            ref_dir = td_path / "ref"
            summary, _ = run_reference_features(LANE, ref_dir)
            cov = run_compare_coverage(MASTER, summary, None, None)
            decks = cov["decks"]
            self.assertEqual(decks["jou1"]["master_candidates_after_deck_filter"], 1)
            self.assertEqual(decks["koto1"]["master_candidates_after_deck_filter"], 1)
            self.assertEqual(decks["jou1"]["aggregates"]["n"], 1)

    def test_compare_coverage_writes_md(self) -> None:
        with tempfile.TemporaryDirectory() as td:
            td_path = Path(td)
            ref_dir = td_path / "ref"
            summary, _ = run_reference_features(LANE, ref_dir)
            md = td_path / "cov.md"
            run_compare_coverage(MASTER, summary, md, None)
            text = md.read_text(encoding="utf-8")
            self.assertIn("Master vs Lane A", text)
            self.assertIn("jou1", text)


if __name__ == "__main__":
    unittest.main()
