import { RecordsUnifiedSummary } from "@/components/RecordsUnifiedSummary";
import { StubPage } from "@/components/StubPage";

export default function Page() {
  return (
    <StubPage
      title="全履歴"
      vbForm="frmAllRireki.frm"
      docRef="mnuZenrireki_Click"
      variant="partial"
    >
      <p className="text-sm leading-relaxed text-zinc-700">
        本家の全履歴は長大な一覧を扱うフォームです。Web 版では{" "}
        <strong>同一 IndexedDB</strong> から、Web 試行と本家インポートをマージしたタイムラインを多めに表示します。
      </p>
      <RecordsUnifiedSummary previewLimit={80} denseTable />
    </StubPage>
  );
}
