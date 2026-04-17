# Behavior baseline and golden tests

## Purpose

Reproduce **observable outcomes** of タイプウェル国語Ｒ without shipping proprietary binaries. Golden tests compare our TypeScript engine against:

1. **Documented** behavior from `ReadMe.txt` (especially level thresholds in seconds).
2. **Your own** `DetailLog` / `Detail.txt` traces (optional, local-only fixtures).

## Trial model (MVP)

From `ReadMe.txt` (overview):

- One trial = **400 keystrokes** (打分) of randomly drawn phrases in a selected mode (基本常用語 / カタカナ語 / 漢字 / 慣用句・ことわざ).
- **Total elapsed time** for the trial maps to a **level label** (see `levels.md`).

The original also tracks per-key times, losses, miskeys, goal indicators (blue/yellow/red), and weak-word lists. The engine exposes hooks for those; initial golden tests focus on **level from total seconds**.

## Detail log format (for mining fixtures)

Example header:

```text
国語Ｒ基本常用語
    Time  Loss Word
k    722     0 からくり
```

- Column `key`: single ASCII key pressed (romaji chunk), sometimes blank continuation rows.
- `Time`: per-stroke time in **milliseconds** (integer).
- `Loss`: time loss / penalty column (often `0`).
- `Word`: Japanese **phrase** shown at word boundaries.

This is ideal for:

- Building **word + reading** pairs (reading inferred from key sequence between two `Word` anchors).
- Reconstructing **total trial time** = sum of `Time` for one file (sanity vs original summary if present).

## Golden test policy

| ID | Source | What we assert |
|----|--------|----------------|
| `G-level-readme-01` | `ReadMe.txt` bands | `levelFromTotalSeconds()` matches documented tier boundaries (see tests in `@typewell-jr/engine`) |
| `G-detail-parse-01` | Synthetic minimal log | Parser extracts expected `(surface, reading)` pairs |
| `G-engine-pace-01` | Engine-only | After N correct keys, `paceIndicator` vs target follows documented blue/yellow/red semantics (approximation until EXE reverse is complete) |

## Recording new baselines (manual, Windows)

1. Run `TWellJR.exe`, complete a trial in a fixed mode.
2. Save the new `DetailLog\*.txt` locally.
3. Copy a **redacted** fragment (no personal commentary) into `packages/engine/test-fixtures/` only if you are comfortable storing it in git; otherwise keep fixtures outside the repo and point tests via env var `TYPEWELL_FIXTURE_DIR`.

## Non-goals (initial pass)

- Bit-identical RNG vs VB6 `Rnd` (seed not yet recovered).
- Pixel-perfect UI or original sound assets.
