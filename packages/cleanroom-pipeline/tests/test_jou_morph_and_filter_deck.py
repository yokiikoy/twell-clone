"""strict_jou_verb_row and filter-deck optional gates."""

from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from cleanroom_pipeline.filter_deck_cmd import run_filter_deck  # noqa: E402
from cleanroom_pipeline.jou_morph_gates import strict_jou_verb_row  # noqa: E402


class TestStrictJouVerbRow(unittest.TestCase):
    def test_passes_verb_shushi(self) -> None:
        row = {
            "sn_any_particle": False,
            "sn_token_count": 1,
            "sn_first_head": "動詞",
            "sn_first_conj": "終止形-一般",
        }
        self.assertTrue(strict_jou_verb_row(row))

    def test_fails_particle(self) -> None:
        row = {
            "sn_any_particle": True,
            "sn_token_count": 1,
            "sn_first_head": "動詞",
            "sn_first_conj": "終止形-一般",
        }
        self.assertFalse(strict_jou_verb_row(row))

    def test_fails_multi_token(self) -> None:
        row = {
            "sn_any_particle": False,
            "sn_token_count": 2,
            "sn_first_head": "動詞",
            "sn_first_conj": "連用形-一般",
        }
        self.assertFalse(strict_jou_verb_row(row))

    def test_fails_missing_sn(self) -> None:
        self.assertFalse(strict_jou_verb_row({"surface": "x"}))


class TestRunFilterDeckMorph(unittest.TestCase):
    def test_strict_requires_jou1(self) -> None:
        with tempfile.TemporaryDirectory() as td:
            p = Path(td) / "m.jsonl"
            p.write_text('{"surface":"愛情","reading":""}\n', encoding="utf-8")
            out = Path(td) / "o.jsonl"
            with self.assertRaises(ValueError):
                run_filter_deck(p, out, "kan1", strict_jou_verb_morph=True)

    def test_strict_rejects_cr_jou2(self) -> None:
        with tempfile.TemporaryDirectory() as td:
            p = Path(td) / "m.jsonl"
            p.write_text('{"surface":"あい","reading":""}\n', encoding="utf-8")
            out = Path(td) / "o.jsonl"
            with self.assertRaises(ValueError):
                run_filter_deck(p, out, "cr-jou2", strict_jou_verb_morph=True)

    def test_strict_allowed_for_cr_jou1(self) -> None:
        with tempfile.TemporaryDirectory() as td:
            p = Path(td) / "m.jsonl"
            p.write_text(
                '{"surface":"ある","reading":"aru","sn_any_particle":false,"sn_token_count":1,'
                '"sn_first_head":"動詞","sn_first_conj":"終止形-一般"}\n',
                encoding="utf-8",
            )
            out = Path(td) / "o.jsonl"
            n = run_filter_deck(p, out, "cr-jou1", strict_jou_verb_morph=True)
            self.assertEqual(n, 1)

    def test_dedupe_reading_keeps_first(self) -> None:
        rows = [
            {"surface": "あいさつ", "reading": "アイサツ", "sn_token_count": 1},
            {"surface": "あいさつ", "reading": "アイサツ", "sn_token_count": 1},
        ]
        with tempfile.TemporaryDirectory() as td:
            inp = Path(td) / "in.jsonl"
            inp.write_text("\n".join(json.dumps(r, ensure_ascii=False) for r in rows) + "\n", encoding="utf-8")
            out = Path(td) / "out.jsonl"
            n = run_filter_deck(inp, out, "jou1", dedupe_reading=True)
            self.assertEqual(n, 1)
            lines = out.read_text(encoding="utf-8").strip().splitlines()
            self.assertEqual(len(lines), 1)

    def test_dedupe_empty_reading_uses_surface(self) -> None:
        rows = [
            {"surface": "あいさつ", "reading": "", "sn_token_count": 1},
            {"surface": "あいさつ", "reading": "", "sn_token_count": 1},
        ]
        with tempfile.TemporaryDirectory() as td:
            inp = Path(td) / "in.jsonl"
            inp.write_text("\n".join(json.dumps(r, ensure_ascii=False) for r in rows) + "\n", encoding="utf-8")
            out = Path(td) / "out.jsonl"
            n = run_filter_deck(inp, out, "jou1", dedupe_reading=True)
            self.assertEqual(n, 1)


if __name__ == "__main__":
    unittest.main()
