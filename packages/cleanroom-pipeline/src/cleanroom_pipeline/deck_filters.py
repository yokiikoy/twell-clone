"""Deck gates: legacy Lane-A *shape* (surface-only) vs cr-* taxonomy (row fields)."""

from __future__ import annotations

import re
import unicodedata
from typing import Any

_LANE_RE = re.compile(r"^(?:cr-)?(jou|kata|kan|koto)(\d+)$")

# Sudachi UniDic POS head (pos[0]) -> cr-jou lane number
_JOU_HEAD_TO_NUM: dict[str, int] = {
    "動詞": 1,
    "形容詞": 2,
    "形状詞": 3,
    "名詞": 4,
    "副詞": 5,
    "連体詞": 6,
    "接続詞": 7,
    "感動詞": 8,
}

# NFKC katakana-only body (length >= 2): katakana + prolonged + middle dot + combining marks
_KATA_CONTINUOUS_RE = re.compile(
    r"^[\u30A1-\u30FA\u30FC\u30FB\u31F0-\u31FF\u3099\u309A]+$"
)

_KATA_CHAR_TO_ROW: dict[str, int] = {}


def _register_kata_row(chars: str, row: int) -> None:
    for ch in chars:
        _KATA_CHAR_TO_ROW[ch] = row


_register_kata_row("アァイィウゥエェオォヴヷヸヹヺ", 1)
_register_kata_row("カガキギクグケゲコゴヵ", 2)
_register_kata_row("サザシジスズセゼソゾ", 3)
_register_kata_row("タダチヂツヅテデトド", 4)
_register_kata_row("ナニヌネノ", 5)
_register_kata_row("ハバパヒビピフブプヘベペホボポ", 6)
_register_kata_row("マミムメモ", 7)
_register_kata_row("ラリルレロ", 8)
_register_kata_row("ヤャユュヨョ", 9)
_register_kata_row("ワヮヲン", 10)


def _nfc(s: str) -> str:
    return unicodedata.normalize("NFC", str(s).strip())


def _nfkc(s: str) -> str:
    return unicodedata.normalize("NFKC", str(s).strip())


def _is_kanji(c: str) -> bool:
    o = ord(c)
    return (
        0x4E00 <= o <= 0x9FFF
        or 0x3400 <= o <= 0x4DBF
        or 0xF900 <= o <= 0xFAFF
    )


def _kanji_count(s: str) -> int:
    return sum(1 for c in _nfc(s) if _is_kanji(c))


def _katakana_char(c: str) -> bool:
    o = ord(c)
    return 0x30A1 <= o <= 0x30FA or o == 0x30FC or o == 0x30FB


def _katakana_ratio(s: str) -> float:
    t = _nfc(s)
    if not t:
        return 0.0
    n = sum(1 for c in t if _katakana_char(c))
    return n / len(t)


def _hiragana_syllabic_count(s: str) -> int:
    t = _nfc(s)
    return sum(1 for c in t if "\u3041" <= c <= "\u3096")


_JOU1_RE = re.compile(r"^[\u3041-\u3096\u30FC]+$")
_KOTO_PARTICLE_RE = re.compile(r"[のをにはがもとで、]")


def _parse_lane(deck_slug: str) -> tuple[str, int] | None:
    m = _LANE_RE.match(deck_slug.strip())
    if not m:
        return None
    return m.group(1), int(m.group(2))


def _jou1(s: str) -> bool:
    return bool(_JOU1_RE.fullmatch(s)) and len(s) >= 2


def _jou2(s: str) -> bool:
    kc = _kanji_count(s)
    if kc < 2:
        return False
    if _hiragana_syllabic_count(s) > 0:
        return False
    if _katakana_ratio(s) >= 0.15:
        return False
    return True


def _jou3(s: str) -> bool:
    if _kanji_count(s) != 0:
        return False
    return _katakana_ratio(s) >= 0.88 and len(s) >= 2


def _kan_base(s: str) -> bool:
    if _katakana_ratio(s) >= 0.75:
        return False
    if _JOU1_RE.fullmatch(s):
        return False
    return _kanji_count(s) >= 2


def _kan_n(s: str, n: int) -> bool:
    if not _kan_base(s):
        return False
    kc = _kanji_count(s)
    ln = len(s)
    if n == 1:
        return True
    if n == 2:
        return kc >= 3 or ln >= 5
    if n == 3:
        return kc >= 3 or ln >= 6
    if n == 4:
        return kc >= 4 or ln >= 7
    if n == 5:
        return kc >= 4 or ln >= 8
    if n == 6:
        return kc >= 5 or ln >= 10
    return False


def _kata_n_legacy(s: str, n: int) -> bool:
    r = _katakana_ratio(s)
    if len(s) < 2:
        return False
    if n == 1:
        return r >= 0.88
    if n == 2:
        return r >= 0.9
    if n == 3:
        return r >= 0.92
    return False


def _koto_shape(s: str) -> bool:
    if len(s) < 9:
        return False
    return bool(_KOTO_PARTICLE_RE.search(s)) or len(s) >= 12


def _surface_matches_legacy(surface: str, deck_slug: str) -> bool:
    """Non-``cr-*`` slugs: Lane-A-shaped surface heuristics (jou1–3, kata1–3, kan1–6, koto1–2)."""
    s = _nfc(str(surface).strip())
    if not s or len(s) > 64:
        return False

    parsed = _parse_lane(deck_slug)
    if not parsed or deck_slug.startswith("cr-"):
        return False

    fam, n = parsed
    if fam == "jou":
        if n == 1:
            return _jou1(s)
        if n == 2:
            return _jou2(s)
        if n == 3:
            return _jou3(s)
        return False
    if fam == "kata":
        if 1 <= n <= 3:
            return _kata_n_legacy(s, n)
        return False
    if fam == "kan":
        if 1 <= n <= 6:
            return _kan_n(s, n)
        return False
    if fam == "koto":
        if deck_slug in ("koto1", "koto2"):
            return _koto_shape(s)
        return False

    return False


def _first_katakana_char(surface_nfkc: str) -> str | None:
    for ch in surface_nfkc:
        o = ord(ch)
        if 0x30A1 <= o <= 0x30FA or ch == "ヴ":
            return ch
    return None


def _katakana_continuous_surface(surface: str) -> bool:
    t = _nfkc(surface).strip()
    if len(t) < 2:
        return False
    return bool(_KATA_CONTINUOUS_RE.fullmatch(t))


def _row_matches_cr_jou(row: dict[str, Any], lane_num: int) -> bool:
    if int(row.get("sn_token_count", -1)) != 1:
        return False
    head = str(row.get("sn_first_head") or "")
    want = _JOU_HEAD_TO_NUM.get(head)
    return want == lane_num


def _row_matches_cr_kata11(row: dict[str, Any]) -> bool:
    v = row.get("cr_kata_lane")
    if v is None:
        return False
    return str(v).strip() == "cr-kata11"


def _row_matches_cr_kata(row: dict[str, Any], lane_num: int) -> bool:
    if int(row.get("sn_token_count", -1)) != 1:
        return False
    surf = str(row.get("surface", ""))
    if not _katakana_continuous_surface(surf):
        return False
    t = _nfkc(surf).strip()
    first = _first_katakana_char(t)
    if first is None:
        return False
    row_idx = _KATA_CHAR_TO_ROW.get(first)
    return row_idx == lane_num


def _row_matches_cr_kan(row: dict[str, Any], deck_slug: str) -> bool:
    v = row.get("cr_kan_lane")
    if v is None:
        return False
    return str(v).strip() == deck_slug


def _row_matches_cr_koto(row: dict[str, Any], deck_slug: str) -> bool:
    v = row.get("cr_koto_lane")
    if v is None:
        return False
    return str(v).strip() == deck_slug


def row_matches_deck(row: dict[str, Any], deck_slug: str) -> bool:
    """Primary API: full JSONL row (surface + Sudachi + optional enrich columns)."""
    slug = deck_slug.strip()
    s = _nfc(str(row.get("surface", "")).strip())
    if not s or len(s) > 64:
        return False

    if slug.startswith("cr-"):
        parsed = _parse_lane(slug)
        if not parsed:
            return False
        fam, n = parsed
        if fam == "jou":
            if n < 1 or n > 8:
                return False
            return _row_matches_cr_jou(row, n)
        if fam == "kata":
            if n < 1 or n > 11:
                return False
            if n == 11:
                return _row_matches_cr_kata11(row)
            return _row_matches_cr_kata(row, n)
        if fam == "kan":
            if n < 1 or n > 6:
                return False
            return _row_matches_cr_kan(row, slug)
        if fam == "koto":
            if n < 1 or n > 4:
                return False
            return _row_matches_cr_koto(row, slug)
        return False

    return _surface_matches_legacy(s, slug)


def surface_matches_deck(surface: str, deck_slug: str) -> bool:
    """Legacy surface-only API.

    For ``cr-*`` slugs always returns **False**; use :func:`row_matches_deck` with an ingested row.
    """
    slug = deck_slug.strip()
    if slug.startswith("cr-"):
        return False
    return _surface_matches_legacy(surface, slug)


def engine_mode_for_deck_slug(slug: str) -> str:
    """Align with Web trial ``GameMode`` for mozc/emiel stroke paths."""
    parsed = _parse_lane(slug)
    if parsed:
        fam, num = parsed
        if fam == "jou":
            if slug.startswith("cr-"):
                return "kihon"
            if num == 3:
                return "katakana"
            return "kihon"
        if fam == "kata":
            return "katakana"
        if fam == "kan":
            return "kanji"
        if fam == "koto":
            return "kanyoku"
    if slug.startswith("jou1") or slug.startswith("jou2"):
        return "kihon"
    if slug.startswith("jou3") or slug.startswith("kata"):
        return "katakana"
    if slug.startswith("kan"):
        return "kanji"
    if slug.startswith("koto"):
        return "kanyoku"
    return "kihon"
