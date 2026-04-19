import { RecordsUnifiedSummary } from "@/components/RecordsUnifiedSummary";
import { StubPage } from "@/components/StubPage";

export default function Page() {
  return (
    <StubPage
      title="総合記録"
      vbForm="frmSougou.frm"
      docRef="mnuSougou_Click / mnuSougouP_Click"
      variant="partial"
    >
      <p className="text-sm leading-relaxed text-zinc-700">
        本家の総合記録は、複数モード・期間にわたる集計を表示する画面です。Web 版ではまず{" "}
        <strong>ブラウザ内に蓄積した試行と本家取り込み</strong>の要約を表示します（本家の集計式とは未一致）。
      </p>
      <RecordsUnifiedSummary previewLimit={50} />
    </StubPage>
  );
}
