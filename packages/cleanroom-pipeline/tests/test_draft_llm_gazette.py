"""Tests for LLM draft TSV parsing (no live API)."""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from cleanroom_pipeline.draft_llm_gazette_cmd import parse_llm_tsv_body  # noqa: E402


class TestParseLlmTsvBody(unittest.TestCase):
    def test_kan_plain(self) -> None:
        body = "東京\tcr-kan4\n大阪市\tcr-kan6\n"
        rows = parse_llm_tsv_body(body, family="kan")
        self.assertEqual(rows, [("東京", "cr-kan4"), ("大阪市", "cr-kan6")])

    def test_kan_strips_fence(self) -> None:
        body = "```\n猫\tcr-kan4\n```\n"
        rows = parse_llm_tsv_body(body, family="kan")
        self.assertEqual(rows, [("猫", "cr-kan4")])

    def test_kan_invalid_lane_dropped(self) -> None:
        body = "x\tcr-kan9\n良い\tcr-kan1\n"
        rows = parse_llm_tsv_body(body, family="kan")
        self.assertEqual(rows, [("良い", "cr-kan1")])

    def test_koto(self) -> None:
        body = "一石二鳥\tcr-koto4\n"
        rows = parse_llm_tsv_body(body, family="koto")
        self.assertEqual(rows, [("一石二鳥", "cr-koto4")])

    def test_dedupe_surface(self) -> None:
        body = "同\tcr-kan1\n同\tcr-kan2\n"
        rows = parse_llm_tsv_body(body, family="kan")
        self.assertEqual(len(rows), 1)


if __name__ == "__main__":
    unittest.main()
