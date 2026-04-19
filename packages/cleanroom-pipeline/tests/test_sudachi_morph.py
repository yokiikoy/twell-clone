"""Sudachi morph_envelope integration (SudachiDict-core required)."""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from sudachipy import dictionary  # noqa: E402

from cleanroom_pipeline.sudachi_morph import morph_envelope  # noqa: E402


class TestMorphEnvelope(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        dic = dictionary.Dictionary(dict="core")
        cls._tok = dic.create()

    def test_taberu_shushi(self) -> None:
        env = morph_envelope(self._tok, "食べる")
        self.assertEqual(env["sn_token_count"], 1)
        self.assertFalse(env["sn_any_particle"])
        self.assertEqual(env["sn_first_head"], "動詞")
        self.assertTrue(str(env["sn_first_conj"]).startswith("終止形"))

    def test_tabe_renyo(self) -> None:
        env = morph_envelope(self._tok, "食べ")
        self.assertEqual(env["sn_token_count"], 1)
        self.assertEqual(env["sn_first_head"], "動詞")
        self.assertTrue(str(env["sn_first_conj"]).startswith("連用形"))

    def test_particle_ni(self) -> None:
        env = morph_envelope(self._tok, "に")
        self.assertTrue(env["sn_any_particle"])
        self.assertEqual(env["sn_first_head"], "助詞")


if __name__ == "__main__":
    unittest.main()
