import { StubPage } from "@/components/StubPage";
import Link from "next/link";

export default function Page() {
  return (
    <StubPage
      title="苦手練習"
      vbForm="frmNigate.frm"
      docRef="mnuRenshuu_Click"
      variant="partial"
    >
      <p className="text-sm leading-relaxed text-zinc-700">
        本家では苦手語に基づく練習セッションを起こします。Web 版では<strong>語別の専用ループ</strong>は未接続ですが、通常の長尺試行はホーム（
        <Link href="/" className="text-sky-700 underline">
          /
        </Link>
        ）の <code className="rounded bg-zinc-200 px-1">TypingCanvas</code> で実施できます。
      </p>
      <p className="text-sm text-zinc-700">
        苦手語の定義・閾値は{" "}
        <Link href="/settings/weak-words" className="font-medium text-sky-800 underline">
          苦手設定
        </Link>
        （本家 <code className="rounded bg-zinc-200 px-1">frmNigaSettei</code> 相当）で今後拡張予定です。
      </p>
    </StubPage>
  );
}
