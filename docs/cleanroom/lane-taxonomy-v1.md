# Cleanroom lane taxonomy v1

Canonical meaning of the **29** `cr-*` lanes. Machine-readable mirror: `packages/cleanroom-pipeline/heuristics/lane_taxonomy_v1.yaml`. Executable logic: `cleanroom_pipeline.deck_filters.row_matches_deck` (and legacy `surface_matches_deck` for non-`cr-*` slugs only).

## Jou (`cr-jou1` … `cr-jou8`)

| Lane | Meaning |
|------|---------|
| cr-jou1 | 動詞 |
| cr-jou2 | 形容詞 |
| cr-jou3 | 形容動詞（Sudachi UniDic: **形状詞**） |
| cr-jou4 | 名詞 |
| cr-jou5 | 副詞 |
| cr-jou6 | 連体詞 |
| cr-jou7 | 接続詞 |
| cr-jou8 | 感動詞 |

**Rules:** `sn_token_count == 1` (single morpheme). `sn_first_head` must match the Sudachi POS head for that lane (see `deck_filters._JOU_HEAD_TO_NUM`).

## Kata (`cr-kata1` … `cr-kata11`)

### `cr-kata1` … `cr-kata10`

First **katakana** mora row (五十音). **Entire surface** must be NFKC-normalized **katakana continuous** (katakana letters + `ー` + `・` only; length ≥ 2). Mixed scripts (e.g. hiragana + katakana phrase) are rejected.

| Lane | Row |
|------|-----|
| cr-kata1 | アイウエオ行 |
| cr-kata2 | カキクケコ行 |
| cr-kata3 | サシスセソ行 |
| cr-kata4 | タチツテト行 |
| cr-kata5 | ナニヌネノ行 |
| cr-kata6 | ハヒフヘホ行 |
| cr-kata7 | マミムメモ行 |
| cr-kata8 | ラリルレロ行 |
| cr-kata9 | ヤユヨ行 |
| cr-kata10 | ワヲン行 |

**Rules:** `sn_token_count == 1`. First katakana character maps to row (small kana map to parent row).

### `cr-kata11`（外国語地名）

**Runtime:** `row["cr_kata_lane"]` must equal `"cr-kata11"`. If absent, no row matches. 語表はオープンライセンスの地名データ等から人手キュレーションし、マニフェストに出典を登録する（`packages/wordlists-v2` の `kata11-tsv` 等）。

## Kan (`cr-kan1` … `cr-kan6`)

| Lane | Meaning (game-facing) |
|------|------------------------|
| cr-kan1 | 並立構造漢語 |
| cr-kan2 | 修飾構造漢語 |
| cr-kan3 | 述賓構造漢語 |
| cr-kan4 | 述補構造漢語 |
| cr-kan5 | 主謂構造漢語 |
| cr-kan6 | 難読地名 |

**学術ラベル**への自動割当を主判定には使わない。リストは **オープン頻度データで足切り**したうえで人手キュレーションし、`enrich-kan` が `cr_kan_lane`（任意で `kan_theme` 等のメタ列）を付与する。

**Runtime:** `row["cr_kan_lane"]` must equal the deck slug. If absent, no row matches.

## Koto (`cr-koto1` … `cr-koto4`)

| Lane | MVP meaning |
|------|---------------|
| cr-koto1 | ことわざ（キュレーションリスト） |
| cr-koto2 | 慣用句（イディオム） |
| cr-koto3 | 故事成語 |
| cr-koto4 | 四字熟語 |

**表層ヒューリスティック**（例: 漢字4文字のみ）は主判定に使わない。草案は **LLM オフライン生成 → 頻度フィルタ → 人手確定**し、`enrich-koto` が `cr_koto_lane`（任意で `koto_kind` メタ列）を付与する。LLM 草案を使う場合は **`draft_generated_at`（UTC）** と **`draft_prompt_id`（またはプロンプトハッシュ）** をメタデータに残す。

**Runtime:** `row["cr_koto_lane"]` must equal the deck slug. If absent, no row matches.

## Open corpora

All gazettes and enrichments must follow [architecture-open-license-pipeline.md](architecture-open-license-pipeline.md) and `open_corpora_manifest.json` / `LICENSE_MANIFEST` policy.

## Gazette build workflow (Kan / Koto)

1. **Draft (optional, network):** `draft-llm-gazette --family kan|koto` reads **`DEEPSEEK_API_KEY`** (or `api_key` / `OPENAI_API_KEY`) from the environment or repo-root `.env` (never commit secrets). Writes a draft TSV under `.cache/`.
2. **Frequency gate:** `filter-gazette-freq` keeps rows whose `surface` has count ≥ threshold in a **license-cleared** frequency TSV or SQLite table (artifact must be registered in `open_corpora_manifest.json` before production use).
3. **Curate:** human edits the filtered TSV, then `enrich-kan` / `enrich-koto` attach `cr_kan_lane` / `cr_koto_lane`; optional third TSV column + `--annotate-field` sets `kan_theme` / `koto_kind` for audit.

**Rejected as sole automation:** Sudachi-only “structure” for kan1–5; “four kanji = koto4” as the main koto4 rule; committing raw LLM output without curation.
