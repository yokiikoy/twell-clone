/** AppShell とセクション layout のナビを同期するための単一ソース */

export type StubNavItem = { href: string; label: string };

export const NAV_RECORD: StubNavItem[] = [
  { href: "/records/aggregate", label: "総合記録" },
  { href: "/records/history", label: "練習記録" },
  { href: "/records/full-history", label: "全履歴" },
  { href: "/records/weak-practice", label: "苦手練習" },
  { href: "/records/log-mail", label: "ログ送付" },
  { href: "/records/boot-log", label: "起動ログ" },
  { href: "/records/web-ranking", label: "Webランキング" },
];

/** 設定メニュー（本家 `frm*.frm` 対応）— `NAV_SETTINGS` の単一ソース */
export const NAV_SETTINGS_META = [
  { href: "/settings/roman", label: "ローマ字表示", vbForm: "frmSetting.frm" },
  { href: "/settings/indicator", label: "目標インジケータ", vbForm: "frmIndicator.frm" },
  { href: "/settings/miss", label: "ミス音", vbForm: "frmMiss.frm" },
  { href: "/settings/elapsed-bands", label: "経過時間帯", vbForm: "frmKeikaTime.frm" },
  { href: "/settings/weak-words", label: "苦手設定", vbForm: "frmNigaSettei.frm" },
  { href: "/settings/kana-by-kana", label: "カナ別練習", vbForm: "frmRomeBetu.frm" },
] as const satisfies readonly { href: string; label: string; vbForm: string }[];

export const NAV_SETTINGS: StubNavItem[] = NAV_SETTINGS_META.map(({ href, label }) => ({
  href,
  label,
}));

export const NAV_CHARTS: StubNavItem[] = [
  { href: "/charts/ranking", label: "ランキング・チャート（FormD）" },
];

export const NAV_SYSTEM: StubNavItem[] = [
  { href: "/shell/form-t", label: "副シェル（FormT）" },
  { href: "/dialogs/generic", label: "汎用ダイアログ" },
  { href: "/dialogs/generic-2", label: "汎用ダイアログ 2" },
  { href: "/system/alert", label: "警告（frmKeikoku）" },
  { href: "/system/loader", label: "ローダー" },
  { href: "/system/reference", label: "リファレンス" },
  { href: "/system/copy-wait", label: "記録完了待ち" },
  { href: "/session/end", label: "終了（案内）" },
];

/**
 * 元コミュニティサイト（`https://www.twfan.com/`）は閉鎖のため、**非公式ミラー**へ誘導する。
 * @see http://tanon710.s500.xrea.com/typewell_mirror/index.html
 */
export const TYPEWELL_MIRROR_URL =
  "http://tanon710.s500.xrea.com/typewell_mirror/index.html";

/** @deprecated 互換名。`TYPEWELL_MIRROR_URL` と同一。 */
export const TW_FAN_URL = TYPEWELL_MIRROR_URL;
