import { IndicatorSettingsPanel } from "@/components/settings/PhaseCSettingsPanels";
import { StubPage } from "@/components/StubPage";

export default function Page() {
  return (
    <StubPage
      title="目標インジケータ"
      vbForm="frmIndicator.frm"
      docRef="mnuIndicator_Click"
      variant="partial"
    >
      <IndicatorSettingsPanel />
    </StubPage>
  );
}
