# Phase 4 appendix — `Jou1` / `Jou2` / `Jou3` module diff

Evidence: VB Decompiler export under [`twjrdecomp/`](../../twjrdecomp/).

## Size and shape

| Module | Top-level procedure (export) | Approx. lines (PowerShell `Measure-Object -Line`) | File size (bytes) | `LitStr "` occurrences (grep count) |
|--------|------------------------------|-----------------------------------------------------|-------------------|--------------------------------------|
| `Jou1.bas` | `Proc_2_0_5E3818` | 9520 | 281710 | 2595 |
| `Jou2.bas` | `Proc_19_0_5DB41C` | 9189 | 304970 | 2501 |
| `Jou3.bas` | `Proc_20_0_5D3E8C` | 5032 | 170042 | 1371 |

Each file is effectively **one monolithic function**: a long `arg_C` dispatch ladder with per-case triple writes (Japanese surface string, romaji-like key, compact code token). The **dispatch key ranges and global memory targets differ** (`FMemStStrCopy` vs `ImpAdStStrCopy MemVar_6302B4` pattern in `Jou2`/`Jou3`), so these are **not** byte-identical copies with renamed symbols.

## Conclusion (for backlog O-06)

- **Same role:** mode-specific **word table + metadata** for the basic (常用) tier and its variants.  
- **Not data-only clones:** procedure entry names, branch constants (e.g. `LitI4 &H361` in `Jou2` vs small integers in `Jou1` openers), and storage helpers differ — treat as **parallel table modules** maintained separately in the binary.  
- **Jou3** is roughly **half** the line count and string literal count of `Jou1`/`Jou2`, consistent with a **smaller card set** for that sub-mode.

## Follow-ups (outside Wave 2)

- Structured diff of **dispatch key sets** (sorted `LitI4` / `EqI4` arms) if automating coverage.  
- Correlate `Jou*` selection at runtime from `frmMain` / `FormT` (Phase 6 stack or static xref completion).
