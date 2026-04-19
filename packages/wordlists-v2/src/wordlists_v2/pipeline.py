"""End-to-end wordlist build: fetch → corpus → merge → per-deck export."""

from __future__ import annotations

import json
import shutil
from pathlib import Path

from wordlists_v2.build_freq_tsv import run_build_freq_tsv
from wordlists_v2.build_manifest import write_build_manifest
from wordlists_v2.build_corpus_tatoeba import run_build_corpus_from_tatoeba
from wordlists_v2.export_deck import run_export
from wordlists_v2.fetch import run_fetch
from wordlists_v2.geonames_kata11 import run_geonames_katakana_places_tsv
from wordlists_v2.gates import engine_mode_for_deck_slug
from wordlists_v2.ingest_core import run_ingest
from wordlists_v2.jmdict_kata import run_jmdict_katakana_jsonl
from wordlists_v2.jmdict_kata11 import run_jmdict_kata11_jsonl
from wordlists_v2.dict_form_rewrite import apply_dictionary_form_rewrites
from wordlists_v2.join_strokes_chunked import attach_mode_column, run_join_strokes_chunked
from wordlists_v2.kata11_geo import run_kata11_tsv_to_jsonl
from wordlists_v2.lanes import CR_LANE_SLUGS
from wordlists_v2.merge_jsonl import merge_jsonl_sources
from wordlists_v2.sample_stratified import run_stratified_sample
from wordlists_v2.wiktionary_koto import koto_draft_tsv_to_jsonl, run_koto_draft_tsv


def package_root() -> Path:
    """``packages/wordlists-v2`` (contains ``src/``)."""
    return Path(__file__).resolve().parents[2]


def repo_root() -> Path:
    """Monorepo root (parent of ``packages``)."""
    return Path(__file__).resolve().parents[4]


def default_paths() -> tuple[Path, Path, Path, Path]:
    pkg = package_root()
    cache = pkg / ".cache" / "open_corpora"
    work = pkg / ".cache" / "work"
    preview = pkg / "output" / "preview"
    web_cleanroom = repo_root() / "apps" / "web" / "public" / "cleanroom"
    return cache, work, preview, web_cleanroom


def run_pipeline(
    *,
    skip_fetch: bool = False,
    skip_wiktionary: bool = False,
    deploy: bool = False,
    max_surfaces: int = 60_000,
    max_rows_per_deck: int = 2000,
    max_jmdict_kata: int = 50_000,
    max_jmdict_kata11: int = 20_000,
    freq_min_count: int = 1,
    freq_max_lines: int | None = 500_000,
    stroke_sigma: float = 2.5,
    seed: int = 42,
    chunk_lines: int = 10_000,
    fetch_timeout: int = 600,
    use_deepseek_excludes: bool = True,
    exclude_keys_path: Path | None = None,
    use_dict_form_rewrites: bool = True,
    dict_rewrites_path: Path | None = None,
) -> dict[str, object]:
    cache, work, preview, web_cleanroom = default_paths()
    work.mkdir(parents=True, exist_ok=True)
    preview.mkdir(parents=True, exist_ok=True)

    steps: list[str] = []
    prov_path: Path | None = None

    if not skip_fetch:
        prov = run_fetch(cache, timeout=fetch_timeout)
        prov_path = Path(str(prov.get("provenance_path", "")))
        steps.append("fetch")
    else:
        prov_path = cache / "SOURCE_PROVENANCE.json"

    tatoeba_tsv = cache / "tatoeba" / "jpn_sentences.tsv"
    jmdict_xml = cache / "jmdict" / "JMdict_e.xml"
    corpus_tsv = work / "corpus.tsv"
    tatoeba_jsonl = work / "tatoeba_ingest.jsonl"
    jmdict_kata_jsonl = work / "jmdict_kata.jsonl"
    jmdict_k11_jsonl = work / "jmdict_kata11.jsonl"
    geonames_txt = cache / "geonames" / "cities15000.txt"
    geonames_kata11_tsv = work / "geonames_kata11.tsv"
    geonames_kata11_jsonl = work / "geonames_kata11.jsonl"
    master_jsonl = work / "master.jsonl"
    freq_tsv = work / "freq.tsv"
    koto_draft_tsv = work / "koto_draft.tsv"
    koto_jsonl = work / "koto_gazette.jsonl"

    if not tatoeba_tsv.is_file():
        raise SystemExit(f"missing Tatoeba TSV (run fetch or use --skip-fetch with cache): {tatoeba_tsv}")
    if not jmdict_xml.is_file():
        raise SystemExit(f"missing JMdict XML: {jmdict_xml}")

    n_corpus = run_build_corpus_from_tatoeba(
        tatoeba_tsv,
        corpus_tsv,
        max_surfaces=max_surfaces,
    )
    steps.append(f"build-corpus:{n_corpus}")

    n_ing = run_ingest(corpus_tsv, tatoeba_jsonl)
    steps.append(f"ingest:{n_ing}")

    n_jk = run_jmdict_katakana_jsonl(jmdict_xml, jmdict_kata_jsonl, max_rows=max_jmdict_kata)
    steps.append(f"jmdict-kata:{n_jk}")

    n_j11 = run_jmdict_kata11_jsonl(jmdict_xml, jmdict_k11_jsonl, max_rows=max_jmdict_kata11)
    steps.append(f"jmdict-kata11:{n_j11}")

    merge_parts: list[Path] = [tatoeba_jsonl, jmdict_kata_jsonl, jmdict_k11_jsonl]

    if geonames_txt.is_file():
        n_g = run_geonames_katakana_places_tsv(geonames_txt, geonames_kata11_tsv)
        steps.append(f"geonames-kata11-tsv:{n_g}")
        if n_g > 0:
            n_gj = run_kata11_tsv_to_jsonl(geonames_kata11_tsv, geonames_kata11_jsonl)
            steps.append(f"geonames-kata11-jsonl:{n_gj}")
            if n_gj > 0:
                merge_parts.append(geonames_kata11_jsonl)

    n_freq = run_build_freq_tsv(tatoeba_tsv, freq_tsv, max_lines=freq_max_lines)
    steps.append(f"build-freq-tsv:{n_freq}")

    if not skip_wiktionary:
        n_kd = run_koto_draft_tsv(koto_draft_tsv)
        steps.append(f"koto-draft:{n_kd}")
        if n_kd > 0:
            # Phrase surfaces rarely appear as whole tokens in morpheme freq; do not freq-gate koto here.
            n_kj = koto_draft_tsv_to_jsonl(koto_draft_tsv, koto_jsonl)
            steps.append(f"koto-jsonl:{n_kj}")
            if n_kj > 0:
                merge_parts.append(koto_jsonl)

    n_m = merge_jsonl_sources(merge_parts, master_jsonl)
    steps.append(f"merge:{n_m}")

    for slug in CR_LANE_SLUGS:
        sample_p = work / f"sample_{slug}.jsonl"
        mode_p = work / f"mode_{slug}.jsonl"
        stroke_p = work / f"stroke_{slug}.jsonl"
        out_json = preview / f"twelljr-{slug}.json"
        run_stratified_sample(
            master_jsonl,
            sample_p,
            slug,
            max_rows=max_rows_per_deck,
            seed=seed,
        )
        attach_mode_column(sample_p, mode_p, slug)
        n_rw, n_rw_changed = apply_dictionary_form_rewrites(
            mode_p,
            slug,
            keys_path=dict_rewrites_path,
            use_rewrites=use_dict_form_rewrites,
        )
        if n_rw_changed:
            steps.append(f"dict-rewrite:{slug}:{n_rw_changed}/{n_rw}")
        mode = engine_mode_for_deck_slug(slug)
        run_join_strokes_chunked(
            mode_p,
            stroke_p,
            chunk_lines=chunk_lines,
            mode=mode,
        )
        run_export(
            stroke_p,
            out_json,
            slug,
            max_rows=None,
            stroke_sigma=stroke_sigma,
            reference_json=None,
            use_deepseek_excludes=use_deepseek_excludes,
            exclude_keys_path=exclude_keys_path,
        )

    steps.append(f"export:{len(CR_LANE_SLUGS)}-decks")

    manifest_path = preview / "BUILD_MANIFEST.json"
    write_build_manifest(
        manifest_path,
        steps=steps,
        source_provenance_path=prov_path if prov_path and prov_path.is_file() else None,
        extra={
            "preview_dir": str(preview),
            "max_rows_per_deck": max_rows_per_deck,
            "freq_min_count": freq_min_count,
            "skip_wiktionary": skip_wiktionary,
        },
    )

    deployed = False
    if deploy:
        if not web_cleanroom.is_dir():
            raise SystemExit(f"deploy target not found: {web_cleanroom}")
        for p in preview.glob("twelljr-*.json"):
            shutil.copy2(p, web_cleanroom / p.name)
        shutil.copy2(manifest_path, web_cleanroom / "BUILD_MANIFEST.json")
        deployed = True

    return {
        "preview_dir": str(preview),
        "master_jsonl": str(master_jsonl),
        "build_manifest": str(manifest_path),
        "deployed": deployed,
        "steps": steps,
    }
