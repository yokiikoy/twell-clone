"""Tatoeba-derived corpus builder (integration; SudachiDict + Cutlet)."""

from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from cleanroom_pipeline.build_corpus_tatoeba_cmd import run_build_corpus_from_tatoeba  # noqa: E402


class TestBuildCorpusFromTatoeba(unittest.TestCase):
    def test_smoke_writes_tsv(self) -> None:
        tsv = "9999\tjpn\t\u3053\u3093\u306b\u3061\u306f\u3002\n10000\tjpn\t\u77ed\u3044\u6587\u3067\u3059\u3002\n"
        with tempfile.TemporaryDirectory() as td:
            inp = Path(td) / "jpn_sentences.tsv"
            inp.write_text(tsv, encoding="utf-8")
            out = Path(td) / "corpus.tsv"
            n = run_build_corpus_from_tatoeba(
                inp, out, max_surfaces=500, include_full_sentences=True, min_rows=3
            )
            self.assertGreaterEqual(n, 3)
            body = out.read_text(encoding="utf-8")
            self.assertIn("\u3053\u3093\u306b\u3061\u306f", body)


if __name__ == "__main__":
    unittest.main()
