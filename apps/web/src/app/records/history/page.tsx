import { LocalTrialHistoryPanel } from "@/components/LocalTrialHistoryPanel";
import { StubPage } from "@/components/StubPage";

export default function Page() {
  return (
    <StubPage
      title="練習記録（履歴閲覧）"
      vbForm="frmRireki.frm"
      docRef="mnuRenJisseki_Click / mnuRenJissekiP_Click"
      variant="partial"
    >
      <LocalTrialHistoryPanel />
    </StubPage>
  );
}
