"""Tests for deck gates: legacy surface-only vs cr-* row_matches_deck."""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from cleanroom_pipeline.cr_lanes import CR_LANE_SLUGS  # noqa: E402
from cleanroom_pipeline.deck_filters import (  # noqa: E402
    engine_mode_for_deck_slug,
    row_matches_deck,
    surface_matches_deck,
)


def _row(
    surface: str,
    *,
    sn_token_count: int | None = None,
    sn_first_head: str | None = None,
    cr_kan_lane: str | None = None,
    cr_koto_lane: str | None = None,
    cr_kata_lane: str | None = None,
) -> dict:
    r: dict = {"surface": surface, "reading": "x"}
    if sn_token_count is not None:
        r["sn_token_count"] = sn_token_count
    if sn_first_head is not None:
        r["sn_first_head"] = sn_first_head
    if cr_kan_lane is not None:
        r["cr_kan_lane"] = cr_kan_lane
    if cr_koto_lane is not None:
        r["cr_koto_lane"] = cr_koto_lane
    if cr_kata_lane is not None:
        r["cr_kata_lane"] = cr_kata_lane
    return r


class TestSurfaceMatchesLegacy(unittest.TestCase):
    def test_jou1_hiragana_only(self) -> None:
        self.assertTrue(surface_matches_deck("あいさつ", "jou1"))
        self.assertFalse(surface_matches_deck("あ", "jou1"))
        self.assertFalse(surface_matches_deck("愛情", "jou1"))
        self.assertFalse(surface_matches_deck("アイス", "jou1"))

    def test_jou2_kanji_only_compounds(self) -> None:
        self.assertTrue(surface_matches_deck("愛情", "jou2"))
        self.assertTrue(surface_matches_deck("悪漢", "jou2"))
        self.assertFalse(surface_matches_deck("悪い", "jou2"))
        self.assertFalse(surface_matches_deck("過ぎる", "jou2"))
        self.assertFalse(surface_matches_deck("いる", "jou2"))

    def test_jou3_katakana(self) -> None:
        self.assertTrue(surface_matches_deck("アイス", "jou3"))
        self.assertFalse(surface_matches_deck("いる", "jou3"))
        self.assertFalse(surface_matches_deck("アメリカ合衆国", "jou3"))

    def test_kan_requires_kanji_not_kata_dominant(self) -> None:
        self.assertTrue(surface_matches_deck("哀愁", "kan1"))
        self.assertTrue(surface_matches_deck("食べ物", "kan1"))
        self.assertFalse(surface_matches_deck("締める", "kan1"))
        self.assertFalse(surface_matches_deck("アイス", "kan1"))

    def test_kan2_kan3_length_ladder(self) -> None:
        self.assertTrue(surface_matches_deck("哀愁", "kan1"))
        self.assertFalse(surface_matches_deck("哀愁", "kan2"))
        self.assertTrue(surface_matches_deck("暗号解読", "kan2"))
        self.assertTrue(surface_matches_deck("暗号解読", "kan3"))
        self.assertTrue(surface_matches_deck("防波堤", "kan2"))
        self.assertTrue(surface_matches_deck("防波堤", "kan3"))

    def test_koto_length_and_particle(self) -> None:
        self.assertTrue(surface_matches_deck("開いた口が塞がらない", "koto1"))
        self.assertTrue(surface_matches_deck("開いた口が塞がらない", "koto2"))
        self.assertFalse(surface_matches_deck("いる", "koto1"))

    def test_cr_slugs_always_false_on_surface_api(self) -> None:
        self.assertFalse(surface_matches_deck("走る", "cr-jou1"))
        self.assertFalse(surface_matches_deck("スーパー", "cr-kata3"))

    def test_unknown_slug_false(self) -> None:
        self.assertFalse(surface_matches_deck("あいさつ", "not-a-deck"))
        self.assertFalse(surface_matches_deck("あいさつ", "jou99"))

    def test_cr_lane_slugs_count(self) -> None:
        self.assertEqual(len(CR_LANE_SLUGS), 29)


class TestRowMatchesCrJou(unittest.TestCase):
    def test_single_token_verb(self) -> None:
        self.assertTrue(row_matches_deck(_row("走る", sn_token_count=1, sn_first_head="動詞"), "cr-jou1"))
        self.assertFalse(row_matches_deck(_row("走る", sn_token_count=2, sn_first_head="動詞"), "cr-jou1"))

    def test_keiyodoshi_shape(self) -> None:
        self.assertTrue(row_matches_deck(_row("静か", sn_token_count=1, sn_first_head="形状詞"), "cr-jou3"))
        self.assertFalse(row_matches_deck(_row("静か", sn_token_count=1, sn_first_head="形容詞"), "cr-jou3"))

    def test_noun_lane(self) -> None:
        self.assertTrue(row_matches_deck(_row("猫", sn_token_count=1, sn_first_head="名詞"), "cr-jou4"))

    def test_legacy_jou1_via_row(self) -> None:
        self.assertTrue(row_matches_deck(_row("あいさつ"), "jou1"))
        self.assertFalse(row_matches_deck(_row("愛情"), "jou1"))


class TestRowMatchesCrKata(unittest.TestCase):
    def test_katakana_continuous_first_row(self) -> None:
        self.assertTrue(row_matches_deck(_row("スーパー", sn_token_count=1, sn_first_head="名詞"), "cr-kata3"))
        self.assertTrue(row_matches_deck(_row("アイス", sn_token_count=1, sn_first_head="名詞"), "cr-kata1"))

    def test_mixed_script_rejected(self) -> None:
        r = _row("お母さんのスーパー", sn_token_count=1, sn_first_head="名詞")
        for i in range(1, 11):
            self.assertFalse(row_matches_deck(r, f"cr-kata{i}"))

    def test_short_surface(self) -> None:
        r = _row("ア", sn_token_count=1, sn_first_head="感動詞")
        self.assertFalse(row_matches_deck(r, "cr-kata1"))


class TestRowMatchesCrKata11(unittest.TestCase):
    def test_kata11_requires_enrich_column(self) -> None:
        self.assertFalse(row_matches_deck(_row("ロンドン", sn_token_count=1), "cr-kata11"))
        self.assertTrue(
            row_matches_deck(_row("ロンドン", sn_token_count=1, cr_kata_lane="cr-kata11"), "cr-kata11"),
        )


class TestRowMatchesCrKanKoto(unittest.TestCase):
    def test_kan_requires_enrich_column(self) -> None:
        self.assertFalse(row_matches_deck(_row("東京"), "cr-kan6"))
        self.assertTrue(
            row_matches_deck(_row("東京", cr_kan_lane="cr-kan6"), "cr-kan6"),
        )

    def test_koto_requires_enrich_column(self) -> None:
        self.assertFalse(row_matches_deck(_row("一石二鳥"), "cr-koto4"))
        self.assertTrue(
            row_matches_deck(_row("一石二鳥", cr_koto_lane="cr-koto4"), "cr-koto4"),
        )


class TestEngineMode(unittest.TestCase):
    def test_slug_modes(self) -> None:
        self.assertEqual(engine_mode_for_deck_slug("jou1"), "kihon")
        self.assertEqual(engine_mode_for_deck_slug("jou3"), "katakana")
        self.assertEqual(engine_mode_for_deck_slug("kan2"), "kanji")
        self.assertEqual(engine_mode_for_deck_slug("kata2"), "katakana")
        self.assertEqual(engine_mode_for_deck_slug("koto2"), "kanyoku")
        self.assertEqual(engine_mode_for_deck_slug("cr-jou1"), "kihon")
        self.assertEqual(engine_mode_for_deck_slug("cr-jou3"), "kihon")
        self.assertEqual(engine_mode_for_deck_slug("cr-kata5"), "katakana")
        self.assertEqual(engine_mode_for_deck_slug("cr-kan4"), "kanji")
        self.assertEqual(engine_mode_for_deck_slug("cr-koto3"), "kanyoku")


if __name__ == "__main__":
    unittest.main()
