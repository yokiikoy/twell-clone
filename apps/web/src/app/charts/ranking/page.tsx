import { StubPage } from "@/components/StubPage";
import Link from "next/link";

export default function Page() {
  return (
    <StubPage
      title="ランキング・チャート（FormD）"
      vbForm="FormD.frm"
      docRef="05-ui-statechart — mnuKako10P 等多数 → FormD.Show"
      variant="partial"
    >
      <p className="text-sm text-zinc-700">
        本家 <code className="rounded bg-zinc-200 px-1">FormD</code> は過去ランキングやチャートをまとめたダイアログです。Web 版では<strong>本家バイナリチャートの再現は未実装</strong>です。下はレイアウト用のプレースホルダです。
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-md border border-zinc-200 bg-white p-3">
          <p className="m-0 text-xs font-medium text-zinc-600">棒グラフ枠（モック）</p>
          <div className="mt-2 flex h-24 items-end gap-1">
            {[40, 65, 35, 80, 50, 90, 55].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t bg-violet-200"
                style={{ height: `${(h / 100) * 96}px` }}
                title={`series ${i + 1}`}
              />
            ))}
          </div>
        </div>
        <div className="rounded-md border border-zinc-200 bg-white p-3">
          <p className="m-0 text-xs font-medium text-zinc-600">折れ線枠（モック）</p>
          <div className="mt-2 h-24 rounded border border-dashed border-zinc-300 bg-zinc-50/80" />
        </div>
      </div>
      <p className="text-xs text-zinc-500">
        生データの閲覧は{" "}
        <Link href="/records/aggregate" className="underline">
          総合記録
        </Link>
        の要約表から入れます。
      </p>
    </StubPage>
  );
}
