"""Multilingual sentence embeddings (semantic primary path)."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any

import numpy as np

# Public SBERT model; Apache-2.0. See HF model card for citation.
DEFAULT_MODEL_ID = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
EMB_DIM = 384

_model_cache: dict[str, Any] = {}


def _load_model(model_id: str = DEFAULT_MODEL_ID):
    try:
        from sentence_transformers import SentenceTransformer
    except ImportError as e:
        raise SystemExit(
            "sentence-transformers is required for semantic profile/score. "
            "Install: pip install -e '.[semantic]'"
        ) from e
    if model_id not in _model_cache:
        _model_cache[model_id] = SentenceTransformer(model_id)
    return _model_cache[model_id]


def encode_surfaces(
    texts: list[str],
    *,
    model_id: str = DEFAULT_MODEL_ID,
    batch_size: int = 64,
) -> np.ndarray:
    """L2-normalized embedding matrix (n, dim)."""
    if not texts:
        return np.zeros((0, EMB_DIM), dtype=np.float64)
    model = _load_model(model_id)
    arr = model.encode(
        texts,
        batch_size=batch_size,
        normalize_embeddings=True,
        show_progress_bar=False,
    )
    return np.asarray(arr, dtype=np.float64)


def _placeholder_centroid(deck_id: str) -> np.ndarray:
    """Deterministic unit vector when a lane has no surfaces (empty filter)."""
    digest = hashlib.sha256(deck_id.encode("utf-8")).digest()
    seed = int.from_bytes(digest[:8], "big", signed=False)
    rng = np.random.default_rng(seed)
    v = rng.standard_normal(EMB_DIM)
    n = float(np.linalg.norm(v))
    if n < 1e-12:
        v = np.zeros(EMB_DIM, dtype=np.float64)
        v[0] = 1.0
        n = 1.0
    return (v / n).astype(np.float64)


def _surfaces_from_candidates_jsonl(path: Path, max_surfaces: int) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    with path.open(encoding="utf-8") as fin:
        for line in fin:
            line = line.strip()
            if not line:
                continue
            row = json.loads(line)
            s = str(row.get("surface", "")).strip()
            if not s or s in seen:
                continue
            seen.add(s)
            out.append(s)
            if len(out) >= max_surfaces:
                break
    return out


def centroid_from_lane_a_rows(rows: list[dict[str, Any]], *, model_id: str = DEFAULT_MODEL_ID) -> np.ndarray:
    texts = [str(r.get("surface", "")).strip() for r in rows]
    texts = [t for t in texts if t]
    if not texts:
        raise SystemExit("Lane A list has no non-empty surfaces")
    emb = encode_surfaces(texts, model_id=model_id)
    c = np.mean(emb, axis=0)
    n = float(np.linalg.norm(c))
    if n < 1e-12:
        raise SystemExit("degenerate embedding centroid")
    return (c / n).astype(np.float64)


def cosine_vs_centroid(emb_row: np.ndarray, centroid: np.ndarray) -> float:
    """Both unit-norm -> dot product."""
    return float(np.dot(emb_row.astype(np.float64), centroid))


def run_profile_semantic(
    lane_a_json: Path,
    deck_id: str,
    out_path: Path,
    model_id: str = DEFAULT_MODEL_ID,
    *,
    from_candidates_jsonl: bool = False,
    max_profile_surfaces: int = 4096,
) -> None:
    if from_candidates_jsonl:
        texts = _surfaces_from_candidates_jsonl(lane_a_json, max_profile_surfaces)
        if not texts:
            centroid = _placeholder_centroid(deck_id)
            note = (
                "No candidate surfaces in JSONL; deterministic placeholder centroid "
                "so score/export can complete (empty lane)."
            )
        else:
            emb = encode_surfaces(texts, model_id=model_id)
            c = np.mean(emb, axis=0)
            n = float(np.linalg.norm(c))
            if n < 1e-12:
                raise SystemExit("degenerate embedding centroid")
            centroid = (c / n).astype(np.float64)
            note = (
                "Centroid from filtered candidate surfaces (JSONL), not Lane A JSON; "
                "surfaces are not copied into the cleanroom output."
            )
    else:
        raw = json.loads(lane_a_json.read_text(encoding="utf-8"))
        if not isinstance(raw, list):
            raise SystemExit("Lane A file must be a JSON array")
        centroid = centroid_from_lane_a_rows(raw, model_id=model_id)
        note = (
            "Lane A surfaces are used only locally to form a centroid vector; "
            "they are not copied into the cleanroom output."
        )
    if centroid.shape[0] != EMB_DIM:
        raise SystemExit(f"unexpected embedding dim {centroid.shape[0]}")
    out_path.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "deck": deck_id,
        "embedding": {
            "kind": "sentence_transformers_multilingual_minilm",
            "model_id": model_id,
            "dim": EMB_DIM,
            "license_spdx": "Apache-2.0",
            "license_url": "https://huggingface.co/sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2",
            "note": note,
        },
        "vector": [float(x) for x in centroid.tolist()],
    }
    out_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def run_score_semantic(master_path: Path, profile_path: Path, out_path: Path) -> int:
    prof = json.loads(profile_path.read_text(encoding="utf-8"))
    meta = prof.get("embedding", {})
    if meta.get("kind") != "sentence_transformers_multilingual_minilm":
        raise SystemExit("profile is not a semantic (sentence-transformers) profile")
    mid = str(meta.get("model_id", DEFAULT_MODEL_ID))
    dim = int(meta.get("dim", EMB_DIM))
    centroid = np.array(prof["vector"], dtype=np.float64)
    if centroid.shape[0] != dim:
        raise SystemExit("profile dim mismatch")

    surfaces: list[str] = []
    rows: list[dict] = []
    with master_path.open(encoding="utf-8") as fin:
        for line in fin:
            line = line.strip()
            if not line:
                continue
            row = json.loads(line)
            surfaces.append(str(row.get("surface", "")).strip())
            rows.append(row)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    if not rows:
        out_path.write_text("", encoding="utf-8")
        return 0

    emb = encode_surfaces(surfaces, model_id=mid)
    n = 0
    with out_path.open("w", encoding="utf-8") as fout:
        for row, v in zip(rows, emb, strict=True):
            row["semantic_similarity"] = cosine_vs_centroid(v, centroid)
            fout.write(json.dumps(row, ensure_ascii=False) + "\n")
            n += 1
    return n
