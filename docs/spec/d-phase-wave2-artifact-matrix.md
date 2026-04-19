# Phase D — 第2波インポート対象マトリクス（実装容易度メモ）

出典: [03-io-contracts.md](../re/analysis/03-io-contracts.md)。最終的には同一タイムライン（`origin` / `artifactKind`）に載せる前提で、**作りやすい順**でスパイクする。

| 系 | 例ファイル | 想定形式 | 検証状態 | 実装メモ（難易度） |
|----|--------------|----------|----------|-------------------|
| Time ログ | `TimeKHJY.log` … `TimeKTWZ.log` | 120B バイナリ V0 | KHJY 部分確定 | **済:** `parseTimeKHJYLogFileV0`、同一レイアウトならサフィックスのみ分岐（低） |
| メモ | `JRmemo.txt` | テキスト想定 | 部分 | Web: 行単位インポート V0（`jrmemo_txt_v0`）、日付ヒューリスティックで sort |
| Boot | `Boot.txt` | テキスト想定 | 部分 | Web: 同上（`boot_txt_v0`） |
| Past | `Past.log` | **50B 固定バイナリ**（TWJR216 実測） | 部分 | Web: `past_binary_v0` + `pastLogBinaryV0.ts`；行テキストは未検証時のみ |
| Detail | `Dtld*.log` | **ヘッダ（6B トリプレット×2 文字）＋ float32 ＋末尾 0〜3B**（TWJR216） | 部分 | Web: `dtld_float32_blob_v0`（[`dtldBptnPoorFloatBlobV0.ts`](../../packages/engine/src/twelljr/dtldBptnPoorFloatBlobV0.ts)）。120B 先頭一致時は従来どおり `dtld_binary_v0`（Time 型） |
| Pattern | `Bptn*.log` | **float32 列のみ**（TWJR216） | 部分 | Web: `bptn_float32_blob_v0` |
| Weak | `Poor*.log` | **float32 列のみ**（TWJR216） | 部分 | Web: `poor_float32_blob_v0` |
| スロット | `0.twl` … `3.twl`, `ComJR.twl` | **TWJR216: VB 風 CRLF テキスト**（`#TRUE#` 等） | 部分 | Web: `twl_slot_txt_v0` 行取り込み（[`twlSlotTextSerializationV0.ts`](../../packages/engine/src/twelljr/twlSlotTextSerializationV0.ts) で検出） |
| エクスポート | `*.txt`（frmAllRireki / frmHeavy） | CSV/独自 | 未 | フォーマット別パーサ（要望駆動・中） |
| レジストリ等 | — | — | 未 | マトリクス外（フェーズ E） |

## 追わないもの（方針メモ）

`Dtld` / `Bptn` / `Poor` の float 列について、**列意味の確定**、**本家チャート相当の再現**、**リプレイとみなした解釈**は当面スコープ外とする。Web は **生の float バブル取り込み**までに留め、人向けの仮説メモは [10-dtld-bptn-poor-float-columns-hypothesis-v0.md](../re/analysis/10-dtld-bptn-poor-float-columns-hypothesis-v0.md) をアーカイブ扱いとする。

## 推奨スパイク順（このリポの方針）

1. 他 `Time*.log` — 120B 同一ならインポートパイプをそのまま流用。  
2. `Boot.txt` / `JRmemo.txt` — テキストとして読めるか確認 → 行ごと `artifactKind`。  
3. `Past.log` / `Dtld*` / `Bptn*` / `Poor*` — 実ファイル先頭で形式確定 → 1 ファイルずつ正規化型を追加。  
4. `.twl` — 実測テキスト系は **済（行）**；真バイナリ `.twl` が出たら別型。  
5. CSV 系 — 仕様が分かってから。

## 関連コード

- 正規化インポート（Time バイナリ）: [localStore.ts](../../apps/web/src/lib/localStore.ts) の `imported_native_v1`、[`timeKHJYLogBinaryV0.ts`](../../packages/engine/src/twelljr/timeKHJYLogBinaryV0.ts)  
- 本家 I/O 一覧: [03-io-contracts.md](../re/analysis/03-io-contracts.md)
