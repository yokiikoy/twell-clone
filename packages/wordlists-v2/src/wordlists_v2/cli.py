"""CLI for wordlists-v2 pipeline."""

from __future__ import annotations

import argparse
from pathlib import Path

from wordlists_v2.build_corpus_tatoeba import run_build_corpus_from_tatoeba
from wordlists_v2.build_freq_tsv import run_build_freq_tsv
from wordlists_v2.export_deck import run_export
from wordlists_v2.fetch import run_fetch
from wordlists_v2.filter_gazette_freq import run_filter_gazette_freq
from wordlists_v2.ingest_core import run_ingest
from wordlists_v2.jmdict_kata import run_jmdict_katakana_jsonl
from wordlists_v2.join_strokes_chunked import attach_mode_column, run_join_strokes_chunked
from wordlists_v2.kata11_geo import run_kata11_tsv_to_jsonl
from wordlists_v2.merge_jsonl import merge_jsonl_sources
from wordlists_v2.pipeline import run_pipeline
from wordlists_v2.sample_stratified import run_stratified_sample


def _default_cache() -> Path:
    return Path(__file__).resolve().parents[2] / ".cache" / "open_corpora"


def main(argv: list[str] | None = None) -> None:
    p = argparse.ArgumentParser(prog="wordlists-v2")
    sub = p.add_subparsers(dest="cmd", required=True)

    sp = sub.add_parser("fetch", help="Download manifest corpora")
    sp.add_argument("--dest", type=Path, default=None, help="Destination root (default: package .cache/open_corpora)")
    sp.add_argument("--only", type=str, default=None)
    sp.add_argument("--timeout", type=int, default=600)

    sp = sub.add_parser("build-corpus", help="Tatoeba TSV -> surface\\treading corpus")
    sp.add_argument("--tatoeba", type=Path, required=True)
    sp.add_argument("--out", type=Path, required=True)
    sp.add_argument("--max-surfaces", type=int, default=60_000)

    sp = sub.add_parser("ingest", help="Corpus TSV -> JSONL with Sudachi fields")
    sp.add_argument("--tsv", type=Path, required=True)
    sp.add_argument("--out", type=Path, required=True)

    sp = sub.add_parser("sample", help="Stratified sample JSONL for a deck")
    sp.add_argument("--in", dest="in_path", type=Path, required=True)
    sp.add_argument("--out", type=Path, required=True)
    sp.add_argument("--deck", type=str, required=True)
    sp.add_argument("--max-rows", type=int, required=True)
    sp.add_argument("--seed", type=int, default=42)
    sp.add_argument("--freq-key", type=str, default=None)

    sp = sub.add_parser("attach-mode", help="Add mode column from deck slug")
    sp.add_argument("--in", dest="in_path", type=Path, required=True)
    sp.add_argument("--out", type=Path, required=True)
    sp.add_argument("--deck", type=str, required=True)

    sp = sub.add_parser("join-strokes", help="Chunked join-strokes (engine TS)")
    sp.add_argument("--in", dest="in_path", type=Path, required=True)
    sp.add_argument("--out", type=Path, required=True)
    sp.add_argument("--chunk-lines", type=int, default=10_000)
    sp.add_argument("--mode", type=str, default=None)

    sp = sub.add_parser("export-deck", help="JSONL -> Web JSON array")
    sp.add_argument("--in", dest="in_path", type=Path, required=True)
    sp.add_argument("--out", type=Path, required=True)
    sp.add_argument("--deck", type=str, required=True)
    sp.add_argument("--max-rows", type=int, default=None)
    sp.add_argument("--stroke-sigma", type=float, default=2.5)
    sp.add_argument("--reference-json", type=Path, default=None)
    sp.add_argument(
        "--exclude-json",
        type=Path,
        default=None,
        help="lane+surface+reading excludes (default: heuristics/deepseek_review_excludes.json if present)",
    )
    sp.add_argument(
        "--no-deepseek-excludes",
        action="store_true",
        help="do not apply deepseek_review_excludes.json",
    )

    sp = sub.add_parser("jmdict-kata", help="JMdict katakana headwords -> JSONL")
    sp.add_argument("--xml", type=Path, required=True)
    sp.add_argument("--out", type=Path, required=True)
    sp.add_argument("--max-rows", type=int, default=50_000)

    sp = sub.add_parser("kata11-tsv", help="Kata11 gazette TSV -> JSONL")
    sp.add_argument("--tsv", type=Path, required=True)
    sp.add_argument("--out", type=Path, required=True)

    sp = sub.add_parser("filter-gazette-freq", help="Filter gazette TSV by frequency")
    sp.add_argument("--in", dest="in_path", type=Path, required=True)
    sp.add_argument("--out", type=Path, required=True)
    sp.add_argument("--min-count", type=int, required=True)
    g = sp.add_mutually_exclusive_group(required=True)
    g.add_argument("--freq-tsv", type=Path, default=None)
    g.add_argument("--freq-sqlite", type=Path, default=None)
    sp.add_argument("--sqlite-table", type=str, default="freq")

    sp = sub.add_parser("merge-jsonl", help="Merge JSONL files (dedupe by surface, first wins)")
    sp.add_argument("--inputs", nargs="+", type=Path, required=True)
    sp.add_argument("--out", type=Path, required=True)

    sp = sub.add_parser("build-freq-tsv", help="Tatoeba jpn_sentences.tsv -> morpheme frequency TSV")
    sp.add_argument("--tatoeba", type=Path, required=True)
    sp.add_argument("--out", type=Path, required=True)
    sp.add_argument("--max-lines", type=int, default=None)

    sp = sub.add_parser("pipeline", help="Full build to packages/wordlists-v2/output/preview")
    sp.add_argument("--skip-fetch", action="store_true")
    sp.add_argument("--skip-wiktionary", action="store_true")
    sp.add_argument("--deploy", action="store_true")
    sp.add_argument("--max-surfaces", type=int, default=60_000)
    sp.add_argument("--max-rows-per-deck", type=int, default=2000)
    sp.add_argument("--max-jmdict-kata", type=int, default=50_000)
    sp.add_argument("--max-jmdict-kata11", type=int, default=20_000)
    sp.add_argument("--freq-min-count", type=int, default=1)
    sp.add_argument("--freq-max-lines", type=int, default=500_000)
    sp.add_argument("--stroke-sigma", type=float, default=2.5)
    sp.add_argument("--seed", type=int, default=42)
    sp.add_argument("--chunk-lines", type=int, default=10_000)
    sp.add_argument("--fetch-timeout", type=int, default=600)
    sp.add_argument(
        "--exclude-json",
        type=Path,
        default=None,
        help="override path for deepseek-style excludes JSON",
    )
    sp.add_argument(
        "--no-deepseek-excludes",
        action="store_true",
        help="skip heuristics/deepseek_review_excludes.json during export",
    )
    sp.add_argument(
        "--dict-rewrites-json",
        type=Path,
        default=None,
        help="override path for category-1 dictionary-form rewrite keys (cr-jou only)",
    )
    sp.add_argument(
        "--no-dict-form-rewrites",
        action="store_true",
        help="skip heuristics/deepseek_review_rewrites.json (join-strokes前の辞書形寄せ)",
    )

    args = p.parse_args(argv)
    dest = getattr(args, "dest", None)

    if args.cmd == "fetch":
        d = dest if dest is not None else _default_cache()
        prov = run_fetch(d, only=getattr(args, "only", None), timeout=args.timeout)
        print(prov.get("provenance_path", ""))

    elif args.cmd == "build-corpus":
        n = run_build_corpus_from_tatoeba(args.tatoeba, args.out, max_surfaces=args.max_surfaces)
        print(n)

    elif args.cmd == "ingest":
        n = run_ingest(args.tsv, args.out)
        print(n)

    elif args.cmd == "sample":
        n = run_stratified_sample(
            args.in_path,
            args.out,
            args.deck,
            max_rows=args.max_rows,
            seed=args.seed,
            freq_key=args.freq_key,
        )
        print(n)

    elif args.cmd == "attach-mode":
        attach_mode_column(args.in_path, args.out, args.deck)

    elif args.cmd == "join-strokes":
        run_join_strokes_chunked(
            args.in_path,
            args.out,
            chunk_lines=args.chunk_lines,
            mode=args.mode,
        )

    elif args.cmd == "export-deck":
        n = run_export(
            args.in_path,
            args.out,
            args.deck,
            max_rows=args.max_rows,
            stroke_sigma=args.stroke_sigma,
            reference_json=args.reference_json,
            use_deepseek_excludes=not args.no_deepseek_excludes,
            exclude_keys_path=args.exclude_json,
        )
        print(n)

    elif args.cmd == "jmdict-kata":
        n = run_jmdict_katakana_jsonl(args.xml, args.out, max_rows=args.max_rows)
        print(n)

    elif args.cmd == "kata11-tsv":
        n = run_kata11_tsv_to_jsonl(args.tsv, args.out)
        print(n)

    elif args.cmd == "filter-gazette-freq":
        kept, total = run_filter_gazette_freq(
            args.in_path,
            args.out,
            min_count=args.min_count,
            freq_tsv=args.freq_tsv,
            freq_sqlite=args.freq_sqlite,
            sqlite_table=args.sqlite_table,
        )
        print(f"{kept}/{total}")

    elif args.cmd == "merge-jsonl":
        n = merge_jsonl_sources(list(args.inputs), args.out)
        print(n)

    elif args.cmd == "build-freq-tsv":
        n = run_build_freq_tsv(
            args.tatoeba,
            args.out,
            max_lines=args.max_lines,
        )
        print(n)

    elif args.cmd == "pipeline":
        import json as json_mod

        result = run_pipeline(
            skip_fetch=args.skip_fetch,
            skip_wiktionary=args.skip_wiktionary,
            deploy=args.deploy,
            max_surfaces=args.max_surfaces,
            max_rows_per_deck=args.max_rows_per_deck,
            max_jmdict_kata=args.max_jmdict_kata,
            max_jmdict_kata11=args.max_jmdict_kata11,
            freq_min_count=args.freq_min_count,
            freq_max_lines=args.freq_max_lines,
            stroke_sigma=args.stroke_sigma,
            seed=args.seed,
            chunk_lines=args.chunk_lines,
            fetch_timeout=args.fetch_timeout,
            use_deepseek_excludes=not args.no_deepseek_excludes,
            exclude_keys_path=args.exclude_json,
            use_dict_form_rewrites=not args.no_dict_form_rewrites,
            dict_rewrites_path=args.dict_rewrites_json,
        )
        print(json_mod.dumps(result, ensure_ascii=False, indent=2))
