# wordlists-v2（スクラップビルド）

既存の `cleanroom-pipeline` / `generate-wordlists` 由来の語表は**品質目標に届かない**前提で切り捨て、このパッケージから **データ主導・ライセンス追跡可能**な語表だけを再構築する。ランタイムのデッキゲートは [`wordlists_v2.gates`](src/wordlists_v2/gates.py)（`cleanroom_pipeline.deck_filters` と **jou / kata1〜11 / kan / koto** で parity テスト済み）。

## 位置づけ

| 項目 | 方針 |
|------|------|
| 旧パイプライン | 本番コードから **import しない**（parity はテストのみで照合）。 |
| レーン定義 | [`docs/cleanroom/lane-taxonomy-v1.md`](../../docs/cleanroom/lane-taxonomy-v1.md)（29 `cr-*` レーン）。 |
| キャッシュ | `packages/wordlists-v2/.cache/open_corpora/`（マニフェスト取得・`SOURCE_PROVENANCE.json`）。 |

## CLI（`python -m wordlists_v2`）

| サブコマンド | 説明 |
|--------------|------|
| **`pipeline`** | **一発ビルド**: fetch（省略可）→ corpus → ingest → JMdict / kata11 / GeoNames / Wiktionary koto → マージ → 全 `cr-*` デッキ export（`output/preview/twelljr-*.json` + `BUILD_MANIFEST.json`）。`--deploy` で `apps/web/public/cleanroom/` へコピー。 |
| `fetch` | `open_corpora_manifest.json` に従い Tatoeba / JMdict / GeoNames 等を取得 |
| `build-corpus` | Tatoeba → `surface\treading` TSV |
| `ingest` | TSV → Sudachi 付き JSONL |
| `merge-jsonl` | 複数 JSONL を表面形でマージ（先勝ち） |
| `build-freq-tsv` | Tatoeba 文を Sudachi 形態素化して `surface<TAB>count` |
| `sample` | デッキ指定の層化サンプル（長さビン） |
| `attach-mode` | `engine_mode_for_deck_slug` に基づき `mode` 列付与 |
| `join-strokes` | `@typewell-jr/engine` の `cleanroom-join-strokes.ts` を **チャンク**で実行 |
| `export-deck` | ストローク帯フィルタ付き Web JSON（`surface`,`reading`,`code`,`index`） |
| `jmdict-kata` | JMdict のカタカナ見出し → JSONL |
| （内部）`jmdict_kata11` モジュール | JMdict place 系エントリのカタカナ → `cr-kata11` JSONL |
| `kata11-tsv` | 外国語地名ガゼット TSV → `cr_kata_lane` 付き JSONL |
| `filter-gazette-freq` | 頻度 TSV/SQLite でガゼット足切り |

### 一発ビルド（人手なし）

初回はネットワークと数十分〜数時間かかる場合があります。

```bash
npm run wordlists:v2:build
# または
python -m pip install -e packages/wordlists-v2
python -m wordlists_v2 pipeline
```

キャッシュ済みで fetch を飛ばす: `python -m wordlists_v2 pipeline --skip-fetch`

Wiktionary（koto 草案）を省略: `--skip-wiktionary`

プレビュー出力: `packages/wordlists-v2/output/preview/`（`BUILD_MANIFEST.json` に手順と `SOURCE_PROVENANCE` 参照）

**LLM 品質レビュー用の結合 TSV/JSONL**: リポジトリルートで `python packages/wordlists-v2/scripts/export_llm_review_bundle.py`（[`GEMINI_REVIEW_CONTEXT_ja.md`](../../docs/cleanroom/GEMINI_REVIEW_CONTEXT_ja.md) / [`GEMINI_REVIEW_PROMPT_ja.md`](../../docs/cleanroom/GEMINI_REVIEW_PROMPT_ja.md)）。

**NotebookLM 用（JSON をそのまま .txt に複製）**: `python packages/wordlists-v2/scripts/json_to_txt_notebooklm.py` → `packages/wordlists-v2/output/notebooklm/*.txt`。

**DeepSeek バッチ品質レビュー（要 `.env` の `DEEPSEEK_API_KEY`・ネットワーク）**: リポジトリルートで `python scripts/cleanroom/deepseek_review_wordlist.py`（既定入力 `output/llm_review/review.tsv`、出力 `output/llm_review/deepseek_review.json`）。試験に `--dry-run` や `--max-chunks 1`。詳細はスクリプト先頭 docstring。

**レビュー結果をエクスポートに反映**: `python scripts/cleanroom/gen_deepseek_excludes.py` で `heuristics/deepseek_review_excludes.json` を生成（既定はカテゴリ 3・4・6 のみ。1 は jou の設計上除外しない）。`pipeline` / `export-deck` はこのファイルがあれば **lane + surface + reading** で一致する行を落とす。オフは `python -m wordlists_v2 pipeline --no-deepseek-excludes`。

## 開発

```bash
cd packages/wordlists-v2
python -m venv .venv
.\.venv\Scripts\activate   # or: source .venv/bin/activate
pip install -e ".[dev]"
pytest -q
```

リポジトリルートから: `npm run wordlists:v2:test` / `npm run wordlists:v2:fetch` / **`npm run wordlists:v2:build`**（要 `python` が PATH にあること）。
