import { StubPage } from "@/components/StubPage";

export default function Page() {
  return (
    <StubPage
      title="記録完了待ち"
      vbForm="frmCopyOK.frm"
      docRef="02-component-map — 記録完了待ち"
      variant="partial"
    >
      <p className="text-sm text-zinc-700">
        本家ではクリップボード連携や記録確定待ちの短いダイアログが出ることがあります。Web 版では<strong>同等のブロッキング UI は未実装</strong>です。
      </p>
      <div className="rounded-md border border-zinc-200 bg-white px-3 py-4 text-center text-sm text-zinc-600">
        ここに「クリップボードへコピーしました。OK で閉じる」系の文言が入る想定です。
      </div>
    </StubPage>
  );
}
