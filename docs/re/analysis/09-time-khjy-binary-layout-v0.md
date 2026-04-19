# `TimeKHJY.log` binary layout — V0 (from real capture)

## Source

- First **64 bytes** hex dump (user) + full **6099-byte** file read once in a dev environment to confirm **120-byte record stride** (file not stored in git — see `.gitignore` `TimeKHJY-full.bin`).
- **Verified:** repeating 120-byte blocks; first block head matches `timekhjy-head-64.bin` + continuation in full file.

## Record stride: **120 bytes** (LE)

Each record is **70 bytes (part A) + 50 bytes (part B)**.

### Part A — 70 bytes

| Offset (rel) | Type | Example | Notes |
|-------------:|------|---------|--------|
| 0 | `uint16` | `8` | Length of `timeAscii`. |
| 2 | `char[8]` | `17:28:32` | `HH:MM:SS` ASCII. |
| 10 | `float32` × 9 | … | Trial metrics (meaning TBD). |
| 46 | `int32` | `10` | Meaning TBD. |
| 50 | `uint16` + `char[8]` | `17.03.20` | `dd.mm.yy`-style date (observed). |
| 60 | `uint16` + `char[8]` | `22:20:30` | Second clock column (also `HH:MM:SS` in sample). |

### Part B — 50 bytes (immediately follows part A)

| Offset (rel) | Type | Notes |
|-------------:|------|--------|
| 70 | `float32` × 9 | Second float vector. |
| 106 | `int32` | Second integer (e.g. `6` in first block of sample file). |
| 110 | `uint16` + `char[8]` | Second `dd.mm.yy` date (e.g. `17.03.13`). |

Next record begins at **+120** from the current record start.

## Implications

- Not CP932 line text — use **`File.arrayBuffer()`** + `parseTimeKHJYLogFileV0`.
- Do not commit full user logs; keep **short heads** in `fixtures/` only.

## Fixture

- [`../../packages/engine/fixtures/timelog-native/timekhjy-head-64.bin`](../../packages/engine/fixtures/timelog-native/timekhjy-head-64.bin) — truncates inside part A clock string.

## Related

- [08-time-log-native-format-v0.md](08-time-log-native-format-v0.md)
- Parser: `packages/engine/src/twelljr/timeKHJYLogBinaryV0.ts`
