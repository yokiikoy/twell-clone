# クリーンルーム語表パイプライン — 会話の整理と次プラン

レーン B（オープンライセンス語表）まわりの会話で**合意できた事実**、**まだコード上で成立していないこと**、および**次にやるべき工程**を一枚にまとめる。法解釈の最終判断ではなく、実装・レビュー用の作業メモである。

---

## 1. エグゼクティブサマリー

- **意図（プロジェクト側）:** 語表の**母集団（候補の一次ソース）**は、pip 内蔵の頻度リストだけでなく、**ネット上のオープンなテキスト／辞書を取得した上で、その内容を解析対象にする**。Sudachi 等はその母集団に対して一貫してかかるべき、というのが一貫した要求だった。
- **現状（実装）:** `fetch-open-corpora` で **Tatoeba** と **JMdict** を取得し、`generate-wordlists` 先頭で必須実行。続けて **`build-corpus-from-tatoeba`** が `corpus.tsv` を書き、**`ingest` 以降は従来どおり**（Sudachi・デッキ・ストローク・セマンティック）。**wordfreq は既定フローから除外**した。
- **残り:** JMdict をマスタ候補に合流させるかは未着手（フェーズ C）。

---

## 2. 何が分かったか（事実ベース）

### 2.1 データの流れ（いま動いているもの）

1. **ネット取得:** `cleanroom_pipeline fetch-open-corpora`  
   - マニフェスト: `packages/cleanroom-pipeline/src/cleanroom_pipeline/open_corpora_manifest.json`  
   - 出力例: `.cache/open_corpora/tatoeba/jpn_sentences.tsv`、`.cache/open_corpora/jmdict/JMdict_e.xml`、`SOURCE_PROVENANCE.json`  
   - ドキュメント: `docs/cleanroom/architecture-open-license-pipeline.md` に節あり。

2. **母集団（現行の実質ソース）:** `build-corpus`  
   - `wordfreq` の `top_n_list("ja", …)` 由来の表層形を走査し、**Cutlet + UniDic Lite** で `surface[TAB]reading`（ローマ字列）の TSV を書く。  
   - これが **`ingest` の唯一の入力**になっている。

3. **形態素・正規化:** `ingest`  
   - **SudachiPy + SudachiDict-core**（Mode C）で `normalized` と `sn_*` 等を付与。

4. **以降:** `filter-deck` → `join-strokes` → `profile-semantic` / `score-semantic` → `export`（Lane A JSON はローカル参照・長さバンドのみ）。

### 2.2 会話で明確になった「解釈のミス」

- 「ネット必須」「具体的なコーパスを用意」を、**「取得パイプラインを足す」**までに矮小化し、**「母集団の置き換え」**までを同一スコープとして閉じなかった。
- 結果として、**外部ファイルは先にあるが主線の解析対象ではない**という中途半端な状態になり、利用者から見れば「変わっていない」と合理的に見える。

### 2.3 本プロジェクト背景との整合（なぜ要求は当然か）

- **クリーンルーム:** Lane A の語を**出力にコピーしない**一方で、レーン B は**出典とライセンスが説明できる入力**であるべき、という方針がドキュメントに既にある（例: `CORPUS_MANIFEST.json` の `sources[]` 思想、`architecture-open-license-pipeline.md`）。
- **その意味での「当然」:** 取得したオープンテキストを**単なる同梱アセット**にせず、**`CORPUS_MANIFEST` に載る一次ソースとしてマスタに流し込む**のが、方針文書と利用者の期待の両方に沿う。

---

## 3. 語表に対して最低限押さえるべき要件（再掲）

| 要件 | 意味 |
|------|------|
| 出典・条項の追跡 | URL、取得日時、ライセンス表記がビルド成果に残ること。 |
| Lane A 非コピー | 参照 JSON は埋め込み重心・件数バンド等に限定。 |
| 表層のゲート | `deck_filters` によるスクリプト形状（モード整合）。 |
| ストローク | `join-strokes` が解釈できる表層・モード。 |
| `reading` 規約 | Web エンジンと整合する ASCII ローマ字列（現状 Cutlet 列）。 |
| Sudachi メタ | `ingest` で同一表層に正規化・（必要なら）品詞・活用。 |
| ランキング | セマンティック類似度（Lane A 重心）＋ `export` の件数制約。 |

**外部テキストを母集団にするときの追加論点（未決定だが設計で埋める）**

- Tatoeba は**文単位** → **語／表層候補への分解規則**（Sudachi 分割、POS フィルタ、長さ上限、重複の扱い）。
- JMdict は**辞書エントリ** → ゲームの「一行」との対応（表記・熟語・多義の扱い）。
- wordfreq との関係:** 置換 / 併合 / デッキ別切替**のどれにするか。

---

## 4. 次のプラン（推奨順）

### フェーズ A — 設計の固定（コードより先に短文で合意）

1. **単一データフロー図**を `architecture-open-license-pipeline.md` か本書に追記する。  
   `Tatoeba TSV → 抽出規則 → corpus.tsv（schema 固定）→ ingest → …` を一本線で書く。
2. **抽出規則 v0** を表で固定する（例: Mode C 形態素のうち名詞・動詞・…を採用するか、文全体も候補に含めるか、N 文字以上、など）。**「正しさ」より再現性**を優先し、バージョン番号を振る。
3. **`reading` の付け方**を決める: 現行どおり Cutlet に任せる／Sudachi `reading_form` を正とする／併記する、のいずれか。

**完了条件:** PR またはコミット前レビューで「母集団の一次ソースは何か」が一文で答えられる。

### フェーズ B — 実装（母集団の接続）— **実施済み（2026-04-18）**

1. **CLI `build-corpus-from-tatoeba`**  
   - 入力: `fetch-open-corpora` 済みの `jpn_sentences.tsv`（`id TAB jpn TAB text`）。  
   - 処理: Sudachi Mode C で形態素（助詞・記号などはスキップ）＋ **全文（句読点除去後、長さ 2〜64）**を候補にし、`surface[TAB]reading`（Cutlet）で **ユニーク表面**まで。  
   - 出力: 従来どおり **`corpus.tsv`** → `ingest` 以降は無変更。
2. **`generate-wordlists.ps1`**  
   - `build-corpus`（wordfreq）をやめ、**`build-corpus-from-tatoeba`** を既定に変更。`pip` 検証から **wordfreq を削除**。
3. **`CORPUS_MANIFEST.json`**（`apps/web/public/cleanroom`）  
   - 主ソースを **Tatoeba**、取得参照を **JMdict**（未マスタ合流）に更新。**wordfreq は記載から外した**。

**残タスク（フェーズ C 以降）:** JMdict 見出しのマスタ合流、必要なら母集団ポリシーのチューニング（形態素 POS・全文の有無）。

### フェーズ C — JMdict（任意・第二ソース）

1. **見出し語（`keb`/`reb`）の抽出**を別コマンドまたは同一コマンドの `--also-jmdict` で TSV に合流。  
2. ライセンス表記は EDRDG 条項に合わせ、`CORPUS_MANIFEST` に独立エントリ。

**完了条件:** デッキ別件数が極端に崩れない範囲で、辞書由来語が候補に乗ること（閾値は後から調整可）。

### フェーズ D — 検証・運用

1. **ユニットテスト:** Tatoeba の極小フィクスチャ（数文）で抽出結果のスナップショット。  
2. **回帰:** `filter-deck` / `export` の既存テストが通ること。  
3. **ドキュメント:** `README.md` の「母集団は Tatoeba …」を冒頭に明記。

---

## 5. 意思決定メモ（更新）

- **既定ソース:** **Tatoeba のみ**（`build-corpus-from-tatoeba`）。JMdict は取得のみ・合流は任意。  
- **wordfreq:** **既定からオミット**済み（`build-corpus` は legacy のみ）。  
- **候補数:** `generate-wordlists` は **`--max-surfaces 60000`**（CLI 名は `max-surfaces`）。

---

## 6. 本ドキュメントの位置づけ

- **レポート:** 会話で確定した事実とギャップの記録（§1–§3）。  
- **プラン:** 次に着手する工程の順序と完了条件（§4–§5）。  

実装に入る際は §4 のフェーズ B をチケット単位に分割し、PR 説明には **「母集団の一次ソースが何になったか」** を必ず書く。
