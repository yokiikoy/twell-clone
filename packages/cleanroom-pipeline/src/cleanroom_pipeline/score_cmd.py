"""Score master JSONL rows against a profile vector."""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np

from cleanroom_pipeline.embed_simple import DIM, cosine_sim, text_to_vec


def run_score(master_path: Path, profile_path: Path, out_path: Path) -> int:
    prof = json.loads(profile_path.read_text(encoding="utf-8"))
    vec = np.array(prof["vector"], dtype=np.float64)
    if vec.shape[0] != DIM:
        raise SystemExit("profile dim mismatch")
    n = 0
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with master_path.open(encoding="utf-8") as fin, out_path.open("w", encoding="utf-8") as fout:
        for line in fin:
            line = line.strip()
            if not line:
                continue
            row = json.loads(line)
            surface = str(row.get("surface", ""))
            c = text_to_vec(surface)
            row["char_similarity"] = cosine_sim(c, vec)
            fout.write(json.dumps(row, ensure_ascii=False) + "\n")
            n += 1
    return n
