"use client";

import { useCallback, useEffect, useState } from "react";
import {
  exportTrialSessionsJson,
  listUnifiedTimelineDescending,
  type UnifiedTimelineEntryV1,
} from "@/lib/localStore";
import { formatTimelineRowCopyLine } from "@/lib/timelineCopy";
import {
  exportTrialSessionsTimeLogStubTxt,
  exportTrialSessionsTimeLogStubZip,
} from "@/lib/timeLogStubExport";
import { TimeLogImportPreview } from "@/components/TimeLogImportPreview";

function tagLabel(entry: UnifiedTimelineEntryV1): string {
  if (entry.source === "web") return "Web試行";
  const k = entry.native.artifactKind;
  const sfx = entry.native.timeLogSuffix;
  const mode = sfx ? `·${sfx}` : "";
  switch (k) {
    case "time_binary_v0":
      return sfx ? `本家記録（Time${mode}）` : "本家記録（Time）";
    case "dtld_binary_v0":
      return `本家記録（Dtld${mode}）`;
    case "bptn_binary_v0":
      return `本家記録（Bptn${mode}）`;
    case "poor_binary_v0":
      return `本家記録（Poor${mode}）`;
    case "boot_txt_v0":
      return "本家記録（Boot）";
    case "jrmemo_txt_v0":
      return "本家記録（JRmemo）";
    case "past_txt_v0":
      return "本家記録（Past）";
    case "dtld_txt_v0":
      return `本家記録（Dtld行${mode}）`;
    case "bptn_txt_v0":
      return `本家記録（Bptn行${mode}）`;
    case "poor_txt_v0":
      return `本家記録（Poor行${mode}）`;
    case "dtld_float32_blob_v0":
      return `本家記録（Dtld·float列${mode}）`;
    case "bptn_float32_blob_v0":
      return `本家記録（Bptn·float列${mode}）`;
    case "poor_float32_blob_v0":
      return `本家記録（Poor·float列${mode}）`;
    case "twl_slot_txt_v0":
      return "本家記録（.twl 行）";
    case "past_binary_v0":
      return "本家記録（Past·50B）";
    default:
      return "本家記録";
  }
}

export function LocalTrialHistoryPanel() {
  const [rows, setRows] = useState<UnifiedTimelineEntryV1[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [copyTip, setCopyTip] = useState<string | null>(null);

  const reload = useCallback(() => {
    listUnifiedTimelineDescending(20)
      .then(setRows)
      .catch((e: unknown) => setErr(e instanceof Error ? e.message : String(e)));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const downloadExport = () => {
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

  const downloadTimeStub = () => {
    void exportTrialSessionsTimeLogStubTxt().then((text) => {
      const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `timelog_stub_v1_${new Date().toISOString().slice(0, 10)}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  const downloadTimeStubZip = () => {
    void exportTrialSessionsTimeLogStubZip().then((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `timelog_stub_v1_${new Date().toISOString().slice(0, 10)}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  const copyLine = (entry: UnifiedTimelineEntryV1) => {
    const text = formatTimelineRowCopyLine(entry);
    void navigator.clipboard.writeText(text).then(
      () => {
        setCopyTip("コピーしました（タブ区切り）");
        setTimeout(() => setCopyTip(null), 2000);
      },
      () => setCopyTip("コピーに失敗しました")
    );
  };

  if (err) {
    return (
      <p className="text-sm text-red-600" role="alert">
        ローカル履歴の読み込みに失敗しました: {err}
      </p>
    );
  }

  return (
    <div className="space-y-3 rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="m-0 font-medium text-zinc-800">
          試行タイムライン（Web + 本家インポート · IndexedDB）
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-100"
            onClick={() => reload()}
          >
            再読込
          </button>
          <button
            type="button"
            className="rounded border border-amber-400 bg-amber-100 px-2 py-1 text-xs font-medium text-amber-950 hover:bg-amber-200"
            onClick={downloadExport}
          >
            JSON 書き出し
          </button>
          <button
            type="button"
            className="rounded border border-zinc-400 bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-900 hover:bg-zinc-200"
            onClick={downloadTimeStub}
            title="本家 Time*.log とは非互換のスタブ行（TWJR_TIMELOG_STUB_V1）"
          >
            Time ログスタブ (TXT)
          </button>
          <button
            type="button"
            className="rounded border border-zinc-500 bg-zinc-200 px-2 py-1 text-xs font-medium text-zinc-950 hover:bg-zinc-300"
            onClick={downloadTimeStubZip}
            title="TimeKHJY.log … TimeKTWZ.log 名の4ファイルを ZIP（中身はスタブ行）"
          >
            Time*.log スタブ ZIP
          </button>
        </div>
      </div>
      {copyTip ? (
        <p className="m-0 text-[11px] text-emerald-800" role="status">
          {copyTip}
        </p>
      ) : null}
      {rows.length === 0 ? (
        <p className="m-0 text-xs text-zinc-600">
          まだ保存された試行も本家取り込みもありません。ホームで 400 打鍵試行を完了するか、下の取り込みから
          Time*.log / Boot.txt / JRmemo.txt / *.twl を選んでください。
        </p>
      ) : (
        <ul className="m-0 max-h-64 list-none space-y-2 overflow-y-auto p-0">
          {rows.map((entry) => (
            <li
              key={entry.id}
              className="flex flex-wrap items-start justify-between gap-2 rounded border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-700"
            >
              <div className="min-w-0 flex-1">
                <span className="mr-1.5 inline-block rounded bg-zinc-200 px-1.5 py-0.5 text-[10px] font-medium text-zinc-800">
                  {tagLabel(entry)}
                </span>
                {entry.source === "web" ? (
                  <>
                    <span className="font-mono text-[10px] text-zinc-500">
                      {entry.web.savedAt}
                    </span>
                    {" — "}
                    <span className="font-medium">{entry.web.deckCaption}</span>
                    {" · "}
                    {entry.web.elapsedMs != null
                      ? `${(entry.web.elapsedMs / 1000).toFixed(2)}s`
                      : "—"}
                    {" · "}
                    ラベル {entry.web.resultLevelId ?? "—"}
                    {" · "}
                    Miss {entry.web.missCount}
                  </>
                ) : entry.native.artifactKind === "dtld_float32_blob_v0" ||
                  entry.native.artifactKind === "bptn_float32_blob_v0" ||
                  entry.native.artifactKind === "poor_float32_blob_v0" ? (
                  <>
                    <span className="font-mono text-[10px] text-zinc-500">
                      {entry.native.floatCount} floats
                      {entry.native.headerLabel
                        ? ` · ${entry.native.headerLabel.slice(0, 48)}${entry.native.headerLabel.length > 48 ? "…" : ""}`
                        : ""}
                    </span>
                    {" · "}
                    <span className="font-mono text-[10px] text-zinc-600">
                      {entry.native.floatPreviewHead.slice(0, 6).map((x) => x.toFixed(2)).join(", ")}
                      …
                    </span>
                    {" · "}
                    <span className="text-[10px] text-zinc-500">← {entry.native.sourceFileName}</span>
                  </>
                ) : entry.native.artifactKind === "past_binary_v0" ? (
                  <>
                    <span className="font-mono text-[10px] text-zinc-500">
                      {entry.native.record.dateAscii}
                    </span>
                    {" · "}
                    float {entry.native.record.valueF32.toFixed(3)}
                    {" · "}
                    int32 {entry.native.record.valueI32}
                    {" · "}
                    <span className="text-[10px] text-zinc-500">
                      ← {entry.native.sourceFileName} #{entry.native.recordIndex + 1}
                    </span>
                  </>
                ) : entry.native.artifactKind === "time_binary_v0" ||
                  entry.native.artifactKind === "dtld_binary_v0" ||
                  entry.native.artifactKind === "bptn_binary_v0" ||
                  entry.native.artifactKind === "poor_binary_v0" ? (
                  <>
                    <span className="font-mono text-[10px] text-zinc-500">
                      {entry.native.record.dateAscii} {entry.native.record.timeAscii}
                    </span>
                    {" · "}
                    clock {entry.native.record.clockAscii}
                    {" · "}
                    int1 {entry.native.record.int32}
                    {entry.native.record.truncated ? " · 末尾切れ" : ""}
                    {" · "}
                    <span className="text-[10px] text-zinc-500">
                      ← {entry.native.sourceFileName} #{entry.native.recordIndex + 1}
                    </span>
                  </>
                ) : "textLine" in entry.native ? (
                  <>
                    <span className="font-mono text-[10px] text-zinc-500">
                      行 {entry.native.recordIndex + 1}
                      {entry.native.timeLogSuffix
                        ? ` · ${entry.native.timeLogSuffix}`
                        : ""}
                    </span>
                    {" · "}
                    <span className="break-all">{entry.native.textLine}</span>
                    {" · "}
                    <span className="text-[10px] text-zinc-500">
                      ← {entry.native.sourceFileName}
                    </span>
                  </>
                ) : null}
              </div>
              <button
                type="button"
                className="shrink-0 rounded border border-zinc-300 bg-zinc-50 px-1.5 py-0.5 text-[10px] text-zinc-700 hover:bg-zinc-100"
                title="タブ区切り1行をクリップボードへ"
                onClick={() => copyLine(entry)}
              >
                延長線コピー
              </button>
            </li>
          ))}
        </ul>
      )}
      <TimeLogImportPreview onImported={reload} />
      <p className="m-0 text-[10px] leading-snug text-zinc-500">
        データモデル・ストア仕様は{" "}
        <code className="rounded bg-zinc-200 px-1">docs/spec/d-phase-prep-local-store.md</code>
        。第2波アーティファクト一覧は{" "}
        <code className="rounded bg-zinc-200 px-1">docs/spec/d-phase-wave2-artifact-matrix.md</code>。
      </p>
    </div>
  );
}
