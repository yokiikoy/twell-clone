import { RomanSettingsPanel } from "@/components/settings/PhaseCSettingsPanels";
import { StubPage } from "@/components/StubPage";

export default function Page() {
  return (
    <StubPage
      title="ローマ字表示設定"
      vbForm="frmSetting.frm"
      docRef="mnuFontSettei_Click"
      variant="partial"
    >
      <RomanSettingsPanel />
    </StubPage>
  );
}
