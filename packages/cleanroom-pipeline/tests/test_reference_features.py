from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from cleanroom_pipeline.reference_features import (
    deck_filter_pass_rate,
    package_root,
    profile_lane_a_json,
    surface_stats,
)
from cleanroom_pipeline.reference_features_cmd import run_reference_features


FIX = Path(__file__).resolve().parent / "fixtures" / "lane_a_tiny"


class TestReferenceFeatures(unittest.TestCase):
    def test_surface_stats_ratios(self) -> None:
        st = surface_stats("あい")
        self.assertEqual(st["n"], 2)
        self.assertEqual(st["h_r"], 1.0)
        self.assertEqual(st["k_r"], 0.0)

    def test_profile_lane_a_jou1_fixture(self) -> None:
        p = FIX / "twelljr-jou1.json"
        pr = profile_lane_a_json(p, "jou1")
        self.assertEqual(pr["n"], 3)
        self.assertLess(abs(pr["deck_filter_pass_rate_lane_a"] - 1.0), 1e-9)
        self.assertEqual(pr["surface_length"]["min"], 3)
        self.assertEqual(pr["surface_length"]["max"], 5)

    def test_deck_filter_pass_rate_koto_fixture(self) -> None:
        p = FIX / "twelljr-koto1.json"
        surfaces = [str(x["surface"]) for x in json.loads(p.read_text(encoding="utf-8"))]
        self.assertLess(abs(deck_filter_pass_rate(surfaces, "koto1") - 1.0), 1e-9)

    def test_run_reference_features_writes_files(self) -> None:
        with tempfile.TemporaryDirectory() as td:
            out = Path(td) / "ref"
            j, m = run_reference_features(FIX, out)
            self.assertTrue(j.is_file() and m.is_file())
            summary = json.loads(j.read_text(encoding="utf-8"))
            self.assertIn("generated_at", summary)
            self.assertIn("jou1", summary["decks"])
            self.assertIn("koto1", summary["decks"])
            md = m.read_text(encoding="utf-8")
            self.assertIn("Lane A reference", md)
            self.assertIn("LLM / human prompt fragment", md)

    def test_heuristics_yaml_exists(self) -> None:
        y = package_root() / "heuristics" / "decks.yaml"
        self.assertTrue(y.is_file())
        self.assertIn("jou1", y.read_text(encoding="utf-8"))


if __name__ == "__main__":
    unittest.main()
