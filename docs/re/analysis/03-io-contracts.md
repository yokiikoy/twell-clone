# Phase 3 — External I/O and data contracts

## Method

Strings embedded in the VB Decompiler export (mostly under [`twjrdecomp/*.frm`](../../twjrdecomp)) were grepped for path-like literals. **Leading `\`** often means “relative to app working directory” in VB apps.

## File artifacts (observed literals)

| Artifact | Example literal | Seen in | Likely role |
|----------|------------------|---------|-------------|
| Time logs | `\TimeKHJY.log`, `\TimeKTKN.log`, `\TimeKNJ.log`, `\TimeKTWZ.log` | `frmWebrkg.frm`, `frmReference.frm` | Per-mode **time** practice logs (suffix: 基本 / カタカナ / 漢字 / 慣用句ぽい) |
| Detail logs | `\DtldKHJY.log`, `\DtldKTKN.log`, `\DtldKNJ.log`, `\DtldKTWZ.log` | `frmReference.frm` | “Detailed” companion to time logs |
| Pattern logs | `\BptnKHJY.log`, `\BptnKTKN.log`, … | `frmRomeBetu.frm`, `frmNigate.frm` | **B**ptn = pattern / 部品? |
| Weak logs | `\PoorKHJY.log`, … | `frmNigate.frm` | **Poor** = weak words |
| Past | `\Past.log` | `frmRireki.frm` | Past trials |
| Memo | `\JRmemo.txt` | `frmWebrkg.frm` | User memo for web ranking |
| Boot | `Boot.txt` | `frmKidou.frm` | Boot / shutdown journal |
| Export filter | `*.txt`, `*t.txt`, `t.txt` | `frmAllRireki.frm`, `frmHeavy.frm` | CSV export / heavy-user batch |
| Config slots | `0.twl` … `3.twl`, `*0.twl` … | `frmHeavy.frm` | **TWL** slot files (aligns with `ComJR.twl` family in [binary-inventory](../binary-inventory.md)) |

**Mode suffix mapping (hypothesis):**

| Suffix | Likely mode |
|--------|-------------|
| `KHJY` | 基本常用語 |
| `KTKN` | カタカナ語 |
| `KNJ` | 漢字 |
| `KTWZ` | 慣用句・ことわざ |

## Registry / network

| Class | Status |
|-------|--------|
| Registry | No literals like `Software\` spotted in this grep pass — **re-scan** with `strings` on EXE or API monitor in Phase 6. |
| HTTP / Web | **`dumpbin /IMPORTS`** on the canonical EXE lists **only `MSVBVM60.DLL`** — no static **`WININET` / `WS2_32` / `URLMON`** imports ([EXP-20260417-PE](06-dynamic-notes.md#exp-20260417-pe)). **`mnuWeb_Click`** opens `http://www.twfan.com/` with **`ShellExecute`** (default browser) per `frmMain.frm` pcode. **Web 再現:** TwFan 閉鎖のため **非公式ミラー** `http://tanon710.s500.xrea.com/typewell_mirror/index.html` を開く。 **`frmWebrkg` (WebRanking):** export + EXE substring scan show **no** WinInet/MSXML/socket strings; pcode uses **`OpenFile`** on `Time*.log` and **`ShellExecute`** ([EXP-20260417-WEB](06-dynamic-notes.md#exp-20260417-web)). Live **API Monitor** on the running form remains optional hardening if policy requires process-level proof. |

## Contract table template

| Contract ID | Read/Write | Format | Evidence file:line | Verified |
|-------------|------------|--------|---------------------|----------|
| TIME-KHJY | append? | `.log` **binary record** (LE `uint16` len + ASCII + `float32`×9 + `int32` + …) — [09-time-khjy-binary-layout-v0.md](09-time-khjy-binary-layout-v0.md) | frmReference / frmWebrkg + user head capture | partial |

Fill **Verified** in Phase 6 using runtime traces.

## Alignment with installed data folder

Cross-check paths against the real install tree (`DetailLog\*.txt`, `ReadMe.txt`, etc.) listed in [binary-inventory](../binary-inventory.md).

**Web prep (local store spike):** [`docs/spec/d-phase-prep-local-store.md`](../../spec/d-phase-prep-local-store.md) — IndexedDB trial summaries, per-`Time*.log` stub ZIP export, `WEB_V1` import preview, native `Time*.log` binary import into `imported_native_v1`, unified timeline UI, and [`fixtures/timelog-stub`](../../packages/engine/fixtures/timelog-stub) for parser tests (not verified native log bytes). **第2波候補の実装順メモ:** [`d-phase-wave2-artifact-matrix.md`](../../spec/d-phase-wave2-artifact-matrix.md)。

**Native `Time*.log` capture plan (V0):** [`08-time-log-native-format-v0.md`](08-time-log-native-format-v0.md) — capture checklist + text heuristics; **binary layout head:** [`09-time-khjy-binary-layout-v0.md`](09-time-khjy-binary-layout-v0.md), parser `timeKHJYLogBinaryV0.ts`, fixture [`timekhjy-head-64.bin`](../../packages/engine/fixtures/timelog-native/timekhjy-head-64.bin).
