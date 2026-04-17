# Phase 1 — Binary triage

## Purpose

Classify **what kind of executable** `TWellJR.exe` is (VB6 lineage, P-code vs native hypothesis, bitness, packer, key imports) so later phases choose the right tools.

## Evidence from `Project.vbp`

| Field | Value | Interpretation (hypothesis) |
|-------|--------|-------------------------------|
| `Type` | `Exe` | GUI subsystem Windows EXE |
| `ExeName32` | `TWellJR.exe` | 32-bit name hint |
| `MajorVer` / `MinorVer` | 2 / 23 | Marketing / file version |
| `CompilationType` | `1` | In VB6 `.vbp`, **1 = “Native Code”** (fast native) vs **0 = P-Code** — aligned with PE scale and vendor docs for this tree. |
| `MaxNumberOfThreads` | `1` | Classic single-threaded VB6 app |

**Action:** When the EXE is on disk, verify `CompilationType` meaning with PE headers (see below) and VB Decompiler’s project properties for the same binary.

## VB Decompiler export vs runtime

The export under [`twjrdecomp/`](../../twjrdecomp/) contains **P-code–style IL listings** in `.bas` files (e.g. `ILdFPR4`, `LtR8`). That can mean either:

1. The project was compiled to **P-code**, or  
2. The tool emits a **common intermediate representation** for analysis even when the EXE is native.

Treat as **“decompiler IR”** until confirmed by PE + vendor docs.

## PE and imports (when EXE is available)

Run (adjust path):

```powershell
# If Visual Studio "x64 Native Tools" / dumpbin is installed:
dumpbin /HEADERS "C:\Users\hotwa\Dropbox\TWJR216\TWellJR.exe"
dumpbin /IMPORTS "C:\Users\hotwa\Dropbox\TWJR216\TWellJR.exe"
```

Example `dumpbin` path on this host:  
`C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Tools\MSVC\<version>\bin\Hostx64\x86\dumpbin.exe` (folder under `VC\Tools\MSVC` varies by MSVC build).

Record in a table:

| Check | Expected for VB6 | Observed |
|-------|-------------------|----------|
| Machine | `14C` (i386) typical | `14C machine (x86)` |
| Optional magic | PE32 | `10B magic # (PE32)` |
| Subsystem | Windows GUI | `2 subsystem (Windows GUI)` |
| Image / linker version | Often tracks product | `2.23 image version`, linker `6.00` |
| Size of code | Nontrivial `.text` for native builds | `0x22F000` (~2.2 MiB) |
| Imports | Runtime + API resolution via VB VM is normal | **Import section lists only `MSVBVM60.DLL`** (ordinals + `MethCallEngine`, `DllFunctionCall`, `__vbaExceptHandler`, …) — no separate `KERNEL32.dll` row; Win32 APIs are reached through the VB runtime. |

## Form binary companions (`.frx`)

| Observation | Detail |
|-------------|--------|
| Current export | **No `.frx` files** present next to `.frm` under `twjrdecomp/`. |
| Impact | Form **embedded binary** (icons, images, some property blobs) may be missing; captions in `.frm` may show encoding glitches without matching `.frx` + correct code page. |
| Mitigation | Copy `.frx` from the original project folder next to each `.frm`, or re-export from VB Decompiler with “save FRX”, or extract via Resource Hacker / original installer tree. **Wave 2 check:** recursive search under `C:\Users\hotwa\Dropbox\TWJR216` for `*.frx` returned **no files** — installer layout may omit companions or store resources only inside the EXE. **Wave 3:** broader `*.frx` search under Dropbox root / `dev\type` / `Documents` also **0 hits** — see [06-dynamic-notes — EXP-20260417-WAVE3-FRX](06-dynamic-notes.md#exp-20260417-wave3-frx). |

## Packer / protector

| Check | Result |
|-------|--------|
| VB Decompiler generic unpacker note | See vendor FAQ for UPX-like packers; custom packers unknown. |
| Heuristic | If `dumpbin` shows normal VB imports and sane sections, likely **unpacked**. |

## P-code vs native (conclusion)

- [`Project.vbp`](../../twjrdecomp/Project.vbp) has `CompilationType = 1` → VB6 **Native Code** compile flag.  
- PE: **large** `size of code`, **PE32**, subsystem **GUI**, machine **x86** — consistent with emitted native x86 bodies.  
- Imports: **only `MSVBVM60.DLL`** is still normal for VB6 native executables (APIs resolved via runtime / `DllFunctionCall`); it does **not** imply P-code by itself.  
- VB Decompiler listings remain **IR-like** regardless; trust **`.vbp` + PE scale + toolchain** over opcode spelling alone.

**Verdict:** Shipped `TWellJR.exe` is **consistent with Native Code** per project metadata and PE triage above.

## Open items

- [ ] If a future install tree contains `.frx`, copy next to `twjrdecomp/*.frm` and note path here.  
- [ ] Optional: Authenticode / publisher line from `Get-AuthenticodeSignature` for release hygiene.
