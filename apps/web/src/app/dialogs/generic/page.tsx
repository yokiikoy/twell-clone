import { StubPage } from "@/components/StubPage";
import Link from "next/link";

export default function Page() {
  return (
    <StubPage
      title="汎用ダイアログ"
      vbForm="frmDialog.frm"
      docRef="02-component-map — 汎用ダイアログ枠"
      variant="partial"
    >
      <p className="text-sm text-zinc-700">
        本家の汎用 Yes/No ダイアログ枠です。Web ではルート直開きはデバッグ用で、通常はモーダルに相当する部品から開く想定です。
      </p>
      <div className="rounded-lg border border-zinc-300 bg-zinc-50 p-4 shadow-inner">
        <p className="m-0 text-sm text-zinc-800">サンプル文言です。よろしいですか？</p>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="rounded border border-zinc-400 bg-white px-3 py-1 text-xs text-zinc-700">
            OK（未配線）
          </button>
          <button type="button" className="rounded border border-zinc-300 bg-zinc-200 px-3 py-1 text-xs text-zinc-700">
            キャンセル
          </button>
        </div>
      </div>
      <p className="text-xs text-zinc-500">
        戻る: <Link href="/" className="underline">ホーム</Link>
      </p>
    </StubPage>
  );
}
