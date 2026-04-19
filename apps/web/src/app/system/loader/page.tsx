import { StubPage } from "@/components/StubPage";

export default function Page() {
  return (
    <StubPage
      title="ローダー"
      vbForm="frmLoad.frm"
      docRef="02-component-map — Loader、要 pcode 確認"
      variant="partial"
    >
      <p className="text-sm text-zinc-700">
        本家のロード画面に相当するオーバーレイの<strong>見本</strong>です。試行フローとは未配線です。
      </p>
      <div className="flex items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50 py-12">
        <div className="flex flex-col items-center gap-2">
          <div
            className="h-10 w-10 animate-spin rounded-full border-2 border-zinc-300 border-t-violet-600"
            aria-hidden
          />
          <span className="text-xs text-zinc-500">読み込み中…（演出のみ）</span>
        </div>
      </div>
    </StubPage>
  );
}
