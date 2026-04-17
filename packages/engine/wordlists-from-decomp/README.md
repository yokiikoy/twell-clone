# デコンパイル由来の語リスト（本家相当）

`twjrdecomp/*.bas`（TWellJR 系バイナリの VB デコンパイル）から **機械抽出**した語 triple です。

| ディレクトリ | 内容 |
|----------------|------|
| `envelope/` | `schemaVersion`, `source`, `count`, `triples[]`（`index` 付き） |
| `web-array/` | `apps/web` のローダと同じ **JSON 配列**（`surface`, `reading`, `code`, `index`） |
| （同内容） | `apps/web/public/twelljr-jou1.json` 等 — `extract:wordlists:all` で上書き |

## 再生成

リポジトリルートまたは `packages/engine` から:

```bash
npm run extract:wordlists:all -w @typewell-jr/engine
```

`Jou1` を **漢字寄せ（Kan 照合 + Jisho）** した Web 用にしたい場合は、上記の **あと**に `npm run extract:jou:web -w @typewell-jr/engine` を実行する（`twelljr-jou1.json` を上書き）。

## 注意

- **著作権・利用許諾**は利用者側で判断してください。本データは解析・再現用の技術資産であり、**再配布可否は未確定**の前提です。
- 表層文字列は **CP932 由来のデコード結果**です。本家 UI の漢字表記と 1:1 とは限りません（`Jou1` の漢字寄せは `enrich-jou1-with-kanji-surfaces.mjs` が別系統）。
- `Module1.bas` は語リストではないため対象外です。
