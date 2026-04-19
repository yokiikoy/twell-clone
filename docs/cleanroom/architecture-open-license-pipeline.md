# クリーンルーム語表パイプライン（オープンライセンス）

本書は Cursor 側の「オープンライセンス・クリーンルーム語表」実装計画に沿った **レーン B** の設計正典です。**法解釈の最終判断ではなく**、実装・レビューのためのチェックリストとして使います。

## 目標

- **入力:** パブリックドメイン、CC0、CC-BY、CC-BY-SA 等、**マニフェストに出典・条項 URL・取得日を残せる**コーパスのみ。
- **出力:** `apps/web/public/cleanroom/` 配下の **Web ローダ互換 JSON**（`surface`, `reading`, `code`, `index`）および **`CORPUS_MANIFEST.json` / `LICENSE_MANIFEST.json`**。
- **レーン A（本家デコンパイル由来）:** リポジトリにコミットしない前提のまま。**語の逐語コピーは出力に混ぜない**。許容されるのは **ローカルでの統計・類似度プロファイル**（例: 重心ベクトル）のみ。

## ライセンス階層と合成ルール

| 入力の組合せ（例） | 出力に推奨される表記（目安） |
|--------------------|------------------------------|
| PD / CC0 のみ | CC0 または PD 宣言（プロジェクト方針に従う） |
| CC-BY-SA を含む | **CC-BY-SA 4.0**（合成物への SA 継承・帰属の両方を満たす運用） |
| CC-BY のみ | CC-BY 4.0 + `NOTICE` への帰属 |

- **ビルド時に** `LICENSE_MANIFEST.json` の条項集合から **SPDX / CC 表記を機械的に決定**する処理を追加する（未実装の場合は手動で manifest を維持）。
- **投げ銭・サーバー費用**等: 典型的な CC 系オープンライセンスでは **商用利用が禁じられない**ことが多いが、**条項本文と専門家レビュー**に従う。

## ネット取得オープンテキスト（`fetch-open-corpora`）

- `npm run cleanroom:gen-wordlists` の先頭で **`python -m cleanroom_pipeline fetch-open-corpora`** を実行する（**ネットワーク必須**。オフラインでは失敗する想定）。
- 出力先の既定: `packages/cleanroom-pipeline/.cache/open_corpora/`。取得ごとに **`SOURCE_PROVENANCE.json`**（URL・UTC 時刻・出力パス・ダウンロードバイト数）を書く。
- マニフェスト実体: [`packages/cleanroom-pipeline/src/cleanroom_pipeline/open_corpora_manifest.json`](../../packages/cleanroom-pipeline/src/cleanroom_pipeline/open_corpora_manifest.json)
  - **Tatoeba** 日本語文エクスポート `jpn_sentences.tsv.bz2` → 展開後 `tatoeba/jpn_sentences.tsv`（ライセンスは [Tatoeba downloads](https://tatoeba.org/en/downloads) に従う; 多くは **CC BY 2.0 FR**）。
  - **JMdict** 英語付き gzip `JMdict_e.gz`（`http://ftp.edrdg.org/...`）→ 展開後 `jmdict/JMdict_e.xml`（[**EDRDG ライセンス**](https://www.edrdg.org/edrdg/licence.html)）。HTTPS ミラーの証明書がホスト名と合わない環境があるため、現行 URL は **HTTP** を採用している。
- **更新:** 語表の母集団は **`build-corpus-from-tatoeba`**（Tatoeba `jpn_sentences.tsv` → Sudachi 形態素＋全文<=64字 → Cutlet `reading`）が主線。`wordfreq` は既定フローから外した。JMdict XML は取得済みだがマスタ TSV には**未合流**（参照・将来用）。

## マニフェスト

### CORPUS_MANIFEST.json（例）

- `sources[]`: `{ "id", "url", "retrieved_at", "license_spdx", "license_url", "notes" }`
- `build`: `{ "tool", "commit", "timestamp" }`

### LICENSE_MANIFEST.json（例）

- `entries[]`: 各コーパス断片と **帰属に使う短いテキスト**（Web の `/help/data-credits` 等にそのまま載せられる粒度）。

## 形態素・正規化（SudachiPy）

1. コーパスから得た候補語に Sudachi を適用し、`surface`（表層）と `normalized_form` を取得する。
2. `reading`（ASCII ローマ字）は Web エンジンと同規約で付与する（別ステップで TS の `romajiToTypingKana` と整合させる）。Python 取り込みでは **TSV で reading を併記**してもよい。
3. **モード内**重複排除（計画どおり）:
   - 第一段階: `normalized` のユニーク（異表記同義の圧縮）。
   - 第二段階: `surface` のユニーク（同表記異読の圧縮）。
4. **モード間**は Set を分離（`kihon` / `kanji` / `katakana` / `kanyoku`）。

エンジン側の純関数: `packages/engine/src/cleanroom/dedup.ts`（Vitest で固定）。

## 類似度（セマンティック主役）

- **既定（本番寄りパイプライン）:** `sentence-transformers` の **多言語 MiniLM**（例: `paraphrase-multilingual-MiniLM-L12-v2`）で Lane A 表層の **埋め込み重心**を取り、候補表層との **コサイン類似度**を `semantic_similarity` として付与する。`npm run cleanroom:gen-wordlists` は **`profile-semantic` / `score-semantic`** を使う（`[semantic]` 追加依存・初回は HF からモデル取得）。
- **レーン A の使い方:** 表層文字列は **ローカルでのみ**埋め込みに供し、出力語表には **コピーしない**。重心ベクトルは統計量として扱う（本書冒頭の方針と同型）。
- **レガシー:** Unicode ヒストグラムは **`profile` / `score`** として残し、比較・フォールバック用。

`export` は **`semantic_similarity` があればそれを、なければ `char_similarity` を**ソートキーに用いる。

## ストローク制約（emiel 準拠）

- **Web と同じ定義:** `mozcMinStrokesForHiraganaLine(typingKana)`（`packages/engine/src/emielStrokeBudget.ts`）。
- **バッチ:** `npm run cleanroom:join-strokes -w @typewell-jr/engine` が JSONL に `mozc_min_strokes` を付与。
- **フィルタ:** レーン A から計算した分布の **平均 ± N** または **パーセンタイル帯**で外れ値を落とす（Python `export` または後続スクリプト）。

### 件数の目安（レーン A 参照・ローカルのみ）

`export` に **`--reference-json`** で Lane A 互換の JSON 配列（ローカルパス、**リポジトリに置かない**）を渡すと、参照の要素数を `N` として **採用件数を概ね `N` に揃える**挙動にできます。

- 候補が **`N` 件以上**あるとき: **上位 `N` 件**（`semantic_similarity` 優先の降順）を出力。
- 候補が **`N` 未満だが `⌊(1−ε)N⌋` 件以上**あるとき（既定 `ε=0.15`）: **候補をすべて**出力（件数は `N` より少ないが許容帯内）。
- 候補が **許容帯の下限未満**のとき: 取れるだけ出力し **警告**（フィルタが強すぎる・コーパス不足のサイン）。

`--count-tolerance` で `ε` を変更可能。参照指定時は **`--max-rows` は無視**（CLI で警告）。

### デッキ別ゲート（Lane A 互換 vs 29 レーン正典）

- **レガシー `jou*` / `kata*` / `kan*` / `koto*`**（`cr-` なし）: 引き続き **表層ヒューリスティック**（`surface_matches_deck`）。意図・閾値は `heuristics/decks.yaml`。
- **クリーンルーム 29 レーン `cr-*`**: 意味定義は **[lane-taxonomy-v1.md](lane-taxonomy-v1.md)** と **`heuristics/lane_taxonomy_v1.yaml`**。`filter-deck` / `export` / `compare-coverage` は **`row_matches_deck(row, slug)`**（JSONL 1 行全体）。`surface_matches_deck` は **`cr-*` に対して常に false**（誤用防止）。
  - **`cr-jou1`…`cr-jou8`**: ingest の Sudachi 列 `sn_token_count == 1` かつ `sn_first_head`（品詞 head）で分岐（形容動詞相当は **形状詞 → `cr-jou3`**）。
  - **`cr-kata1`…`cr-kata10`**: 同じく単一形態素前提のうえ、**NFKC 表層がカタカナ連続体**（長音 `ー`・中点 `・` のみ併用可）を満たした場合のみ、**先頭カタカナ文字の五十音行**で分岐（混在表層はこれらに不一致）。
  - **`cr-kata11`**: 行に **`cr_kata_lane == "cr-kata11"`**（外国語地名ガゼット）が無い限り一致しない。
  - **`cr-kan*` / `cr-koto*`**: 行に **`cr_kan_lane` / `cr_koto_lane`**（`enrich-kan` / `enrich-koto` + マニフェスト付きガゼット TSV）が無い限り一致しない MVP。詳細は lane taxonomy 文書。
- `npm run cleanroom:join-strokes` は **デッキごとに `--mode`**（`kihon` / `katakana` / `kanji` / `kanyoku`）を付与し、Web の `GameMode` と整合したストローク数を付ける。

### 品詞・内部タクソノミ vs デッキ名（製品互換）

- **Lane A 参照デッキ**（`twelljr-jou1.json` 等）の集計は従来どおり **表層ベースの `surface_matches_deck`** で「参照ファイルがそのスラッグの形に近いか」を測る（`reference-features`）。
- **`cr-*` 本番コーパス**は **`master.jsonl` の `sn_*` + 任意 enrich 列**が正であり、`compare-coverage` は **行ベース**で Lane A 件数と比較する（参照 `summary.json` に `cr-*` が無い場合はレーンごとの比較は出ない）。

### ヒューリスティック整備ワークフロー（本家特徴 → ルール → コーパス）

**法解釈の最終判断ではない**が、運用上「集計だけはローカルで Lane A から取り、語の全文は配布物に混ぜない」方針と整合する手順を固定する。

1. **参照特徴（集計のみ）**  
   ローカルの `apps/web/public/twelljr-*.json` を入力に、`python -m cleanroom_pipeline reference-features --input-dir …/public --output-dir …/.cache/reference_profiles` を実行する。  
   出力: `summary.json`（分位数・比率・**レガシー**デッキの Lane A 通過率 = `surface_matches_deck`）と **`HEURISTIC_REPORT.md`**（人間向け表 + LLM 用プロンプト断片。**語の全文は JSON に載せない**）。
2. **閾値の意図を文書化**  
   [`packages/cleanroom-pipeline/heuristics/decks.yaml`](../../packages/cleanroom-pipeline/heuristics/decks.yaml) と [lane-taxonomy-v1.md](lane-taxonomy-v1.md)。実装の正は [`deck_filters.py`](../../packages/cleanroom-pipeline/src/cleanroom_pipeline/deck_filters.py) の **`row_matches_deck`**（`cr-*`）および **`surface_matches_deck`**（非 `cr-*` のみ）。
3. **コーパスとのギャップ**  
   `ingest` 後の `master.jsonl` に対し `compare-coverage` を走らせ、`COVERAGE_REPORT.md` で **Lane A 参照件数 vs 行ベース `filter-deck` 通過件数**を並べる。`master_pass_filter == 0` はコーパス不足、`sn_*` 欠落、または **kan/koto 用ガゼット未投入**の切り分け材料になる。
4. **本番一括**  
   `npm run cleanroom:gen-wordlists` は ingest 直後に上記レポートを **ベストエフォート**で生成する（失敗しても語表生成は続行）。レポートだけ欲しい場合は `npm run cleanroom:report`（要既存 `master.jsonl`）。スキップは `generate-wordlists.ps1 -SkipReport`。

## Web 統合

- 環境変数 **`NEXT_PUBLIC_WORDSET`**: 未設定または `decomp` のとき従来の `/twelljr-*.json`。`cleanroom` のとき **`/cleanroom/twelljr-*.json`**。
- データ出典ページ（`/help/data-credits` 等）は別タスクで実体を置く。本フェーズでは `public/cleanroom/README.md` にクレジット方針を記載。

## ディレクトリ

| パス | 役割 |
|------|------|
| `packages/cleanroom-pipeline/` | Python CLI（ingest / **draft-llm-gazette** / **filter-gazette-freq** / **enrich-kan** / **enrich-koto** / filter-deck / profile / score / export / **reference-features** / **compare-coverage**） |
| `packages/engine/src/cleanroom/` | 重複排除など **ブラウザでも使える純関数** |
| `packages/engine/scripts/cleanroom-join-strokes.ts` | ストローク列付与 |
| `apps/web/public/cleanroom/` | 配信用 JSON + manifest |

## 再生成手順（概要）

1. 許可コーパスを取得し `CORPUS_MANIFEST.json` を更新する。
2. `uv sync`（`packages/cleanroom-pipeline`）→ `uv run python -m cleanroom_pipeline ingest ...`
3. （任意）`draft-llm-gazette` → `filter-gazette-freq`（頻度表はマニフェスト登録後）→ 人手確定 TSV → `enrich-kan` / `enrich-koto` で `cr_kan_lane` / `cr_koto_lane` を付与（未実施なら `cr-kan*` / `cr-koto*` は空レーンになり得る）。
4. ローカルのみ: Lane A JSON を渡して `profile` → `score`。
5. デッキごとに `filter-deck`（`cr-*` は行ベース）→ `join-strokes`（**`--mode`** 付き）→ `score` → `export`（`npm run cleanroom:gen-wordlists` が一括）。
6. 件数目安は `export` の **`--reference-json`**（ローカルの Lane A 配列長）→ `apps/web/public/cleanroom/`。
7. `npm test` / `npm run build -w web`。

関連: [planning-handoff-brief.md](planning-handoff-brief.md)、[twelljr-data-pipeline.md](../re/twelljr-data-pipeline.md)（レーン A）。
