# Binary inventory: タイプウェル国語Ｒ (TWJR216)

Source folder (local machine, not in repo): `C:\Users\hotwa\Dropbox\TWJR216`.

## Entry points and binaries

| File | Size (bytes) | Role |
|------|---------------|------|
| `TWellJR.exe` | 2,297,856 | Primary VB6 application (国語Ｒ本体) |
| `TWellRT.exe` | 51,200 | Auxiliary executable |
| `TWtoGR.exe` | 84,480 | Converter / tool |
| `TWtoWeb.exe` | 98,816 | Converter / tool |
| `twrtcb.exe` | 6,561,732 | Large bundled tool (likely Python/wx runtime) |
| `twtter.exe` | 5,451,287 | Twitter-related tool |
| `hspext.dll` | 53,248 | Native dependency |

## Configuration and user data (plain text / logs)

| File | Notes |
|------|--------|
| `ComJR.twl` | Serialized UI/options (VB-style `#TRUE#` / numeric fields) |
| `config.bin` | Binary configuration blob |
| `ReadMe.txt` | Official documentation; **level time bands** and mode descriptions |
| `Detail.txt`, `DetailDB*.txt` | Session / aggregate typing statistics |
| `DetailLog/*.txt` | Per-trial keystroke timing logs (see `docs/spec/behavior-baseline.md`) |
| `JRlkg.csv` | Online-style **ranking table** (name, score, rank code); **not** the word dictionary |
| `*.log` (`Bptn*`, `Poor*`, `Time*`, …) | Practice / weakness logs |

## Word list location (RE status)

- Practice logs (`Detail.txt`, `DetailLog/*.txt`) contain **surface forms** (語句) and per-key timing; romaji is implied by the key column.
- The full 10k+ phrase table is expected to live **inside `TWellJR.exe` resources or a companion format** not exposed as a standalone `.csv` in this folder.
- **Recommended path for clone**: (1) parse your own `DetailLog` exports to bootstrap a JSON lexicon; (2) optionally supplement with a **self-authored** word list; (3) run VB Decompiler on `TWellJR.exe` locally to locate embedded tables (output stays on your machine).

## Subfolders observed

- `DetailLog/` — many per-run text traces (good for golden-test *input shapes*, not for redistributing verbatim in OSS).
- `twrt/`, `twtoweb/` — build artifacts / Python runtimes (large); not required for the web clone MVP.

## VB Decompiler export（Git には含めない）

`twjrdecomp/` は **ローカル専用**です（リポジトリの `.gitignore` で `*.bas` / `*.frm` 等を除外し、この説明の `README.md` のみ追跡）。クローン後に、手元の VB Decompiler エクスポートをここへ展開してください。

**実行時に参照されるのは** Next.js が配信する **`apps/web/public/twelljr-*.json`（語表）** のみです。`twjrdecomp/` は `packages/engine` の抽出スクリプト実行時だけ必要です。

エクスポートの内容例（参考・ローカルに置いたときの話）:

- `Project.vbp` — VB6 プロジェクト一覧（`ExeName32="TWellJR.exe"`、`frmMain` 起動など）。
- `*.frm` / `*.bas` — フォーム定義と P-code 風リスティング（解析・`docs/re/analysis/` の根拠）。

公開リポジトリでは **エクスポート一式を push しない**運用にしてください。検証済みの式は `docs/spec/` や TypeScript（`packages/engine`）へ昇格させます。

## UI / embedded imagery (RE observation)

国語Ｒは **測定に特化した無骨な UI** である。フォーム埋め込み資源（`.frx` 等）や exe 内ビットマップを辿る限り、**本体から確認しやすい画像はアプリケーション／ウィンドウのアイコン類に留まる**ことが多く、**測定ウィンドウ本体にリッチな写真・イラストが載る前提には立たない**。見た目のピクセルパーフェクト再現は、エンジン・語表・ログ整合より優先度を下げてよい根拠の一つ。

## Decompilation note

VB Decompiler は **Windows 向け GUI** です。`twjrdecomp/` は Cursor 等での解析用ダンプとしてローカルに保持し、`ReadMe.txt` / `DetailLog` と突き合わせて確認した内容をドキュメント・コードへ反映します。
