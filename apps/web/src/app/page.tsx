import { TypingCanvas } from "@/components/TypingCanvas";

export default function Home() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          タイプウェル系・プライベート練習プロトタイプ
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          国語Ｒ相当の採点・400 打鍵試行。上部メニューから本家相当の各画面（スタブ）へ遷移できます。
        </p>
        <p className="mt-2 text-xs leading-relaxed text-zinc-600">
          <span className="font-medium text-zinc-700">ライセンス・権利への配慮</span>
          {" — "}
          本家実行ファイルやデコンパイル成果一式の再配布は行っていません。リポジトリには解析ノートと、必要最小限の表形式データのみを置いています。OSS
          部品は各ライセンスに従って表示・利用します（例: ローマ字入力{" "}
          <a
            className="text-amber-800 underline hover:text-amber-700"
            href="https://github.com/tomoemon/emiel"
            target="_blank"
            rel="noreferrer"
          >
            emiel
          </a>
          （MIT））。
        </p>
        <p className="mt-1.5 text-xs leading-relaxed text-zinc-600">
          ワードセットは現状、本家をデコンパイルして抽出した語表（
          <code className="rounded bg-zinc-200 px-1 text-zinc-800">public/twelljr-*.json</code>
          ）を用いていますが、いずれクリーンルーム化した独自供出へ置き換える予定です。
        </p>
      </header>
      <TypingCanvas />
    </main>
  );
}
