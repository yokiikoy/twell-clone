import { StubPage } from "@/components/StubPage";
import Link from "next/link";

export default function Page() {
  return (
    <StubPage
      title="終了"
      vbForm="frmMain — mnuEnd / Global.Unload"
      docRef="mnuEnd_Click / mnuEndb_Click — Web ではブラウザタブを閉じる案内"
      variant="partial"
    >
      <p className="text-sm text-zinc-600">
        本家はプロセス終了です。Web 版ではタブを閉じるか、このサイトから離れてください。
      </p>
      <p className="text-xs text-zinc-500">
        記録の書き出しは{" "}
        <Link href="/records/history" className="underline">
          練習記録
        </Link>
        から行えます。
      </p>
    </StubPage>
  );
}
