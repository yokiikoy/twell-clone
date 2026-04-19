import { StubPage } from "@/components/StubPage";
import Link from "next/link";

export default function Page() {
  return (
    <StubPage
      title="リファレンス"
      vbForm="frmReference.frm"
      docRef="02-component-map — Reference"
      variant="partial"
    >
      <p className="text-sm text-zinc-700">
        本家のリファレンス／ヘルプ相当です。Web 版では解析ドキュメントへの導線を置きます。
      </p>
      <ul className="list-disc space-y-1 pl-5 text-sm text-sky-900">
        <li>
          <Link className="underline" href="/help/readme">
            /help/readme（ReadMe 相当）
          </Link>
        </li>
        <li>
          <a
            className="underline"
            href="https://github.com/tomoemon/emiel"
            target="_blank"
            rel="noopener noreferrer"
          >
            emiel（ローマ字入力・外部）
          </a>
        </li>
      </ul>
    </StubPage>
  );
}
