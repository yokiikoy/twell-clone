import { KanaByKanaSettingsPanel } from "@/components/settings/PhaseCSettingsPanels";
import { StubPage } from "@/components/StubPage";

export default function Page() {
  return (
    <StubPage
      title="カナ別練習"
      vbForm="frmRomeBetu.frm"
      docRef="mnuRom_Click"
      variant="partial"
    >
      <KanaByKanaSettingsPanel />
    </StubPage>
  );
}
