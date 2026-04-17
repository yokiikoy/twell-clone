# Binary inventory: タイプウェル国語Ｒ (TWJR216)

Source folder (local machine, not in repo): `C:\Users\hotwa\Dropbox\TWJR216`.

## Entry points and binaries

| File | Size (bytes) | Role |
|------|---------------|------|
| `TWellJR.exe` | 2,297,856 | Primary VB6 application (国語Ｒ本体) |
| `TWellRT.exe` | 51,200 | Auxiliary executable |
| `TWtoGR.exe` | 84,480 | Converter / tool |
| `TWtoWeb.exe` | 98,816 | Converter / tool |
| `twrtcb.exe` | 6,561,732 | Large bundled tool (likely Python/wx runtime) |
| `twtter.exe` | 5,451,287 | Twitter-related tool |
| `hspext.dll` | 53,248 | Native dependency |

## Configuration and user data (plain text / logs)

| File | Notes |
|------|--------|
| `ComJR.twl` | Serialized UI/options (VB-style `#TRUE#` / numeric fields) |
| `config.bin` | Binary configuration blob |
| `ReadMe.txt` | Official documentation; **level time bands** and mode descriptions |
| `Detail.txt`, `DetailDB*.txt` | Session / aggregate typing statistics |
| `DetailLog/*.txt` | Per-trial keystroke timing logs (see `docs/spec/behavior-baseline.md`) |
| `JRlkg.csv` | Online-style **ranking table** (name, score, rank code); **not** the word dictionary |
| `*.log` (`Bptn*`, `Poor*`, `Time*`, …) | Practice / weakness logs |

## Word list location (RE status)

- Practice logs (`Detail.txt`, `DetailLog/*.txt`) contain **surface forms** (語句) and per-key timing; romaji is implied by the key column.
- The full 10k+ phrase table is expected to live **inside `TWellJR.exe` resources or a companion format** not exposed as a standalone `.csv` in this folder.
- **Recommended path for clone**: (1) parse your own `DetailLog` exports to bootstrap a JSON lexicon; (2) optionally supplement with a **self-authored** word list; (3) run VB Decompiler on `TWellJR.exe` locally to locate embedded tables (output stays on your machine).

## Subfolders observed

- `DetailLog/` — many per-run text traces (good for golden-test *input shapes*, not for redistributing verbatim in OSS).
- `twrt/`, `twtoweb/` — build artifacts / Python runtimes (large); not required for the web clone MVP.

## VB Decompiler export (in this repo)

`twjrdecomp/` — VB Decompiler **project-style export** of `TWellJR.exe` (see `Project.vbp` footer `[VB Decompiler]` build stamp). Structured RE notes live in **[`docs/re/analysis/README.md`](analysis/README.md)**.

`twjrdecomp/` contains:

- `Project.vbp` — VB6 project list (`ExeName32="TWellJR.exe"`, startup `frmMain`, version 2.23).
- `*.frm` — form definitions (e.g. `frmMain.frm` is large; captions may show mojibake depending on export encoding).
- `*.bas` — modules with **P-code style listings** (e.g. `Module1.bas` includes `Proc_1_0_51B39C` with literal level strings `ZA`…`J` and thresholds as `LitI2_Byte` / `LtR8` chains — useful to cross-check `packages/engine/src/level.ts`).

Binary form companions (`.frx` etc.) may live next to the original EXE or need a separate extract; this folder listing is mostly text.

If the repository is **public**, confirm you are allowed to **redistribute** this export; otherwise keep `twjrdecomp/` private or out of git.

## Decompilation note

VB Decompiler is **GUI / Windows-native**. Use `twjrdecomp/` as the persisted dump for Cursor-assisted analysis; promote **verified** formulas into `docs/spec/` and TypeScript as they are confirmed against `ReadMe.txt` / `DetailLog`.
