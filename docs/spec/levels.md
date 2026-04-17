# Level table (from ReadMe.txt)

Official text (タイプウェル国語Ｒ ver 2.1.6) maps **total trial time in seconds** to bands. Each band lists labels from **slow** (left) to **fast** (right).

| Category | Labels (slow → fast) | Time range (seconds) |
|----------|----------------------|----------------------|
| Amateur | J I H G F E D C B A | 205.999 ～ 76.000 |
| Professional | SJ SI SH SG SF SE SD SC SB SA | 75.999 ～ 56.000 |
| Genius | SS XJ XI XH XG XF XE XD XC XB | 55.999 ～ 36.000 |
| Machine | XA XS XX ZJ ZI ZH ZG ～ | 35.999 ～ (faster) |

Rules stated explicitly:

- If time **≥ 206** seconds, **no level** is shown.
- Boundaries use half-open intervals in implementation: see `levelFromTotalSeconds` in `packages/engine`.

## Implementation hypothesis

Within each category, sub-levels are assumed **evenly spaced** in time until decompilation proves otherwise. Golden tests lock boundary seconds; internal ordering is fixed by the arrays in `level.ts`.
