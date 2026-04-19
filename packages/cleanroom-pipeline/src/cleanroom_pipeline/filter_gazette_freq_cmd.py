"""Filter draft gazette TSV rows using a simple frequency table (TSV or SQLite)."""

from __future__ import annotations

import sqlite3
from pathlib import Path


def load_freq_tsv(path: Path) -> dict[str, int]:
    m: dict[str, int] = {}
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        parts = line.split("\t")
        if len(parts) < 2:
            continue
        surf = parts[0].strip()
        try:
            cnt = int(parts[1].strip())
        except ValueError:
            continue
        if surf:
            m[surf] = m.get(surf, 0) + cnt
    return m


def load_freq_sqlite(path: Path, table: str = "freq") -> dict[str, int]:
    conn = sqlite3.connect(str(path))
    try:
        cur = conn.execute(f"SELECT surface, count FROM {table}")
        return {str(r[0]): int(r[1]) for r in cur.fetchall()}
    finally:
        conn.close()


def run_filter_gazette_freq(
    gazette_in: Path,
    out_path: Path,
    *,
    min_count: int,
    freq_tsv: Path | None,
    freq_sqlite: Path | None,
    sqlite_table: str,
) -> tuple[int, int]:
    if bool(freq_tsv) == bool(freq_sqlite):
        raise SystemExit("Provide exactly one of --freq-tsv or --freq-sqlite")

    freq: dict[str, int]
    if freq_tsv is not None:
        freq = load_freq_tsv(freq_tsv)
    else:
        freq = load_freq_sqlite(freq_sqlite, table=sqlite_table)

    kept = 0
    total = 0
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with gazette_in.open(encoding="utf-8") as fin, out_path.open("w", encoding="utf-8") as fout:
        for line in fin:
            raw = line.strip()
            if not raw or raw.startswith("#"):
                continue
            parts = raw.split("\t")
            if len(parts) < 2:
                continue
            total += 1
            surf = parts[0].strip()
            c = freq.get(surf, 0)
            if c >= min_count:
                fout.write(f"{parts[0].strip()}\t{parts[1].strip()}\n")
                kept += 1
    return kept, total
