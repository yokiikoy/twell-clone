from __future__ import annotations

import tempfile
from pathlib import Path

from wordlists_v2.filter_gazette_freq import run_filter_gazette_freq


def test_filter_gazette_keeps_frequent() -> None:
    with tempfile.TemporaryDirectory() as td:
        t = Path(td)
        gaz = t / "g.tsv"
        freq = t / "f.tsv"
        out = t / "o.tsv"
        gaz.write_text("東京\tcr-kan6\nいる\tcr-kan1\n", encoding="utf-8")
        freq.write_text("東京\t10\nいる\t1\n", encoding="utf-8")
        kept, total = run_filter_gazette_freq(gaz, out, min_count=2, freq_tsv=freq, freq_sqlite=None)
        assert total == 2
        assert kept == 1
        assert "東京" in out.read_text(encoding="utf-8")
