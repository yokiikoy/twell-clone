import { StubPage } from "@/components/StubPage";
import Link from "next/link";

export default function Page() {
  return (
    <StubPage
      title="起動ログ"
      vbForm="frmKidou.frm"
      docRef="mnuKidou_Click"
      variant="partial"
    >
      <p className="text-sm leading-relaxed text-zinc-700">
        本家の起動ログは <code className="rounded bg-zinc-200 px-1">Boot.txt</code>{" "}
        に相当するテキストを閲覧する画面です。Web 版では{" "}
        <strong>行単位の取り込み</strong>は{" "}
        <Link href="/records/history" className="font-medium text-sky-800 underline">
          練習記録
        </Link>
        内の本家ファイル取り込み（<code className="rounded bg-zinc-200 px-1">Boot.txt</code>）から IndexedDB に保存できます。
      </p>
      <p className="text-xs text-zinc-500">
        本画面専用の一覧表示は未実装です。取り込み後の行はタイムラインに <code className="rounded bg-zinc-100 px-1">boot_txt_v0</code>{" "}
        として混ざります。
      </p>
    </StubPage>
  );
}
