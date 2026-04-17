# Phase 0 — Governance and reproducibility

## Scope

| Item | Decision |
|------|----------|
| Primary target | `TWellJR.exe` (国語Ｒ), VB6 project per [`twjrdecomp/Project.vbp`](../../twjrdecomp/Project.vbp) |
| In-repo artifacts | VB Decompiler export under [`twjrdecomp/`](../../twjrdecomp/); analysis notes under `docs/re/analysis/` |
| Out-of-repo artifacts | Original install folder (e.g. Dropbox `TWJR216`); optional companion EXEs per [binary-inventory](../binary-inventory.md) |
| Redistribution | Do not publish full decompilation dumps publicly without rights review. This tree stores **notes and tables**, not the EXE. |

## Binary identity (fill when EXE is available)

Canonical binary used for Wave 2 (out of repo; **do not commit** the EXE):

`C:\Users\hotwa\Dropbox\TWJR216\TWellJR.exe`

```powershell
Get-FileHash "C:\Users\hotwa\Dropbox\TWJR216\TWellJR.exe" -Algorithm SHA256
(Get-Item "C:\Users\hotwa\Dropbox\TWJR216\TWellJR.exe").Length
```

| Field | Value |
|-------|--------|
| SHA-256 | `BE84162B4D8CE0F34972E19D51C26416080A3FC99B3E6BA70C590BBCB5DAA0AD` |
| Size (bytes) | `2297856` |
| Product version (from `.vbp`) | Major 2, Minor 23, Revision 0 |
| `ExeName32` | `TWellJR.exe` |
| Startup form | `frmMain` |

## Toolchain snapshot

| Tool | Version / note |
|------|------------------|
| VB Decompiler | Build `26.3.9599.33394`, export date `2026/04/17` (footer in `Project.vbp`) |
| Analysis host | Record OS build when running dynamic phases (Phase 6) |

## Change control

- When replacing the EXE or re-exporting from VB Decompiler, **update this file** and `README.md` in this folder.
- Cross-link new findings to phase docs (`01-` … `07-`) instead of duplicating long dumps.
