"""Offline draft gazette lines via DeepSeek (OpenAI-compatible API). Secrets from env / .env only."""

from __future__ import annotations

import json
import os
import re
import ssl
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any, Final


_DEEPSEEK_URL: Final[str] = "https://api.deepseek.com/chat/completions"


def _pipeline_package_root() -> Path:
    return Path(__file__).resolve().parents[2]


def _mono_repo_root() -> Path:
    """``type-cleanroom`` root (parent of ``packages``)."""
    return _pipeline_package_root().parent.parent


def load_env_file(path: Path) -> None:
    """Set ``os.environ`` keys from ``KEY=value`` lines (do not override existing)."""
    if not path.is_file():
        return
    text = path.read_text(encoding="utf-8")
    for raw in text.splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        if "=" not in line:
            continue
        key, _, val = line.partition("=")
        key = key.strip()
        val = val.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = val


def resolve_api_key() -> str:
    return (
        os.environ.get("DEEPSEEK_API_KEY", "").strip()
        or os.environ.get("OPENAI_API_KEY", "").strip()
        or os.environ.get("api_key", "").strip()
    )


def _default_env_path() -> Path:
    return _mono_repo_root() / ".env"


def build_user_prompt(*, family: str, count: int, themes: str) -> str:
    if family == "kan":
        lanes = "cr-kan1, cr-kan2, cr-kan3, cr-kan4, cr-kan5, cr-kan6"
        desc = (
            "Japanese typing-game candidates: mostly 2–4 kanji compounds or short idiomatic "
            "kanji strings (no full sentences). Distribute across lanes for variety."
        )
    elif family == "koto":
        lanes = "cr-koto1 (proverbs), cr-koto2 (idioms), cr-koto3 (kotsuwan / stories), cr-koto4 (yoji-jukugo)"
        desc = (
            "Japanese typing-game candidates: proverbs, idioms, short classical phrases, "
            "or legitimate four-kanji yoji. No invented rare strings."
        )
    else:
        raise ValueError(f"family must be kan or koto, got {family!r}")

    theme_line = f"Themes / registers to cover: {themes}.\n" if themes.strip() else ""

    return (
        f"You are helping build an open-license typing-game word list.\n"
        f"{desc}\n"
        f"{theme_line}"
        f"Output exactly {count} lines. Each line MUST be two TAB-separated fields with no extra columns:\n"
        f"  surface<TAB>lane_slug\n"
        f"where lane_slug is one of: {lanes}.\n"
        f"Use NFC Unicode. Surfaces must be <= 32 characters, no newlines inside a field.\n"
        f"Do not add headers, numbering, markdown fences, or commentary—only the data lines."
    )


def parse_llm_tsv_body(content: str, *, family: str) -> list[tuple[str, str]]:
    """Extract valid surface\\tlane lines from model output (tolerate code fences)."""
    text = content.strip()
    if text.startswith("```"):
        text = re.sub(r"^```[a-zA-Z]*\s*", "", text)
        text = re.sub(r"\s*```\s*$", "", text)
    if family == "kan":
        pat = re.compile(r"^(\S+)\t(cr-kan[1-6])$")
    elif family == "koto":
        pat = re.compile(r"^(\S+)\t(cr-koto[1-4])$")
    else:
        raise ValueError(f"family must be kan or koto, got {family!r}")

    out: list[tuple[str, str]] = []
    seen: set[str] = set()
    for line in text.splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        m = pat.match(line)
        if not m:
            continue
        surf, slug = m.group(1), m.group(2)
        if len(surf) > 64:
            continue
        if surf in seen:
            continue
        seen.add(surf)
        out.append((surf, slug))
    return out


def call_deepseek_chat(
    *,
    api_key: str,
    user_prompt: str,
    timeout: int = 120,
    temperature: float = 0.4,
    max_tokens: int | None = None,
) -> str:
    payload: dict[str, Any] = {
        "model": "deepseek-chat",
        "messages": [{"role": "user", "content": user_prompt}],
        "temperature": temperature,
    }
    if max_tokens is not None:
        payload["max_tokens"] = max_tokens
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(
        _DEEPSEEK_URL,
        data=body,
        method="POST",
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
    )
    ctx = ssl.create_default_context()
    try:
        with urllib.request.urlopen(req, timeout=timeout, context=ctx) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", errors="replace")[:500]
        raise SystemExit(f"DeepSeek HTTP {e.code}: {detail}") from e
    try:
        return str(payload["choices"][0]["message"]["content"])
    except (KeyError, IndexError, TypeError) as e:
        raise SystemExit(f"Unexpected DeepSeek response shape: {payload!r:.400}") from e


def run_draft_llm_gazette(
    out_path: Path,
    *,
    family: str,
    count: int,
    themes: str,
    env_file: Path | None,
    timeout: int,
) -> int:
    env_path = env_file if env_file is not None else _default_env_path()
    load_env_file(env_path)
    key = resolve_api_key()
    if not key:
        raise SystemExit(
            "No API key: set DEEPSEEK_API_KEY (or api_key / OPENAI_API_KEY) in environment "
            f"or in {env_path}"
        )

    prompt = build_user_prompt(family=family, count=count, themes=themes)
    content = call_deepseek_chat(api_key=key, user_prompt=prompt, timeout=timeout)
    rows = parse_llm_tsv_body(content, family=family)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", encoding="utf-8") as f:
        f.write("# Draft gazette from draft-llm-gazette — run filter-gazette-freq then curate before enrich.\n")
        for surf, slug in rows:
            f.write(f"{surf}\t{slug}\n")
    return len(rows)
