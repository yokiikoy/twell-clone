# TWellJR.exe — reverse-engineering analysis hub

Structured analysis of **`TWellJR.exe`** (タイプウェル国語Ｒ) per the project plan. **Primary inputs:**

- VB Decompiler export: [`twjrdecomp/`](../../twjrdecomp/) (`Project.vbp`, `*.frm`, `*.bas`)
- Installed game folder (out of repo): see [binary-inventory](../binary-inventory.md)

## Phase index

| Phase | Document | Status |
|-------|----------|--------|
| 0 | [00-governance.md](00-governance.md) | SHA-256 + size recorded (Dropbox `TWJR216`) |
| 1 | [01-binary-triage.md](01-binary-triage.md) | PE + imports + Native vs P-code conclusion |
| 2 | [02-component-map.md](02-component-map.md) | Component table drafted |
| 2 | [02-callgraph-stub.md](02-callgraph-stub.md) | Seed edges from `frmMain` handlers |
| 2 | [02-frmMain-survey.md](02-frmMain-survey.md) | Partial `frmMain` survey |
| 3 | [03-io-contracts.md](03-io-contracts.md) | Log patterns from strings |
| 4 | [04-domain-typing.md](04-domain-typing.md) | `Module1` ladder + `Proc_1_1` map + font branch |
| 4 | [04-mode-module-diff.md](04-mode-module-diff.md) | `Jou1`–`Jou3` shape / stats |
| 4 | [04-snippets/](04-snippets/) | Empty — optional tiny pcode excerpts |
| 5 | [05-ui-statechart.md](05-ui-statechart.md) | Menu → form + `FormD` / timer notes |
| 6 | [06-dynamic-notes.md](06-dynamic-notes.md) | Wave 3: WEB + LEVEL + FRX + IO audit EXPs |
| 7 | [07-system-spec.md](07-system-spec.md) | Wave 2–3 resolved items + small open backlog |

## Quick links

- Binary / file inventory: [../binary-inventory.md](../binary-inventory.md)
- **Web reproduction roadmap:** [../web-reproduction-roadmap.md](../web-reproduction-roadmap.md)
- **Web surface matrix:** [../web-surface-matrix.md](../web-surface-matrix.md)
- Behavior baseline (logs, tests policy): [../../spec/behavior-baseline.md](../../spec/behavior-baseline.md)

## Progress checklist

- [x] Phase 0–7 scaffold committed under `docs/re/analysis/`
- [x] EXE hash + PE filled (`00`, `01`)
- [x] Wave 3 verification logged (`06` — WEB / LEVEL / FRX / IO audit; API Monitor & x32dbg still optional follow-ups)
- [x] Call graph non-empty (`02-callgraph-stub`)
