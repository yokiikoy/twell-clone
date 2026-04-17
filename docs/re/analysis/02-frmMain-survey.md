# `frmMain` — partial survey (bootstrap)

Source: [`twjrdecomp/frmMain.frm`](../../twjrdecomp/frmMain.frm).

## Scale

- **VB.Timer** sections: **3** (`Begin VB.Timer` count).
- **Menu / event region** begins around line **~15623** (first `Private Sub mnu*` / `Timer1_Timer` in export).

## Sample menu handlers (addresses from VB Decompiler)

| Procedure | Address | Inferred meaning (Japanese menu stem) |
|-----------|---------|----------------------------------------|
| `mnuSougouP_Click` | `50EE48` | 総合 related |
| `mnuNigateSettei_Click` | `506A68` | 苦手設定 |
| `mnuMissJougen_Click` | `5069D8` | ミス上限 |
| `mnuEnd_Click` | `506B88` | 終了 |
| `mnuRenshuu_Click` | `50A1C4` | 練習 |
| `mnuReadMe_Click` | `50CECC` | ReadMe |
| `mnuRenJisseki_Click` | `50979C` | 練習実績 |
| `mnuFontSettei_Click` | `5096AC` | フォント設定 |
| `mnuIndicator_Click` | `506A20` | インジケータ |
| `mnuKeikaTime_Click` | `506990` | 経過時間 |
| `Timer1_Timer` | `517378` | Core tick — **high priority for Phase 5/6** |

## Follow-ups

- [ ] Name all three `Timer` controls and intervals from form header.  
- [ ] Map `mnu*Click` → shown forms (`frmSetting`, `frmIndicator`, …).  
- [ ] Correlate `Timer1_Timer` with `Module1` / mode modules via xref inside pcode body.
