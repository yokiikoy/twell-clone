export function StubPage({
  title,
  vbForm,
  docRef,
  children,
}: {
  title: string;
  vbForm: string;
  docRef: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-2xl space-y-4 py-2 sm:px-0">
      <h1 className="text-xl font-semibold tracking-tight text-zinc-100">
        {title}
      </h1>
      <p className="text-sm text-zinc-400">
        本家相当: <code className="rounded bg-zinc-800 px-1.5 py-0.5">{vbForm}</code>
      </p>
      <p className="text-xs text-zinc-500">根拠: {docRef}</p>
      <p className="rounded-md border border-amber-900/40 bg-amber-950/25 px-3 py-2 text-sm text-amber-100/90">
        フェーズ C スタブ — 画面ロジックは今後のイテレーションで実装予定です。
      </p>
      {children}
    </div>
  );
}
