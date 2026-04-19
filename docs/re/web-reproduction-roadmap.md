# TWellJR ウェブ再現ロードマップ

**正典:** 本書は Cursor 側の **Web clone feasibility** 計画（`web_clone_feasibility_0b2c6954.plan.md`）と解析ハブ [analysis/README.md](analysis/README.md) を前提にする。  
**ゲート:** 実装・データ抽出の作業は **プロダクトオーナーの明示ゴーサイン後**に開始する（本書は設計・優先順位の固定用）。**実行開始記録:** ユーザー依頼「実行プラン Implement」により `packages/engine` 拡張・関連ドキュメント作成を着手（Cursor プラン `web_reproduction_execute_c7e2a876`）。

## Web サービスとして補完したい軸（プロジェクト動機）

現代のタイピング界隈で薄れがちだが、**タイプウェル系が長く担ってきた価値**を、**現代のウェブサービス**として再構成する、という動機をここに固定する（技術正典ではないが、優先判断の参照になる）。

1. **期間を問わない全期間の実力番付** — 短期イベントや単一サイト内ランキングではなく、**累積された序列**がコミュニティの共通言語になる土台。
2. **単語系で数十秒を超える打鍵** — 短尺スプリントだけでは測りにくい**持久・集中・ローマ経路の安定**を競技に含める（例: 国語Ｒ相当の **400 確定ストローク**試行はこの体験の核に近い）。
3. **長期不変のワードセットに基づく競技環境** — （1）と結びつく。**何年も変わらない同一ワードセット**が「名片的」なパターナリティと、**コミュニティ横断の普遍基準**を生む。権利・クリーンルームとはトレードオフになり得るため、**参照系の持続可能性**は別方針（コーパス再構成・利用許諾）で管理する。

## VB デコンパイラ出力だけで上記目的は達成できるか

**結論: 「技術的な挙動の再現・試行体験」にはかなり寄与するが、目的全体を「出力物だけ」で完結させることはできない。**

| 軸 | デコンパイラ出力（＋従来の解析メモ・公式 ReadMe / ログ）の役割 | 出力だけでは足りないもの |
|----|----------------------------------|---------------------------|
| (1) 全期間番付 | **寄与しない**。採点境界の根拠を読む材料にはなる。 | **永続アカウント・DB・改ざん耐性・運用**はバックエンドとプロダクト設計。 |
| (2) 長尺単語打鍵 | **寄与が大きい**。`Module1`・モード別供出・試行長などの根拠を追える（本リポジトリのエンジン・Web 試行の前提）。 | **ローマ入力の体感**は [emiel](https://github.com/tomoemon/emiel) 等の **別実装**。EXE とビット一致の再コンパイルは目的外。 |
| (3) 普遍のワードセット | **供出パイプラインの理解・移行・検証**に使える（LitStr 抽出→JSON 等）。 | **コミュニティが何年も同じ土俵を使う**ための**権利上持続可能な語表**は、クリーンルーム・コーパス・許諾の別レーン。埋め込み画像等（`.frx` 欠落）は**見た目再現**には弱いが、**(3) の「語の同一性」**とは直結しない。 |

**国語Ｒ（`TWellJR.exe`）固有の注意:** 出荷ビルドは **Native Code** 寄りと整理され、デコンパイラの `.bas` は **VB ソースというより解析用 IR** として読む前提。[`01-binary-triage.md`](analysis/01-binary-triage.md) 参照。エクスポートに **`.frx` が無い**場合、フォームの埋め込みバイナリは欠ける可能性がある（ロジック追跡とは別問題）。

**画像・フォーム資源（観察メモ）:** フォーム埋め込み資源（`.frx` 等）のリバース側では、**本体 exe から取り出せるビットマップは主にアプリケーション／ウィンドウのアイコン類に留まる**整理がつく。国語Ｒは **無骨な測定機**であり、**測定ウィンドウ本体に写真のような装飾画像が載っているタイプの UI ではない**（見た目クローンをエンジン・語表より後ろに置ける理由の一つ）。詳細は [binary-inventory.md](binary-inventory.md) の該当節。

## 実装優先度・マーケティング・差別化（方針メモ）

上記「補完したい軸」を、**何から作るか／何をオリジナルにするか**の判断として固定する。

### まず作るもの（最優先）

- **長尺の単語系打鍵**で、**タイプウェル的な体験**を先に成立させる（本リポジトリの **400 確定ストローク試行**・`Module1` 級表示などがその核）。
- **物語:** タイプウェル国語Ｒの **リバースエンジニアリングから出発した**ことは、**正典ではないがマーケティング上の手がかり**として明示してよい（技術的正しさの根拠は解析ドキュメントとテストに置く）。

### 全期間番付（累積序列）

- 本家タイプウェル側は長年 **メール受付中心の半自動運用**に近かった領域であり、**現代的な Web サービスとしてフルスクラッチ**で組むこと自体に価値がある（認証・DB・改ざん耐性・運用をこちらで設計する）。
- 一方で **段位・級・時間帯など「序列の意味づけ」**（国語Ｒでは `Module1` チャート相当）は、**タイプウェルに極力寄せる**。**番付の配信方式は新しく、尺の読み方は本家体感に合わせる**、という住み分け。

### 普遍のワードセット

- **クリーンルーム**で、**統計・特徴・コーパスから「ほぼ同じ」語セット**を再構成する手法を別途確立し、**何年も同一セットを使い続ける**前提で設計する（権利・再配布とトレードオフの管理は [binary-inventory.md](binary-inventory.md)・権利方針と連動）。

## 北極星と制約

| 項目 | 内容 |
|------|------|
| 最終目標 | **挙動・データの完全再現**（スコア境界、モード別供出、ログの意味など、可能な限り公式と一致） |
| 進め方 | **フェーズ分割**。各フェーズは単体で検証・回帰テスト資産が増える単位 |
| ドメイン | 不明点は **タイプウェル熱狂ヘビーユーザー（リポジトリ利用者）** に問い合わせ可 |
| UI | **セマンティック一致で可**（ピクセルパーフェクト不要）。**画面・設定・メニュー相当の表面積を不当に削らない**（公式より著しく簡素な 1 画面化は避ける） |
| 権利 | 語リスト・ブランド・配布形態は **別途方針を文書化**してからデータを扱う |

### 将来検討（表層表示・アンチチート）

現状の **プレーンテキスト表層**は実装・検証が速い一方、**コピー・スクリプトによるチートが容易**である。フェーズが進んだあとで、例として次を検討する余地がある（いずれも **アクセシビリティ・帯域・権利・本家体感とのトレードオフ** が付く）。

- **画像化した表層**（ビットマップ／SVG 等）— DOM から語をそのまま読めないようにする
- **OCR ジャミング**（わざと難読なレンダリング、ノイズ、分割描画）— 自動抽出のコストを上げる（完全防御にはならない）
- **サーバ側検証**（入力シーケンス・タイミングの整合）— クライアント改ざん耐性と運用コストの両立

## 再現度レベル（案）

将来の受け入れ・スコープ議論用のラベル。

- **L0:** 体感類似のタイピング練習（独自データ可）
- **L1:** `Module1` 相当ロジック（時間→レベル、`Proc_1_1` 系）と同一アルゴリズム
- **L2:** 少なくとも 1 公式モード相当の **語供出・採点**が export 由来データと一致（ゴールデンテスト）
- **L3:** 主要モード・ログ・設定の **広い互換**（ファイル形式 or 明示的移行）
- **L4:** 可能な限りの **公式挙動一致**（境界ケースまでヘビーユーザー + 自動テストで固定）

北極星は **L4 志向**。到達度はフェーズごとにラベル付けする。

## 入力ソース（解析資産）

| 種別 | パス / ドキュメント |
|------|---------------------|
| システム俯瞰 | [analysis/07-system-spec.md](analysis/07-system-spec.md) |
| コア typing / 採点 | [analysis/04-domain-typing.md](analysis/04-domain-typing.md)、`packages/engine` [module1Core.ts](../packages/engine/src/twelljr/module1Core.ts) |
| モード別ワード塊 | [analysis/04-mode-module-diff.md](analysis/04-mode-module-diff.md)、ローカル `twjrdecomp/*.bas`（Git 未収録）／生成物 `apps/web/public/twelljr-*.json` |
| I/O・ログ | [analysis/03-io-contracts.md](analysis/03-io-contracts.md)、`packages/engine` [logContracts.ts](../packages/engine/src/twelljr/logContracts.ts) |
| UI・メニュー | [analysis/05-ui-statechart.md](analysis/05-ui-statechart.md)、[analysis/02-component-map.md](analysis/02-component-map.md)、[web-surface-matrix.md](web-surface-matrix.md) |
| UI 雰囲気（非正典・補助） | [external-clone-ui-reference.md](external-clone-ui-reference.md) — 既存 Web クローンの **ぽさ**・LLM 手がかり（採点の正ではない） |
| 動的・ネット | [analysis/06-dynamic-notes.md](analysis/06-dynamic-notes.md) |
| ローマ字入力（Web 計画） | [emiel](https://github.com/tomoemon/emiel)（MIT）— 下記「横断課題」参照 |

## 進行分担（別ワークツリー）

- **クリーンルーム語表:** 別エージェント・**別 Git ワークツリー**で進行中。成果物は **権利上クリーンな置換ワードセット**（形式は合意次第）。本リポジトリは **当面 `apps/web/public/twelljr-*.json`（VB デコンパイル由来の抽出物）**を試行・検証・ログ照合の参照として維持する。
- **本リポジトリのフェーズ:** 語表の**中身差し替え**は向こうの成果を待ちつつ、こちらは **フェーズ C 続行 → フェーズ D 前準備 → エンジン/I-O ゴールデン**を進める。取り込み時に **JSON スキーマ互換・データソース切替**だけ先に固めておくと合流が速い。

### このリポジトリで直近すすめる

1. **フェーズ C:** [web-surface-matrix.md](web-surface-matrix.md) の `スタブ` を、公式 05/02 に対する **発見可能性**（ラベル・導線）から優先して底上げする。
2. **フェーズ D 前準備:** ブラウザ永続化（IndexedDB 等）の **最小スキャフォールド**と、[03-io-contracts.md](analysis/03-io-contracts.md) に沿った **ログ読み取り／エクスポート**のスパイク設計を `docs/spec` または `analysis` に起こす。
3. **エンジン:** `packages/engine` の **ログ契約・`Module1` 境界**のゴールデン拡張（クリーンルーム語表とは独立）。
4. **取り込み IF:** クリーンルーム語表が出たら **差し替えるだけ**になるよう、`WordListFile` / `TypingCanvas` の **データソース切替**（環境変数 or 設定 1 本）を小さく足す。

## フェーズ計画（推奨順）

### フェーズ A — コアエンジン + 1 モード縮小

- `Module1` 相当: 時間→ラベル階段、`Proc_1_1` のキー→内部定数マップを **TypeScript（または既存 `packages/engine`）** に移植。
- **1 モードのみ**（例: 基本常用 `Jou1` の部分集合）でワード供出パイプラインを試す。
- **ヘビーユーザー確認:** 境界秒（例: 76s 前後、206s）・表示ラベルが公式体感と一致するか。
- **成果物:** ユニットテスト（表に対する固定ベクトル）+ Q&A メモ（任意で `docs/re/` 配下に `web-reproduction-qa.md` 等）。

### フェーズ B — データ拡張とゴールデンテスト（着手済み）

- **クリーンルーム語表は別ワークツリー**（上記「進行分担」）。本リポのフェーズ B は **export 由来 JSON のパイプライン・Web 同梱・照合**までを継続し、置換語表は **取り込み IF** で合流する。
- `Jou*` → 構造化 JSON（表層文字列、ローマ字キー、内部コード）抽出パイプライン設計・実装（正典: [twelljr-data-pipeline.md](twelljr-data-pipeline.md)）。
- `Kata*` / `Kan*` / `Koto*` を同型で追加（`npm run extract:bas` / モード別薄ラッパー）。
- **エンジン側ゴールデン:** 柔軟 `LitStr` パーサは小さな固定フィクスチャで Vitest 固定済み。**語リストの Web 同梱・本家画面との完全一致**は **ライセンス／配布方針のゲート後**（フェーズ B の最小完了からは外す）。
- （将来）入力系列・経過時間・期待ラベル / 次語を公式と突き合わせる統合ゴールデンは、上記ゲート後に拡張。

### フェーズ C — UI 表面積（セマンティック一致）（着手済み・最小完了）

- [02-component-map.md](analysis/02-component-map.md) と [05-ui-statechart.md](analysis/05-ui-statechart.md) から **フォーム・主要メニュー・ダイアログ一覧**を作り、Web の **ルート / モーダル / 設定パネル** への対応表（**表面積マトリクス**）を維持。
- 見た目はデザインシステムに寄せてよいが、**操作系列と分岐の発見可能性**を公式に揃える。既存の非公式 Web 実装の **情報の並び・ラベル語彙**は [external-clone-ui-reference.md](external-clone-ui-reference.md) に整理し、**ぽさ**の補助参照に使う（正典は引き続き `analysis/*` と表面積マトリクス）。
- **実装状況（最小完了の定義）:** [web-surface-matrix.md](web-surface-matrix.md) に **WebPath / Status / Notes** を付与し、`apps/web` の **AppShell メニュー**からマトリクス上の各 **スタブページ**へ到達可能。`/` の **試行（TypingCanvas）**は維持（ローマ字入力の詳細は下記 **横断課題（emiel）**）。**キーのガイド**は `KeyGuideDialog` モーダル（05 `mnuGuid` 相当の入口）。
- **続行（発見可能性）:** `/settings/*` と `/records/*` に **セクション layout**（[`stubNavConfig.ts`](../../apps/web/src/lib/stubNavConfig.ts) と同期したサイドバー [`StubSidebarNav`](../../apps/web/src/components/StubSidebarNav.tsx)）を追加。トップメニューと **同一 URL 一覧**を単一ソースで維持。

### 横断課題（フェーズ C 以降・着手計画）— ローマ字入力 **emiel** 直接組み込み

- **目的:** 現状 [`packages/engine` の試行ループ](../../packages/engine/src/engine.ts)が行う **ASCII ローマ字の 1 文字 `===` 判定**では曖昧入力に弱いため、[emiel](https://github.com/tomoemon/emiel)（**MIT**）を **`apps/web` に直接**組み込み、**Google 日本語入力（Mozc）相当**のローマ字ルール（例: `sha` / `sya`、促音の連打等）で打てるようにする。
- **本家 pcode との関係:** 本家 `frmMain` の `Form_KeyPress` 周辺（`again*` 系の内部ヒント等）とは **別実装**。Web 版は **Mozc 系仕様（emiel）を正**とし、**バイト級の pcode 一致は求めない**（L4 議論の対象外としてよい）。
- **試行の「400」の意味（確定）:** **確定ストローク数基準**。emiel の **`finishedStroke.length`**（バックスペースで巻き戻したエッジを除いた確定ストローク列の長さ）が `trialKeyCount`（既定 **400**）に達したら試行終了とする。**本家は初期生成のかな文字数基準**だったが、Web 版では **タイパー業界でいう水増し打ち**（同じ表記でも、別表記ローマ字によりストローク数が増えること）を **許容**し、曖昧入力の使い勝手を優先する。
- **実装（着手済み）:** `apps/web` の [`TypingCanvas`](../../apps/web/src/components/TypingCanvas.tsx) が **`emiel` の `activate` + `rule.getRoman` + `build`** で入力し、語列は [`buildTrialSurfaceLine`](../../packages/engine/src/wordPicker.ts)（`typingKana` 合計＋語間スペースが試行打鍵数＋少し予備に達するまで語を連結）。**採点・ペース・経過時間**は engine の [`createStrokeTrialEngine`](../../packages/engine/src/strokeTrialEngine.ts)（`applyEmielStep` / `getRenderState`）に集約。
- **emiel に渡すターゲット文字列:** `kanaText` は **本家 BAS のローマ字 `reading` から生成した `WordEntry.typingKana`（ひらがな）を語間スペース連結**（[`buildTrialSurfaceLine`](../../packages/engine/src/wordPicker.ts)、[`romajiToTypingKana`](../../packages/engine/src/twelljr/romajiTypingKana.ts) + [wanakana](https://github.com/WaniKani/WanaKana)）。表層 `surface` は表示用。JSON に `typingKana` を埋め込むと上書き可能。
- **語列の長さ:** 400 確定ストロークに到達する前に `isFinished()` だけで打ち切られないよう、`fullTarget` を十分長く生成する（[`wordPicker`](../../packages/engine/src/wordPicker.ts) 相当の語繰り返し＋見積もり）。詳細は実装 PR で固定。
- **実行環境:** `detectKeyboardLayout` / `activate` は **ブラウザクライアントのみ**（SSR では初期化しない）。キー購読は **emiel と `TypingCanvas` で二重化しない**こと。ブラウザ対応は emiel README の **Chrome / Edge 主**に従い、制限事項を `apps/web` 側の利用案内に転記する。

### フェーズ D — 永続化・ログ互換

- `Time*.log` / `Dtld*` / `.twl` 等（[03-io-contracts.md](analysis/03-io-contracts.md)）の **読み取り・エクスポート互換**または **ワンショット移行ツール**。
- ブラウザ保存は IndexedDB 等 + エクスポートを既定とし、公式ファイルとの差分を文書化。
- **着手済み（スタブ）:** `gameMode` → `Time*` サフィックス対応（`timeLogSuffixForGameMode`）、`WEB_V1` タブ区切りスタブ行（[`d-phase-prep-local-store.md`](../spec/d-phase-prep-local-store.md)）、履歴画面から JSON / 単一 TXT / **4 ファイル名 ZIP** 書き出し、`WEB_V1` 取り込みプレビュー、[`fixtures/timelog-stub`](../../packages/engine/fixtures/timelog-stub)。
- **ネイティブ行:** テキスト系は [`08-time-log-native-format-v0.md`](analysis/08-time-log-native-format-v0.md) の `probeTimeLogTextV0`。**`TimeKHJY.log` バイナリ先頭**は [`09-time-khjy-binary-layout-v0.md`](analysis/09-time-khjy-binary-layout-v0.md) + `parseTimeKHJYLogFileV0` + [`fixtures/timelog-native`](../../packages/engine/fixtures/timelog-native)（実ヘッダ 64B）。

### フェーズ E（任意）— ハードニング

- API Monitor / x32dbg 系の残課題（[07-system-spec.md](analysis/07-system-spec.md) O-13/O-14）を必要なら実施し、Web 版の外部依存設計に反映。

## リスク・未決事項チェックリスト

- [ ] 語リスト・商標の **利用許諾**または社内限定方針
- [ ] **L 目標**の公式合意（L3 で止めるか L4 まで行くか）
- [ ] **表面積マトリクス**のレビュー（ヘビーユーザー）
- [ ] `packages/engine` との **単一ソース**化タイミング（フェーズ A から併走か、B 以降か）

## ゴーサイン後に最初にやること（実行チェックリスト）

1. 上記チェックリストの未着手を埋める（または「保留」と明示）。
2. リポジトリ内の **実装置き場**（例: `apps/web` 新設、`packages/engine` 拡張）を決め、最小ビルドが通るスキャフォールド。
3. フェーズ A の **テストファイル 1 本** + `Module1` ロジック移植の PR 単位に分割。

**進捗（実行プラン反映済み）:** `packages/engine` に `twelljr/module1Core.ts`（`Proc_1_0` / `Proc_1_1`）、`jou1-sample.json` + `jouSample.ts`、`logContracts.ts`、抽出スクリプト `scripts/extract-bas-triples.ts`（`extractBasTriples.ts`）、ドキュメント [web-surface-matrix.md](web-surface-matrix.md) / [twelljr-data-pipeline.md](twelljr-data-pipeline.md) を追加。`npm test` / `npm run build`（engine）は通過。

**フェーズ A（Web 接続）:** `TrialConfig.scoringProfile: "twelljr"` で試行終了ラベルを `twellJrLabelFromTotalSeconds` に切替。`apps/web` の `TypingCanvas` は `public/twelljr-jou1.json` … `twelljr-koto2.json`（全モード・デコンパイル由来全件）を切替、`jouTriplesToWordEntries` で供出。一括同期は `npm run extract:wordlists:all -w @typewell-jr/engine`。個別に Jou1 を取り直す場合は `npm run extract:jou:web` / `extract:kan1:web`（`scripts/extract-bas-triples.ts`、`--write-web`、CP932）。Jou1 用は抽出後に `Kan*` 照合 + Jisho で表層を可能な範囲で漢字化（`enrich-jou1-with-kanji-surfaces.mjs`、キャッシュ `jou-jisho-kanji-cache.json`）。

**フェーズ C（UI 表面積）:** [`AppShell`](../../apps/web/src/components/AppShell.tsx) + ドロップダウン相当ナビ、[`StubPage`](../../apps/web/src/components/StubPage.tsx) ベースの各ルート（`/settings/*`, `/records/*`, `/charts/ranking`, `/dialogs/*`, `/system/*`, `/tools/heavy-user`, `/help/readme`, `/session/end`, `/shell/form-t`）。マトリクスは [web-surface-matrix.md](web-surface-matrix.md)。キーガイドは [`KeyGuideDialog`](../../apps/web/src/components/KeyGuideDialog.tsx)（モーダル）。

---

*更新履歴: 初版 — ウェブ再現方針の文書化（ユーザー依頼）。*  
*追記: emiel 直接組み込み・400=確定ストローク基準・本家との差（Mozc 系優先／水増し許容）をロードマップに統合。*  
*追記: 別ワークツリーでのクリーンルーム語表と本リポの進行分担・直近タスクを明記。*
