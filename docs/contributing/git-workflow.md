# Git ブランチ運用（gitflow 着想）

このリポジトリでは **Vincent Driessen 系の gitflow を簡略化した**運用を既定とする。目的は、(1) `master` を常にリリース可能に近い状態に保つこと、(2) 作業単位をブランチと PR で隔離すること、(3) 緊急修正の経路を明示すること。

## 既定ブランチ

| ブランチ | 役割 |
|----------|------|
| `master` | **統合・リリース用の本流**。マージ済みの変更のみが乗る想定。直接コミットは **ホットフィックスやメタ修正のみ** に限定する。 |

### `develop` について

現状 **`develop` は置かない**（小さなチーム・単一アプリ前提）。チームが大きくなり、常時「次バージョン統合」を分離したくなったら `develop` を追加し、**`feature/*` → `develop` → `release/*` → `master`** の順に拡張する。

## ブランチ種別と命名

| 種別 | 接頭辞 | 例 | 用途 |
|------|--------|-----|------|
| 機能・仕様 | `feature/` | `feature/emiel-0.2-upgrade` | 新機能・非自明なリファクタ |
| 不具合修正 | `fix/` | `fix/trial-stroke-count` | バグ修正 |
| 雑務・依存更新 | `chore/` | `chore/bump-next-15` | ツールチェーン、ロックファイル、ドキュメントのみ等 |
| リリース準備 | `release/` | `release/0.2.0` | バージョンタグ・CHANGELOG 調整、リリース直前の微修正 |
| 緊急修正 | `hotfix/` | `hotfix/security-patch` | **本番相当の `master` から分岐**し、修正後に `master` へ戻す |

命名は **英小文字・ハイフン** を推奨する。Issue 番号を付ける場合は `feature/123-short-topic` のようにしてよい。

## 日常の流れ（推奨）

1. `master` を最新化する。  
   `git checkout master` → `git pull origin master`
2. 作業ブランチを切る。  
   `git checkout -b feature/my-topic`
3. コミットは **論理単位** で小さめに積む（レビューしやすさ優先）。
4. リモートへプッシュし、**GitHub 上で Pull Request** を `master` 向けに開く。
5. レビュー後、`master` にマージする（マージ戦略は **squash merge** か **merge commit** をチームで固定するとよい。未固定ならどちらでも可だが、同一 PR 内で混在しないこと）。

## `master` への直接プッシュ

- **避ける**: 機能変更・依存メジャー更新・挙動に効くリファクタ。
- **許容**: タイポ修正、`AGENTS.md` の一行、CI の明らかな設定ミス修正など **リスクが極小**なもの。
- **緊急**: `hotfix/*` で切ってから `master` にマージし、必要ならすぐタグやデプロイ手順を追記する。

## リリース（将来 `release/*` を使う場合）

1. `master` または `develop` から `release/x.y.z` を切る。  
2. バージョン文字列・CHANGELOG のみをそのブランチで整える。  
3. 検証後 `master` にマージし、タグ `vX.Y.Z` を打つ。  
4. バグのみ `release/*` 上で直し、再度 `master` に取り込む。

## 参考

- [A successful Git branching model](https://nvie.com/posts/a-successful-git-branching-model/)（元祖 gitflow）
- 本リポジトリの解析ガバナンス: [`docs/re/analysis/00-governance.md`](../re/analysis/00-governance.md)
