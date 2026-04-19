import { ElapsedBandsSettingsPanel } from "@/components/settings/PhaseCSettingsPanels";
import { StubPage } from "@/components/StubPage";

export default function Page() {
  return (
    <StubPage
      title="経過時間帯"
      vbForm="frmKeikaTime.frm"
      docRef="mnuKeikaTime_Click"
      variant="partial"
    >
      <ElapsedBandsSettingsPanel />
    </StubPage>
  );
}
