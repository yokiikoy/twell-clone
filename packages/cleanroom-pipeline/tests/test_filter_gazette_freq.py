"""Tests for gazette frequency filter."""

from __future__ import annotations

import sqlite3
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from cleanroom_pipeline.filter_gazette_freq_cmd import run_filter_gazette_freq  # noqa: E402


class TestFilterGazetteFreq(unittest.TestCase):
    def setUp(self) -> None:
        self._td = tempfile.TemporaryDirectory()
        self.tmp = Path(self._td.name)

    def tearDown(self) -> None:
        self._td.cleanup()

    def test_tsv_freq(self) -> None:
        g = self.tmp / "g.tsv"
        f = self.tmp / "f.tsv"
        out = self.tmp / "o.tsv"
        g.write_text("a\tcr-kan1\nb\tcr-kan2\n", encoding="utf-8")
        f.write_text("a\t2000\nb\t5\n", encoding="utf-8")
        kept, total = run_filter_gazette_freq(g, out, min_count=1000, freq_tsv=f, freq_sqlite=None, sqlite_table="freq")
        self.assertEqual((kept, total), (1, 2))
        self.assertEqual(out.read_text(encoding="utf-8").strip(), "a\tcr-kan1")

    def test_sqlite_freq(self) -> None:
        db = self.tmp / "freq.db"
        conn = sqlite3.connect(str(db))
        conn.execute("CREATE TABLE freq (surface TEXT PRIMARY KEY, count INTEGER)")
        conn.execute("INSERT INTO freq VALUES ('猫', 5000)")
        conn.commit()
        conn.close()
        g = self.tmp / "g.tsv"
        out = self.tmp / "o.tsv"
        g.write_text("猫\tcr-kan4\n犬\tcr-kan4\n", encoding="utf-8")
        kept, total = run_filter_gazette_freq(
            g, out, min_count=1000, freq_tsv=None, freq_sqlite=db, sqlite_table="freq"
        )
        self.assertEqual((kept, total), (1, 2))


if __name__ == "__main__":
    unittest.main()
