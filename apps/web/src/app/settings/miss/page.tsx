import { MissSoundSettingsPanel } from "@/components/settings/PhaseCSettingsPanels";
import { StubPage } from "@/components/StubPage";

export default function Page() {
  return (
    <StubPage
      title="ミス音・ミス上限"
      vbForm="frmMiss.frm"
      docRef="mnuMissJougen_Click"
      variant="partial"
    >
      <MissSoundSettingsPanel />
    </StubPage>
  );
}
