# Phase 4 — Domain core (typing / scoring)

## `Module1.bas` — `Proc_1_0_51B39C` (address `51B39C`)

**Hypothesis:** `arg_C` is **total trial time in seconds** as `R4` / float (VB `Single`), compared in ascending chain with `LtR8` (less-than). Final segment uses `LitI2 206` with `LtR8` then `GeR8` for the dash band.

**Evidence for seconds:** `LitI2 206` matches documented **≥206 s ⇒ out of chart** behavior in public ReadMe-derived specs.

### Extracted threshold → label table

Each row: **if `arg_C` < threshold then assign `label`** (earlier rows win — classic `If/ElseIf` ladder). Thresholds are **exclusive upper bounds** for the listed label (except the terminal `>=206` case).

| Upper threshold (decimal) | Hex in dump | Label |
|---------------------------|---------------|-------|
| 10 | `&HA` | ZS |
| 12 | `&HC` | ZA |
| 14 | `&HE` | ZB |
| 16 | `&H10` | ZC |
| 18 | `&H12` | ZD |
| 20 | `&H14` | ZE |
| 22 | `&H16` | ZF |
| 24 | `&H18` | ZG |
| 26 | `&H1A` | ZH |
| 28 | `&H1C` | ZI |
| 30 | `&H1E` | ZJ |
| 32 | `&H20` | XX |
| 34 | `&H22` | XS |
| 36 | `&H24` | XA |
| 38 | `&H26` | XB |
| 40 | `&H28` | XC |
| 42 | `&H2A` | XD |
| 44 | `&H2C` | XE |
| 46 | `&H2E` | XF |
| 48 | `&H30` | XG |
| 50 | `&H32` | XH |
| 52 | `&H34` | XI |
| 54 | `&H36` | XJ |
| 56 | `&H38` | SS |
| 58 | `&H3A` | SA |
| 60 | `&H3C` | SB |
| 62 | `&H3E` | SC |
| 64 | `&H40` | SD |
| 66 | `&H42` | SE |
| 68 | `&H44` | SF |
| 70 | `&H46` | SG |
| 72 | `&H48` | SH |
| 74 | `&H4A` | SI |
| 76 | `&H4C` | SJ |
| 80 | `&H50` | A |
| 86 | `&H56` | B |
| 94 | `&H5E` | C |
| 104 | `&H68` | D |
| 116 | `&H74` | E |
| 130 | `130` | F |
| 146 | `146` | G |
| 164 | `164` | H |
| 184 | `184` | I |
| 206 | `206` | J |
| ≥206 | `206` + `GeR8` | `-` |

**Note:** The first bucket `ZS` for `t < 10` may be a **special / sentinel** label (needs product ReadMe or runtime check).

### Trailing branch (`LitI2_Byte &H4C`)

After the ladder, code compares `arg_C` with **`0x4C` (= 76)** seconds and picks one of two **font face names** written into the return buffer. The VB Decompiler export shows **mojibake** for these `LitStr` lines; decoding the same byte sequences as **Windows code page 932** yields:

| Branch | CP932 meaning (UI string) |
|--------|-----------------------------|
| `arg_C < 76` | **ＭＳ ゴシック** (MS Gothic) — decompiler shows `LitStr "‚l‚r ƒSƒVƒbƒN"` at `Module1.bas` pcode near `51B386`. |
| `arg_C ≥ 76` | **ＭＳ Ｐゴシック** (MS P Gothic) — extra lead byte `0x82 0x6F` is CP932 **全角Ｐ** (`U+FF30`) before ゴシック; decompiler shows `LitStr "‚l‚r ‚oƒSƒVƒbƒN"` at `51B391`. |

**Role:** Likely **default label fonts** for big / long trials crossing the 76 s line used elsewhere in the ladder (`SJ` bucket). **Verification:** [EXP-20260417-LEVEL](06-dynamic-notes.md#exp-20260417-level) — pcode ladder + font branch **walked for probe values 5 / 75 / 210 s** (no in-process debugger on host); CPU-level confirm deferred to x32dbg if needed.

## `Module1.bas` — `Proc_1_1_52F7B4` (address `52F7B4`)

Maps a **single-character goal key** (ASCII letters, digits, and a few punctuation symbols) to two fields written on `arg_8`: **`arg_8(100)` as `UI1`** (small byte) and **`arg_8(104)` as `I4`**. Uppercase letters mostly use **`arg_8(104) ∈ {0x30, 0x31}`**; lowercase **`a`–`z`** and digit / punctuation arms (except `$` and `'`) use **`arg_8(104) = 0x63` (99 decimal)**.

**Evidence:** Exhaustive `EqStr` ladder in [`twjrdecomp/Module1.bas`](../../twjrdecomp/Module1.bas) from `'52F7B4` through `ExitProc` at `52F7B3`.

### Full key → (`arg_8(100)`, `arg_8(104)`) table

Values are **decimal** for the `UI1` byte and **hex** for the `I4` word (as in the dump: `LitI4 &H31`, etc.).

| Key | `arg_8(100)` | `arg_8(104)` | Key | `arg_8(100)` | `arg_8(104)` |
|-----|--------------|--------------|-----|--------------|--------------|
| `A` | 25 | `0x31` | `a` | 25 | `0x63` |
| `B` | 41 | `0x31` | `b` | 41 | `0x63` |
| `C` | 39 | `0x31` | `c` | 39 | `0x63` |
| `D` | 27 | `0x31` | `d` | 27 | `0x63` |
| `E` | 15 | `0x31` | `e` | 15 | `0x63` |
| `F` | 28 | `0x31` | `f` | 28 | `0x63` |
| `G` | 29 | `0x31` | `g` | 29 | `0x63` |
| `H` | 30 | `0x30` | `h` | 30 | `0x63` |
| `I` | 20 | `0x30` | `i` | 20 | `0x63` |
| `J` | 31 | `0x30` | `j` | 31 | `0x63` |
| `K` | 32 | `0x30` | `k` | 32 | `0x63` |
| `L` | 33 | `0x30` | `l` | 33 | `0x63` |
| `M` | 43 | `0x30` | `m` | 43 | `0x63` |
| `N` | 42 | `0x30` | `n` | 42 | `0x63` |
| `O` | 21 | `0x30` | `o` | 21 | `0x63` |
| `P` | 22 | `0x30` | `p` | 22 | `0x63` |
| `Q` | 13 | `0x31` | `q` | 13 | `0x63` |
| `R` | 16 | `0x31` | `r` | 16 | `0x63` |
| `S` | 26 | `0x31` | `s` | 26 | `0x63` |
| `T` | 17 | `0x31` | `t` | 17 | `0x63` |
| `U` | 19 | `0x30` | `u` | 19 | `0x63` |
| `V` | 40 | `0x31` | `v` | 40 | `0x63` |
| `W` | 14 | `0x31` | `w` | 14 | `0x63` |
| `X` | 38 | `0x31` | `x` | 38 | `0x63` |
| `Y` | 18 | `0x30` | `y` | 18 | `0x63` |
| `Z` | 37 | `0x31` | `z` | 37 | `0x63` |
| `1` | 0 | `0x63` | `6` | 5 | `0x63` |
| `2` | 1 | `0x63` | `7` | 6 | `0x63` |
| `3` | 2 | `0x63` | `8` | 7 | `0x63` |
| `4` | 3 | `0x63` | `9` | 8 | `0x63` |
| `5` | 4 | `0x63` | `0` | 9 | `0x63` |
| `$` | 3 | `0x31` | `'` | 6 | `0x30` |
| `-` | 10 | `0x63` | `,` | 44 | `0x63` |
| `.` | 45 | `0x63` | `_` | 50 | `0x63` |

Any other single-character input **falls through** the ladder with **no writes** to these fields (execution falls off the final `BranchF` to `ExitProc`).

**Next:** Correlate `(100)/(104)` pairs with `frmIndicator` paints / ReadMe goal palette (needs UI or trace).

## Mode modules (`Jou*`, `Kata*`, `Kan*`, `Koto*`)

| Next action | Rationale |
|-------------|-----------|
| Diff `Jou1` vs `Jou2` vs `Jou3` pcode sizes / string literals | **Done (Wave 2):** see [04-mode-module-diff](04-mode-module-diff.md). |
| Search each for `Rnd`, `Randomize`, table literals | Word pick / shuffle. |
| Cross-link to `DetailLog` word boundaries | Validate phrase selection. |

## Verification (Phase 6 feed-in)

- [ ] Run fixed-duration trials; compare **computed label** from table vs on-screen result.  
- [x] Pcode-level ladder check for representative seconds — [EXP-20260417-LEVEL](06-dynamic-notes.md#exp-20260417-level) (Wave 3; not a live debugger session).  
- [ ] Optional: Breakpoint at `51B39C` with known `arg_C` float bit pattern (float rounding / build RVA) under x32dbg.
