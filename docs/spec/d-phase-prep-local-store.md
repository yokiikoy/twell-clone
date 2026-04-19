# Phase D prep — browser persistence and export spike

This note scopes **local-first** persistence for the Web app before parity work on official log formats. It complements [External I/O and data contracts](../re/analysis/03-io-contracts.md).

## Provenance model（Web 試行 vs 本家インポート）

- **一本のタイムライン**（履歴 UI）に、ブラウザ内試行と本家由来の行を **時系列でマージ**して表示する。
- **Web 試行**は既存ストア `trial_sessions_v1` のみ。行の意味は従来どおり `LocalTrialSessionRecordV1`（`schemaVersion: 1`）。
- **本家インポート**は別ストア `imported_native_v1`。各行は正規化された論理レコードで、**本家ファイルと同一バイト列は保持しない**。
- 本家行の区別フィールド（IndexedDB 上）:
  - **`origin`**: 現状は常に `native_import`（表示ラベルは「本家記録」系）。
  - **`artifactKind`**: パーサ／ファイル族。例: `time_binary_v0`、`dtld_float32_blob_v0`、`boot_txt_v0`、`jrmemo_txt_v0`（ほか追加可）。
  - **`timeLogSuffix`**: ファイル名から推定した `KHJY` / `KTKN` / …（`inferTimeLogSuffixFromFilename`）。不明なら `null`。
  - **`sortMs`**: タイムライン用の数値ソートキー。Time バイナリはレコード先頭の日付＋時刻列を UTC 解釈した ms（解釈不能時は `0` で、`importedAt` 側のマージで後退しないよう UI 読み込みで補助）。
  - **`sourceFileName`**, **`sourceByteLength`**, **`recordIndex`**, **`importedAt`**: 取り込み元の追跡用。
- 同一 **`sourceFileName`** で再インポートした場合、**既存のそのファイル由来行を削除してから**新しい行を挿入する（置換セマンティクス）。

第2波で載せる他ファイルの一覧・難易度は [d-phase-wave2-artifact-matrix.md](d-phase-wave2-artifact-matrix.md)。

## Goals (this iteration)

1. **IndexedDB scaffold** — versioned object stores: Web 試行（append-only）＋本家インポート（ファイル単位置換）。
2. **JSON export envelope** — machine-readable bundle for later import / diff tooling（Web 試行のみの JSON 書き出しは従来どおり）。
3. **Traceability** — each row carries enough context to map toward official artifacts later (`Time*.log` per mode suffix, `Past.log`, etc.) without claiming byte-for-byte compatibility.

## Time*.log stub export (engine + Web)

- **Not** native VB `TimeKHJY.log` … bytes. A tab-separated trace with marker `WEB_V1` and the four filename suffixes (`KHJY` … `KTWZ`) for alignment with [03-io-contracts.md](../re/analysis/03-io-contracts.md).
- **Engine:** `timeLogSuffixForGameMode` in [`logContracts.ts`](../../packages/engine/src/twelljr/logContracts.ts), `formatTimeLogStubLineV1` / `buildTimeLogStubFileBodyV1` in [`timeLogStubLine.ts`](../../packages/engine/src/twelljr/timeLogStubLine.ts), tests in [`timeLogStubLine.test.ts`](../../packages/engine/src/twelljr/timeLogStubLine.test.ts).
- **Web:** `/records/history` → 「Time ログスタブ (TXT)」は全件1ファイル、「**Time*.log スタブ ZIP**」は `TimeKHJY.log` … `TimeKTWZ.log` の**4名**で分割（中身は同一 `WEB_V1` スタブ行）。取り込み欄は **`WEB_V1` 行だけ**プレビュー（本家独自行はスキップして理由を表示）。
- **Fixture:** [`packages/engine/fixtures/timelog-stub/sample-combined.txt`](../../packages/engine/fixtures/timelog-stub/sample-combined.txt) — パーサ結合用の匿名サンプル。

## Non-goals (yet)

- Parsing or emitting **verified** VB-era `.log` line formats (stub only until captures exist).
- Sync, accounts, or server-side storage.
- Full lap vectors or per-keystroke traces (can extend schema in a new `schemaVersion`).

## Mapping toward `03-io-contracts.md`

| Official artifact (hypothesis) | Web store / 状態 |
|-------------------------------|------------------|
| `TimeKHJY.log` … `TimeKTWZ.log` | **インポート:** `imported_native_v1`（`time_binary_v0`）。**スタブ書き出し:** 既存 ZIP/TXT。 |
| `Past.log` 他 | マトリクス参照。別 `artifactKind` で同一ストアまたはストア分割は実装時に決定。 |
| `Dtld*.log`, `Bptn*.log`, `Poor*.log` | 未。 |
| `*.twl` slots | 未。 |

## Schema: `trial_sessions_v1`

Implemented in `apps/web/src/lib/localStore.ts` as `LocalTrialSessionRecordV1`:

- `schemaVersion`: `1`
- `id`: UUID
- `savedAt`: ISO-8601
- `deckKind`: `merged` | `single`
- `mergedTab` / `singleDeckId`: which surface was active
- `gameMode`: engine mode string (`kihon`, `katakana`, …)
- `deckCaption`: human-readable label (debug / support)
- `trialStrokeTarget`, `confirmedStrokes`, `elapsedMs` (engine wall-clock trial duration), `resultLevelId`, `missCount`

## Schema: `imported_native_v1`

`apps/web/src/lib/localStore.ts` の `NativeImportRecordV1`（判別共用、`keyPath: "id"`）。

- **`time_binary_v0` / `dtld_binary_v0` / `bptn_binary_v0` / `poor_binary_v0`:** いずれも `record` に 120B パース結果（Dtld 等は **Time 同型の仮定**）。`timeLogSuffix` はファイル名から（[`nativeLogFamilyFilenameV0.ts`](../../packages/engine/src/twelljr/nativeLogFamilyFilenameV0.ts)）。
- **テキスト行:** `boot_txt_v0` / `jrmemo_txt_v0` / `twl_slot_txt_v0` / `dtld_txt_v0` / `bptn_txt_v0` / `poor_txt_v0` — 非空行ごと 1 行（Dtld 等は [`bufferLooksLikeLineOrientedTextLogV0`](../../packages/engine/src/twelljr/nativeBufferTextHeuristicV0.ts) が true のときのみ UI で取り込み可。`.twl` は [`looksLikeTwlSlotTextSerializationV0`](../../packages/engine/src/twelljr/twlSlotTextSerializationV0.ts)）。`sortMs` は日付ヒューリスティック（[`nativeTextArtifactV0.ts`](../../packages/engine/src/twelljr/nativeTextArtifactV0.ts)）。
- **`past_binary_v0`:** `Past.log` の **50B 固定**レコード（[`pastLogBinaryV0.ts`](../../packages/engine/src/twelljr/pastLogBinaryV0.ts)）。日付は **`DD.MM.YY`**、float32、int32。

インデックス: `sourceFileName`（置換削除用）、`sortMs`（新しい順の列挙用）。

## Unified timeline（読み取り）

- `listUnifiedTimelineDescending` — `trial_sessions_v1` と `imported_native_v1` をマージし、`sortMs` 降順（同値は `id` で安定化）。
- クリップボード用のタブ区切り行: `apps/web/src/lib/timelineCopy.ts` の `formatTimelineRowCopyLine`。

## Next steps (Phase D proper)

1. Time 列の意味確定（表示品質）— [09-time-khjy-binary-layout-v0.md](../re/analysis/09-time-khjy-binary-layout-v0.md) と照合。
2. 第2波ファイル種別ごとのパーサと `artifactKind` 拡張 — [d-phase-wave2-artifact-matrix.md](d-phase-wave2-artifact-matrix.md)。
3. Golden tests against **anonymized native** fixtures once available (stub tests already in engine).

## Code touchpoints

- Persistence: `apps/web/src/lib/localStore.ts`
- タイムライン行コピー: `apps/web/src/lib/timelineCopy.ts`
- 取り込み UI: `apps/web/src/components/TimeLogImportPreview.tsx`
- Boot/JRmemo デコード・行分割・sort ヒューリスティック: `packages/engine/src/twelljr/nativeTextArtifactV0.ts`
- ログ族ファイル名→`artifactKind`: `packages/engine/src/twelljr/nativeLogFamilyFilenameV0.ts`
- `Past.log` 50B: `packages/engine/src/twelljr/pastLogBinaryV0.ts`、行/バイナリ切分ヒューリスティック: `nativeBufferTextHeuristicV0.ts`
- Write path: `TypingCanvas` on first transition to `finished` (400 確定ストローク)
- Read path: `records/history` via `LocalTrialHistoryPanel`
