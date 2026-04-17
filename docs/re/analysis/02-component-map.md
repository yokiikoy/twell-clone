# Phase 2 — Surface map (components)

## Startup

- **`Startup="frmMain"`** — main typing shell ([`twjrdecomp/frmMain.frm`](../../twjrdecomp/frmMain.frm)).
- **`IconForm="frmMain"`**

## Standard modules (`.bas`)

| Module | First procedure (VB Decompiler) | Hypothesis |
|--------|-----------------------------------|--------------|
| `Module1.bas` | `Proc_1_0_51B39C`, `Proc_1_1_52F7B4` | Shared core: **total seconds → level label** (`51B39C`), **level letter → goal/timing bytes** (`52F7B4` — see Phase 4). |
| `Jou1.bas` | `Proc_2_0_5E3818` | 基本常用語 variant 1 |
| `Jou2.bas` | `Proc_19_0_5DB41C` | 基本常用語 variant 2 |
| `Jou3.bas` | `Proc_20_0_5D3E8C` | 基本常用語 variant 3 |
| `Kata1.bas` | `Proc_5_0_611D1C` | カタカナ語 variant 1 |
| `Kata2.bas` | `Proc_23_0_608200` | カタカナ語 variant 2 |
| `Kata3.bas` | `Proc_24_0_5EC240` | カタカナ語 variant 3 |
| `Kan1.bas` | `Proc_8_0_61B870` | 漢字 variant 1 |
| `Kan2.bas` | `Proc_25_0_6253FC` | 漢字 variant 2 |
| `Kan3.bas` | `Proc_26_0_62F33C` | 漢字 variant 3 |
| `Koto1.bas` | `Proc_9_0_5F4F70` | 慣用句・ことわざ variant 1 |
| `Koto2.bas` | `Proc_21_0_5FE6E4` | 慣用句・ことわざ variant 2 |

**Pattern:** Each mode family has **2–3 parallel modules** with one primary `Proc_*` each — likely **difficulty bands, word tables, or build flavors**. Diff `Jou1` vs `Jou2` bodies in a future pass.

## Forms (`.frm`)

| File | Caption (UTF-8 in source where readable) | Role (hypothesis) |
|------|------------------------------------------|-------------------|
| `frmMain.frm` | タイプウェル国語Ｒ | Main UI; very large (controls for typing surface, timers, labels). |
| `FormT.frm` | タイプウェル国語Ｒ | Secondary shell / trial UI (verify vs `frmMain`). |
| `KeyGuid.frm` | キーのガイド | Key guide overlay / help. |
| `FormSoufu.frm` | *(Shift_JIS)* ログと記録のエントリー | Log / record entry. |
| `FormD.frm` | Form1 | Placeholder or dialog stub — **needs event scan**. |
| `frmDialog.frm` | タイプウェル国語Ｒ | Generic dialog chrome. |
| `frmKeikoku.frm` | タイプウェル国語Ｒ | Warning / notice. |
| `frmSougou.frm` | *(Shift_JIS)* タイプウェル国語Ｒ … 総合記録 | Aggregate records. |
| `frmNigate.frm` | Form1 | Weak-word / “苦手” UI — caption generic; **verify**. |
| `frmRireki.frm` | *(Shift_JIS)* タイプウェル … 履歴閲覧 | History viewer. |
| `frmCopyOK.frm` | *(Shift_JIS)* 記録完了待ち | “Wait for copy done” dialog. |
| `frmNigaSettei.frm` | *(Shift_JIS)* 苦手設定 | Weak-word settings. |
| `frmSetting.frm` | *(Shift_JIS)* ローマ字表示設定 | Roman display settings. |
| `frmIndicator.frm` | *(Shift_JIS)* 目標インジケータ設定 | Goal pace / indicator settings. |
| `frmRomeBetu.frm` | *(Shift_JIS)* カナ別練習 | Per-kana practice. |
| `frmMiss.frm` | *(Shift_JIS)* ミス音設定 | Miss sound settings. |
| `frmAllRireki.frm` | *(Shift_JIS)* 全履歴 | Full history export / browse. |
| `frmKidou.frm` | *(Shift_JIS)* 起動・終了ログ | Boot / shutdown log. |
| `frmWebrkg.frm` | WebRanking | Web ranking feature. |
| `frmLoad.frm` | Form1 | Loader — **verify**. |
| `frmKeikaTime.frm` | *(Shift_JIS)* 経過時間帯表示設定 | Elapsed-time band display settings. |
| `frmReference.frm` | Reference | Reference / help window. |
| `frmDialog2.frm` | *(mojibake in grep)* | Small dialog — **recover caption with `.frx`/encoding**. |
| `frmHeavy.frm` | For Heavy User | “Heavy user” tools / patterns (`*t.txt`, `.twl` patterns in code). |

Captions marked Shift_JIS were inferred from context where the export shows mojibake in tools; reconcile with live UI or `.frx`.

## `frmMain.frm` decomposition strategy

Bootstrap survey: **[02-frmMain-survey.md](02-frmMain-survey.md)** (timers, sample menu handlers).

The file is **tens of thousands of lines** — do not read linearly. Recommended chunks:

1. **Header block** — `VERSION`, `Caption`, scale, `Icon = "frmMain.frx":0000` (proves **expected `.frx`**).  
2. **`Begin VB.Timer`** sections — list all `Timer` control names and `Interval` if present.  
3. **`Begin VB.PictureBox` / `Begin VB.Label` grids** — typing surface (`lblBig` index runs appear early).  
4. **Event procedures** — search for `Private Sub` / `Public Sub` at end of file (VB Decompiler may interleave pcode).

Add findings as sub-bullets under `02-component-map.md` or a child file `02-frmMain-survey.md` when surveyed.

## String sweep (quick)

Embedded literals in forms reference logs such as `\TimeKHJY.log`, `\DetailLog\`-style paths, `Boot.txt`, `JRmemo.txt` — see [Phase 3](03-io-contracts.md).
