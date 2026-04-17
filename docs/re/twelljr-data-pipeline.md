# TWellJR データパイプライン（フェーズ B）

## 目的

`twjrdecomp/Jou*.bas`（および `Kata*` / `Kan*` / `Koto*`）の pcode から **構造化ワード表**（表面 / ローマ字キー / 内部コード）を生成し、`@typewell-jr/engine` の `WordEntry[]` 等へ供給する。

## 現状

| 成果物 | 場所 |
|--------|------|
| 手切りサンプル | [packages/engine/test-fixtures/jou1-sample.json](../packages/engine/test-fixtures/jou1-sample.json) |
| **全モード・本家デコンパイル由来の語リスト（コミット用）** | [`packages/engine/wordlists-from-decomp/`](../packages/engine/wordlists-from-decomp/)（`npm run extract:wordlists:all` で再生成） |
| プロトタイプ抽出 | `npm run extract:jou:web` / `extract:kan1:web`（`@typewell-jr/engine`） |
| 汎用 BAS 抽出 CLI | `npm run extract:bas -- <path/to>.bas <limit> [--out …] [--write-web …]` → [`packages/engine/scripts/extract-bas-triples.ts`](../packages/engine/scripts/extract-bas-triples.ts)。**件数上限なし**は第2引数 `0`。実装ロジックは [`extractBasTriples.ts`](../packages/engine/src/twelljr/extractBasTriples.ts) + [`readBasLitStrings.ts`](../packages/engine/src/twelljr/readBasLitStrings.ts) |

`extract-bas-triples.ts` は **CP932 デコード後**、`LitStr` を **(日本語表層)(ローマ字 1 個以上)(内部コード)** とみなすスキャン（`Kan*` の連続ローマ字＝表記揺れを吸収）。`Jou*` も同ルートで問題なく通る。完全な pcode 再現ではなく、Web 用辞書の位相ずれ防止用。

**既定の `--out`:** `packages/engine/test-fixtures/extracted-<Bas名>.json`（envelope: `schemaVersion`, `source`, `count`, `triples[]` に各 `index`）。**機械生成ファイルは `.gitignore` 対象**（語リストのリポジトリ同梱はライセンス確定後に判断）。

**`--write-web`:** `apps/web/public/twelljr-*.json` 向けの **JSON 配列のみ**（Next `fetch` ローダ互換）。全モード一括は `npm run extract:wordlists:all` が `wordlists-from-decomp` と `apps/web/public` の両方へ書き出す。

**薄い npm ラッパー:** `Jou2`/`Jou3`、`Kan2`/`Kan3`、`Kata1`–`Kata3`、`Koto1`/`Koto2` は `packages/engine/package.json` の `extract:jou2` 等で同型出力可能。

**Jou1 表層の漢字化（補助レイヤ）:** `npm run extract:jou:web` の後段で `enrich-jou1-with-kanji-surfaces.mjs` が走る。これは **本家画面の漢字表記を pcode から RE したものではない**（`Kan*` 一意照合 + Jisho 由来のヒューリスティック）。公式 UI との表層完全一致ゴールデンと混同しないこと。`Kan1`–`Kan3` で `reading`（ハイフン除去）が一意に決まる語は上書きし、残りは Jisho API でひらがな表層を引き、JMdict の「Usually written using kana alone」付き候補は漢字にしない（例: あいつ）。結果キャッシュは `packages/engine/test-fixtures/jou-jisho-kanji-cache.json`。オフライン時は `SKIP_JISHO_ENRICH=1`。

**文字コード:** `twjrdecomp/*.bas` の日本語 `LitStr` は **CP932** のままのことが多い。Node の `readFileSync(..., "utf8")` では表面形が化けるため、本番抽出は **`iconv-lite` で CP932 デコード**するか、VB Decompiler 側で Unicode 再エクスポートを検討する。

## フェーズ B — スコープと完了定義（最小）

- **含む:** 上記の **単一（＋薄ラッパー）抽出経路**、**柔軟パーサの Vitest ゴールデン**（最小インライン `LitStr` 系列フィクスチャ。巨大 `.bas` はテストに埋め込まない）。
- **ライセンスゲートの外（保留）:** 語リストの **公開 Web への同梱**や **本家画面との完全一致ゴールデン**。エンジン配下の `wordlists-from-decomp/` は解析用のデコンパイル由来スナップショット（README に注意書き）。**一般向け再配布**は別途判断。

**フェーズ B 最小完了（Done）の条件**

1. `Jou1`–`Jou3`, `Kan1`–`Kan3`, `Kata1`–`Kata3`, `Koto1`–`Koto2` を **同じ JSON 形**（envelope または web 配列）で生成できる。
2. 柔軟パーサの挙動が **Vitest の固定ベクトル**で固定されている（[`extractBasTriples.test.ts`](../packages/engine/src/twelljr/extractBasTriples.test.ts)）。
3. 語の **Web 同梱・本家一致**はライセンス確定まで保留であることを本ドキュメントおよび [web-reproduction-roadmap.md](web-reproduction-roadmap.md) に明記する。

## 本家突合用縮小ベクトル（任意・将来）

**フル公式一致**はライセンス・ランタイム依存のためフェーズ B の必須成果から外す。

将来、ヘビーユーザー承認のもと **10〜20 件**の突合ベクトル（例: `index` / `reading` / 期待 `surface` の方針）を持てるようにする場合の **置き場（案）:** `packages/engine/test-fixtures/twelljr-official-alignment.json`（リポジトリに載せるかはライセンス OK 後）。初回は空配列またはサンプル 1 件のスキーマ例のみでもよい。**拡張方針:** ライセンスゲート解除後にベクトルを追加し、オプションの統合テストで読み込む。

## 次ステップ

1. 分岐アーム単位の AST 的抽出（または VB Decompiler の別エクスポート）。
2. 抽出結果と **ヘビーユーザー** によるランダムサンプル突合（上記オプション JSON）。
3. （ライセンス OK 後）同一 `index` での surface/reading が公式と一致するゴールデンへの拡張。

関連: [web-reproduction-roadmap.md](web-reproduction-roadmap.md) フェーズ B。
