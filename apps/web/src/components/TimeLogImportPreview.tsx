"use client";

import {
  bufferLooksLikeLineOrientedTextLogV0,
  decodeNativeTextFileBestEffort,
  formatUint8HeadHexV0,
  inferNativeBinaryTimeLikeArtifactFromFilename,
  inferNativeTextLogArtifactFromFilename,
  inferTimeLogSuffixFromFilename,
  inferNativeFloatBlobArtifactFromFilename,
  looksLikeBptnPoorFloat32ScoresBlobV0,
  looksLikeDtldPackedNativeV0,
  looksLikePastLogBinaryV0,
  looksLikeTimeKHJYBinaryV0,
  looksLikeTwlSlotTextSerializationV0,
  parseDtldPackedNativeFileV0,
  parseNativeFloat32BlobFileV0,
  parsePastLogFileV0,
  parseTimeKHJYLogFileV0,
  parseTimeLogStubFileTextV1,
  probeTimeLogTextV0,
  splitNativeTextLinesV0,
  type DtldPackedNativeParseV0,
  type NativeFloatBlobInferV0,
  type NativeTextLogInferV0,
  type PastLogBinaryRecordV0,
  type TimeKHJYBinaryRecordV0,
  type TimeLogLineProbeV0,
} from "@typewell-jr/engine";
import {
  replaceImportedFloat32BlobFileV0,
  replaceImportedNativeTextFileV0,
  replaceImportedPastBinaryFileV0,
  replaceImportedTimeBinaryFileV0,
} from "@/lib/localStore";
import { useId, useState } from "react";

const MAX_ISSUES_SHOWN = 25;
const MAX_NATIVE_UNKNOWN = 12;
const MAX_NATIVE_ROWS = 30;
const MAX_NATIVE_TEXT_PREVIEW = 40;

function binaryImportSubtitle(fileLabel: string | null): string {
  if (!fileLabel) return "120B V0";
  const inf = inferNativeBinaryTimeLikeArtifactFromFilename(fileLabel);
  const sfx = inf?.timeLogSuffix ? ` · ${inf.timeLogSuffix}` : "";
  switch (inf?.artifactKind) {
    case "dtld_binary_v0":
      return `Dtld（Time 120B 先頭一致・中身は Time 型として解釈）${sfx}`;
    case "bptn_binary_v0":
      return `Bptn（Time 120B 先頭一致）${sfx}`;
    case "poor_binary_v0":
      return `Poor（Time 120B 先頭一致）${sfx}`;
    default:
      return `Time*.log バイナリ（120B V0）${sfx}`;
  }
}

function nativeTextImportTitle(meta: NativeTextLogInferV0): string {
  const suf = meta.timeLogSuffix ? ` · ${meta.timeLogSuffix}` : "";
  switch (meta.artifactKind) {
    case "boot_txt_v0":
      return `Boot.txt（行）${suf}`;
    case "jrmemo_txt_v0":
      return `JRmemo.txt（行）${suf}`;
    case "past_txt_v0":
      return "Past.log（行・非50B時）";
    case "dtld_txt_v0":
      return `Dtld*.log（行）${suf}`;
    case "bptn_txt_v0":
      return `Bptn*.log（行）${suf}`;
    case "poor_txt_v0":
      return `Poor*.log（行）${suf}`;
    case "twl_slot_txt_v0":
      return "*.twl（スロット・VB 風テキスト行）";
    default:
      return meta.artifactKind;
  }
}

type FloatBlobPreviewStateV0 = {
  infer: NativeFloatBlobInferV0;
  dtld: DtldPackedNativeParseV0 | null;
  floats: Float32Array;
};

type ImportMode =
  | "none"
  | "text"
  | "binary"
  | "native_text"
  | "past_binary"
  | "float_blob"
  | "native_blocked";

export type TimeLogImportPreviewProps = {
  onImported?: () => void;
};

export function TimeLogImportPreview({ onImported }: TimeLogImportPreviewProps) {
  const inputId = useId();
  const [importMode, setImportMode] = useState<ImportMode>("none");
  const [binaryRecs, setBinaryRecs] = useState<TimeKHJYBinaryRecordV0[]>([]);
  const [parsed, setParsed] = useState<ReturnType<
    typeof parseTimeLogStubFileTextV1
  > | null>(null);
  const [probe, setProbe] = useState<ReturnType<typeof probeTimeLogTextV0> | null>(null);
  const [fileLabel, setFileLabel] = useState<string | null>(null);
  const [sourceByteLength, setSourceByteLength] = useState(0);
  const [importBusy, setImportBusy] = useState(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [nativeTextLines, setNativeTextLines] = useState<string[]>([]);
  const [nativeTextMeta, setNativeTextMeta] = useState<NativeTextLogInferV0 | null>(null);
  const [nativeTextEncoding, setNativeTextEncoding] = useState<string>("");
  const [pastBinaryRecs, setPastBinaryRecs] = useState<PastLogBinaryRecordV0[]>([]);
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null);
  const [blockedHexPreview, setBlockedHexPreview] = useState<string | null>(null);
  const [floatBlobPreview, setFloatBlobPreview] = useState<FloatBlobPreviewStateV0 | null>(null);

  return (
    <div className="space-y-2 rounded-md border border-dashed border-zinc-300 bg-white px-3 py-2.5 text-xs">
      <p className="m-0 font-medium text-zinc-800">本家ファイル取り込み（プレビュー）</p>
      <p className="m-0 leading-snug text-zinc-600">
        <span className="font-medium">Time*.log</span> が 120B 先頭一致なら{" "}
        <code className="rounded bg-zinc-200 px-1">09</code> 準拠。{" "}
        <span className="font-medium">Past.log</span> は 50B 固定レコード（実データ確認済み）。{" "}
        <span className="font-medium">Dtld</span> は実測でヘッダ文字列＋
        <code className="rounded bg-zinc-200 px-1">float32</code> 列、
        <span className="font-medium">Bptn/Poor</span> は
        <code className="rounded bg-zinc-200 px-1">float32</code> 列として取り込み可。行テキストは内容が読める場合のみ。{" "}
        <span className="font-medium">Boot.txt</span> / <span className="font-medium">JRmemo.txt</span>{" "}
        は行テキスト。<span className="font-medium">*.twl</span>（例: ComJR）は{" "}
        <code className="rounded bg-zinc-200 px-1">#TRUE#</code> 形式の行テキストとして検出したときのみ行取り込み。それ以外のテキストは{" "}
        <span className="font-medium">WEB_V1</span> スタブ＋{" "}
        <code className="rounded bg-zinc-200 px-1">08-time-log-native-format-v0.md</code>{" "}
        の行分類。
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor={inputId} className="sr-only">
          ログファイルを選択
        </label>
        <input
          id={inputId}
          type="file"
          accept=".txt,.log,.twl,.bin,text/plain,application/octet-stream"
          className="max-w-full text-[11px] file:mr-2 file:rounded file:border file:border-zinc-300 file:bg-zinc-50 file:px-2 file:py-1"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (!f) {
              setImportMode("none");
              setBinaryRecs([]);
              setParsed(null);
              setProbe(null);
              setFileLabel(null);
              setSourceByteLength(0);
              setImportMsg(null);
              setNativeTextLines([]);
              setNativeTextMeta(null);
              setNativeTextEncoding("");
              setPastBinaryRecs([]);
              setBlockedMessage(null);
              setBlockedHexPreview(null);
              setFloatBlobPreview(null);
              return;
            }
            setFileLabel(f.name);
            setImportMsg(null);
            void f.arrayBuffer().then((buf) => {
              const u8 = new Uint8Array(buf);
              setSourceByteLength(u8.byteLength);
              if (looksLikeTimeKHJYBinaryV0(u8)) {
                setImportMode("binary");
                setBinaryRecs(parseTimeKHJYLogFileV0(u8));
                setParsed(null);
                setProbe(null);
                setNativeTextLines([]);
                setNativeTextMeta(null);
                setNativeTextEncoding("");
                setPastBinaryRecs([]);
                setBlockedMessage(null);
                setBlockedHexPreview(null);
                setFloatBlobPreview(null);
              } else {
                setBinaryRecs([]);
                const textMeta = inferNativeTextLogArtifactFromFilename(f.name);
                const { text, encodingLabel } = decodeNativeTextFileBestEffort(u8);
                setPastBinaryRecs([]);
                setBlockedMessage(null);
                setBlockedHexPreview(null);
                setFloatBlobPreview(null);
                if (
                  textMeta?.artifactKind === "past_txt_v0" &&
                  looksLikePastLogBinaryV0(u8)
                ) {
                  setImportMode("past_binary");
                  setPastBinaryRecs(parsePastLogFileV0(u8));
                  setNativeTextMeta(null);
                  setNativeTextLines([]);
                  setNativeTextEncoding("");
                  setParsed(null);
                  setProbe(null);
                } else if (
                  textMeta &&
                  (textMeta.artifactKind === "boot_txt_v0" ||
                    textMeta.artifactKind === "jrmemo_txt_v0")
                ) {
                  setImportMode("native_text");
                  setNativeTextMeta(textMeta);
                  setNativeTextEncoding(encodingLabel);
                  setNativeTextLines(splitNativeTextLinesV0(text));
                  setParsed(null);
                  setProbe(null);
                } else if (textMeta?.artifactKind === "twl_slot_txt_v0") {
                  if (looksLikeTwlSlotTextSerializationV0(u8)) {
                    setImportMode("native_text");
                    setNativeTextMeta(textMeta);
                    setNativeTextEncoding(encodingLabel);
                    setNativeTextLines(splitNativeTextLinesV0(text));
                    setParsed(null);
                    setProbe(null);
                  } else {
                    setImportMode("native_blocked");
                    setBlockedMessage(
                      "この .twl は ComJR 系の VB 風テキスト（#TRUE# / #FALSE#）として検出できませんでした。別形式の可能性があります。"
                    );
                    setBlockedHexPreview(formatUint8HeadHexV0(u8, 64));
                    setNativeTextMeta(null);
                    setNativeTextLines([]);
                    setNativeTextEncoding(encodingLabel);
                    setParsed(null);
                    setProbe(null);
                  }
                } else if (
                  textMeta &&
                  (textMeta.artifactKind === "dtld_txt_v0" ||
                    textMeta.artifactKind === "bptn_txt_v0" ||
                    textMeta.artifactKind === "poor_txt_v0")
                ) {
                  const blobInf = inferNativeFloatBlobArtifactFromFilename(f.name);
                  let tookFloatBlob = false;
                  if (
                    blobInf?.artifactKind === "dtld_float32_blob_v0" &&
                    looksLikeDtldPackedNativeV0(u8)
                  ) {
                    const parsed = parseDtldPackedNativeFileV0(u8);
                    if (parsed) {
                      tookFloatBlob = true;
                      setImportMode("float_blob");
                      setFloatBlobPreview({ infer: blobInf, dtld: parsed, floats: parsed.floats });
                      setNativeTextMeta(null);
                      setNativeTextLines([]);
                      setNativeTextEncoding(encodingLabel);
                      setParsed(null);
                      setProbe(null);
                    }
                  } else if (
                    blobInf &&
                    (blobInf.artifactKind === "bptn_float32_blob_v0" ||
                      blobInf.artifactKind === "poor_float32_blob_v0") &&
                    looksLikeBptnPoorFloat32ScoresBlobV0(u8)
                  ) {
                    const floats = parseNativeFloat32BlobFileV0(u8);
                    if (floats && floats.length > 0) {
                      tookFloatBlob = true;
                      setImportMode("float_blob");
                      setFloatBlobPreview({ infer: blobInf, dtld: null, floats });
                      setNativeTextMeta(null);
                      setNativeTextLines([]);
                      setNativeTextEncoding(encodingLabel);
                      setParsed(null);
                      setProbe(null);
                    }
                  }
                  if (!tookFloatBlob) {
                    if (bufferLooksLikeLineOrientedTextLogV0(u8)) {
                      setImportMode("native_text");
                      setNativeTextMeta(textMeta);
                      setNativeTextEncoding(encodingLabel);
                      setNativeTextLines(splitNativeTextLinesV0(text));
                      setParsed(null);
                      setProbe(null);
                    } else {
                      setImportMode("native_blocked");
                      setBlockedMessage(
                        "このファイルは行として読めるテキストではない可能性が高いです（バイナリ）。Dtld/Bptn/Poor の行取り込みは出しません。"
                      );
                      setBlockedHexPreview(formatUint8HeadHexV0(u8, 64));
                      setNativeTextMeta(null);
                      setNativeTextLines([]);
                      setNativeTextEncoding(encodingLabel);
                      setParsed(null);
                      setProbe(null);
                    }
                  }
                } else if (textMeta?.artifactKind === "past_txt_v0") {
                  setImportMode("native_blocked");
                  setBlockedMessage(
                    "Past.log ですが、想定の 50 バイト固定レコードとして読めませんでした。"
                  );
                  setBlockedHexPreview(formatUint8HeadHexV0(u8, 64));
                  setNativeTextMeta(null);
                  setNativeTextLines([]);
                  setNativeTextEncoding(encodingLabel);
                  setParsed(null);
                  setProbe(null);
                } else {
                  setImportMode("text");
                  setNativeTextLines([]);
                  setNativeTextMeta(null);
                  setNativeTextEncoding("");
                  setParsed(parseTimeLogStubFileTextV1(text));
                  setProbe(probeTimeLogTextV0(text));
                }
              }
            });
          }}
        />
      </div>
      {importMode === "binary" ? (
        <div className="space-y-2 border-t border-zinc-100 pt-2">
          {fileLabel ? (
            <p className="m-0 text-[11px] text-zinc-500">
              ファイル: <span className="font-mono">{fileLabel}</span>
              {" — "}
              <span className="font-medium text-violet-900">{binaryImportSubtitle(fileLabel)}</span>
            </p>
          ) : null}
          {binaryRecs.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={importBusy || !fileLabel}
                className="rounded border border-violet-600 bg-violet-600 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => {
                  if (!fileLabel || binaryRecs.length === 0) return;
                  setImportBusy(true);
                  setImportMsg(null);
                  const binInf = inferNativeBinaryTimeLikeArtifactFromFilename(fileLabel);
                  void replaceImportedTimeBinaryFileV0({
                    sourceFileName: fileLabel,
                    sourceByteLength,
                    timeLogSuffix: binInf?.timeLogSuffix ?? inferTimeLogSuffixFromFilename(fileLabel),
                    binaryArtifactKind: binInf?.artifactKind ?? "time_binary_v0",
                    records: binaryRecs,
                  })
                    .then(({ added }) => {
                      setImportMsg(`IndexedDB に ${added} 件を取り込みました（同一ファイル名は置換）。`);
                      onImported?.();
                    })
                    .catch((e: unknown) => {
                      setImportMsg(
                        e instanceof Error ? e.message : String(e)
                      );
                    })
                    .finally(() => setImportBusy(false));
                }}
              >
                {importBusy ? "取り込み中…" : "この内容を IndexedDB に取り込む"}
              </button>
            </div>
          ) : null}
          {importMsg ? (
            <p
              className={`m-0 text-[11px] ${importMsg.includes("取り込みました") ? "text-emerald-800" : "text-red-700"}`}
              role="status"
            >
              {importMsg}
            </p>
          ) : null}
          {binaryRecs.length === 0 ? (
            <p className="m-0 text-[11px] text-zinc-600">解釈できるレコードがありません。</p>
          ) : (
            <div className="max-h-56 space-y-2 overflow-y-auto">
              {binaryRecs.map((rec, idx) => (
                <div
                  key={`${rec.timeAscii}-${idx}`}
                  className="rounded border border-violet-200 bg-violet-50/60 px-2 py-1.5 text-[10px] text-zinc-800"
                >
                  <p className="m-0 font-medium text-violet-950">
                    レコード {idx + 1}
                    {rec.truncated ? "（末尾 EOF で切れ）" : ""}
                  </p>
                  <p className="m-0 mt-0.5 font-mono">
                    時刻 {rec.timeAscii} · 日付1 {rec.dateAscii} · clock {rec.clockAscii} · int1{" "}
                    {rec.int32}
                  </p>
                  <p className="m-0 mt-0.5 break-all text-zinc-700">
                    float1×9: {rec.floats1.map((x) => x.toFixed(3)).join(", ")}
                  </p>
                  {rec.floats2.length > 0 ? (
                    <p className="m-0 mt-0.5 font-mono text-zinc-700">
                      日付2 {rec.dateAscii2} · int2 {rec.int322}
                    </p>
                  ) : null}
                  {rec.floats2.length > 0 ? (
                    <p className="m-0 mt-0.5 break-all text-zinc-600">
                      float2×9: {rec.floats2.map((x) => x.toFixed(3)).join(", ")}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : importMode === "past_binary" ? (
        <div className="space-y-2 border-t border-zinc-100 pt-2">
          {fileLabel ? (
            <p className="m-0 text-[11px] text-zinc-500">
              ファイル: <span className="font-mono">{fileLabel}</span>
              {" — "}
              <span className="font-medium text-amber-900">Past.log バイナリ（50B V0）</span>
            </p>
          ) : null}
          <p className="m-0 text-[11px] text-zinc-700">
            レコード数:{" "}
            <span className="font-semibold tabular-nums">{pastBinaryRecs.length}</span>
          </p>
          {pastBinaryRecs.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={importBusy || !fileLabel}
                className="rounded border border-amber-700 bg-amber-700 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => {
                  if (!fileLabel || pastBinaryRecs.length === 0) return;
                  setImportBusy(true);
                  setImportMsg(null);
                  void replaceImportedPastBinaryFileV0({
                    sourceFileName: fileLabel,
                    sourceByteLength,
                    records: pastBinaryRecs,
                  })
                    .then(({ added }) => {
                      setImportMsg(`IndexedDB に ${added} 件を取り込みました（同一ファイル名は置換）。`);
                      onImported?.();
                    })
                    .catch((e: unknown) => {
                      setImportMsg(e instanceof Error ? e.message : String(e));
                    })
                    .finally(() => setImportBusy(false));
                }}
              >
                {importBusy ? "取り込み中…" : "この内容を IndexedDB に取り込む"}
              </button>
            </div>
          ) : null}
          {importMsg ? (
            <p
              className={`m-0 text-[11px] ${importMsg.includes("取り込みました") ? "text-emerald-800" : "text-red-700"}`}
              role="status"
            >
              {importMsg}
            </p>
          ) : null}
          {pastBinaryRecs.length === 0 ? (
            <p className="m-0 text-[11px] text-zinc-600">解釈できる Past レコードがありません。</p>
          ) : (
            <div className="max-h-48 space-y-1 overflow-y-auto">
              {pastBinaryRecs.slice(0, 25).map((rec, idx) => (
                <div
                  key={`${rec.dateAscii}-${idx}`}
                  className="rounded border border-amber-200 bg-amber-50/70 px-2 py-1 font-mono text-[10px] text-zinc-800"
                >
                  #{idx + 1} · 日付 {rec.dateAscii} · float {rec.valueF32.toFixed(3)} · int32{" "}
                  {rec.valueI32}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : importMode === "float_blob" && floatBlobPreview ? (
        <div className="space-y-2 border-t border-teal-100 pt-2">
          {fileLabel ? (
            <p className="m-0 text-[11px] text-zinc-500">
              ファイル: <span className="font-mono">{fileLabel}</span>
              {" — "}
              <span className="font-medium text-teal-900">
                {floatBlobPreview.infer.artifactKind === "dtld_float32_blob_v0"
                  ? "Dtld（ヘッダ＋float32）"
                  : floatBlobPreview.infer.artifactKind === "bptn_float32_blob_v0"
                    ? "Bptn（float32 列）"
                    : "Poor（float32 列）"}
                {floatBlobPreview.infer.timeLogSuffix
                  ? ` · ${floatBlobPreview.infer.timeLogSuffix}`
                  : ""}
              </span>
            </p>
          ) : null}
          {floatBlobPreview.dtld ? (
            <p className="m-0 text-[11px] text-zinc-700">
              ヘッダ {floatBlobPreview.dtld.headerByteLength} B · 末尾パディング{" "}
              {floatBlobPreview.dtld.trailerByteLength} B
            </p>
          ) : null}
          {floatBlobPreview.dtld ? (
            <p className="m-0 max-h-16 overflow-y-auto break-all font-mono text-[10px] text-zinc-800">
              {floatBlobPreview.dtld.headerLabel.slice(0, 400)}
              {floatBlobPreview.dtld.headerLabel.length > 400 ? "…" : ""}
            </p>
          ) : null}
          <p className="m-0 text-[11px] text-zinc-700">
            float 要素数:{" "}
            <span className="font-semibold tabular-nums">{floatBlobPreview.floats.length}</span>
            {" · 先頭 "}
            {Math.min(12, floatBlobPreview.floats.length)} 件:{" "}
            <span className="font-mono">
              {Array.from(floatBlobPreview.floats.subarray(0, Math.min(12, floatBlobPreview.floats.length)))
                .map((x) => x.toFixed(3))
                .join(", ")}
            </span>
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={importBusy || !fileLabel}
              className="rounded border border-teal-700 bg-teal-700 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => {
                if (!fileLabel || !floatBlobPreview) return;
                setImportBusy(true);
                setImportMsg(null);
                void replaceImportedFloat32BlobFileV0({
                  sourceFileName: fileLabel,
                  sourceByteLength,
                  artifactKind: floatBlobPreview.infer.artifactKind,
                  timeLogSuffix: floatBlobPreview.infer.timeLogSuffix,
                  headerLabel: floatBlobPreview.dtld?.headerLabel ?? null,
                  floats: floatBlobPreview.floats,
                })
                  .then(({ added }) => {
                    setImportMsg(`IndexedDB に ${added} 件（1 ファイル＝1 レコード）を取り込みました。`);
                    onImported?.();
                  })
                  .catch((e: unknown) => {
                    setImportMsg(e instanceof Error ? e.message : String(e));
                  })
                  .finally(() => setImportBusy(false));
              }}
            >
              {importBusy ? "取り込み中…" : "この内容を IndexedDB に取り込む"}
            </button>
          </div>
          {importMsg ? (
            <p
              className={`m-0 text-[11px] ${importMsg.includes("取り込みました") ? "text-emerald-800" : "text-red-700"}`}
              role="status"
            >
              {importMsg}
            </p>
          ) : null}
        </div>
      ) : importMode === "native_blocked" ? (
        <div className="space-y-2 border-t border-rose-100 pt-2">
          {fileLabel ? (
            <p className="m-0 text-[11px] text-zinc-500">
              ファイル: <span className="font-mono">{fileLabel}</span>
            </p>
          ) : null}
          <p className="m-0 text-[11px] font-medium text-rose-900" role="alert">
            {blockedMessage ?? "この取り込み経路は利用できません。"}
          </p>
          {blockedHexPreview ? (
            <details className="rounded border border-rose-200 bg-rose-50/80 px-2 py-1.5">
              <summary className="cursor-pointer text-[11px] text-rose-950">
                先頭 64 バイト（hex）
              </summary>
              <pre className="m-0 mt-1 max-h-24 overflow-auto whitespace-pre-wrap break-all font-mono text-[10px] text-zinc-800">
                {blockedHexPreview}
              </pre>
            </details>
          ) : null}
        </div>
      ) : importMode === "native_text" && nativeTextMeta ? (
        <div className="space-y-2 border-t border-zinc-100 pt-2">
          {fileLabel ? (
            <p className="m-0 text-[11px] text-zinc-500">
              ファイル: <span className="font-mono">{fileLabel}</span>
              {" — "}
              <span className="font-medium text-sky-900">
                {nativeTextImportTitle(nativeTextMeta)}
              </span>
              {" · 解読 "}
              <span className="font-mono">{nativeTextEncoding}</span>
            </p>
          ) : null}
          <p className="m-0 text-[11px] text-zinc-700">
            非空行:{" "}
            <span className="font-semibold tabular-nums">{nativeTextLines.length}</span>
            {" · "}
            行内に <span className="font-mono">yyyy/mm/dd</span> があるときはタイムラインの並びに利用（
            <code className="rounded bg-zinc-200 px-1">nativeTextArtifactV0</code>）。
          </p>
          {nativeTextLines.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={importBusy || !fileLabel}
                className="rounded border border-sky-700 bg-sky-700 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => {
                  if (!fileLabel || !nativeTextMeta || nativeTextLines.length === 0) return;
                  setImportBusy(true);
                  setImportMsg(null);
                  void replaceImportedNativeTextFileV0({
                    sourceFileName: fileLabel,
                    sourceByteLength,
                    artifactKind: nativeTextMeta.artifactKind,
                    timeLogSuffix: nativeTextMeta.timeLogSuffix,
                    lines: nativeTextLines,
                  })
                    .then(({ added }) => {
                      setImportMsg(`IndexedDB に ${added} 行を取り込みました（同一ファイル名は置換）。`);
                      onImported?.();
                    })
                    .catch((e: unknown) => {
                      setImportMsg(e instanceof Error ? e.message : String(e));
                    })
                    .finally(() => setImportBusy(false));
                }}
              >
                {importBusy ? "取り込み中…" : "この内容を IndexedDB に取り込む"}
              </button>
            </div>
          ) : null}
          {importMsg ? (
            <p
              className={`m-0 text-[11px] ${importMsg.includes("取り込みました") ? "text-emerald-800" : "text-red-700"}`}
              role="status"
            >
              {importMsg}
            </p>
          ) : null}
          {nativeTextLines.length === 0 ? (
            <p className="m-0 text-[11px] text-zinc-600">空ファイル、または解釈できる行がありません。</p>
          ) : (
            <ul className="m-0 max-h-48 list-none space-y-1 overflow-y-auto p-0 font-mono text-[10px] text-zinc-800">
              {nativeTextLines.slice(0, MAX_NATIVE_TEXT_PREVIEW).map((line, i) => (
                <li key={i} className="truncate border-b border-zinc-100 py-0.5" title={line}>
                  <span className="text-zinc-500">{i + 1}.</span> {line}
                </li>
              ))}
            </ul>
          )}
          {nativeTextLines.length > MAX_NATIVE_TEXT_PREVIEW ? (
            <p className="m-0 text-[10px] text-zinc-500">
              先頭 {MAX_NATIVE_TEXT_PREVIEW} 行のみ表示。
            </p>
          ) : null}
        </div>
      ) : importMode === "text" && parsed && probe ? (
        <div className="space-y-2 border-t border-zinc-100 pt-2">
          {fileLabel ? (
            <p className="m-0 text-[11px] text-zinc-500">
              ファイル: <span className="font-mono">{fileLabel}</span>
              {" — "}
              <span className="font-medium text-zinc-700">テキスト</span>
            </p>
          ) : null}
          <p className="m-0 text-[11px] text-zinc-700">
            解釈できた行: <span className="font-semibold tabular-nums">{parsed.rows.length}</span>
            {" · "}
            スキップ/注意:{" "}
            <span className="font-semibold tabular-nums">{parsed.issues.length}</span>
          </p>
          {parsed.issues.length > 0 ? (
            <details className="rounded border border-amber-200 bg-amber-50/80 px-2 py-1.5">
              <summary className="cursor-pointer text-amber-950">
                スキップ行のメッセージ（最大 {MAX_ISSUES_SHOWN} 件）
              </summary>
              <ul className="mt-1 max-h-32 list-disc space-y-0.5 overflow-y-auto pl-4 text-[10px] text-amber-900">
                {parsed.issues.slice(0, MAX_ISSUES_SHOWN).map((msg, i) => (
                  <li key={i}>{msg}</li>
                ))}
              </ul>
            </details>
          ) : null}
          <div className="rounded border border-zinc-200 bg-zinc-50/80 px-2 py-1.5 text-[11px] text-zinc-700">
            <span className="font-medium">行分類（V0）</span>
            {" — "}
            空 {probe.counts.empty} · # {probe.counts.comment} · WEB_V1 {probe.counts.web_v1} ·
            本家候補(tab) {probe.counts.native_candidate_tab} · 未分類 {probe.counts.native_unknown}
          </div>
          {probe.lines.filter((l) => l.kind === "native_candidate_tab").length > 0 ? (
            <div className="max-h-40 overflow-auto rounded border border-emerald-200 bg-emerald-50/40">
              <p className="m-0 border-b border-emerald-200/80 px-2 py-1 text-[10px] font-medium text-emerald-950">
                本家候補（先頭セルが yyyy/mm/dd 形・タブ≥2）— 未検証
              </p>
              <table className="w-full border-collapse text-left text-[10px]">
                <thead className="sticky top-0 bg-emerald-100/90 text-emerald-950">
                  <tr>
                    <th className="border-b border-emerald-200 px-1.5 py-1 font-medium">行</th>
                    <th className="border-b border-emerald-200 px-1.5 py-1 font-medium">列0…</th>
                  </tr>
                </thead>
                <tbody>
                  {probe.lines
                    .filter((l) => l.kind === "native_candidate_tab")
                    .slice(0, MAX_NATIVE_ROWS)
                    .map((l) => (
                      <tr key={l.lineIndex1} className="border-b border-emerald-100">
                        <td className="whitespace-nowrap px-1.5 py-0.5 font-mono text-zinc-600">
                          {l.lineIndex1}
                        </td>
                        <td className="px-1.5 py-0.5 font-mono text-[9px] text-zinc-800">
                          {(l.cells ?? []).join(" │ ")}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : null}
          {probe.lines.filter((l) => l.kind === "native_unknown").length > 0 ? (
            <details className="rounded border border-zinc-200 bg-zinc-50 px-2 py-1.5">
              <summary className="cursor-pointer text-[11px] font-medium text-zinc-800">
                未分類行（先頭 {MAX_NATIVE_UNKNOWN} 件の抜粋）
              </summary>
              <ul className="mt-1 max-h-28 list-none space-y-0.5 overflow-y-auto p-0 font-mono text-[9px] text-zinc-600">
                {probe.lines
                  .filter((l) => l.kind === "native_unknown")
                  .slice(0, MAX_NATIVE_UNKNOWN)
                  .map((l: TimeLogLineProbeV0) => (
                    <li key={l.lineIndex1} className="truncate" title={l.raw}>
                      L{l.lineIndex1}: {l.raw.trim().slice(0, 120)}
                    </li>
                  ))}
              </ul>
            </details>
          ) : null}
          {parsed.rows.length > 0 ? (
            <div className="max-h-48 overflow-auto rounded border border-zinc-200">
              <table className="w-full border-collapse text-left text-[10px]">
                <thead className="sticky top-0 bg-zinc-100 text-zinc-700">
                  <tr>
                    <th className="border-b border-zinc-200 px-1.5 py-1 font-medium">savedAt</th>
                    <th className="border-b border-zinc-200 px-1.5 py-1 font-medium">sfx</th>
                    <th className="border-b border-zinc-200 px-1.5 py-1 font-medium">秒</th>
                    <th className="border-b border-zinc-200 px-1.5 py-1 font-medium">級</th>
                    <th className="border-b border-zinc-200 px-1.5 py-1 font-medium">Miss</th>
                  </tr>
                </thead>
                <tbody>
                  {parsed.rows.map((r) => (
                    <tr key={`${r.id}-${r.savedAt}`} className="border-b border-zinc-100">
                      <td className="whitespace-nowrap px-1.5 py-0.5 font-mono text-zinc-600">
                        {r.savedAt}
                      </td>
                      <td className="px-1.5 py-0.5">{r.suffix}</td>
                      <td className="tabular-nums px-1.5 py-0.5">{r.elapsedSec}</td>
                      <td className="px-1.5 py-0.5">{r.module1Label || "—"}</td>
                      <td className="tabular-nums px-1.5 py-0.5">{r.missCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
