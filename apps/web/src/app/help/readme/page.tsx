import { StubPage } from "@/components/StubPage";
import Link from "next/link";

export default function Page() {
  return (
    <StubPage
      title="ReadMe 相当"
      vbForm="ReadMe.txt（本家は ShellExecute）"
      docRef="mnuReadMe_Click"
      variant="partial"
    >
      <p className="text-sm text-zinc-700">
        本家は <code className="rounded bg-zinc-200 px-1">ReadMe.txt</code> を既定アプリで開きます。Web 版ではリポジトリ内ドキュメントへの案内に置き換えています。
      </p>
      <section className="rounded-md border border-zinc-200 bg-zinc-50/80 p-3 text-sm text-zinc-800">
        <p className="m-0 font-medium text-zinc-900">開発者向けパス（リポジトリ）</p>
        <ul className="m-0 mt-2 list-disc space-y-1 pl-5 font-mono text-xs text-zinc-700">
          <li>docs/re/web-reproduction-roadmap.md — フェーズ計画</li>
          <li>docs/re/analysis/03-io-contracts.md — 本家ログ I/O</li>
          <li>docs/re/web-surface-matrix.md — 画面マトリクス</li>
        </ul>
      </section>
      <p className="text-sm text-zinc-600">
        試行・取り込み:{" "}
        <Link href="/records/history" className="underline">
          練習記録
        </Link>
      </p>
    </StubPage>
  );
}
