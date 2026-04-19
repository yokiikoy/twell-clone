# cleanroom-pipeline

オープンライセンス前提の **レーン B** 用オフラインツール（SudachiPy 正規化、**セマンティック類似度**（Sentence-BERT）またはレガシー Unicode ヒストグラム、Web 向け JSON エクスポート）。

## セットアップ

[uv](https://github.com/astral-sh/uv) 推奨:

```bash
cd packages/cleanroom-pipeline
uv sync --extra build --extra semantic
```

**Windows で `uv` が無いとき:** 同じディレクトリで Python 3.11+ を使い、一度だけ editable インストールしてから `python -m` で呼びます（`generate-wordlists.ps1` と同様）。

```powershell
cd packages\cleanroom-pipeline
python -m pip install -q -e .
python -m cleanroom_pipeline draft-llm-gazette --help
```

`build-corpus-from-tatoeba` や `profile-semantic` には追加で `pip install -e ".[build,semantic]"` が必要です。

語表生成スクリプト（リポジトリルートの `npm run cleanroom:gen-wordlists`）は **`[build,semantic]`** を前提とする。初回 `profile-semantic` 実行時に Hugging Face から埋め込みモデルが取得される（リポジトリにはコミットしない）。

## サブコマンド

| コマンド | 説明 |
|----------|------|
| `fetch-open-corpora` | **ネット必須**: マニフェストの URL から Tatoeba 日本語文 TSV・JMdict 英語 XML 等を取得し `.cache/open_corpora/` に展開（`SOURCE_PROVENANCE.json` 付き） |
| `ingest` | TSV（`surface[TAB]reading`、reading 省略可）→ JSONL（`surface`, `normalized`, `reading`） |
| `profile-semantic` | Lane A 互換 JSON 配列 → **Sentence-BERT 重心**（`[semantic]`） |
| `score-semantic` | マスタ JSONL に **`semantic_similarity`**（コサイン）を付与 |
| `profile` / `score` | レガシー: **Unicode ヒストグラム**重心と `char_similarity` |
| `filter-deck` | マスタ JSONL を **デッキ別ゲート**で絞る（`cr-*` は `row_matches_deck`＝行全体、レガシーは表層のみ） |
| `enrich-kan` / `enrich-koto` | 任意 TSV（`surface<TAB>lane`、任意 3 列目 + `--annotate-field`）で列を付与。無指定ならコピーのみ |
| `draft-llm-gazette` | **ネット必須**: DeepSeek で Kan/Koto 草案 TSV（キーは環境変数またはリポジトリルート `.env` の `DEEPSEEK_API_KEY` / `api_key`。**コミット禁止**） |
| `filter-gazette-freq` | 草案 TSV を **頻度 TSV または SQLite** で足切り（本番利用する頻度表はマニフェスト登録後） |
| `export` | ストローク σ フィルタ後、**`semantic_similarity` 優先**でソートし `twelljr-*.json` 形へ |
| `build-corpus-from-tatoeba` | **`[build]`**（`cutlet`, `unidic-lite`）+ Sudachi で Tatoeba `jpn_sentences.tsv` から `surface[TAB]reading` TSV を生成（母集団の主線） |
| `build-corpus` | **[legacy]** `wordfreq` が別途入っている場合のみ。既定の語表生成では使わない |

```bash
uv run python -m cleanroom_pipeline ingest -i words.tsv -o master.jsonl
uv run python -m cleanroom_pipeline profile-semantic -i ../../path/to/twelljr-jou1.json --deck jou1 -o profiles/jou1.json
uv run python -m cleanroom_pipeline score-semantic -i master_stroked.jsonl -p profiles/jou1.json -o master_scored.jsonl
uv run python -m cleanroom_pipeline export -i master_scored.jsonl --deck jou1 -o ../../apps/web/public/cleanroom/twelljr-jou1.json --reference-json ../../path/to/twelljr-jou1.json
```

`export` に **`--reference-json`** を渡すと、参照配列長 `N` を基準に件数を **`±count-tolerance`**（既定 15%）で揃える。`build-corpus-from-tatoeba` は **Sudachi で形態素＋全文（<=64字）**を拾い、**Cutlet + unidic-lite** で `reading` 列を付与する。

ストローク列は Node 側: `npm run cleanroom:join-strokes -w @typewell-jr/engine`（**`--mode`** でデッキと整合）。

### `npm run cleanroom:gen-wordlists`（再生成）について

- **`cr-jou*` / `cr-kata*`** は ingest 済み `master.jsonl` の **`sn_token_count` / `sn_first_head`** が前提。Tatoeba 由来では全文行が多く、**品詞レーンやカタ行レーンが極端に空**になり得る（仕様どおり）。
- **`cr-kan*` / `cr-koto*`** は **`enrich-kan` / `enrich-koto`** で `cr_kan_lane` / `cr_koto_lane` を付けない限り **常に 0 件**（ハッシュ分割は廃止）。オープンライセンスのガゼット TSV をマニフェストに載せたうえでパイプラインに挿入する。
- 詳細な意味と MVP 方針は **`docs/cleanroom/lane-taxonomy-v1.md`**。

### Kan / Koto ガゼット（草案 → 頻度 → enrich）

1. （任意）`uv run python -m cleanroom_pipeline draft-llm-gazette --family kan -o .cache/draft_kan.tsv`
2. `uv run python -m cleanroom_pipeline filter-gazette-freq -i .cache/draft_kan.tsv -o .cache/draft_kan_filt.tsv --freq-tsv path/to/freq.tsv --min-count 1000`
3. 人手で `gazette_kan.tsv` に整えたうえで `enrich-kan --gazette …`（3 列目 + `--annotate-field kan_theme` も可）

## モデル（セマンティック既定）

既定モデル: **`sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2`**（次元 384、Apache-2.0）。`LICENSE_MANIFEST.json` に帰属を載せること。別モデルは `profile-semantic --model-id …` で指定可能（`score-semantic` はプロファイル内の `model_id` を使用）。
