import { StubPage } from "@/components/StubPage";
import Link from "next/link";

export default function FormTShellPage() {
  return (
    <StubPage
      title="副シェル（FormT）"
      vbForm="FormT.frm"
      docRef="05-ui-statechart.md — mnuTopL / mnuTopLP → FormT.Show"
      variant="partial"
    >
      <p className="text-sm leading-relaxed text-zinc-700">
        本家の副ウィンドウ（トップレベル別フォーム）に相当する領域です。Web では<strong>別ウィンドウは使わず</strong>、このルートを「副シェル相当のコンテナ」として確保しています。
      </p>
      <ul className="list-disc space-y-1 pl-5 text-sm text-zinc-700">
        <li>
          メイン試行:{" "}
          <Link href="/" className="font-medium text-sky-800 underline">
            ホーム /
          </Link>
        </li>
        <li>将来、ランキングチャートや補助ツールをここに寄せる余地あり（未配線）。</li>
      </ul>
    </StubPage>
  );
}
