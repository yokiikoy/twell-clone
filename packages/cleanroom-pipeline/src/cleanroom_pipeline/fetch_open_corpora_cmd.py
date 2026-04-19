"""Download pinned open-license corpora / dictionary text over the network (required)."""

from __future__ import annotations

import bz2
import gzip
import json
import shutil
import ssl
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable


def _manifest_path() -> Path:
    return Path(__file__).resolve().parent / "open_corpora_manifest.json"


def _load_manifest() -> dict[str, Any]:
    raw = _manifest_path().read_text(encoding="utf-8")
    return json.loads(raw)


def _ua_request(url: str, *, method: str = "GET") -> urllib.request.Request:
    return urllib.request.Request(
        url,
        method=method,
        headers={
            "User-Agent": "cleanroom-pipeline/0.1 (+https://github.com/)",
            "Accept": "*/*",
        },
    )


def _urlopen_ctx() -> ssl.SSLContext:
    # Default verify is fine for tatoeba.org; EDRDG uses http:// for JMdict_e.gz.
    return ssl.create_default_context()


def _download_stream(url: str, dest: Path, *, timeout: int) -> int:
    dest.parent.mkdir(parents=True, exist_ok=True)
    req = _ua_request(url)
    ctx = _urlopen_ctx()
    with urllib.request.urlopen(req, timeout=timeout, context=ctx) as resp, dest.open("wb") as out:
        shutil.copyfileobj(resp, out)
    return int(dest.stat().st_size)


def _process_bz2_tsv(archive: Path, out_tsv: Path) -> None:
    out_tsv.parent.mkdir(parents=True, exist_ok=True)
    with bz2.open(archive, "rb") as zin, out_tsv.open("wb") as zout:
        shutil.copyfileobj(zin, zout)


def _process_gzip_xml(archive: Path, out_xml: Path) -> None:
    out_xml.parent.mkdir(parents=True, exist_ok=True)
    with gzip.open(archive, "rb") as zin, out_xml.open("wb") as zout:
        shutil.copyfileobj(zin, zout)


_KIND_HANDLERS: dict[str, Callable[[Path, Path], None]] = {
    "bz2_tsv": _process_bz2_tsv,
    "gzip_xml": _process_gzip_xml,
}


def run_fetch_open_corpora(
    dest: Path,
    *,
    only: str | None = None,
    timeout: int = 600,
) -> dict[str, Any]:
    """Fetch all manifest artifacts into *dest* (network required). Returns provenance dict."""
    manifest = _load_manifest()
    artifacts: list[dict[str, Any]] = list(manifest.get("artifacts") or [])
    if only:
        artifacts = [a for a in artifacts if str(a.get("id")) == only]
        if not artifacts:
            raise SystemExit(f"unknown artifact id for --only: {only!r}")

    dest = dest.resolve()
    dl_dir = dest / "downloads"
    dl_dir.mkdir(parents=True, exist_ok=True)

    provenance: dict[str, Any] = {
        "fetched_at_utc": datetime.now(timezone.utc).isoformat(),
        "dest": str(dest),
        "artifacts": [],
    }

    for art in artifacts:
        aid = str(art["id"])
        url = str(art["url"])
        kind = str(art["kind"])
        out_rel = str(art["output_relpath"])
        if kind not in _KIND_HANDLERS:
            raise SystemExit(f"unknown artifact kind {kind!r} for {aid}")

        tmp_arc = dl_dir / f"{aid}.download.bin"
        try:
            try:
                nbytes = _download_stream(url, tmp_arc, timeout=timeout)
            except urllib.error.URLError as e:
                raise SystemExit(f"fetch failed for {aid} ({url}): {e}") from e

            out_path = dest / out_rel
            _KIND_HANDLERS[kind](tmp_arc, out_path)
        finally:
            if tmp_arc.is_file():
                tmp_arc.unlink(missing_ok=True)

        provenance["artifacts"].append(
            {
                "id": aid,
                "url": url,
                "license": art.get("license"),
                "description": art.get("description"),
                "output": str(out_path),
                "downloaded_bytes": nbytes,
            }
        )

    prov_path = dest / "SOURCE_PROVENANCE.json"
    prov_path.write_text(json.dumps(provenance, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    provenance["provenance_path"] = str(prov_path)
    return provenance

