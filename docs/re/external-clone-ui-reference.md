# 外部ブラウザクローン参照（UI の「ぽさ」・LLM 手がかり）

本書は **タイプウェル系の既存 Web 実装**を観察メモとして固定し、当リポジトリの Web UI を **雰囲気（ぽさ）**で寄せるときの **人間・LLM 共通の手がかり**にする。  
**正典ではない。** 採点・境界秒・語供出の **正**は [analysis/](analysis/README.md)・`twjrdecomp`・`packages/engine` のテストに従う。

---

## 参照 URL（一次）

| 名称 | URL | 備考 |
|------|-----|------|
| ブラウザ版タイプウェル国語R（非公式） | [typewell-in-browser.web.app](https://typewell-in-browser.web.app/) | fiore 氏。Firebase ホスティング。 |
| ソース | [fiore57/TypeWell-in-browser](https://github.com/fiore57/TypeWell-in-browser) | **MIT**。Vue CLI。 |
| 英単語・加速用編（作者ミラー） | [twew.html](http://tanon710.s500.xrea.com/typewell_mirror/js/twew.html) | **GANGAS** 名義・2013 年台の静的ページ。国語Rとは別ライン。 |

---

## 位置づけ（何を真にするか）

| 観点 | fiore 版（国語R風） | GANGAS twew（英単語） |
|------|---------------------|------------------------|
| **目的** | 国語Rに近い **練習 UI**（タイム・レベル・ミス中心） | 当時ブラウザ向け **英単語** ミニゲーム |
| **ソース** | 公開（OSS） | HTML + 外部 `eword.js` 想定の古典構成 |
| **採点の正** | 本家と一致を主張しない（README もサブセット明記） | 偏差値は別ランキング HTML 由来の参考値 |
| **当リポでの使い方** | **情報階層・ラベル語彙・モード切替の発見可能性**の参考 | **一行サマリー（Time / Miss / Level 帯）**の密度・「箱」UI の参考 |
| **避けること** | 実装の丸写し・ビジュアル盗用 | 英単語用コピー・古いブラウザ前提の再現に固執 |

---

## fiore 版から拾える「ぽさ」（LLM / 実装メモ）

観察ベース。画面は SPA（JS 必須）。

1. **状態の見える化**  
   - 上段に **Time**、**目標**（レベルなし含む）、**Miss** がまとまって並ぶイメージ。  
   - **READY** のような待機ラベルがある。

2. **モードと常用語**  
   - 「基本常用語」など **モード見出し**がコンテンツブロックのタイトルになっている。  
   - **F1–F4 でモード変更**と明示（本家メニュー構造の簡略版）。

3. **設定の塊**  
   - カウントダウン秒、目標レベル（**長いレベル ID 列**）、ミス上限、目標インジケータ（青 / 黄赤）など **数値・列挙が縦に並ぶ設定帯**。  
   - Web 版ではフォームではなく **設定ページ or 折りたたみ**にマッピングしてよいが、「まとまり」は参考になる。

4. **操作説明の分離**  
   - **プレイ画面**（Space/Enter スタート、Esc リセット）と **結果画面**（R でリプレイ等）を箇条書きで分ける。

5. **LLM への短文化（コピペ用）**  
   - 「国語R風タイピング Web。上段に Time・目標レベル・Miss。待機は READY。Space/Enter で開始、Esc でリセット。F1–F4 でモード。設定はカウントダウン・目標レベル列・ミス上限・インジケータ閾値が縦に並ぶ。本家より機能少なめ。」

---

## GANGAS twew から拾える「ぽさ」

観察ベース。国語R Web とは **プロダクトが違う**が、**情報密度の癖**の参考になる。

1. **一行メトリクス**  
   - `Time` / `偏差値` / `Miss` / `Level` が **同じ視線高度**に並ぶ。  
   - Level は **`[ ]` で囲った複数セル**のような「段階インジケータ」表現。

2. **本文と操作説明の距離**  
   - ルール説明・ワード由来・クッキー保存などが **下部に長文**でまとまる（昔の Web の癖）。

3. **LLM への短文化**  
   - 「英単語タイプ練習の古典ページ。一行に Time・偏差値・Miss・Level ボックス。説明は下の段落。レベルは角括弧風の複数マス。」

---

## 当リポジトリ（`apps/web`）への落とし込み

- **構造の正:** [05-ui-statechart.md](analysis/05-ui-statechart.md)、[02-component-map.md](analysis/02-component-map.md)、[web-surface-matrix.md](web-surface-matrix.md)。  
- **ぽさの正（補助）:** 本書 + 上記クローンの **スクリーンショット比較**（任意）。  
- **実装方針:** 既存の zinc/dark や AppShell を維持しつつ、  
  - **試行中サマリー**（経過・ミス・レベル相当）の **優先度と並び**、  
  - **待機 / カウントダウン / プレイ / 終了** の **ラベル語彙**、  
  - **設定項目のグルーピング**  
  を fiore 版に寄せると、タイプウェル慣れユーザーに **発見可能性**が伝わりやすい。

---

## Web 実装ギャップと反映状況（Typewell「ぽさ」U1–U5）

| ID | 計画内容 | 反映先・備考 |
|----|----------|--------------|
| **U1** | 上段サマリー（状態・Time・級・Miss 固定幅／長文は `title`） | [`apps/web/src/components/TrialTypewellChrome.tsx`](../../apps/web/src/components/TrialTypewellChrome.tsx) の `TrialStatusStrip`。[`TypingCanvas.tsx`](../../apps/web/src/components/TypingCanvas.tsx) でデッキ選択直後〜ビューポート前に配置。Time の詳細文言は帯から削除しサマリー＋ツールチップに集約。 |
| **U2** | モード見出し＋操作説明の二段（待機中／終了後） | 同ファイルの `TrialDeckHeading` / `TrialPlayHelp` / `TrialFinishedHelp`。 |
| **U3** | Module1 ラダーの「箱」装飾 | 同ファイルの `Module1ChartLadderRow` + エンジン [`MODULE1_CHART_LABEL_ORDER`](../../packages/engine/src/twelljr/module1Core.ts)。採点ロジックは変更なし。 |
| **U4** | 設定スタブへの「塊」＋ `frm*.frm` キャプション | `PracticeSettingsStubHub`。[`stubNavConfig.ts`](../../apps/web/src/lib/stubNavConfig.ts) の `NAV_SETTINGS_META` を単一ソース化し `NAV_SETTINGS` を派生。 |
| **U5** | 本節（ギャップ表）と下記チェックリスト | 当節。 |

### まだ「ぽさ」だけでは埋まらないもの（任意フォロー）

- **F1–F4 デッキ切替:** 未実装（本家メニュー／fiore との差）。  
- **Miss 本数:** emiel `failedInputCount`。`activateCompat` で **`KeyboardEvent.repeat` を破棄**し、試行ハンドラでは **`auto.input` は keydown のみ**（keyup を渡すと同一誤打が再び `failed` になりやすい）。本家定義とは一致しない場合あり。  
- **本家 `frmIndicator` の目標レベル UI:** 「級」は **経過秒からの Module1 チャート帯**表示（プレイ中は推定、終了後は確定ラベルと一致）。

---

## 見た目チェックリスト（手動・リグレ用）

1. **ロード → 待機 → カウントダウン → 試行 → 終了**の一連で、上段サマリー＋ラダー行の **縦ブレ**がない（プレースホルダ／固定 `min-h` が効いている）。  
2. **Time / 級 / Miss** が **数秒以内**で視認できる（fiore 一行サマリー相当）。  
3. **Module1 ラダー**で試行中〜終了後に **現在級**が 1 マスだけ強調される。  
4. **設定スタブ**リンクから `/settings/*` に飛び、各ページの `vbForm` 表示と **href が一致**する。  
5. **進捗行**で pace が **本文に出ず**、ツールチップにだけ出る（本家用語との混同を避ける）。

---

## 実装参照（コード索引）

| 役割 | パス |
|------|------|
| ぽさ用 UI 部品 | `apps/web/src/components/TrialTypewellChrome.tsx` |
| 試行ページ組み立て | `apps/web/src/components/TypingCanvas.tsx` |
| 設定ナビ単一ソース | `apps/web/src/lib/stubNavConfig.ts`（`NAV_SETTINGS_META`） |
| チャート級の列順 | `packages/engine/src/twelljr/module1Core.ts`（`MODULE1_CHART_LABEL_ORDER`） |

---

## 更新履歴

| 日付 | 内容 |
|------|------|
| 2026-04-17 | 初版。fiore 版・GANGAS twew の解析メモと LLM 短文化を追記。 |
| 2026-04-18 | U1–U5 実装ギャップ表・チェックリスト・コード索引を追記。 |
