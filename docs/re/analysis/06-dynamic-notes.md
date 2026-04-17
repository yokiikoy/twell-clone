# Phase 6 — Dynamic verification (log)

## Purpose

Back **static** claims in `01`–`05` with **runtime evidence** (debugger, API monitor, or scripted trials).

## Environment log (fill per session)

| Field | Value |
|-------|--------|
| Date | 2026-04-17 |
| Windows build | `Microsoft Windows [Version 10.0.26200.8246]` (`cmd /c ver`, Wave 3 session) |
| EXE path + SHA-256 | `C:\Users\hotwa\Dropbox\TWJR216\TWellJR.exe` — `BE84162B4D8CE0F34972E19D51C26416080A3FC99B3E6BA70C590BBCB5DAA0AD` |
| Debugger / tools | `dumpbin` 14.44.x (VS 2022 Build Tools); **API Monitor / x32dbg not installed** on this host — Wave 3 used **export audit + binary substring scan** instead of live API trace where noted |

## Experiment template

### EXP-YYYYMMDD-01

| Section | Content |
|---------|---------|
| Hypothesis | One sentence |
| Setup | Steps to reach UI state |
| Procedure | Breakpoints / filters |
| Observations | Registers, return values, file writes |
| Conclusion | Confirmed / refuted / inconclusive |
| Links | Update `04-domain-typing.md` §… if confirmed |

## Suggested first experiments

1. **EXP-LEVEL-01:** Break on `Module1.Proc_1_0_51B39C` (`51B39C`); feed known float seconds; verify returned string vs table in [04-domain-typing](04-domain-typing.md).  
2. **EXP-IO-01:** API Monitor filter `CreateFileW`; run one trial; capture paths under `DetailLog` / `Time*.log`.  
3. **EXP-TIMER-01:** Break `Timer1_Timer`; log call frequency vs wall clock.

<a id="exp-20260417-pe"></a>

### EXP-20260417-PE — Import table snapshot

| Section | Content |
|---------|---------|
| Hypothesis | Shipped EXE has **no direct `WININET` / `WS2_32` / `URLMON`** import table entries; networking is via shell or late-bound calls. |
| Setup | Install path above; `dumpbin /IMPORTS TWellJR.exe`. |
| Procedure | Read first import DLL block. |
| Observations | Only **`MSVBVM60.DLL`** appears in the import section listing (ordinal + named runtime helpers). |
| Conclusion | **Import table** supports “no statically linked Winsock/WinInet” — browser / file opens use **`ShellExecute`** (see `frmMain` `mnuWeb_Click`, `mnuReadMe_Click`). **Inconclusive** for COM / `CreateObject` network without runtime API monitor. |
| Links | [03-io-contracts](03-io-contracts.md) § Registry / network; [07-system-spec](07-system-spec.md) O-09 resolved note. |

<a id="exp-20260417-level"></a>

### EXP-20260417-LEVEL — `Proc_1_0_51B39C` float seconds → label

| Section | Content |
|---------|---------|
| Hypothesis | Ladder in [04-domain-typing](04-domain-typing.md) matches representative `arg_C` values; trailing block picks **ＭＳ ゴシック** vs **ＭＳ Ｐゴシック** using the same `76` (`0x4C`) cutoff. |
| Setup | Source: [`twjrdecomp/Module1.bas`](../../twjrdecomp/Module1.bas) `Private Function Proc_1_0_51B39C` (`'51B39C`). **Process debugger not used** (x32dbg not present). |
| Procedure | Hand-walk the published `LtR8` / `GeR8` ladder order; check three `Single`-class inputs **5**, **75**, **210** seconds. |
| Observations | **5:** first test `arg_C < 10` (`&HA`) succeeds → `LitStr "ZS"` then branch to `loc_51B37C` (`Module1.bas` lines 4–11, 363+). **75:** fails `arg_C < 74` (`&H4A`, SI) and succeeds `arg_C < 76` (`&H4C`) → `LitStr "SJ"` (lines 268–275); font block at `51B37C` uses `arg_C < 76` → **ＭＳ ゴシック** string (lines 363–369). **210:** fails `arg_C < 206`, succeeds `arg_C >= 206` → `LitStr "-"` (lines 356–362); font block `arg_C < 76` false → **ＭＳ Ｐゴシック** (lines 371–372). |
| Conclusion | **Confirmed** at **VB Decompiler pcode-export** fidelity for the three probe values. **Not** a CPU single-step or in-process memory proof — repeat under x32dbg when available if product QA requires it. |
| Links | [04-domain-typing](04-domain-typing.md) § `Proc_1_0_51B39C` (verification line updated). |

<a id="exp-20260417-web"></a>

### EXP-20260417-WEB — `frmWebrkg` / WebRanking network surface (Wave 3)

| Section | Content |
|---------|---------|
| Hypothesis | WebRanking UI does **not** call WinInet / WinHTTP / raw sockets via statically visible APIs; it uses **local `.log` files** and **`ShellExecute`** where needed. |
| Setup | Canonical EXE above; full export [`twjrdecomp/`](../../twjrdecomp/) (`*.frm`, `*.bas`). |
| Procedure | (1) `dumpbin /IMPORTS` — already only `MSVBVM60`. (2) ASCII + UTF-16LE substring scan of the EXE for `wininet`, `WININET`, `WinHttp`, `urlmon`, `WSAStartup`, `InternetOpen`, `MSXML2`, `Microsoft.XMLHTTP` — **no hits**. (3) Ripgrep on entire `twjrdecomp` for the same tokens — **no hits** in any `.frm`/`.bas`. (4) Read `frmWebrkg.frm` pcode: **`OpenFile`** on `\TimeKHJY.log` etc.; **`ShellExecute`** with `LitStr "open"` (e.g. around decompiler line 7511). |
| Observations | No declarable Internet APIs in export; no embedded HTTP client strings in binary scan; form logic is file + shell oriented. **API Monitor** attach during live `frmWebrkg` use was **not** run (tool absent). |
| Conclusion | **Strong static confirmation** that WebRanking is **not** shipping obvious WinInet/MSXML client code paths. Residual risk: **late-bound** `CreateObject` with runtime-only strings — none observed in export grep; treat as **low** until contradicted by API Monitor. |
| Links | [03-io-contracts](03-io-contracts.md) § Registry / network; [07-system-spec](07-system-spec.md) O-10 resolution. |

<a id="exp-20260417-wave3-frx"></a>

### EXP-20260417-WAVE3-FRX — `.frx` expanded search

| Section | Content |
|---------|---------|
| Hypothesis | A `.frx` may exist outside `TWJR216` (e.g. user Dropbox root, dev tree). |
| Setup | PowerShell `Get-ChildItem -Recurse -Filter '*.frx'` under `C:\Users\hotwa\Dropbox`, `C:\Users\hotwa\dev\type`, `C:\Users\hotwa\Documents` (first-pass cap implicit in tool run). |
| Observations | **0** paths returned. |
| Conclusion | No companion `.frx` discovered in these trees; O-12 remains **open** until an installer or backup yields files. |
| Links | [01-binary-triage](01-binary-triage.md) Mitigation; [07-system-spec](07-system-spec.md) O-12. |

### EXP-20260417-IO-AUDIT — `OpenFile` / log paths (static, Wave 3 optional)

| Section | Content |
|---------|---------|
| Hypothesis | Time / detail logs are opened via VB `Open` / `OpenFile` pcode with leading `\` relative paths. |
| Procedure | Ripgrep `OpenFile` + `\.log` in `twjrdecomp` (sample: `frmWebrkg.frm`, `frmReference.frm` per [03-io-contracts](03-io-contracts.md)). |
| Conclusion | **Static audit only** — aligns Phase 3 table; **Verified** column in contract template still awaits `CreateFileW` API Monitor if strict runtime proof is required. |
| Links | [03-io-contracts](03-io-contracts.md). |

### EXP-20260417-TIMER — `Timer1_Timer` cadence (deferred)

| Section | Content |
|---------|---------|
| Hypothesis | `Timer1_Timer` (`517378`) fires at a fixed `Interval` from the form header and drives elapsed caption / conditional `frmKeikoku.Show`. |
| Procedure | *(Not run.)* Break handler or log `timeGetTime` deltas under x32dbg / ETW. |
| Conclusion | **Deferred** — no trace captured this session; see [05-ui-statechart](05-ui-statechart.md) Timer note. |
