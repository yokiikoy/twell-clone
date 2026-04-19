import { StubPage } from "@/components/StubPage";
import Link from "next/link";

export default function Page() {
  return (
    <StubPage
      title="汎用ダイアログ（第2）"
      vbForm="frmDialog2.frm"
      docRef="02-component-map — frmDialog2"
      variant="partial"
    >
      <p className="text-sm text-zinc-700">
        本家では <code className="rounded bg-zinc-200 px-1">frmDialog</code>{" "}
        とは別インスタンスの汎用ダイアログがあります。Web でもルートを分けておきます。
      </p>
      <div className="rounded-lg border border-zinc-300 bg-white p-4 shadow-sm">
        <p className="m-0 text-sm text-zinc-800">第2ダイアログのサンプル（確認のみ）</p>
        <div className="mt-3 flex justify-end">
          <button type="button" className="rounded bg-violet-600 px-3 py-1 text-xs text-white">
            閉じる（未配線）
          </button>
        </div>
      </div>
      <p className="text-xs text-zinc-500">
        <Link href="/dialogs/generic" className="underline">
          汎用ダイアログ 1
        </Link>
        {" · "}
        <Link href="/" className="underline">
          ホーム
        </Link>
      </p>
    </StubPage>
  );
}
