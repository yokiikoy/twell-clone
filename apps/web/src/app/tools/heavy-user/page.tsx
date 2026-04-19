import { StubPage } from "@/components/StubPage";
import Link from "next/link";

export default function Page() {
  return (
    <StubPage
      title="ヘビーユーザー向けツール"
      vbForm="frmHeavy.frm"
      docRef="02-component-map — .twl / パターン"
      variant="partial"
    >
      <p className="text-sm leading-relaxed text-zinc-700">
        本家のヘビーユーザー向けフォーム（スロット <code className="rounded bg-zinc-200 px-1">.twl</code>{" "}
        等）に相当します。Web 版では <strong>ファイルの行取り込み</strong>は{" "}
        <Link href="/records/history" className="font-medium text-sky-800 underline">
          練習記録
        </Link>
        内の「本家ファイル取り込み」から <code className="rounded bg-zinc-200 px-1">*.twl</code>（ComJR 系 VB 風テキスト）を選べます。
      </p>
      <p className="text-xs text-zinc-600">
        I/O 契約の一覧: リポジトリ{" "}
        <code className="rounded bg-zinc-100 px-1">docs/re/analysis/03-io-contracts.md</code>
      </p>
      <ul className="list-disc space-y-1 pl-5 text-xs text-zinc-700">
        <li>
          スロット名の慣例: <code className="rounded bg-zinc-100 px-1">0.twl</code> …{" "}
          <code className="rounded bg-zinc-100 px-1">3.twl</code>（エンジン{" "}
          <code className="rounded bg-zinc-100 px-1">twlSlotBasename</code>）
        </li>
        <li>バイナリのみの .twl は未検証のため取り込み対象外になり得ます。</li>
      </ul>
    </StubPage>
  );
}
