# Web 表面積マトリクス（TWellJR → Web）

**目的:** 公式 VB6 の **フォーム数・メニュー相当の表面積**を Web で落とさない（セマンティック一致方針）。  
**ソース:** [analysis/02-component-map.md](analysis/02-component-map.md)、[analysis/05-ui-statechart.md](analysis/05-ui-statechart.md)。

**Status 凡例:** `未着手` | `スタブ` | `一部実装` | `完了`（フェーズ C では UI 到達性優先のため多くは `スタブ`）。

| Status | 意味 |
|--------|------|
| `スタブ` | 到達のみ、本家項目の列挙が主（`StubPage` 琥珀帯） |
| `一部実装` | 主要表示/入力の一部、または IndexedDB 等と結線（`StubPage` は青帯または子ありで琥珀省略可） |
| `完了` | 05 の当該経路で期待する主要フローが Web で再現（境界は別タスク可） |

## フォーム / シェル → Web 単位

| VB 資産 | 推奨 Web 単位 | WebPath | Status | Notes |
|---------|----------------|---------|--------|-------|
| `frmMain.frm` | `AppShell` + メニューバー + タイピングキャンバス | `/` | 一部実装 | 練習 UI は [`TypingCanvas`](../../apps/web/src/components/TypingCanvas.tsx)。メニューバーはフェーズ C で追加 |
| `FormT.frm` | 副シェル | `/shell/form-t` | 一部実装 | 02: Secondary shell。副シェル相当の説明＋ホーム導線 |
| `KeyGuid.frm` | `KeyGuideDialog`（クライアントモーダル） | `(modal)` | 一部実装 | 05 `mnuGuid_Click` トグル相当。`/guide/key` は未使用（メニューからモーダルのみ） |
| `FormSoufu.frm` | `LogEntry` | `/records/log-mail` | 一部実装 | 05 `mnuMail_Click`。送付フォーム枠のみ（送信未実装） |
| `FormD.frm` | `RankingChartDialog` | `/charts/ranking` | 一部実装 | 05 多数 `mnu*P` → `FormD.Show`。チャート枠モック＋総合記録への導線 |
| `frmDialog.frm` | `AppDialog` | `/dialogs/generic` | 一部実装 | 汎用ダイアログ枠 1。OK/キャンセル見本（未配線） |
| `frmDialog2.frm` | `AppDialog2` | `/dialogs/generic-2` | 一部実装 | 02 に独立行あり。第2ダイアログ見本 |
| `frmKeikoku.frm` | `AlertDialog` | `/system/alert` | 一部実装 | 05 `Timer1_Timer` 等。警告モック。試行中トーストは未結線 |
| `frmSougou.frm` | `AggregateRecordsPage` | `/records/aggregate` | 一部実装 | 05 `mnuSougou`。[`RecordsUnifiedSummary`](../../apps/web/src/components/RecordsUnifiedSummary.tsx) で要約 |
| `frmNigate.frm` | `WeakWordsPracticePage` | `/records/weak-practice` | 一部実装 | 05 `mnuRenshuu`。説明＋ `/` 試行・苦手設定への導線 |
| `frmRireki.frm` | `HistoryViewerPage` | `/records/history` | 一部実装 | 05 `mnuRenJisseki`。IndexedDB 試行＋本家取り込み・[`LocalTrialHistoryPanel`](../../apps/web/src/components/LocalTrialHistoryPanel.tsx) |
| `frmCopyOK.frm` | `CopyWait` | `/system/copy-wait` | 一部実装 | 記録完了待ち。文言プレースホルダ |
| `frmNigaSettei.frm` | `WeakWordSettingsPage` | `/settings/weak-words` | 一部実装 | 05 `mnuNigateSettei`。[`PhaseCSettingsPanels`](../../apps/web/src/components/settings/PhaseCSettingsPanels.tsx) + localStorage |
| `frmSetting.frm` | `RomanSettingsPage` | `/settings/roman` | 一部実装 | 05 `mnuFontSettei`。同上 |
| `frmIndicator.frm` | `IndicatorSettingsPage` | `/settings/indicator` | 一部実装 | 05 `mnuIndicator`。同上 |
| `frmRomeBetu.frm` | `KanaByKanaPage` | `/settings/kana-by-kana` | 一部実装 | 05 `mnuRom`。同上 |
| `frmMiss.frm` | `MissSoundSettingsPage` | `/settings/miss` | 一部実装 | 05 `mnuMissJougen`。同上 |
| `frmAllRireki.frm` | `FullHistoryPage` | `/records/full-history` | 一部実装 | 05 `mnuZenrireki`。長めプレビュー表＋ [`RecordsUnifiedSummary`](../../apps/web/src/components/RecordsUnifiedSummary.tsx) |
| `frmKidou.frm` | `BootLogPage` | `/records/boot-log` | 一部実装 | 05 `mnuKidou`。Boot.txt 取り込みは練習記録へ誘導 |
| `frmWebrkg.frm` | `WebRankingPage` | `/records/web-ranking` | 一部実装 | 05 `mnuZenkoku`。外部ミラーへのリンクのみ |
| `frmLoad.frm` | `LoaderOverlay` | `/system/loader` | 一部実装 | 02: 要 pcode 確認。スピナー演出モック |
| `frmKeikaTime.frm` | `ElapsedBandSettingsPage` | `/settings/elapsed-bands` | 一部実装 | 05 `mnuKeikaTime`。[`webClientPrefs`](../../apps/web/src/lib/webClientPrefs.ts) |
| `frmReference.frm` | `ReferencePanel` | `/system/reference` | 一部実装 | 02 Reference。/help/readme 等への導線 |
| `frmHeavy.frm` | `HeavyUserToolsPage` | `/tools/heavy-user` | 一部実装 | `.twl` / パターン系。03-io 案内＋練習記録への取り込み導線 |

**02 突合:** 上表は [02-component-map.md](analysis/02-component-map.md) の Forms 表に **1 行ずつ対応**（`frmDialog` / `frmDialog2` を分割）。`.bas` 語モジュールは本マトリクス対象外（データパイプライン側）。

## `frmMain` メニュー → 遷移（05 より）

| メニュー / トリガー | Web 遷移先（案） | WebPath | Status | Notes |
|---------------------|------------------|---------|--------|-------|
| `mnuSougou_Click` / `mnuSougouP_Click` | `AggregateRecordsPage` | `/records/aggregate` | 一部実装 | |
| `mnuNigateSettei_Click` | `WeakWordSettingsPage` | `/settings/weak-words` | 一部実装 | |
| `mnuMissJougen_Click` | `MissSoundSettingsPage` | `/settings/miss` | 一部実装 | |
| `mnuRenshuu_Click` | `WeakWordsPracticePage` | `/records/weak-practice` | 一部実装 | |
| `mnuRenJisseki_Click` / `P` | `HistoryViewerPage` | `/records/history` | 一部実装 | 同上 |
| `mnuMail_Click` | `LogEntry` | `/records/log-mail` | 一部実装 | |
| `mnuFontSettei_Click` | `RomanSettingsPage` | `/settings/roman` | 一部実装 | |
| `mnuIndicator_Click` | `IndicatorSettingsPage` | `/settings/indicator` | 一部実装 | |
| `mnuKeikaTime_Click` | `ElapsedBandSettingsPage` | `/settings/elapsed-bands` | 一部実装 | |
| `mnuZenkoku_Click` | `WebRankingPage` | `/records/web-ranking` | 一部実装 | |
| `mnuGuid_Click` | `KeyGuideDialog` | `(modal)` | 一部実装 | `AppShell` 内トグル |
| `mnuTopL_Click` / `P` | `FormT` shell | `/shell/form-t` | 一部実装 | |
| `mnuRom_Click` | `KanaByKanaPage` | `/settings/kana-by-kana` | 一部実装 | |
| `mnuKidou_Click` | `BootLogPage` | `/records/boot-log` | 一部実装 | |
| `mnuZenrireki_Click` | `FullHistoryPage` | `/records/full-history` | 一部実装 | |
| `mnuReadMe_Click` | 静的ヘルプ | `/help/readme` | 一部実装 | 本家は `ReadMe.txt` を ShellExecute。リポ内 doc パス案内 |
| `mnuWeb_Click` | 外部 URL | `http://tanon710.s500.xrea.com/typewell_mirror/index.html`（**非公式ミラー**） | 完了 | 本家 EXE は `http://www.twfan.com/`（TwFan 閉鎖）。Web はミラーへ `target=_blank` |
| `mnuEnd_Click` / `mnuEndb_Click` | セッション終了案内 | `/session/end` | 一部実装 | Web ではタブ閉じる案内＋練習記録リンク |
| `mnuKako10P` 等 → `FormD` | `RankingChartDialog` | `/charts/ranking` | 一部実装 | 共有チャート面（モック） |
| `Timer1_Timer` → `frmKeikoku` | 警告 | `/system/alert` | 一部実装 | インラインは未実装。モック警告あり |

## レビュー用チェック

- [x] 上表の **行が公式 `frm*` 一覧から欠けていない**（02 Forms 表と突合、`frmDialog2` 明示）。
- [x] **メニュー経路**が 05 の `Show` 表と **WebPath で 1:1 辿れる**（`mnuWeb` は外部リンク）。
- [x] Web で **1 画面に統合しすぎていない** — 方針: **VB フォーム 1 行 = WebPath 1 本**で分散（[`stubNavConfig`](../../apps/web/src/lib/stubNavConfig.ts) とサイドバーで発見可能性を維持）。統合案がある場合は却下理由を Notes に記す。

更新履歴: 初版（実行プラン `surface-matrix`）。フェーズ C: WebPath / Status / Notes 列追加、02 突合チェック更新。フェーズ C スタブ詰め: 多くの `スタブ` を `一部実装` に更新（`StubPage` variant、`RecordsUnifiedSummary`、設定 localStorage 等）。
