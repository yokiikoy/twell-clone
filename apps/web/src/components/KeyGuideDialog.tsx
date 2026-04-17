"use client";

import { useEffect } from "react";

export function KeyGuideDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="key-guide-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="max-h-[85vh] w-full max-w-lg overflow-auto rounded-lg border border-zinc-600 bg-zinc-900 p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <h2
            id="key-guide-title"
            className="text-lg font-semibold text-zinc-100"
          >
            キーのガイド
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-zinc-600 px-2 py-1 text-sm text-zinc-300 hover:bg-zinc-800"
          >
            閉じる
          </button>
        </div>
        <p className="mt-3 text-sm text-zinc-400">
          本家 <code className="rounded bg-zinc-800 px-1">KeyGuid.frm</code>{" "}
          に相当。ローマ字配列・色分けなどは今後ここへ移植します（現状プレースホルダ）。
        </p>
        <p className="mt-4 text-xs text-zinc-500">
          05 <code>mnuGuid_Click</code>: KeyGuid の表示トグル。Esc
          でも閉じられます。
        </p>
      </div>
    </div>
  );
}
