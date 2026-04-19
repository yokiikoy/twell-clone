"""Invoke engine cleanroom-join-strokes.ts in line chunks to limit memory use."""

from __future__ import annotations

import json
import os
import shutil
import subprocess
from pathlib import Path

from wordlists_v2.gates import engine_mode_for_deck_slug


def _repo_root() -> Path:
    return Path(__file__).resolve().parents[4]


def _engine_dir() -> Path:
    return _repo_root() / "packages" / "engine"


def _join_strokes_script() -> Path:
    return _engine_dir() / "scripts" / "cleanroom-join-strokes.ts"


def run_join_strokes_chunked(
    jsonl_in: Path,
    jsonl_out: Path,
    *,
    chunk_lines: int = 10_000,
    mode: str | None = None,
) -> None:
    """Read JSONL, append mozc_min_strokes via TS engine in chunks."""
    script = _join_strokes_script()
    eng = _engine_dir()
    if not script.is_file():
        raise SystemExit(f"join-strokes script not found: {script}")

    all_lines: list[str] = []
    with jsonl_in.open(encoding="utf-8") as f:
        for line in f:
            if line.strip():
                all_lines.append(line.rstrip("\n"))

    if not all_lines:
        jsonl_out.parent.mkdir(parents=True, exist_ok=True)
        jsonl_out.write_text("", encoding="utf-8")
        return

    chunks: list[list[str]] = []
    buf: list[str] = []
    for line in all_lines:
        buf.append(line)
        if len(buf) >= chunk_lines:
            chunks.append(buf)
            buf = []
    if buf:
        chunks.append(buf)

    cache_rel = Path(".cache") / "wordlists-v2-join"
    cache_dir = eng / cache_rel
    cache_dir.mkdir(parents=True, exist_ok=True)

    out_parts: list[str] = []
    npx = "npx.cmd" if os.name == "nt" else "npx"

    try:
        for i, chunk in enumerate(chunks):
            rel_in = cache_rel / f"c{i}_in.jsonl"
            rel_out = cache_rel / f"c{i}_out.jsonl"
            (eng / rel_in).write_text("\n".join(chunk) + "\n", encoding="utf-8")
            cmd = [
                npx,
                "--yes",
                "tsx",
                str(Path("scripts") / "cleanroom-join-strokes.ts"),
                "--input",
                str(rel_in).replace("\\", "/"),
                "--output",
                str(rel_out).replace("\\", "/"),
            ]
            if mode:
                cmd.extend(["--mode", mode])
            subprocess.run(cmd, cwd=str(eng), check=True)
            out_file = eng / rel_out
            out_parts.append(out_file.read_text(encoding="utf-8").rstrip("\n"))
    finally:
        if cache_dir.is_dir():
            shutil.rmtree(cache_dir, ignore_errors=True)

    jsonl_out.parent.mkdir(parents=True, exist_ok=True)
    body = "\n".join(p for p in out_parts if p)
    jsonl_out.write_text(body + ("\n" if body else ""), encoding="utf-8")


def attach_mode_column(jsonl_in: Path, jsonl_out: Path, deck_slug: str) -> None:
    """Add ``mode`` to each row from engine_mode_for_deck_slug."""
    mode = engine_mode_for_deck_slug(deck_slug)
    lines_out: list[str] = []
    with jsonl_in.open(encoding="utf-8") as fin:
        for line in fin:
            line = line.strip()
            if not line:
                continue
            r = json.loads(line)
            r["mode"] = mode
            lines_out.append(json.dumps(r, ensure_ascii=False))
    jsonl_out.parent.mkdir(parents=True, exist_ok=True)
    jsonl_out.write_text("\n".join(lines_out) + "\n", encoding="utf-8")
