#!/usr/bin/env python3
"""
Chunk `review.tsv`, call DeepSeek Chat API per chunk, merge JSON issue lists.

Requires repo-root `.env` with DEEPSEEK_API_KEY (or api_key / OPENAI_API_KEY).
Run from repository root:

  python scripts/cleanroom/deepseek_review_wordlist.py

PYTHONPATH is set automatically for `cleanroom_pipeline`.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

# packages/cleanroom-pipeline/src
_REPO_ROOT = Path(__file__).resolve().parents[2]
_SRC = _REPO_ROOT / "packages" / "cleanroom-pipeline" / "src"
if str(_SRC) not in sys.path:
    sys.path.insert(0, str(_SRC))

from cleanroom_pipeline.draft_llm_gazette_cmd import (  # noqa: E402
    call_deepseek_chat,
    load_env_file,
    resolve_api_key,
)


def _parse_json_array(text: str) -> list[Any]:
    """Parse first complete JSON array; tolerate trailing commentary after valid JSON."""
    t = text.strip()
    if t.startswith("```"):
        t = re.sub(r"^```[a-zA-Z]*\s*", "", t)
        t = re.sub(r"\s*```\s*$", "", t)
    t = t.strip()
    dec = json.JSONDecoder()
    for i, ch in enumerate(t):
        if ch != "[":
            continue
        try:
            obj, _end = dec.raw_decode(t[i:])
            if isinstance(obj, list):
                return obj
        except json.JSONDecodeError:
            continue
    try:
        data = json.loads(t)
        if isinstance(data, list):
            return data
    except json.JSONDecodeError:
        pass
    raise ValueError("Could not parse a JSON array from model response (first 800 chars):\n" + t[:800])


def _build_user_prompt(
    *,
    chunk_tsv: str,
    chunk_index: int,
    chunk_line_start: int,
    chunk_line_end: int,
    max_items: int,
    context_excerpt: str,
) -> str:
    return (
        f"{context_excerpt}\n\n"
        "---\n\n"
        "You are reviewing ONLY the following TSV block (tab-separated). "
        "First line is the header; data lines follow. "
        f"This is chunk {chunk_index} (source lines {chunk_line_start}-{chunk_line_end} in the original file).\n\n"
        "Return ONLY a single line: a minified JSON array (no pretty-print, no line breaks inside the JSON). "
        "No markdown fences, no commentary before or after the array.\n"
        "Each element must be an object with keys: "
        '"lane", "surface", "reading", "code", "category" (integer 1-7), "reason" (short Japanese string; avoid backslashes and double-quotes inside reason).\n'
        f"Include at most {max_items} items, highest-priority issues first.\n"
        "If nothing matches, return [].\n\n"
        "Problem categories (same meaning as in the context above):\n"
        "1=活用・語形が不自然 2=レーンと矛盾しうる 3=固有名・センシティブ疑い "
        "4=記号・混在 5=文脈依存で単独意味不明 6=希少・難読 7=その他\n\n"
        "TSV block:\n"
        f"{chunk_tsv}"
    )


def _default_context() -> str:
    return (
        "データ概要: クリーンルーム語表は Tatoeba 等を Sudachi で形態素化しマージしたマスターから、"
        "レーンごとにゲートでフィルタしてサンプリングしたものです。"
        "Jou(cr-jou*)は単一形態素＋品詞一致のため、連用形・語幹のみなど辞書形でない表層が混じり得ます。"
        "Kata はカタカナ連続ルール、Kata11 は外国地名由来、koto は Wiktionary カテゴリ題名由来です。"
        "辞書形・一般語のみを保証していません。人名・固有名排除は別工程です。"
    )


def _read_context_file(path: Path | None) -> str:
    if path is None or not path.is_file():
        return _default_context()
    return path.read_text(encoding="utf-8").strip()[:12000]


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument(
        "--input",
        type=Path,
        default=_REPO_ROOT / "packages" / "wordlists-v2" / "output" / "llm_review" / "review.tsv",
        help="Input TSV (lane, surface, reading, code, index)",
    )
    p.add_argument(
        "--out",
        type=Path,
        default=_REPO_ROOT / "packages" / "wordlists-v2" / "output" / "llm_review" / "deepseek_review.json",
        help="Output JSON path",
    )
    p.add_argument("--chunk-lines", type=int, default=500, help="Max data lines per API call")
    p.add_argument(
        "--max-items",
        type=int,
        default=35,
        help="Max issues to request per chunk (keep low to avoid truncated JSON)",
    )
    p.add_argument("--max-chunks", type=int, default=0, help="If >0, only process first N chunks (smoke test)")
    p.add_argument("--delay-seconds", type=float, default=0.0, help="Sleep between API calls")
    p.add_argument("--timeout", type=int, default=180, help="HTTP timeout per request")
    p.add_argument("--temperature", type=float, default=0.25, help="DeepSeek sampling temperature")
    p.add_argument(
        "--max-tokens",
        type=int,
        default=8192,
        help="API max_tokens (completion); raise if JSON is truncated",
    )
    p.add_argument(
        "--context-file",
        type=Path,
        default=None,
        help="Optional markdown with extra context (e.g. docs/cleanroom/GEMINI_REVIEW_CONTEXT_ja.md)",
    )
    p.add_argument("--dry-run", action="store_true", help="Do not call API; print chunk stats only")
    args = p.parse_args(argv)

    load_env_file(_REPO_ROOT / ".env")
    api_key = resolve_api_key()
    if not api_key and not args.dry_run:
        raise SystemExit(
            "No API key: set DEEPSEEK_API_KEY (or api_key / OPENAI_API_KEY) in environment or .env"
        )

    inp = args.input.resolve()
    if not inp.is_file():
        raise SystemExit(f"Input not found: {inp}")

    raw = inp.read_text(encoding="utf-8").splitlines()
    if not raw:
        raise SystemExit("Empty input file")
    header = raw[0]
    data_lines = raw[1:]
    if not data_lines:
        raise SystemExit("No data rows after header")

    chunks: list[list[str]] = []
    for i in range(0, len(data_lines), args.chunk_lines):
        chunks.append(data_lines[i : i + args.chunk_lines])

    if args.max_chunks and args.max_chunks > 0:
        chunks = chunks[: args.max_chunks]

    context_excerpt = _read_context_file(args.context_file)

    if args.dry_run:
        print(f"dry-run: input={inp} data_lines={len(data_lines)} chunks={len(chunks)}", file=sys.stderr)
        if chunks:
            sample = header + "\n" + "\n".join(chunks[0])
            prompt = _build_user_prompt(
                chunk_tsv=sample,
                chunk_index=0,
                chunk_line_start=2,
                chunk_line_end=1 + len(chunks[0]),
                max_items=args.max_items,
                context_excerpt=context_excerpt,
            )
            print(f"dry-run: first_prompt_chars={len(prompt)}", file=sys.stderr)
        return 0

    all_issues: list[dict[str, Any]] = []
    for idx, block_lines in enumerate(chunks):
        line_start = 2 + idx * args.chunk_lines
        line_end = line_start + len(block_lines) - 1
        chunk_tsv = header + "\n" + "\n".join(block_lines)
        print(f"chunk {idx + 1}/{len(chunks)} lines {line_start}-{line_end} ...", file=sys.stderr, flush=True)
        items: list[Any] = []
        scales = (1.0, 0.55, 0.3)
        last_err: str | None = None
        for scale in scales:
            mi = max(5, int(args.max_items * scale))
            if scale < 1.0:
                print(f"  retry with max_items={mi} ...", file=sys.stderr, flush=True)
            prompt_try = _build_user_prompt(
                chunk_tsv=chunk_tsv,
                chunk_index=idx,
                chunk_line_start=line_start,
                chunk_line_end=line_end,
                max_items=mi,
                context_excerpt=context_excerpt,
            )
            content = call_deepseek_chat(
                api_key=api_key,
                user_prompt=prompt_try,
                timeout=args.timeout,
                temperature=args.temperature,
                max_tokens=args.max_tokens,
            )
            try:
                items = _parse_json_array(content)
                break
            except ValueError as e:
                last_err = str(e)
        else:
            raise SystemExit(last_err or "parse failed")
        for it in items:
            if isinstance(it, dict):
                row = dict(it)
                row["chunk_index"] = idx
                row["source_line_start"] = line_start
                row["source_line_end"] = line_end
                all_issues.append(row)
        if args.delay_seconds > 0 and idx < len(chunks) - 1:
            time.sleep(args.delay_seconds)

    out = {
        "meta": {
            "input": str(inp),
            "output_generated_at": datetime.now(timezone.utc).isoformat(),
            "chunk_lines": args.chunk_lines,
            "max_items_per_chunk": args.max_items,
            "chunks_processed": len(chunks),
            "temperature": args.temperature,
            "max_tokens": args.max_tokens,
            "total_issues": len(all_issues),
        },
        "issues": all_issues,
    }
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(out, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {args.out} ({len(all_issues)} issues)", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
