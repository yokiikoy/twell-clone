"""License-friendly MVP embedding: fixed-dim Unicode histogram (no external model files)."""

from __future__ import annotations

import math
from typing import Iterable

import numpy as np

DIM = 512


def text_to_vec(text: str) -> np.ndarray:
    v = np.zeros(DIM, dtype=np.float64)
    for ch in text:
        v[ord(ch) % DIM] += 1.0
    n = float(np.linalg.norm(v))
    if n <= 0:
        return v
    return v / n


def centroid_from_texts(texts: Iterable[str]) -> np.ndarray:
    acc = np.zeros(DIM, dtype=np.float64)
    n = 0
    for t in texts:
        acc += text_to_vec(t)
        n += 1
    if n == 0:
        return acc
    acc /= float(n)
    norm = float(np.linalg.norm(acc))
    if norm <= 1e-12:
        return acc
    return acc / norm


def cosine_sim(a: np.ndarray, b: np.ndarray) -> float:
    da = float(np.linalg.norm(a))
    db = float(np.linalg.norm(b))
    if da <= 1e-12 or db <= 1e-12:
        return 0.0
    return float(np.dot(a, b) / (da * db))


def vec_from_json_list(obj: list) -> np.ndarray:
    surfaces: list[str] = []
    for row in obj:
        if isinstance(row, dict) and "surface" in row:
            surfaces.append(str(row["surface"]))
    return centroid_from_texts(surfaces)
