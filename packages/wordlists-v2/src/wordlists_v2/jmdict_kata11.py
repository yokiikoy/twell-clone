"""JMdict entries tagged with place-related misc -> katakana keb -> cr-kata11 JSONL."""

from __future__ import annotations

import json
import xml.etree.ElementTree as ET
from pathlib import Path

from sudachipy import dictionary, tokenizer

from wordlists_v2.corpus_utils import make_cutlet, surface_reading_row
from wordlists_v2.gates import is_katakana_continuous_surface
from wordlists_v2.sudachi_morph import morph_envelope


def _local(tag: str) -> str:
    if "}" in tag:
        return tag.split("}", 1)[1]
    return tag


def _entry_suggests_place(entry_el: ET.Element) -> bool:
    raw = ET.tostring(entry_el, encoding="unicode")
    return (
        "place_name" in raw
        or "place name" in raw.lower()
        or "&place;" in raw
        or "地名" in raw
        or "name_type" in raw
        or "Place name" in raw
    )


def _iter_katakana_surfaces_from_place_entries(jmdict_xml: Path):
    """Place-tagged entries: katakana may appear in ``keb`` or ``reb`` (loanword readings)."""
    for event, elem in ET.iterparse(jmdict_xml, events=("end",)):
        if _local(elem.tag) != "entry":
            continue
        if not _entry_suggests_place(elem):
            elem.clear()
            continue
        pending: list[str] = []
        for child in elem:
            lt = _local(child.tag)
            if lt == "k_ele":
                for ke in child:
                    if _local(ke.tag) == "keb" and ke.text:
                        t = ke.text.strip()
                        if is_katakana_continuous_surface(t):
                            pending.append(t)
            elif lt == "r_ele":
                for re in child:
                    if _local(re.tag) == "reb" and re.text:
                        t = re.text.strip()
                        if is_katakana_continuous_surface(t):
                            pending.append(t)
        elem.clear()
        for t in dict.fromkeys(pending):
            yield t


def run_jmdict_kata11_jsonl(
    jmdict_xml: Path,
    out_jsonl: Path,
    *,
    max_rows: int = 20_000,
) -> int:
    if not jmdict_xml.is_file():
        raise SystemExit(f"JMdict XML not found: {jmdict_xml}")

    katsu = make_cutlet()
    dic = dictionary.Dictionary(dict="core")
    tok = dic.create()

    seen: set[str] = set()
    n = 0
    out_jsonl.parent.mkdir(parents=True, exist_ok=True)
    with out_jsonl.open("w", encoding="utf-8") as fout:
        for keb in _iter_katakana_surfaces_from_place_entries(jmdict_xml):
            if n >= max_rows:
                break
            if keb in seen:
                continue
            row_sr = surface_reading_row(katsu, keb)
            if row_sr is None:
                continue
            surface, reading = row_sr
            rec = {
                "surface": surface,
                "normalized": surface,
                "reading": reading,
                "cr_kata_lane": "cr-kata11",
                "source": "jmdict_place_keb",
            }
            rec.update(morph_envelope(tok, surface))
            seen.add(surface)
            fout.write(json.dumps(rec, ensure_ascii=False) + "\n")
            n += 1
    return n
