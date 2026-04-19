"use client";

import {
  exportTrialSessionsJson,
  listTrialSessionsDescending,
  listUnifiedTimelineDescending,
  type UnifiedTimelineEntryV1,
} from "@/lib/localStore";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

function rowLabel(e: UnifiedTimelineEntryV1): string {
  if (e.source === "web") {
    return `${e.web.deckCaption} · ${(e.web.elapsedMs / 1000).toFixed(1)}s`;
  }
  const k = e.native.artifactKind;
  if (k === "past_binary_v0") {
    return `Past ${e.native.record.dateAscii}`;
  }
  if (
    k === "time_binary_v0" ||
    k === "dtld_binary_v0" ||
    k === "bptn_binary_v0" ||
    k === "poor_binary_v0"
  ) {
    return `${k} #${e.native.recordIndex + 1}`;
  }
  if (k === "dtld_float32_blob_v0" || k === "bptn_float32_blob_v0" || k === "poor_float32_blob_v0") {
    return `${k} (${e.native.floatCount} floats)`;
  }
  if ("textLine" in e.native) {
    return `${k} L${e.native.recordIndex + 1}`;
  }
  return k;
}

export type RecordsUnifiedSummaryProps = {
  /** 一覧に載せる最大件数（新しい順） */
  previewLimit?: number;
  /** 詳細表を多めに出す（全履歴向け） */
  denseTable?: boolean;
};

export function RecordsUnifiedSummary({
  previewLimit = 40,
  denseTable = false,
}: RecordsUnifiedSummaryProps) {
  const [rows, setRows] = useState<UnifiedTimelineEntryV1[]>([]);
  const [webTotal, setWebTotal] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const reload = useCallback(() => {
    void Promise.all([
      listUnifiedTimelineDescending(previewLimit),
      listTrialSessionsDescending(10_000),
    ])
      .then(([unified, webAll]) => {
        setRows(unified);
        setWebTotal(webAll.length);
        setErr(null);
      })
      .catch((e: unknown) => setErr(e instanceof Error ? e.message : String(e)));
  }, [previewLimit]);

  useEffect(() => {
    reload();
  }, [reload]);

  const webInPreview = rows.filter((r) => r.source === "web").length;
  const nativeInPreview = rows.filter((r) => r.source === "native").length;

  const downloadJson = () => {
    void exportTrialSessionsJson().then((json) => {
      const blob = new Blob([json], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `trial_sessions_v1_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  const show = denseTable ? 24 : 10;

  return (
    <div className="space-y-3 text-sm text-zinc-700">
      {err ? (
        <p className="text-red-600" role="alert">
          {err}
        </p>
      ) : null}
      <div className="rounded-md border border-zinc-200 bg-zinc-50/80 px-3 py-2 text-xs text-zinc-600">
        <p className="m-0 font-medium text-zinc-800">IndexedDB 要約（ブラウザ内のみ）</p>
        <ul className="m-0 mt-1 list-disc space-y-0.5 pl-4">
          <li>
            Web 試行（保存件数の上限表示）:{" "}
            <span className="font-mono tabular-nums">{webTotal ?? "—"}</span> 件
          </li>
          <li>
            下のプレビュー（直近 {previewLimit} 件マージ内）: Web{" "}
            <span className="font-mono">{webInPreview}</span> / 本家取り込み{" "}
            <span className="font-mono">{nativeInPreview}</span>
          </li>
        </ul>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link
          href="/records/history"
          className="rounded border border-sky-600 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-900 hover:bg-sky-100"
        >
          練習記録（詳細・取り込み）
        </Link>
        <button
          type="button"
          className="rounded border border-zinc-400 bg-white px-2.5 py-1 text-xs text-zinc-800 hover:bg-zinc-100"
          onClick={downloadJson}
        >
          Web 試行のみ JSON 書き出し
        </button>
        <button
          type="button"
          className="rounded border border-zinc-300 bg-zinc-100 px-2.5 py-1 text-xs text-zinc-700 hover:bg-zinc-200"
          onClick={() => reload()}
        >
          再読込
        </button>
      </div>
      {rows.length === 0 ? (
        <p className="m-0 text-xs text-zinc-500">まだデータがありません。ホームで試行するか、練習記録から本家ログを取り込んでください。</p>
      ) : (
        <div className="overflow-x-auto rounded border border-zinc-200">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="bg-zinc-100 text-zinc-600">
              <tr>
                <th className="border-b border-zinc-200 px-2 py-1 font-medium">種別</th>
                <th className="border-b border-zinc-200 px-2 py-1 font-medium">要約</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, show).map((e) => (
                <tr key={e.id} className="border-b border-zinc-100">
                  <td className="whitespace-nowrap px-2 py-1 font-mono text-[10px] text-zinc-500">
                    {e.source === "web" ? "Web" : "本家"}
                  </td>
                  <td className="px-2 py-1 text-zinc-800">{rowLabel(e)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
