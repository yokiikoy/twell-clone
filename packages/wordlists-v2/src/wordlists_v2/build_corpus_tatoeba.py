"""Build surface[TAB]reading TSV from Tatoeba jpn_sentences.tsv (Sudachi + Cutlet)."""

from __future__ import annotations

from pathlib import Path

from sudachipy import dictionary, tokenizer

from wordlists_v2.corpus_utils import make_cutlet, surface_reading_row

_TRAIL_SENT_PUNCT = frozenset("\u3002\uFF0E\uFF01\uFF1F\u300D\u300F\uFF09")


def _strip_trailing_sentence_punct(s: str) -> str:
    t = s.rstrip()
    while t and t[-1] in _TRAIL_SENT_PUNCT:
        t = t[:-1].rstrip()
    return t


_SKIP_POS_HEADS = frozenset(
    {
        "助詞",
        "助動詞",
        "記号",
        "補助記号",
        "空白",
    }
)


def _try_emit(
    seen: dict[str, str],
    ordered: list[tuple[str, str]],
    katsu: object,
    surface: str,
) -> None:
    row = surface_reading_row(katsu, surface)
    if row is None:
        return
    s, r = row
    if s in seen:
        return
    seen[s] = r
    ordered.append((s, r))


def run_build_corpus_from_tatoeba(
    tatoeba_sentences_tsv: Path,
    out_path: Path,
    *,
    max_surfaces: int = 60_000,
    include_full_sentences: bool = True,
    min_morpheme_len: int = 2,
    min_rows: int = 1000,
) -> int:
    if not tatoeba_sentences_tsv.is_file():
        raise SystemExit(f"Tatoeba file not found: {tatoeba_sentences_tsv}")

    katsu = make_cutlet()
    dic = dictionary.Dictionary(dict="core")
    tok = dic.create()
    mode = tokenizer.Tokenizer.SplitMode.C

    seen: dict[str, str] = {}
    ordered: list[tuple[str, str]] = []

    with tatoeba_sentences_tsv.open(encoding="utf-8") as fin:
        for line in fin:
            if len(seen) >= max_surfaces:
                break
            line = line.rstrip("\n\r")
            if not line or line.startswith("#"):
                continue
            parts = line.split("\t")
            if len(parts) < 3:
                continue
            if parts[1].strip() != "jpn":
                continue
            text = parts[2].strip()
            if not text:
                continue

            morphemes = list(tok.tokenize(text, mode))
            for m in morphemes:
                if len(seen) >= max_surfaces:
                    break
                pos = m.part_of_speech()
                head = str(pos[0]) if pos else ""
                if head in _SKIP_POS_HEADS:
                    continue
                surf = m.surface()
                if len(surf) < min_morpheme_len:
                    continue
                _try_emit(seen, ordered, katsu, surf)

            if len(seen) >= max_surfaces:
                break

            if include_full_sentences and len(seen) < max_surfaces:
                sent = _strip_trailing_sentence_punct(text)
                if min_morpheme_len <= len(sent) <= 64:
                    _try_emit(seen, ordered, katsu, sent)

    if len(ordered) < min_rows:
        raise SystemExit(f"too few tatoeba-derived corpus rows: {len(ordered)} (min_rows={min_rows})")

    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", encoding="utf-8") as fout:
        for s, r in ordered:
            fout.write(f"{s}\t{r}\n")
    return len(ordered)
