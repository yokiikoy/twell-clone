import { StubPage } from "@/components/StubPage";

export default function Page() {
  return (
    <StubPage
      title="ログ送付"
      vbForm="FormSoufu.frm"
      docRef="mnuMail_Click"
      variant="partial"
    >
      <p className="text-sm leading-relaxed text-zinc-700">
        本家では記録メール送信用のフォーム（宛先・件名・本文など）を開きます。Web 版では<strong>メール送信は未実装</strong>です。下はプレースホルダのみです。
      </p>
      <form className="space-y-3 rounded-md border border-zinc-200 bg-white p-3 text-sm">
        <div>
          <label className="block text-xs font-medium text-zinc-600">宛先（本家相当）</label>
          <input
            type="email"
            readOnly
            className="mt-0.5 w-full rounded border border-zinc-200 bg-zinc-50 px-2 py-1 text-zinc-500"
            placeholder="（未接続）"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-600">件名</label>
          <input
            type="text"
            readOnly
            className="mt-0.5 w-full rounded border border-zinc-200 bg-zinc-50 px-2 py-1 text-zinc-500"
            placeholder="タイピング記録"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-600">本文プレビュー</label>
          <textarea
            readOnly
            rows={4}
            className="mt-0.5 w-full resize-y rounded border border-zinc-200 bg-zinc-50 px-2 py-1 font-mono text-xs text-zinc-500"
            placeholder="Web 試行 JSON や本家ログのエクスポートは練習記録画面から行えます。"
          />
        </div>
        <p className="m-0 text-xs text-amber-800">
          送信ボタンは出しません（ブラウザから勝手にメールを送らないため）。
        </p>
      </form>
    </StubPage>
  );
}
