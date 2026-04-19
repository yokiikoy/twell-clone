import { StubPage } from "@/components/StubPage";

export default function Page() {
  return (
    <StubPage
      title="警告・通知"
      vbForm="frmKeikoku.frm"
      docRef="05-ui-statechart — Timer1_Timer → frmKeikoku.Show"
      variant="partial"
    >
      <p className="text-sm text-zinc-700">
        本家ではタイマー等からモーダル警告を出します。Web 版では<strong>試行中のインライン警告は未結線</strong>です。下は見た目サンプルです。
      </p>
      <div
        className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950 shadow-sm"
        role="alert"
      >
        <p className="m-0 font-medium">サンプル: 記録の保存に失敗しました（モック）</p>
        <p className="m-0 mt-1 text-xs text-amber-900">実際のエラーは今後 <code className="rounded bg-amber-100/80 px-1">AppShell</code>{" "}
        からトースト表示する想定です。</p>
      </div>
    </StubPage>
  );
}
