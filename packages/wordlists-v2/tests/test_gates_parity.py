"""Parity: wordlists_v2.gates vs cleanroom_pipeline.deck_filters for supported slugs."""

from __future__ import annotations

import pytest

from cleanroom_pipeline.deck_filters import row_matches_deck as cr_row_matches
from wordlists_v2.gates import row_matches_deck as v2_row_matches


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


@pytest.mark.parametrize(
    ("slug", "row"),
    [
        ("cr-jou1", _row("走る", sn_token_count=1, sn_first_head="動詞")),
        ("cr-jou3", _row("静か", sn_token_count=1, sn_first_head="形状詞")),
        ("cr-jou4", _row("猫", sn_token_count=1, sn_first_head="名詞")),
        ("jou1", _row("あいさつ")),
        ("cr-kata3", _row("スーパー", sn_token_count=1, sn_first_head="名詞")),
        ("cr-kata1", _row("アイス", sn_token_count=1, sn_first_head="名詞")),
        ("cr-kan6", _row("東京", cr_kan_lane="cr-kan6")),
        ("cr-koto4", _row("一石二鳥", cr_koto_lane="cr-koto4")),
        ("cr-kata11", _row("ロンドン", sn_token_count=1, cr_kata_lane="cr-kata11")),
    ],
)
def test_row_matches_parity(slug: str, row: dict) -> None:
    assert v2_row_matches(row, slug) == cr_row_matches(row, slug)


def test_mixed_script_kata_rejected_both() -> None:
    r = _row("お母さんのスーパー", sn_token_count=1, sn_first_head="名詞")
    for i in range(1, 11):
        assert v2_row_matches(r, f"cr-kata{i}") == cr_row_matches(r, f"cr-kata{i}")
