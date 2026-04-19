"""Sudachi-derived fields for master rows (POS / conjugation / particles)."""

from __future__ import annotations

from typing import Any

from sudachipy import tokenizer


def morph_envelope(tok: tokenizer.Tokenizer, surface: str) -> dict[str, Any]:
    mode = tokenizer.Tokenizer.SplitMode.C
    morphemes = list(tok.tokenize(surface, mode))
    if not morphemes:
        return {
            "sn_token_count": 0,
            "sn_any_particle": False,
            "sn_first_head": "",
            "sn_first_conj": "",
            "sn_pos_heads": "",
        }
    heads: list[str] = []
    any_particle = False
    first_conj = ""
    first_head = ""
    for i, m in enumerate(morphemes):
        pos = m.part_of_speech()
        head = str(pos[0]) if pos else ""
        heads.append(head)
        if head == "助詞":
            any_particle = True
        if i == 0:
            first_head = head
            if len(pos) >= 6 and pos[5] not in ("", "*"):
                first_conj = str(pos[5])
    return {
        "sn_token_count": len(morphemes),
        "sn_any_particle": any_particle,
        "sn_first_head": first_head,
        "sn_first_conj": first_conj,
        "sn_pos_heads": "|".join(heads),
    }
