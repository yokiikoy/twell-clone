import { WeakWordsSettingsPanel } from "@/components/settings/PhaseCSettingsPanels";
import { StubPage } from "@/components/StubPage";

export default function Page() {
  return (
    <StubPage
      title="苦手設定"
      vbForm="frmNigaSettei.frm"
      docRef="mnuNigateSettei_Click"
      variant="partial"
    >
      <WeakWordsSettingsPanel />
    </StubPage>
  );
}
