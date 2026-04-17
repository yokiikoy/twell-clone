# `twjrdecomp/`（ローカルのみ）

このディレクトリには **VB Decompiler 等で得た `TWellJR.exe` のエクスポート**（`*.bas` / `*.frm` / `Project.vbp` など）を置きます。**Git には含めません**（`.gitignore` 済み）。

- **Web アプリの実行時**が読むのは `apps/web/public/twelljr-*.json` のみです。
- 語表を更新するときは `packages/engine` の `extract:*` スクリプト（`package.json` 参照）を、**このフォルダにエクスポートを展開した状態で**実行してください。

方針の詳細: `docs/re/binary-inventory.md`
