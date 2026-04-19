"""Optional strict morphology gates for jou-style decks (requires ingest sn_* fields)."""

from __future__ import annotations

from typing import Any


def strict_jou_verb_row(row: dict[str, Any]) -> bool:
    """True when row looks like a single-token 動詞 in 終止形 with no 助詞 in the span."""
    if row.get("sn_any_particle") is True:
        return False
    try:
        n = int(row.get("sn_token_count", -1))
    except (TypeError, ValueError):
        return False
    if n != 1:
        return False
    if row.get("sn_first_head") != "動詞":
        return False
    conj = str(row.get("sn_first_conj") or "")
    if not conj.startswith("終止形"):
        return False
    return True
