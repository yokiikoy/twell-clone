# Native `Time*.log` fixtures (Phase D)

This folder holds **redacted real captures** once available, plus **synthetic** placeholders for parser tests.

| File | Purpose |
|------|---------|
| `synthetic-candidate-v0.txt` | **Not** from TWellJR.exe — tab row whose first cell matches the V0 “date-first” heuristic so `probeTimeLogTextV0` classifies it as `native_candidate_tab`. Replace when you add a redacted native sample. |
| `timekhjy-head-64.bin` | First **64 bytes** of a real `TimeKHJY.log` (user capture). Truncates mid part-A clock string; used by `timeKHJYLogBinaryV0.test.ts`. |
| `past-v0-synthetic-150.bin` | **Synthetic** 3×50-byte `Past.log` V0 records (`pastLogBinaryV0.test.ts`). |
| `TimeKHJY-full.bin` | **Gitignored** — do not commit full logs from `Dropbox/TWJR216` (personal trial data). |

**Do not** commit personally identifying columns. Prefer trimming user names / machine paths.

When a native sample is added:

1. Document columns in [`08-time-log-native-format-v0.md`](../../../../docs/re/analysis/08-time-log-native-format-v0.md).
2. Add a golden test in `timeLogNativeProbeV0.test.ts` (or a dedicated native parser module).
3. Mark **Verified** in [`03-io-contracts.md`](../../../../docs/re/analysis/03-io-contracts.md) contract table.
