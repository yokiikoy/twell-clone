import { TypingCanvas } from "@/components/TypingCanvas";

export default function Home() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          タイプウェル系・プライベート練習プロトタイプ
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          国語Ｒ相当の採点・400 打鍵試行。語リストは{" "}
          <code className="rounded bg-zinc-800 px-1">public/twelljr-*.json</code>{" "}
          （デコンパイル由来）。上部メニューから本家相当の各画面（スタブ）へ遷移できます。
        </p>
      </header>
      <TypingCanvas />
    </main>
  );
}
