# Web 表面積マトリクス（TWellJR → Web）

**目的:** 公式 VB6 の **フォーム数・メニュー相当の表面積**を Web で落とさない（セマンティック一致方針）。  
**ソース:** [analysis/02-component-map.md](analysis/02-component-map.md)、[analysis/05-ui-statechart.md](analysis/05-ui-statechart.md)。

**Status 凡例:** `未着手` | `スタブ` | `一部実装` | `完了`（フェーズ C では UI 到達性優先のため多くは `スタブ`）。

## フォーム / シェル → Web 単位

| VB 資産 | 推奨 Web 単位 | WebPath | Status | Notes |
|---------|----------------|---------|--------|-------|
| `frmMain.frm` | `AppShell` + メニューバー + タイピングキャンバス | `/` | 一部実装 | 練習 UI は [`TypingCanvas`](../../apps/web/src/components/TypingCanvas.tsx)。メニューバーはフェーズ C で追加 |
| `FormT.frm` | 副シェル | `/shell/form-t` | スタブ | 02: Secondary shell |
| `KeyGuid.frm` | `KeyGuideDialog`（クライアントモーダル） | `(modal)` | 一部実装 | 05 `mnuGuid_Click` トグル相当。`/guide/key` は未使用（メニューからモーダルのみ） |
| `FormSoufu.frm` | `LogEntry` | `/records/log-mail` | スタブ | 05 `mnuMail_Click` |
| `FormD.frm` | `RankingChartDialog` | `/charts/ranking` | スタブ | 05 多数 `mnu*P` → `FormD.Show` |
| `frmDialog.frm` | `AppDialog` | `/dialogs/generic` | スタブ | 汎用ダイアログ枠 1 |
| `frmDialog2.frm` | `AppDialog2` | `/dialogs/generic-2` | スタブ | 02 に独立行あり（旧マトリクスは `frmDialog` と併記のみ） |
| `frmKeikoku.frm` | `AlertDialog` | `/system/alert` | スタブ | 05 `Timer1_Timer` 等。試行中トーストは未結線 |
| `frmSougou.frm` | `AggregateRecordsPage` | `/records/aggregate` | スタブ | 05 `mnuSougou` |
| `frmNigate.frm` | `WeakWordsPracticePage` | `/records/weak-practice` | スタブ | 05 `mnuRenshuu` |
| `frmRireki.frm` | `HistoryViewerPage` | `/records/history` | スタブ | 05 `mnuRenJisseki` |
| `frmCopyOK.frm` | `CopyWait` | `/system/copy-wait` | スタブ | 記録完了待ち |
| `frmNigaSettei.frm` | `WeakWordSettingsPage` | `/settings/weak-words` | スタブ | 05 `mnuNigateSettei` |
| `frmSetting.frm` | `RomanSettingsPage` | `/settings/roman` | スタブ | 05 `mnuFontSettei` |
| `frmIndicator.frm` | `IndicatorSettingsPage` | `/settings/indicator` | スタブ | 05 `mnuIndicator` |
| `frmRomeBetu.frm` | `KanaByKanaPage` | `/settings/kana-by-kana` | スタブ | 05 `mnuRom` |
| `frmMiss.frm` | `MissSoundSettingsPage` | `/settings/miss` | スタブ | 05 `mnuMissJougen` |
| `frmAllRireki.frm` | `FullHistoryPage` | `/records/full-history` | スタブ | 05 `mnuZenrireki` |
| `frmKidou.frm` | `BootLogPage` | `/records/boot-log` | スタブ | 05 `mnuKidou` |
| `frmWebrkg.frm` | `WebRankingPage` | `/records/web-ranking` | スタブ | 05 `mnuZenkoku` |
| `frmLoad.frm` | `LoaderOverlay` | `/system/loader` | スタブ | 02: 要 pcode 確認 |
| `frmKeikaTime.frm` | `ElapsedBandSettingsPage` | `/settings/elapsed-bands` | スタブ | 05 `mnuKeikaTime` |
| `frmReference.frm` | `ReferencePanel` | `/system/reference` | スタブ | 02 Reference |
| `frmHeavy.frm` | `HeavyUserToolsPage` | `/tools/heavy-user` | スタブ | `.twl` / パターン系 |

**02 突合:** 上表は [02-component-map.md](analysis/02-component-map.md) の Forms 表に **1 行ずつ対応**（`frmDialog` / `frmDialog2` を分割）。`.bas` 語モジュールは本マトリクス対象外（データパイプライン側）。

## `frmMain` メニュー → 遷移（05 より）

| メニュー / トリガー | Web 遷移先（案） | WebPath | Status | Notes |
|---------------------|------------------|---------|--------|-------|
| `mnuSougou_Click` / `mnuSougouP_Click` | `AggregateRecordsPage` | `/records/aggregate` | スタブ | |
| `mnuNigateSettei_Click` | `WeakWordSettingsPage` | `/settings/weak-words` | スタブ | |
| `mnuMissJougen_Click` | `MissSoundSettingsPage` | `/settings/miss` | スタブ | |
| `mnuRenshuu_Click` | `WeakWordsPracticePage` | `/records/weak-practice` | スタブ | |
| `mnuRenJisseki_Click` / `P` | `HistoryViewerPage` | `/records/history` | スタブ | |
| `mnuMail_Click` | `LogEntry` | `/records/log-mail` | スタブ | |
| `mnuFontSettei_Click` | `RomanSettingsPage` | `/settings/roman` | スタブ | |
| `mnuIndicator_Click` | `IndicatorSettingsPage` | `/settings/indicator` | スタブ | |
| `mnuKeikaTime_Click` | `ElapsedBandSettingsPage` | `/settings/elapsed-bands` | スタブ | |
| `mnuZenkoku_Click` | `WebRankingPage` | `/records/web-ranking` | スタブ | |
| `mnuGuid_Click` | `KeyGuideDialog` | `(modal)` | 一部実装 | `AppShell` 内トグル |
| `mnuTopL_Click` / `P` | `FormT` shell | `/shell/form-t` | スタブ | |
| `mnuRom_Click` | `KanaByKanaPage` | `/settings/kana-by-kana` | スタブ | |
| `mnuKidou_Click` | `BootLogPage` | `/records/boot-log` | スタブ | |
| `mnuZenrireki_Click` | `FullHistoryPage` | `/records/full-history` | スタブ | |
| `mnuReadMe_Click` | 静的ヘルプ | `/help/readme` | スタブ | 本家は `ReadMe.txt` を ShellExecute |
| `mnuWeb_Click` | 外部 URL | `https://www.twfan.com/` | 完了 | メニューから `target=_blank` のみ（本家委譲） |
| `mnuEnd_Click` / `mnuEndb_Click` | セッション終了案内 | `/session/end` | スタブ | Web ではタブ閉じる案内 |
| `mnuKako10P` 等 → `FormD` | `RankingChartDialog` | `/charts/ranking` | スタブ | 共有チャート面 |
| `Timer1_Timer` → `frmKeikoku` | 警告 | `/system/alert` | スタブ | インラインは未実装 |

## レビュー用チェック

- [x] 上表の **行が公式 `frm*` 一覧から欠けていない**（02 Forms 表と突合、`frmDialog2` 明示）。
- [x] **メニュー経路**が 05 の `Show` 表と **WebPath で 1:1 辿れる**（`mnuWeb` は外部リンク）。
- [ ] Web で **1 画面に統合しすぎていない**（レビュー時に明示的に却下理由を書く）— 現状はスタブ分散のため保留。

更新履歴: 初版（実行プラン `surface-matrix`）。フェーズ C: WebPath / Status / Notes 列追加、02 突合チェック更新。
