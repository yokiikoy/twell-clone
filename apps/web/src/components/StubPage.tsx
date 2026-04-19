export type StubPageVariant = "stub" | "partial";

export function StubPage({
  title,
  vbForm,
  docRef,
  variant = "stub",
  children,
}: {
  title: string;
  vbForm: string;
  docRef: string;
  /** `partial`: 下に実装済みコンテンツがある — 琥珀の全画面スタブ帯を出さない */
  variant?: StubPageVariant;
  children?: React.ReactNode;
}) {
  const showFullStubBanner = variant === "stub" || !children;
  return (
    <div className="mx-auto max-w-2xl space-y-4 py-2 sm:px-0">
      <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
        {title}
      </h1>
      <p className="text-sm text-zinc-600">
        本家相当: <code className="rounded bg-zinc-200 px-1.5 py-0.5 text-zinc-800">{vbForm}</code>
      </p>
      <p className="text-xs text-zinc-500">根拠: {docRef}</p>
      {showFullStubBanner ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          フェーズ C スタブ — 画面ロジックは今後のイテレーションで実装予定です。
        </p>
      ) : (
        <p className="rounded-md border border-sky-200 bg-sky-50/90 px-3 py-2 text-xs text-sky-950">
          一部実装 — 下記は Web 側の読み取り／永続化。本家フォームの全項目一致は未完了です。
        </p>
      )}
      {children}
    </div>
  );
}
