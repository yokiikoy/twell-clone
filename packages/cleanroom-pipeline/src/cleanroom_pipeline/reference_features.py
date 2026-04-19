"""Aggregate structural features from Lane-A-style JSON (no full-text export in summaries)."""

from __future__ import annotations

import json
import math
import re
import statistics
from datetime import datetime, timezone
from pathlib import Path
from collections.abc import Callable
from typing import Any

from cleanroom_pipeline.deck_filters import surface_matches_deck

KNOWN_DECK_FILES: tuple[str, ...] = (
    "twelljr-jou1.json",
    "twelljr-jou2.json",
    "twelljr-jou3.json",
    "twelljr-kan1.json",
    "twelljr-kan2.json",
    "twelljr-kan3.json",
    "twelljr-kata1.json",
    "twelljr-kata2.json",
    "twelljr-kata3.json",
    "twelljr-koto1.json",
    "twelljr-koto2.json",
)


def package_root() -> Path:
    """``packages/cleanroom-pipeline`` (contains ``src/`` and ``heuristics/``)."""
    return Path(__file__).resolve().parents[2]


def heuristics_yaml_path() -> Path:
    return package_root() / "heuristics" / "decks.yaml"


def is_kanji(c: str) -> bool:
    o = ord(c)
    return 0x4E00 <= o <= 0x9FFF or 0x3400 <= o <= 0x4DBF or 0xF900 <= o <= 0xFAFF


def char_class(c: str) -> str:
    o = ord(c)
    if c.isspace():
        return "ws"
    if 0x3041 <= o <= 0x3096:
        return "h"
    if 0x30A1 <= o <= 0x30FA:
        return "kt"
    if o == 0x30FC:
        return "prolong"
    if is_kanji(c):
        return "k"
    if c.isascii() and (c.isalpha() or c.isdigit()):
        return "lat"
    if o in (0x30FB, 0xFF0C):
        return "punct"
    return "other"


def surface_stats(surface: str) -> dict[str, float | int]:
    cls = [char_class(c) for c in surface]
    n = len(surface)
    nh = sum(1 for x in cls if x == "h")
    nkt = sum(1 for x in cls if x == "kt")
    nk = sum(1 for x in cls if x == "k")
    npr = sum(1 for x in cls if x == "prolong")
    nlat = sum(1 for x in cls if x == "lat")
    nws = sum(1 for x in cls if x == "ws")
    denom = max(1, n - nws)
    return {
        "n": n,
        "h": nh,
        "kt": nkt,
        "k": nk,
        "pr": npr,
        "lat": nlat,
        "ws": nws,
        "h_r": nh / denom,
        "kt_r": nkt / denom,
        "k_r": nk / denom,
        "lat_r": nlat / denom,
    }


def percentile(xs: list[float], p: float) -> float:
    if not xs:
        return float("nan")
    xs = sorted(xs)
    i = (len(xs) - 1) * p / 100
    lo = int(math.floor(i))
    hi = int(math.ceil(i))
    if lo == hi:
        return xs[lo]
    return xs[lo] * (hi - i) + xs[hi] * (i - lo)


def deck_slug_from_lane_a_filename(name: str) -> str | None:
    if not name.startswith("twelljr-") or not name.endswith(".json"):
        return None
    return name[len("twelljr-") : -len(".json")]


def discover_lane_a_paths(input_dir: Path) -> list[tuple[str, Path]]:
    out: list[tuple[str, Path]] = []
    for name in KNOWN_DECK_FILES:
        p = input_dir / name
        if not p.is_file():
            continue
        slug = deck_slug_from_lane_a_filename(name)
        if slug:
            out.append((slug, p))
    return out


def _length_quantiles(lens: list[int]) -> dict[str, int | float]:
    if not lens:
        return {"min": 0, "p5": float("nan"), "p50": float("nan"), "p90": float("nan"), "max": 0}
    fl = [float(x) for x in lens]
    return {
        "min": min(lens),
        "p5": round(percentile(fl, 5)),
        "p50": round(percentile(fl, 50)),
        "p90": round(percentile(fl, 90)),
        "max": max(lens),
    }


def _float_quantiles(xs: list[float]) -> dict[str, float]:
    if not xs:
        return {"min": float("nan"), "p5": float("nan"), "p50": float("nan"), "p90": float("nan"), "max": float("nan")}
    fl = list(xs)
    return {
        "min": min(fl),
        "p5": percentile(fl, 5),
        "p50": percentile(fl, 50),
        "p90": percentile(fl, 90),
        "max": max(fl),
    }


def composition_fractions(
    surfaces: list[str], stats: list[dict[str, float | int]]
) -> dict[str, float]:
    n = len(stats)
    if n == 0:
        return {
            "strict_hiragana_only_regex": 0.0,
            "relaxed_hira_no_kanji_kata_lat": 0.0,
            "has_kanji": 0.0,
            "kanji_only_surface": 0.0,
            "kanji_hira_mixed": 0.0,
            "katakana_dom_kt_ge_0_85_no_kanji": 0.0,
            "katakana_dom_kt_ge_0_85_any": 0.0,
            "surface_has_whitespace": 0.0,
        }

    def frac(pred: Callable[[dict[str, float | int]], bool]) -> float:
        return sum(1 for st in stats if pred(st)) / n

    pure_hira = frac(
        lambda st: st["k"] == 0
        and st["kt"] == 0
        and st["lat"] == 0
        and (st["h"] + st["pr"]) >= max(1, (st["n"] - st["ws"]) - 1)
    )
    strict_hira = (
        sum(
            1
            for s in surfaces
            if re.fullmatch(r"[\u3041-\u3096\u30FC]+", s.replace(" ", ""))
        )
        / n
    )
    return {
        "strict_hiragana_only_regex": strict_hira,
        "relaxed_hira_no_kanji_kata_lat": pure_hira,
        "has_kanji": frac(lambda st: st["k"] >= 1),
        "kanji_only_surface": frac(lambda st: st["k"] >= 1 and st["h"] == 0 and st["kt"] == 0),
        "kanji_hira_mixed": frac(lambda st: st["k"] >= 1 and st["h"] >= 1),
        "katakana_dom_kt_ge_0_85_no_kanji": frac(lambda st: st["kt_r"] >= 0.85 and st["k"] == 0),
        "katakana_dom_kt_ge_0_85_any": frac(lambda st: st["kt_r"] >= 0.85),
        "surface_has_whitespace": frac(lambda st: st["ws"] >= 1),
    }


def deck_filter_pass_rate(surfaces: list[str], deck_slug: str) -> float:
    if not surfaces:
        return 0.0
    ok = sum(1 for s in surfaces if surface_matches_deck(s, deck_slug))
    return ok / len(surfaces)


def aggregate_surfaces(
    deck_slug: str,
    source_file: str,
    surfaces: list[str],
    readings: list[str] | None,
) -> dict[str, Any]:
    """Build one deck entry for summary.json (no sample surfaces)."""
    n = len(surfaces)
    if n == 0:
        return {
            "n": 0,
            "source_file": source_file,
            "surface_length": {"min": 0, "p5": None, "p50": None, "p90": None, "max": 0},
            "mean_ratios": {"hiragana": None, "katakana": None, "kanji": None, "latin": None},
            "kanji_count_per_surface": {
                "mean": None,
                "quantiles": {"min": None, "p5": None, "p50": None, "p90": None, "max": None},
            },
            "composition_fractions": composition_fractions([], []),
            "deck_filter_pass_rate_lane_a": 0.0,
        }
    stats = [surface_stats(s) for s in surfaces]
    lens = [int(st["n"]) for st in stats]
    h_r = [float(st["h_r"]) for st in stats]
    kt_r = [float(st["kt_r"]) for st in stats]
    k_r = [float(st["k_r"]) for st in stats]
    lat_r = [float(st["lat_r"]) for st in stats]
    k_cnt = [int(st["k"]) for st in stats]

    entry: dict[str, Any] = {
        "n": n,
        "source_file": source_file,
        "surface_length": _length_quantiles(lens),
        "mean_ratios": {
            "hiragana": statistics.mean(h_r) if h_r else float("nan"),
            "katakana": statistics.mean(kt_r) if kt_r else float("nan"),
            "kanji": statistics.mean(k_r) if k_r else float("nan"),
            "latin": statistics.mean(lat_r) if lat_r else float("nan"),
        },
        "kanji_count_per_surface": {
            "mean": statistics.mean(k_cnt) if k_cnt else float("nan"),
            "quantiles": _float_quantiles([float(x) for x in k_cnt]),
        },
        "composition_fractions": composition_fractions(surfaces, stats),
        "deck_filter_pass_rate_lane_a": deck_filter_pass_rate(surfaces, deck_slug),
    }
    if readings is not None and len(readings) == n:
        rlen = [len(r) for r in readings]
        entry["reading_ascii_len"] = {
            "mean": statistics.mean(rlen) if rlen else float("nan"),
            "quantiles": _float_quantiles([float(x) for x in rlen]),
        }
    return entry


def profile_lane_a_json(path: Path, deck_slug: str) -> dict[str, Any]:
    raw = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(raw, list):
        raise SystemExit(f"expected JSON array: {path}")
    surfaces = [str(x.get("surface", "")) for x in raw]
    readings = [str(x.get("reading", "")) for x in raw]
    return aggregate_surfaces(deck_slug, path.name, surfaces, readings)


def build_reference_summary(input_dir: Path) -> dict[str, Any]:
    decks: dict[str, Any] = {}
    for slug, p in discover_lane_a_paths(input_dir):
        decks[slug] = profile_lane_a_json(p, slug)
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "input_dir": str(input_dir.resolve()),
        "decks": decks,
    }


def render_heuristic_report_md(summary: dict[str, Any], heuristics_rel: str) -> str:
    lines: list[str] = []
    lines.append("# Lane A reference — heuristic tuning report")
    lines.append("")
    lines.append(f"- Generated: `{summary.get('generated_at', '')}`")
    lines.append(f"- Input dir: `{summary.get('input_dir', '')}`")
    lines.append(f"- Heuristic spec (threshold notes): `{heuristics_rel}`")
    lines.append("")
    lines.append("## Per-deck aggregates (Lane A only)")
    lines.append("")
    lines.append(
        "| deck | n | len p50 | len p90 | mean k_r | strict_hira% | deck_filter_pass |"
    )
    lines.append("|------|---|---------|---------|----------|--------------|------------------|")
    decks = summary.get("decks") or {}
    for slug in sorted(decks.keys()):
        d = decks[slug]
        sl = d.get("surface_length") or {}
        cf = (d.get("composition_fractions") or {}).get("strict_hiragana_only_regex", 0.0)
        mr = d.get("mean_ratios") or {}
        pass_r = d.get("deck_filter_pass_rate_lane_a", 0.0)
        lines.append(
            f"| {slug} | {d.get('n', 0)} | {sl.get('p50', '')} | {sl.get('p90', '')} | "
            f"{mr.get('kanji', 0):.3f} | {cf * 100:.1f} | {pass_r * 100:.1f}% |"
        )
    lines.append("")
    lines.append("## Notes")
    lines.append("")
    lines.append(
        "- `deck_filter_pass_rate_lane_a` is the fraction of **Lane A surfaces** that satisfy "
        "current `surface_matches_deck` for that **legacy** deck slug (expect ~100% if files match slugs). "
        "It does not apply to `cr-*` lanes, which are validated on full `master.jsonl` rows via `row_matches_deck`."
    )
    lines.append(
        "- This report stores **aggregates only** in `summary.json`, not full word lists."
    )
    lines.append("")
    lines.append("---")
    lines.append("")
    lines.append("## LLM / human prompt fragment (paste below the fold)")
    lines.append("")
    lines.append(
        "You are helping tune **open-corpus deck filters** for a typing game. "
        "You are given **numeric tables only** (no full word lists). "
        f"Compare aggregate statistics above with the commented thresholds in `{heuristics_rel}`. "
        "Propose concrete threshold or regex changes for `deck_filters.py` so that "
        "(1) Lane A aggregate shape stays close, (2) open-corpus `master.jsonl` yields enough "
        "candidates per deck (see `compare-coverage` report). "
        "Do not reproduce or infer specific copyrighted word strings from the numbers alone."
    )
    lines.append("")
    return "\n".join(lines) + "\n"


def load_summary(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))
