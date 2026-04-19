# Native `Time*.log` format — V0 capture plan (unverified)

## Status

| Item | State |
|------|--------|
| Byte-level line grammar | **Partially verified** for `TimeKHJY.log` — structured **binary** (length-prefixed ASCII + `float32`×9 + `int32` + …); see [09-time-khjy-binary-layout-v0.md](09-time-khjy-binary-layout-v0.md). |
| Encoding | **Not** a single CP932 text stream for this file — treat as **binary records**; embedded strings are ASCII in the captured sample. |
| Web import (`/records/history`) | Uses `File.arrayBuffer()` when `looksLikeTimeKHJYBinaryV0` matches; otherwise text / `WEB_V1` path. |

## Capture checklist (minimal)

1. On a machine with TWellJR installed, copy **`TimeKHJY.log`** (or another `Time*.log`) to a scratch folder.
2. Record: **file size**, first **32 bytes hex** (BOM? no BOM?), and whether `file -I` / PowerShell shows UTF-8 vs binary.
3. Copy **2–5 complete lines** into a text editor → **delete or replace** user-identifying columns → save as `fixtures/timelog-native/redacted-sample-01.txt` (UTF-8 for repo) **or** keep CP932 and document decode in test.
4. Update the **contract table** in [03-io-contracts.md](03-io-contracts.md) (`Verified` column).
5. Replace [synthetic-candidate-v0.txt](../../packages/engine/fixtures/timelog-native/synthetic-candidate-v0.txt) usage in tests with the redacted file when grammar is fixed.

## V0 heuristic in code (`probeTimeLogTextV0`)

Until native grammar exists, `packages/engine/src/twelljr/timeLogNativeProbeV0.ts` classifies non-`WEB_V1` lines as:

- **`native_candidate_tab`** — at least **two** tab-separated cells, first cell matches `yyyy/mm/dd`, `yyyy-mm-dd`, or `yyyy.mm.dd` prefix.
- **`native_unknown`** — everything else (includes real native lines that do not match this weak probe).

This is **not** a claim of parity with the EXE; it only surfaces “maybe data” rows in the Web preview.

## Related

- Web stub pipeline: [d-phase-prep-local-store.md](../../spec/d-phase-prep-local-store.md)
- Dynamic evidence notes: [06-dynamic-notes.md](06-dynamic-notes.md) (WebRanking `OpenFile` on `Time*.log`)
