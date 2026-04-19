"""CLI entry for cleanroom-pipeline."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from cleanroom_pipeline.build_corpus_cmd import run_build_corpus
from cleanroom_pipeline.build_corpus_tatoeba_cmd import run_build_corpus_from_tatoeba
from cleanroom_pipeline.compare_coverage_cmd import run_compare_coverage
from cleanroom_pipeline.draft_llm_gazette_cmd import run_draft_llm_gazette
from cleanroom_pipeline.enrich_gazette_cmd import run_enrich_lane_column
from cleanroom_pipeline.filter_gazette_freq_cmd import run_filter_gazette_freq
from cleanroom_pipeline.export_cmd import run_export
from cleanroom_pipeline.fetch_open_corpora_cmd import run_fetch_open_corpora
from cleanroom_pipeline.filter_deck_cmd import run_filter_deck
from cleanroom_pipeline.reference_features_cmd import run_reference_features
from cleanroom_pipeline.ingest import run_ingest
from cleanroom_pipeline.embed_semantic import run_profile_semantic, run_score_semantic
from cleanroom_pipeline.profile_cmd import run_profile
from cleanroom_pipeline.score_cmd import run_score


def main() -> None:
    p = argparse.ArgumentParser(prog="cleanroom-pipeline")
    sub = p.add_subparsers(dest="cmd", required=True)

    p_ingest = sub.add_parser("ingest", help="TSV surface[\\treading] -> JSONL")
    p_ingest.add_argument("-i", "--input", type=Path, required=True)
    p_ingest.add_argument("-o", "--output", type=Path, required=True)

    p_prof = sub.add_parser(
        "profile",
        help="Lane-A JSON array -> centroid profile (Unicode histogram; legacy bootstrap)",
    )
    p_prof.add_argument("-i", "--input", type=Path, required=True)
    p_prof.add_argument("--deck", type=str, required=True)
    p_prof.add_argument("-o", "--output", type=Path, required=True)

    p_ps = sub.add_parser(
        "profile-semantic",
        help="Lane-A JSON array (default) or filtered JSONL -> centroid profile via sentence embeddings ([semantic])",
    )
    p_ps.add_argument(
        "-i",
        "--input",
        type=Path,
        required=True,
        help="Lane-A JSON array, or JSONL from filter-deck when --from-candidates-jsonl",
    )
    p_ps.add_argument("--deck", type=str, required=True)
    p_ps.add_argument("-o", "--output", type=Path, required=True)
    p_ps.add_argument(
        "--from-candidates-jsonl",
        action="store_true",
        help="Treat --input as newline JSON objects with a surface field (sample up to --max-profile-surfaces)",
    )
    p_ps.add_argument(
        "--max-profile-surfaces",
        type=int,
        default=4096,
        help="with --from-candidates-jsonl: max unique surfaces to embed for the centroid (default: 4096)",
    )
    p_ps.add_argument(
        "--model-id",
        type=str,
        default="sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2",
    )

    p_score = sub.add_parser("score", help="Score master JSONL vs histogram profile (legacy)")
    p_score.add_argument("-i", "--input", type=Path, required=True)
    p_score.add_argument("-p", "--profile", type=Path, required=True)
    p_score.add_argument("-o", "--output", type=Path, required=True)

    p_ss = sub.add_parser(
        "score-semantic",
        help="Score master JSONL vs semantic profile (sentence-transformers; [semantic])",
    )
    p_ss.add_argument("-i", "--input", type=Path, required=True)
    p_ss.add_argument("-p", "--profile", type=Path, required=True)
    p_ss.add_argument("-o", "--output", type=Path, required=True)

    p_fetch = sub.add_parser(
        "fetch-open-corpora",
        help="Download pinned open-license text/dict dumps from the web (network required)",
    )
    p_fetch.add_argument(
        "--dest",
        type=Path,
        required=True,
        help="Directory for downloads + extracted files + SOURCE_PROVENANCE.json",
    )
    p_fetch.add_argument("--only", type=str, default=None, help="Fetch a single manifest id, e.g. tatoeba_jpn_sentences")
    p_fetch.add_argument("--timeout", type=int, default=600, help="Per-artifact HTTP timeout seconds (default 600)")

    p_bct = sub.add_parser(
        "build-corpus-from-tatoeba",
        help="Write surface[TAB]reading TSV from Tatoeba jpn_sentences.tsv (Sudachi+Cutlet; network fetch separate)",
    )
    p_bct.add_argument("-i", "--input", type=Path, required=True, help="jpn_sentences.tsv from fetch-open-corpora")
    p_bct.add_argument("-o", "--output", type=Path, required=True)
    p_bct.add_argument("--max-surfaces", type=int, default=60_000)
    p_bct.add_argument(
        "--no-full-sentences",
        action="store_true",
        help="Do not emit whole-sentence surfaces (only Sudachi morphemes)",
    )
    p_bct.add_argument(
        "--min-rows",
        type=int,
        default=1000,
        help="Fail if fewer unique surfaces written (default 1000; use lower only for tests)",
    )

    p_bc = sub.add_parser(
        "build-corpus",
        help="[legacy] Write surface[TAB]reading TSV from wordfreq+Cutlet (requires pip install wordfreq)",
    )
    p_bc.add_argument("-o", "--output", type=Path, required=True)
    p_bc.add_argument("--max-words", type=int, default=150_000)

    p_ekan = sub.add_parser(
        "enrich-kan",
        help="Stream JSONL; optional TSV sets cr_kan_lane per surface (manifest-backed lists upstream)",
    )
    p_ekan.add_argument("-i", "--input", type=Path, required=True)
    p_ekan.add_argument("-o", "--output", type=Path, required=True)
    p_ekan.add_argument(
        "--gazette",
        type=Path,
        default=None,
        help="TSV lines: surface<TAB>lane_slug (e.g. cr-kan6); comments #… OK",
    )
    p_ekan.add_argument(
        "--annotate-field",
        type=str,
        default=None,
        help="If gazette has a third tab column, copy it into this JSONL field (e.g. kan_theme)",
    )

    p_draft = sub.add_parser(
        "draft-llm-gazette",
        help="[network] Call DeepSeek chat API; write draft TSV (use .env DEEPSEEK_API_KEY; do not commit output)",
    )
    p_draft.add_argument(
        "--family",
        type=str,
        required=True,
        choices=("kan", "koto"),
        help="Which cr-kan* or cr-koto* lane family to draft for",
    )
    p_draft.add_argument("-o", "--output", type=Path, required=True, help="Draft TSV path (e.g. under .cache/)")
    p_draft.add_argument("--count", type=int, default=80, help="How many lines to ask the model for (default 80)")
    p_draft.add_argument(
        "--themes",
        type=str,
        default="自然,ビジネス,感情,学び",
        help="Comma-separated theme hints for the prompt",
    )
    p_draft.add_argument(
        "--env-file",
        type=Path,
        default=None,
        help="Dotenv file (default: <repo>/.env)",
    )
    p_draft.add_argument("--timeout", type=int, default=180, help="HTTP timeout seconds (default 180)")

    p_fgf = sub.add_parser(
        "filter-gazette-freq",
        help="Keep gazette TSV rows whose surface has frequency >= min in a TSV or SQLite table",
    )
    p_fgf.add_argument("-i", "--input", type=Path, required=True, help="Draft gazette TSV")
    p_fgf.add_argument("-o", "--output", type=Path, required=True)
    p_fgf.add_argument("--min-count", type=int, default=1000, help="Minimum corpus count (default 1000)")
    p_fgf.add_argument("--freq-tsv", type=Path, default=None, help="surface<TAB>count frequency table")
    p_fgf.add_argument("--freq-sqlite", type=Path, default=None, help="SQLite path with table freq(surface TEXT, count INT)")
    p_fgf.add_argument(
        "--sqlite-table",
        type=str,
        default="freq",
        help="Table name for --freq-sqlite (default freq)",
    )

    p_ekoto = sub.add_parser(
        "enrich-koto",
        help="Stream JSONL; optional TSV sets cr_koto_lane per surface (manifest-backed lists upstream)",
    )
    p_ekoto.add_argument("-i", "--input", type=Path, required=True)
    p_ekoto.add_argument("-o", "--output", type=Path, required=True)
    p_ekoto.add_argument(
        "--gazette",
        type=Path,
        default=None,
        help="TSV lines: surface<TAB>lane_slug (e.g. cr-koto4); comments #… OK",
    )
    p_ekoto.add_argument(
        "--annotate-field",
        type=str,
        default=None,
        help="If gazette has a third tab column, copy it into this JSONL field (e.g. koto_kind)",
    )

    p_fd = sub.add_parser(
        "filter-deck",
        help="Keep JSONL rows matching deck gates (row-based for cr-*, surface for legacy)",
    )
    p_fd.add_argument("-i", "--input", type=Path, required=True)
    p_fd.add_argument("-o", "--output", type=Path, required=True)
    p_fd.add_argument("--deck", type=str, required=True, help="e.g. jou1, cr-jou1, cr-kata4")
    p_fd.add_argument(
        "--strict-jou-verb-morph",
        action="store_true",
        help="With --deck jou1 or cr-jou1: keep only single-token 動詞 in 終止形, no 助詞 (requires ingest sn_* fields)",
    )
    p_fd.add_argument(
        "--dedupe-reading",
        action="store_true",
        help="After other gates: keep first row per NFC reading (empty reading falls back to surface)",
    )

    p_exp = sub.add_parser("export", help="Scored JSONL -> web twelljr JSON array")
    p_exp.add_argument("-i", "--input", type=Path, required=True)
    p_exp.add_argument("-o", "--output", type=Path, required=True)
    p_exp.add_argument("--deck", type=str, required=True, help="slug for code prefix, e.g. jou1 or cr-jou1")
    p_exp.add_argument(
        "--reference-json",
        type=Path,
        default=None,
        help="Lane A-style JSON array; output length matches its len within ±count-tolerance (default 15%%)",
    )
    p_exp.add_argument(
        "--count-tolerance",
        type=float,
        default=0.15,
        help="allowed relative deviation from reference length when --reference-json is set (default: 0.15)",
    )
    p_exp.add_argument("--max-rows", type=int, default=None)
    p_exp.add_argument("--stroke-sigma", type=float, default=2.5)

    p_rf = sub.add_parser(
        "reference-features",
        help="Lane A twelljr-*.json -> aggregate summary.json + HEURISTIC_REPORT.md (local only)",
    )
    p_rf.add_argument(
        "--input-dir",
        type=Path,
        required=True,
        help="Directory containing twelljr-jou1.json etc. (typically apps/web/public)",
    )
    p_rf.add_argument(
        "--output-dir",
        type=Path,
        required=True,
        help="e.g. packages/cleanroom-pipeline/.cache/reference_profiles",
    )

    p_cc = sub.add_parser(
        "compare-coverage",
        help="Compare master.jsonl deck-filter counts to Lane A reference summary.json",
    )
    p_cc.add_argument("-i", "--input", type=Path, required=True, help="master.jsonl")
    p_cc.add_argument(
        "--reference-profiles",
        type=Path,
        required=True,
        help="summary.json from reference-features",
    )
    p_cc.add_argument(
        "-o",
        "--output",
        type=Path,
        default=None,
        help="Write COVERAGE_REPORT.md (default: print JSON to stdout)",
    )
    p_cc.add_argument("--deck", type=str, default=None, help="Single deck slug only")

    args = p.parse_args()
    if args.cmd == "fetch-open-corpora":
        prov = run_fetch_open_corpora(args.dest, only=args.only, timeout=args.timeout)
        print(json.dumps(prov, ensure_ascii=False, indent=2))
    elif args.cmd == "build-corpus-from-tatoeba":
        n = run_build_corpus_from_tatoeba(
            args.input,
            args.output,
            max_surfaces=args.max_surfaces,
            include_full_sentences=not args.no_full_sentences,
            min_rows=args.min_rows,
        )
        print(f"build-corpus-from-tatoeba: {n} rows -> {args.output}")
    elif args.cmd == "build-corpus":
        n = run_build_corpus(args.output, max_words=args.max_words)
        print(f"build-corpus: {n} rows -> {args.output}")
    elif args.cmd == "draft-llm-gazette":
        n = run_draft_llm_gazette(
            args.output,
            family=args.family,
            count=args.count,
            themes=args.themes,
            env_file=args.env_file,
            timeout=args.timeout,
        )
        print(f"draft-llm-gazette: {n} rows -> {args.output}")
    elif args.cmd == "filter-gazette-freq":
        kept, total = run_filter_gazette_freq(
            args.input,
            args.output,
            min_count=args.min_count,
            freq_tsv=args.freq_tsv,
            freq_sqlite=args.freq_sqlite,
            sqlite_table=args.sqlite_table,
        )
        print(f"filter-gazette-freq: kept {kept} / {total} -> {args.output}")
    elif args.cmd == "enrich-kan":
        n = run_enrich_lane_column(
            args.input,
            args.output,
            "cr_kan_lane",
            args.gazette,
            meta_column=args.annotate_field,
        )
        print(f"enrich-kan: {n} rows -> {args.output}")
    elif args.cmd == "enrich-koto":
        n = run_enrich_lane_column(
            args.input,
            args.output,
            "cr_koto_lane",
            args.gazette,
            meta_column=args.annotate_field,
        )
        print(f"enrich-koto: {n} rows -> {args.output}")
    elif args.cmd == "filter-deck":
        n = run_filter_deck(
            args.input,
            args.output,
            args.deck,
            strict_jou_verb_morph=args.strict_jou_verb_morph,
            dedupe_reading=args.dedupe_reading,
        )
        print(f"filter-deck: {n} rows -> {args.output}")
    elif args.cmd == "ingest":
        n = run_ingest(args.input, args.output)
        print(f"ingest: {n} rows -> {args.output}")
    elif args.cmd == "profile":
        run_profile(args.input, args.deck, args.output)
        print(f"profile: {args.output}")
    elif args.cmd == "profile-semantic":
        run_profile_semantic(
            args.input,
            args.deck,
            args.output,
            model_id=args.model_id,
            from_candidates_jsonl=args.from_candidates_jsonl,
            max_profile_surfaces=args.max_profile_surfaces,
        )
        print(f"profile-semantic: {args.output}")
    elif args.cmd == "score":
        n = run_score(args.input, args.profile, args.output)
        print(f"score: {n} rows -> {args.output}")
    elif args.cmd == "score-semantic":
        n = run_score_semantic(args.input, args.profile, args.output)
        print(f"score-semantic: {n} rows -> {args.output}")
    elif args.cmd == "export":
        n = run_export(
            args.input,
            args.output,
            args.deck,
            max_rows=args.max_rows,
            stroke_sigma=args.stroke_sigma,
            reference_json=args.reference_json,
            count_tolerance=args.count_tolerance,
        )
        print(f"export: {n} rows -> {args.output}")
    elif args.cmd == "reference-features":
        p1, p2 = run_reference_features(args.input_dir, args.output_dir)
        print(f"reference-features: {p1}")
        print(f"reference-features: {p2}")
    elif args.cmd == "compare-coverage":
        cov = run_compare_coverage(
            args.input,
            args.reference_profiles,
            args.output,
            args.deck,
        )
        if args.output is None:
            print(json.dumps(cov, ensure_ascii=False, indent=2))
        else:
            print(f"compare-coverage: {args.output}")
