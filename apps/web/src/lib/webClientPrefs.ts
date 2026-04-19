/**
 * Phase C — lightweight client-only preferences (not official TWJR format).
 * Keys are namespaced; values are JSON-serializable.
 */

const PREFIX = "typewell-jr-web-ui-prefs-v0:";

function safeParse<T>(raw: string | null, fallback: T): T {
  if (raw == null || raw === "") return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function loadPref<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  return safeParse(window.localStorage.getItem(PREFIX + key), fallback);
}

export function savePref<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
}

export type RomanPrefsV0 = {
  /** 大きめフォントでローマ字を見せる意図のスライダー値 0.8–1.4 */
  fontScale: number;
  /** ひらがな併記のイメージ（本家 frmSetting の一部） */
  showFuriganaHint: boolean;
};

export const DEFAULT_ROMAN_PREFS: RomanPrefsV0 = {
  fontScale: 1,
  showFuriganaHint: true,
};

export type IndicatorPrefsV0 = {
  showGoalPacing: boolean;
  barOpacity: number;
};

export const DEFAULT_INDICATOR_PREFS: IndicatorPrefsV0 = {
  showGoalPacing: true,
  barOpacity: 0.85,
};

export type MissPrefsV0 = {
  playSound: boolean;
  ceilingStrokes: number;
};

export const DEFAULT_MISS_PREFS: MissPrefsV0 = {
  playSound: true,
  ceilingStrokes: 3,
};

export type ElapsedBandsPrefsV0 = {
  bandMinutes: number[];
};

export const DEFAULT_ELAPSED_BANDS: ElapsedBandsPrefsV0 = {
  bandMinutes: [1, 3, 5, 10, 20],
};

export type WeakWordsPrefsV0 = {
  autoTrack: boolean;
  maxTracked: number;
};

export const DEFAULT_WEAK_WORDS_PREFS: WeakWordsPrefsV0 = {
  autoTrack: false,
  maxTracked: 50,
};

export type KanaByKanaPrefsV0 = {
  practiceKanaRow: string;
};

export const DEFAULT_KANA_BY_KANA: KanaByKanaPrefsV0 = {
  practiceKanaRow: "あいうえお",
};
