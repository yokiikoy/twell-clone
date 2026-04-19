"use client";

import {
  DEFAULT_ELAPSED_BANDS,
  DEFAULT_INDICATOR_PREFS,
  DEFAULT_KANA_BY_KANA,
  DEFAULT_MISS_PREFS,
  DEFAULT_ROMAN_PREFS,
  DEFAULT_WEAK_WORDS_PREFS,
  loadPref,
  savePref,
  type ElapsedBandsPrefsV0,
  type IndicatorPrefsV0,
  type KanaByKanaPrefsV0,
  type MissPrefsV0,
  type RomanPrefsV0,
  type WeakWordsPrefsV0,
} from "@/lib/webClientPrefs";
import { useEffect, useId, useState } from "react";

export function RomanSettingsPanel() {
  const [v, setV] = useState<RomanPrefsV0>(DEFAULT_ROMAN_PREFS);
  useEffect(() => setV(loadPref("roman", DEFAULT_ROMAN_PREFS)), []);
  const idScale = useId();
  const idFuri = useId();
  return (
    <div className="space-y-4 text-sm text-zinc-800">
      <p className="text-xs text-zinc-600">
        本家 <code className="rounded bg-zinc-200 px-1">frmSetting</code>{" "}
        のローマ字表示まわりの<strong>クライアントのみの下書き</strong>です。試行エンジンとは未結線です。
      </p>
      <div>
        <label htmlFor={idScale} className="block text-xs font-medium text-zinc-600">
          表示スケール（プレースホルダ）
        </label>
        <input
          id={idScale}
          type="range"
          min={0.8}
          max={1.4}
          step={0.05}
          value={v.fontScale}
          onChange={(e) => {
            const next = { ...v, fontScale: Number(e.target.value) };
            setV(next);
            savePref("roman", next);
          }}
          className="mt-1 w-full"
        />
        <span className="text-xs tabular-nums text-zinc-500">{v.fontScale.toFixed(2)}×</span>
      </div>
      <div className="flex items-center gap-2">
        <input
          id={idFuri}
          type="checkbox"
          checked={v.showFuriganaHint}
          onChange={(e) => {
            const next = { ...v, showFuriganaHint: e.target.checked };
            setV(next);
            savePref("roman", next);
          }}
        />
        <label htmlFor={idFuri} className="text-sm">
          ひらがな併記ヒント（UI のみ）
        </label>
      </div>
    </div>
  );
}

export function IndicatorSettingsPanel() {
  const [v, setV] = useState<IndicatorPrefsV0>(DEFAULT_INDICATOR_PREFS);
  useEffect(() => setV(loadPref("indicator", DEFAULT_INDICATOR_PREFS)), []);
  const id = useId();
  return (
    <div className="space-y-4 text-sm text-zinc-800">
      <p className="text-xs text-zinc-600">
        目標インジケータ（経過ペース）の<strong>表示フラグの下書き</strong>。{" "}
        <code className="rounded bg-zinc-200 px-1">TypingCanvas</code> への反映は未配線です。
      </p>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="checkbox"
          checked={v.showGoalPacing}
          onChange={(e) => {
            const next = { ...v, showGoalPacing: e.target.checked };
            setV(next);
            savePref("indicator", next);
          }}
        />
        <label htmlFor={id}>目標ペース帯を表示する（意図）</label>
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-600">帯の不透明度</label>
        <input
          type="range"
          min={0.3}
          max={1}
          step={0.05}
          value={v.barOpacity}
          onChange={(e) => {
            const next = { ...v, barOpacity: Number(e.target.value) };
            setV(next);
            savePref("indicator", next);
          }}
          className="mt-1 w-full"
        />
      </div>
    </div>
  );
}

export function MissSoundSettingsPanel() {
  const [v, setV] = useState<MissPrefsV0>(DEFAULT_MISS_PREFS);
  useEffect(() => setV(loadPref("miss", DEFAULT_MISS_PREFS)), []);
  const idSound = useId();
  return (
    <div className="space-y-4 text-sm text-zinc-800">
      <p className="text-xs text-zinc-600">ミス音・ミス上限の<strong>クライアント設定の雛形</strong>（音声ファイルは未同梱）。</p>
      <div className="flex items-center gap-2">
        <input
          id={idSound}
          type="checkbox"
          checked={v.playSound}
          onChange={(e) => {
            const next = { ...v, playSound: e.target.checked };
            setV(next);
            savePref("miss", next);
          }}
        />
        <label htmlFor={idSound}>ミス時に音を鳴らす（予定）</label>
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-600">ミス許容（ストローク上限のイメージ）</label>
        <input
          type="number"
          min={0}
          max={20}
          value={v.ceilingStrokes}
          onChange={(e) => {
            const next = { ...v, ceilingStrokes: Number(e.target.value) || 0 };
            setV(next);
            savePref("miss", next);
          }}
          className="mt-1 w-24 rounded border border-zinc-300 px-2 py-1"
        />
      </div>
    </div>
  );
}

export function ElapsedBandsSettingsPanel() {
  const [v, setV] = useState<ElapsedBandsPrefsV0>(DEFAULT_ELAPSED_BANDS);
  useEffect(() => setV(loadPref("elapsedBands", DEFAULT_ELAPSED_BANDS)), []);
  const raw = v.bandMinutes.join(", ");
  return (
    <div className="space-y-3 text-sm text-zinc-800">
      <p className="text-xs text-zinc-600">
        経過時間帯（分）をカンマ区切りで保持するプレースホルダ。本家の境界値とは未一致です。
      </p>
      <input
        type="text"
        className="w-full rounded border border-zinc-300 px-2 py-1 font-mono text-xs"
        value={raw}
        onChange={(e) => {
          const parts = e.target.value
            .split(/[\s,]+/)
            .map((s) => parseInt(s, 10))
            .filter((n) => Number.isFinite(n) && n > 0);
          const next = { bandMinutes: parts.length ? parts : DEFAULT_ELAPSED_BANDS.bandMinutes };
          setV(next);
          savePref("elapsedBands", next);
        }}
      />
    </div>
  );
}

export function WeakWordsSettingsPanel() {
  const [v, setV] = useState<WeakWordsPrefsV0>(DEFAULT_WEAK_WORDS_PREFS);
  useEffect(() => setV(loadPref("weakWords", DEFAULT_WEAK_WORDS_PREFS)), []);
  const id = useId();
  return (
    <div className="space-y-4 text-sm text-zinc-800">
      <p className="text-xs text-zinc-600">苦手語の自動追跡は<strong>未接続</strong>。将来の API 用フラグのみ保存します。</p>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="checkbox"
          checked={v.autoTrack}
          onChange={(e) => {
            const next = { ...v, autoTrack: e.target.checked };
            setV(next);
            savePref("weakWords", next);
          }}
        />
        <label htmlFor={id}>試行から苦手候補を自動収集する（予定）</label>
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-600">保持上限（語数イメージ）</label>
        <input
          type="number"
          min={5}
          max={500}
          value={v.maxTracked}
          onChange={(e) => {
            const next = { ...v, maxTracked: Number(e.target.value) || 50 };
            setV(next);
            savePref("weakWords", next);
          }}
          className="mt-1 w-24 rounded border border-zinc-300 px-2 py-1"
        />
      </div>
    </div>
  );
}

export function KanaByKanaSettingsPanel() {
  const [v, setV] = useState<KanaByKanaPrefsV0>(DEFAULT_KANA_BY_KANA);
  useEffect(() => setV(loadPref("kanaByKana", DEFAULT_KANA_BY_KANA)), []);
  return (
    <div className="space-y-3 text-sm text-zinc-800">
      <p className="text-xs text-zinc-600">
        カナ行の練習対象（文字列のメモ）。本家の語出しロジックとは未接続です。
      </p>
      <textarea
        rows={2}
        className="w-full rounded border border-zinc-300 px-2 py-1 font-mono text-xs"
        value={v.practiceKanaRow}
        onChange={(e) => {
          const next = { practiceKanaRow: e.target.value.slice(0, 120) };
          setV(next);
          savePref("kanaByKana", next);
        }}
      />
    </div>
  );
}
