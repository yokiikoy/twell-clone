import { StubPage } from "@/components/StubPage";

export default function Page() {
  return (
    <StubPage
      title="終了"
      vbForm="frmMain — mnuEnd / Global.Unload"
      docRef="mnuEnd_Click / mnuEndb_Click — Web ではブラウザタブを閉じる案内"
    >
      <p className="text-sm text-zinc-400">
        本家はプロセス終了です。Web 版ではタブを閉じるか、このサイトから離れてください。
      </p>
    </StubPage>
  );
}
