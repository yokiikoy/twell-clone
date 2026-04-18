# エージェント向けメモ

## Git

- **`master` に直接コミットしない**（メタ修正・明らかな一行 typo 以外）。機能・修正・依存更新は **`feature/` / `fix/` / `chore/`** などのブランチを `master` から切り、PR 経由で取り込む。
- 緊急時は **`hotfix/*`** を `master` から分岐してからマージする。
- 詳細・表・リリース手順: [docs/contributing/git-workflow.md](docs/contributing/git-workflow.md)
