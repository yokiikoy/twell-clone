import { StubPage } from "@/components/StubPage";
import { TYPEWELL_MIRROR_URL } from "@/lib/stubNavConfig";

export default function Page() {
  return (
    <StubPage
      title="Web ランキング"
      vbForm="frmWebrkg.frm"
      docRef="mnuZenkoku_Click"
      variant="partial"
    >
      <p className="text-sm leading-relaxed text-zinc-700">
        本家は全国・Web 系ランキング用の画面を開きます。Web 版では<strong>サーバ番付は未実装</strong>です。コミュニティ参照用に、従来の非公式ミラーへのリンクのみ提供します（別タブ）。
      </p>
      <p className="text-xs text-zinc-500">
        出典は表面積マトリクス <code className="rounded bg-zinc-200 px-1">mnuWeb</code> 行に合わせています。
      </p>
      <a
        href={TYPEWELL_MIRROR_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex rounded border border-violet-600 bg-violet-50 px-3 py-2 text-sm font-medium text-violet-900 hover:bg-violet-100"
      >
        タイプウェル系ミラーを開く（外部）
      </a>
    </StubPage>
  );
}
