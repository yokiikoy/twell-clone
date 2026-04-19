"""Draft koto gazette TSV from ja.wiktionary.org category members (CC BY-SA)."""

from __future__ import annotations

import json
import time
import urllib.parse
import urllib.request
from pathlib import Path

# Category title -> cr_koto_lane (game slug). Titles match ja.wiktionary.org category pages.
KOTO_CATEGORY_SLUGS: list[tuple[str, str]] = [
    ("Category:日本語 ことわざ", "cr-koto1"),
    ("Category:日本語 慣用句", "cr-koto2"),
    ("Category:故事成語", "cr-koto3"),
    ("Category:四字熟語", "cr-koto4"),
]


def _api_get(params: dict[str, str], *, timeout: int = 60) -> dict:
    base = "https://ja.wiktionary.org/w/api.php"
    qs = urllib.parse.urlencode(params)
    url = f"{base}?{qs}"
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "wordlists-v2/0.1 (typing game; +https://github.com/)"},
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def fetch_category_members(cmtitle: str, *, max_titles: int = 2000) -> list[str]:
    """Return page titles (main namespace preferred)."""
    out: list[str] = []
    continue_cm: str | None = None
    while len(out) < max_titles:
        params: dict[str, str] = {
            "action": "query",
            "list": "categorymembers",
            "cmtitle": cmtitle,
            "cmlimit": "500",
            "format": "json",
        }
        if continue_cm:
            params["cmcontinue"] = continue_cm
        data = _api_get(params)
        q = data.get("query") or {}
        cm = q.get("categorymembers") or []
        for m in cm:
            title = str(m.get("title") or "")
            if not title or title.startswith("Category:"):
                continue
            # Strip Wiktionary subpage markers
            title = title.split("/")[0].strip()
            if title:
                out.append(title)
            if len(out) >= max_titles:
                break
        cont = data.get("continue") or {}
        continue_cm = cont.get("cmcontinue")
        if not continue_cm:
            break
        time.sleep(0.3)
    return out[:max_titles]


def run_koto_draft_tsv(
    out_tsv: Path,
    *,
    max_per_category: int = 2000,
) -> int:
    """Write surface<TAB>cr_koto_lane rows from Wiktionary categories."""
    out_tsv.parent.mkdir(parents=True, exist_ok=True)
    seen: set[str] = set()
    n = 0
    with out_tsv.open("w", encoding="utf-8") as fout:
        for cmtitle, lane in KOTO_CATEGORY_SLUGS:
            try:
                titles = fetch_category_members(cmtitle, max_titles=max_per_category)
            except OSError as e:
                print(f"wiktionary_koto: warning: {cmtitle}: {e}", flush=True)
                continue
            for t in titles:
                if t in seen:
                    continue
                seen.add(t)
                fout.write(f"{t}\t{lane}\n")
                n += 1
    return n


def koto_draft_tsv_to_jsonl(tsv_path: Path, out_jsonl: Path) -> int:
    """Add Cutlet reading; output rows with cr_koto_lane for merge."""
    from wordlists_v2.corpus_utils import make_cutlet, surface_reading_row

    katsu = make_cutlet()
    n = 0
    out_jsonl.parent.mkdir(parents=True, exist_ok=True)
    with tsv_path.open(encoding="utf-8") as fin, out_jsonl.open("w", encoding="utf-8") as fout:
        for line in fin:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            parts = line.split("\t")
            if len(parts) < 2:
                continue
            surface = parts[0].strip()
            lane = parts[1].strip()
            if len(surface) > 64:
                continue
            sr = surface_reading_row(katsu, surface)
            if sr is None:
                continue
            _, reading = sr
            rec = {
                "surface": surface,
                "normalized": surface,
                "reading": reading,
                "cr_koto_lane": lane,
                "source": "ja.wiktionary_category",
            }
            fout.write(json.dumps(rec, ensure_ascii=False) + "\n")
            n += 1
    return n
