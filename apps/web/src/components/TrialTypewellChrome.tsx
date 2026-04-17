"use client";

import {
  MODULE1_CHART_LABEL_ORDER,
  twellJrLabelFromTotalSeconds,
  type StrokeTrialRenderState,
} from "@typewell-jr/engine";
import Link from "next/link";
import { NAV_SETTINGS_META } from "@/lib/stubNavConfig";

export type TrialRunPhase = "loading" | "lobby" | "countdown" | "playing" | "finished";

const TIME_HELP =
  "初回確定ストロークから試行終了までの経過（秒）。試行完了後は固定。";
const CHART_HELP =
  "国語Ｒ Module1 チャート上の級（経過総秒から参照）。試行完了後は確定ラベルと一致。";
const MISS_HELP =
  "emiel の failedInputCount（無効打鍵の累計）。試行では **keydown のみ** をオートマトンに渡し、keyup による二重 failed を避けます。OS の keydown リピートは入力層で無視。本家のミス定義とは一致しない場合があります。";

const CHART_LADDER_LABELS: readonly string[] = [...MODULE1_CHART_LABEL_ORDER, "-"];

function formatSecondsShort(ms: number): string {
  if (ms < 0 || !Number.isFinite(ms)) return "—";
  return `${(ms / 1000).toFixed(2)}s`;
}

function phaseShortLabel(phase: TrialRunPhase): string {
  switch (phase) {
    case "loading":
      return "読込中";
    case "lobby":
      return "待機";
    case "countdown":
      return "開始まで";
    case "playing":
      return "試行中";
    case "finished":
      return "終了";
    default:
      return "";
  }
}

/** fiore 的な上段: 状態・Time・級（チャート帯）・Miss。高さは折り返し時も確保 */
export function TrialStatusStrip({
  runPhase,
  trialForStrip,
  missCount,
}: {
  runPhase: TrialRunPhase;
  trialForStrip: StrokeTrialRenderState | null;
  /** 試行中は emiel `Automaton.failedInputCount`；試行外は null */
  missCount: number | null;
}) {
  const elapsed = trialForStrip?.elapsedMs ?? 0;
  const elapsedSec = elapsed / 1000;
  const liveChart =
    trialForStrip != null
      ? trialForStrip.finished && trialForStrip.resultLevelId != null
        ? trialForStrip.resultLevelId
        : twellJrLabelFromTotalSeconds(elapsedSec)
      : null;

  const timeDisplay =
    trialForStrip != null && (runPhase === "playing" || runPhase === "finished")
      ? formatSecondsShort(elapsed)
      : "—";

  const missDisplay = missCount != null ? String(missCount) : "—";

  return (
    <div
      className="flex min-h-[2.25rem] shrink-0 flex-wrap items-center gap-x-4 gap-y-1.5 border border-zinc-200 bg-zinc-100 px-3 py-1.5 text-xs text-zinc-700 sm:min-h-[2.5rem] sm:text-sm"
      aria-label="試行状態サマリー"
    >
      <div className="flex items-baseline gap-1.5">
        <span className="text-zinc-500">状態</span>
        <span className="min-w-[3.25rem] font-medium tabular-nums text-zinc-900">
          {phaseShortLabel(runPhase)}
        </span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-zinc-500" title={TIME_HELP}>
          Time
        </span>
        <span className="min-w-[5.5ch] cursor-default tabular-nums text-zinc-900" title={TIME_HELP}>
          {timeDisplay}
        </span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-zinc-500" title={CHART_HELP}>
          級
        </span>
        <span
          className="min-w-[2ch] font-semibold tabular-nums text-amber-800"
          title={CHART_HELP}
        >
          {liveChart ?? "—"}
        </span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-zinc-500" title={MISS_HELP}>
          Miss
        </span>
        <span
          className={
            "min-w-[3ch] tabular-nums " +
            (missCount != null && missCount > 0 ? "text-orange-700" : "text-zinc-600")
          }
          title={MISS_HELP}
        >
          {missDisplay}
        </span>
      </div>
    </div>
  );
}

/** Module1 ラダーの装飾表示（採点ロジックはエンジン側のまま） */
export function Module1ChartLadderRow({
  trialForStrip,
  runPhase,
}: {
  trialForStrip: StrokeTrialRenderState | null;
  runPhase: TrialRunPhase;
}) {
  const show = trialForStrip != null && (runPhase === "playing" || runPhase === "finished");
  if (!show) {
    return (
      <div
        className="h-8 shrink-0 rounded border border-zinc-200 bg-zinc-100"
        aria-hidden
      />
    );
  }

  const elapsedSec = trialForStrip.elapsedMs / 1000;
  const active =
    trialForStrip.finished && trialForStrip.resultLevelId != null
      ? trialForStrip.resultLevelId
      : twellJrLabelFromTotalSeconds(elapsedSec);

  return (
    <div
      className="flex h-8 shrink-0 items-stretch gap-0.5 overflow-x-auto rounded border border-zinc-200 bg-zinc-50 px-1 py-0.5"
      role="presentation"
      aria-label="国語Ｒ Module1 チャート級（装飾）"
    >
      {CHART_LADDER_LABELS.map((id) => {
        const on = id === active;
        return (
          <span
            key={id}
            className={
              "flex min-w-[1.35rem] shrink-0 items-center justify-center rounded-sm border px-0.5 font-mono text-[9px] tabular-nums sm:text-[10px] " +
              (on
                ? "border-amber-500 bg-amber-100 text-amber-950 ring-1 ring-amber-400"
                : "border-zinc-200 bg-white text-zinc-500")
            }
          >
            {id}
          </span>
        );
      })}
    </div>
  );
}

export function TrialDeckHeading({ group, caption }: { group: string; caption: string }) {
  return (
    <div className="shrink-0 border-b border-zinc-200 pb-2">
      <h2 className="m-0 text-sm font-semibold tracking-tight text-zinc-900 sm:text-base">
        {caption}
      </h2>
      <p className="m-0 mt-0.5 text-[11px] text-zinc-600">{group}</p>
    </div>
  );
}

export function TrialPlayHelp({ countdownSeconds }: { countdownSeconds: number }) {
  return (
    <div className="space-y-1 text-[11px] leading-snug text-zinc-600">
      <p className="m-0 font-medium text-zinc-700">待機・カウントダウン・試行中</p>
      <ul className="m-0 list-inside list-disc space-y-0.5 pl-0.5 marker:text-zinc-400">
        <li>
          <kbd className="rounded border border-zinc-300 bg-zinc-100 px-1 py-0.5 font-mono text-[10px] text-zinc-800">
            Enter
          </kbd>{" "}
          /{" "}
          <kbd className="rounded border border-zinc-300 bg-zinc-100 px-1 py-0.5 font-mono text-[10px] text-zinc-800">
            Space
          </kbd>{" "}
          で開始（{countdownSeconds} 秒カウントダウンは下の帯）。下の「スタート」ボタンでも同じです。
        </li>
        <li>ワード枠は常に同じ位置。Esc はカウントダウン中・試行中・終了後に待機へ（試行中・終了後は語を抽選し直し）。</li>
      </ul>
    </div>
  );
}

export function TrialFinishedHelp() {
  return (
    <div className="space-y-1 text-[11px] leading-snug text-zinc-600">
      <p className="m-0 font-medium text-zinc-700">終了後</p>
      <ul className="m-0 list-inside list-disc space-y-0.5 pl-0.5 marker:text-zinc-400">
        <li>結果行に国語Ｒラベル（Module1）を表示します。</li>
        <li>本家相当のリプレイ（R キー等）は Web 版では未実装です（予定）。</li>
      </ul>
    </div>
  );
}

function TrialEmielKeyboardIntro() {
  return (
    <p className="m-0 px-3 py-2.5 text-[11px] leading-snug text-zinc-600">
      ローマ字入力は{" "}
      <a
        className="text-amber-800 underline hover:text-amber-700"
        href="https://github.com/tomoemon/emiel"
        target="_blank"
        rel="noreferrer"
      >
        emiel
      </a>
      （Mozc 相当）。キー配列は Chrome / Edge で自動検出（失敗時は QWERTY JIS 想定）。Firefox / Safari
      では物理キー認識に制限がある場合があります（emiel README 参照）。
    </p>
  );
}

function TrialHintParagraph({
  surfaceHint,
  trialStrokeCount,
}: {
  surfaceHint: string;
  trialStrokeCount: number;
}) {
  return (
    <div className="space-y-0.5 text-[11px] leading-snug text-zinc-600">
      <p className="m-0">
        <span className="font-medium text-zinc-700">{surfaceHint}</span>
        {" · "}
        Mozc系（emiel）· 確定ストローク {trialStrokeCount}（語間スペース）
      </p>
      <p className="m-0">
        ターゲットかなは平仮名のみの語は表層のまま、それ以外は BAS を正規化してから tsuikyo の roma 表を逆引き（取りこぼしは
        wanakana にフォールバック）。下のローマ字行は emiel オートマトン（Mozc 経路）の確定／未確定ローマ字です。
      </p>
    </div>
  );
}

/**
 * ページ最下部の「補助の塊」: emiel／キー検出・試行操作・表層／かな／ローマ字の読み方＋設定スタブリンク。
 */
export function PracticeSettingsStubHub({
  countdownSeconds,
  surfaceHint,
  trialStrokeCount,
}: {
  countdownSeconds: number;
  surfaceHint: string;
  trialStrokeCount: number;
}) {
  return (
    <div className="shrink-0 overflow-hidden rounded-md border border-zinc-200 bg-zinc-50">
      <TrialEmielKeyboardIntro />
      <div className="grid gap-3 border-t border-zinc-200 px-3 py-2.5 sm:grid-cols-2">
        <TrialPlayHelp countdownSeconds={countdownSeconds} />
        <TrialFinishedHelp />
      </div>
      <div className="border-t border-zinc-200 px-3 py-2.5">
        <TrialHintParagraph surfaceHint={surfaceHint} trialStrokeCount={trialStrokeCount} />
      </div>
      <div className="border-t border-zinc-200 px-3 py-2.5">
        <p className="m-0 mb-2 text-[11px] font-medium text-zinc-600">本家メニュー相当（設定スタブ）</p>
        <ul className="m-0 grid list-none grid-cols-1 gap-1.5 sm:grid-cols-2">
          {NAV_SETTINGS_META.map(({ href, label, vbForm }) => (
            <li key={href}>
              <Link
                href={href}
                className="flex flex-col rounded border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-800 hover:border-amber-300 hover:bg-amber-50/80"
              >
                <span className="font-medium text-zinc-900">{label}</span>
                <span className="mt-0.5 font-mono text-[10px] text-zinc-500">{vbForm}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
