"use client";

import {
  buildTrialSurfaceLine,
  buildTrialSurfaceLineMerged,
  createStrokeTrialEngine,
  jouTriplesToWordEntries,
  MERGED_WEIGHTS_KANJI,
  MERGED_WEIGHTS_KATAKANA,
  MERGED_WEIGHTS_KIHON,
  MERGED_WEIGHTS_KANYOKU,
  mulberry32,
  type GameMode,
  type JouTripleRow,
  type MergedSurfaceLineWeightSpec,
  type StrokeTrialEngine,
  type StrokeTrialRenderState,
  type WordEntry,
} from "@typewell-jr/engine";
import { keyboard, rule, type Automaton, type InputEvent, type KeyboardLayout } from "emiel";
import { activateCompat } from "../lib/emielActivateCompat";
/** 語末「ん」→語間 Space: 400 打鍵・`nn`/`xn` 整合はラッパー側コメント参照 */
import { inputWithNnBeforeSpaceIfNeeded } from "../lib/emielNsSpaceAssist";
import {
  Module1ChartLadderRow,
  PracticeSettingsStubHub,
  TrialDeckHeading,
  TrialStatusStrip,
  type TrialRunPhase,
} from "./TrialTypewellChrome";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";

/** 国語Ｒ Web 版: 確定ストローク数（emiel `finishedStroke.length`） */
const TRIAL_STROKES = 400;

const COUNTDOWN_SECONDS = 3;
const LAP_STROKE_INTERVAL = 50;

/** ラップ一覧枠。控えめな固定高さで縦位置の跳ねを抑えつつ余白を詰める */
const TYPING_STATS_LAPS_BOX_CLASS =
  "flex h-[3.75rem] shrink-0 flex-col overflow-hidden rounded border border-zinc-200 bg-zinc-100 px-2.5 py-1.5 text-xs leading-snug text-zinc-600";

const STROKE_TRIAL_RESET = {
  trialStrokeCount: TRIAL_STROKES,
  goalLevelId: "J",
  scoringProfile: "twelljr" as const,
};

/** 内容高に追従（上限まで）。長いときは枠全体がスクロール。短い語列で点線枠下に空きを作らない */
const TRIAL_VIEWPORT_CLASS =
  "flex min-h-[7.5rem] max-h-[min(48vh,480px)] shrink-0 flex-col overflow-y-auto rounded border border-zinc-200 bg-white p-2.5 shadow-sm";

/** `finishedWord` 長は emiel ターゲット（`typingKana` 連結＋語間スペース）に対応 */
function wordIndexFromTypingProgress(
  segments: readonly WordEntry[],
  finishedJpLen: number
): number {
  let offset = 0;
  for (let wi = 0; wi < segments.length; wi++) {
    const len = segments[wi]!.typingKana.length;
    const end = offset + len;
    if (finishedJpLen < end) return wi;
    offset = end + 1;
  }
  return Math.max(0, segments.length - 1);
}

type DeckId =
  | "jou1"
  | "jou2"
  | "jou3"
  | "kan1"
  | "kan2"
  | "kan3"
  | "kata1"
  | "kata2"
  | "kata3"
  | "koto1"
  | "koto2";

type DeckSpec = {
  url: string;
  mode: GameMode;
  caption: string;
  surfaceHint: string;
  group: string;
};

const DECKS: Record<DeckId, DeckSpec> = {
  jou1: {
    url: "/twelljr-jou1.json",
    mode: "kihon",
    caption: "Jou1 常用",
    surfaceHint: "表層（ひらがな・語の間はスペース）",
    group: "基本常用",
  },
  jou2: {
    url: "/twelljr-jou2.json",
    mode: "kihon",
    caption: "Jou2 常用",
    surfaceHint: "表層（ひらがな・語の間はスペース）",
    group: "基本常用",
  },
  jou3: {
    url: "/twelljr-jou3.json",
    mode: "kihon",
    caption: "Jou3 常用",
    surfaceHint: "表層（ひらがな・語の間はスペース）",
    group: "基本常用",
  },
  kan1: {
    url: "/twelljr-kan1.json",
    mode: "kanji",
    caption: "Kan1 漢字",
    surfaceHint: "表層（漢字・語の間はスペース）",
    group: "漢字",
  },
  kan2: {
    url: "/twelljr-kan2.json",
    mode: "kanji",
    caption: "Kan2 漢字",
    surfaceHint: "表層（漢字・語の間はスペース）",
    group: "漢字",
  },
  kan3: {
    url: "/twelljr-kan3.json",
    mode: "kanji",
    caption: "Kan3 漢字",
    surfaceHint: "表層（漢字・語の間はスペース）",
    group: "漢字",
  },
  kata1: {
    url: "/twelljr-kata1.json",
    mode: "katakana",
    caption: "Kata1 カタカナ",
    surfaceHint: "表層（カタカナ・語の間はスペース）",
    group: "カタカナ",
  },
  kata2: {
    url: "/twelljr-kata2.json",
    mode: "katakana",
    caption: "Kata2 カタカナ",
    surfaceHint: "表層（カタカナ・語の間はスペース）",
    group: "カタカナ",
  },
  kata3: {
    url: "/twelljr-kata3.json",
    mode: "katakana",
    caption: "Kata3 カタカナ",
    surfaceHint: "表層（カタカナ・語の間はスペース）",
    group: "カタカナ",
  },
  koto1: {
    url: "/twelljr-koto1.json",
    mode: "kanyoku",
    caption: "Koto1 慣用",
    surfaceHint: "表層（慣用句・語の間はスペース）",
    group: "慣用",
  },
  koto2: {
    url: "/twelljr-koto2.json",
    mode: "kanyoku",
    caption: "Koto2 慣用",
    surfaceHint: "表層（慣用句・語の間はスペース）",
    group: "慣用",
  },
};

const DECK_IDS = Object.keys(DECKS) as DeckId[];

type MergedContentTab = "kihon" | "katakana" | "kanji" | "kanyoku";

type DeckPickerView = "merged" | "single";

const MERGED_SPECS: Record<
  MergedContentTab,
  {
    tabLabel: string;
    caption: string;
    group: string;
    surfaceHint: string;
    mode: GameMode;
    weights: MergedSurfaceLineWeightSpec;
    sources: readonly { url: string; deck: 1 | 2 | 3 }[];
  }
> = {
  kihon: {
    tabLabel: "常用",
    caption: "Jou1–3 合成（Deck 比率 約 2:2:1）",
    group: "基本常用 · 合成",
    surfaceHint: "表層（ひらがな・語の間はスペース）",
    mode: "kihon",
    weights: { kind: "three", weights: MERGED_WEIGHTS_KIHON },
    sources: [
      { url: "/twelljr-jou1.json", deck: 1 },
      { url: "/twelljr-jou2.json", deck: 2 },
      { url: "/twelljr-jou3.json", deck: 3 },
    ],
  },
  katakana: {
    tabLabel: "カタカナ",
    caption: "Kata1–3 合成（約 1:1:1）",
    group: "カタカナ · 合成",
    surfaceHint: "表層（カタカナ・語の間はスペース）",
    mode: "katakana",
    weights: { kind: "three", weights: MERGED_WEIGHTS_KATAKANA },
    sources: [
      { url: "/twelljr-kata1.json", deck: 1 },
      { url: "/twelljr-kata2.json", deck: 2 },
      { url: "/twelljr-kata3.json", deck: 3 },
    ],
  },
  kanji: {
    tabLabel: "漢字",
    caption: "Kan1–3 合成（約 1:1:1）",
    group: "漢字 · 合成",
    surfaceHint: "表層（漢字・語の間はスペース）",
    mode: "kanji",
    weights: { kind: "three", weights: MERGED_WEIGHTS_KANJI },
    sources: [
      { url: "/twelljr-kan1.json", deck: 1 },
      { url: "/twelljr-kan2.json", deck: 2 },
      { url: "/twelljr-kan3.json", deck: 3 },
    ],
  },
  kanyoku: {
    tabLabel: "慣用句",
    caption: "Koto1–2 合成（約 1:1）",
    group: "慣用 · 合成",
    surfaceHint: "表層（慣用句・語の間はスペース）",
    mode: "kanyoku",
    weights: { kind: "two", weights: MERGED_WEIGHTS_KANYOKU },
    sources: [
      { url: "/twelljr-koto1.json", deck: 1 },
      { url: "/twelljr-koto2.json", deck: 2 },
    ],
  },
};

const MERGED_TAB_ORDER: readonly MergedContentTab[] = [
  "kihon",
  "katakana",
  "kanji",
  "kanyoku",
];

/** F1–F4 → 合成タブ（常用・カタカナ・漢字・慣用句） */
const FN_TO_MERGED_TAB: readonly (readonly [string, MergedContentTab])[] = [
  ["F1", "kihon"],
  ["F2", "katakana"],
  ["F3", "kanji"],
  ["F4", "kanyoku"],
];

function groupOrder(a: string, b: string): number {
  const order = ["基本常用", "漢字", "カタカナ", "慣用"];
  return order.indexOf(a) - order.indexOf(b);
}

function decksByGroup(): { group: string; ids: DeckId[] }[] {
  const m = new Map<string, DeckId[]>();
  for (const id of DECK_IDS) {
    const g = DECKS[id].group;
    if (!m.has(g)) m.set(g, []);
    m.get(g)!.push(id);
  }
  return [...m.entries()]
    .sort(([ga], [gb]) => groupOrder(ga, gb))
    .map(([group, ids]) => ({ group, ids }));
}

type RunPhase = TrialRunPhase;

type LapSegment = { stroke: number; segmentMs: number };

function formatSeconds(ms: number): string {
  if (ms < 0 || !Number.isFinite(ms)) return "—";
  return `${(ms / 1000).toFixed(2)}s`;
}

function useAudioClick() {
  const ctxRef = useRef<AudioContext | null>(null);
  return useCallback(() => {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!ctxRef.current) ctxRef.current = new Ctx();
    const ctx = ctxRef.current;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "square";
    o.frequency.value = 880;
    g.gain.value = 0.04;
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.02);
  }, []);
}

/** 破線枠内の本文のみ（外枠・注釈ブロック・結果・進捗は親で固定レイアウト） */
function EmielTrialBody({
  segments,
  automaton,
  trial,
}: {
  segments: WordEntry[];
  automaton: Automaton;
  trial: StrokeTrialRenderState;
}) {
  const { finished } = trial;
  const jpLen = automaton.finishedWord.length;
  const activeSeg = finished ? -1 : wordIndexFromTypingProgress(segments, jpLen);

  const segmentWordClass = (wi: number) =>
    wi === activeSeg
      ? "text-amber-800 underline decoration-amber-600 underline-offset-2"
      : wi < activeSeg || finished
        ? "text-zinc-500"
        : "text-zinc-800";

  const jpFont =
    '"Yu Gothic UI","Yu Gothic",Meiryo,"Hiragino Sans","Hiragino Kaku Gothic ProN",sans-serif';

  const fr = automaton.finishedRoman;
  const pr = automaton.pendingRoman;

  return (
    <div className="flex w-full min-h-0 flex-col justify-start text-sm leading-relaxed text-zinc-900">
      <div className="min-w-0 whitespace-pre-wrap break-words font-sans tracking-normal" style={{ fontFamily: jpFont }}>
        {segments.map((seg, wi) => (
          <span key={`jp-${wi}`}>
            {wi > 0 ? (
              <span className="select-none text-zinc-400" aria-hidden>
                {" "}
              </span>
            ) : null}
            <span className={segmentWordClass(wi)}>{seg.surface}</span>
          </span>
        ))}
      </div>
      <div
        className="mt-1.5 shrink-0 whitespace-pre-wrap break-all font-mono text-[11px] tracking-wide text-zinc-600 sm:text-xs"
        aria-label="emiel オートマトンのローマ字（確定・未確定）"
      >
        <span className="text-emerald-700">{fr}</span>
        {Array.from(pr).map((ch, j) => (
          <span
            key={`pr-${j}`}
            className={
              j === 0 && !finished
                ? "rounded-sm bg-amber-100 px-0.5 text-amber-950 ring-1 ring-amber-500"
                : "text-zinc-600"
            }
          >
            {ch}
          </span>
        ))}
      </div>
      <p className="mb-0 mt-1.5 shrink-0 text-[10px] leading-snug text-zinc-600">
        琥珀枠はオートマトン上の次の 1 文字。BAS の reading 綴りと違うことがありますが、上のかなターゲットに沿った打鍵が正です。
      </p>
    </div>
  );
}

export function TypingCanvas() {
  const autoRef = useRef<Automaton | null>(null);
  const strokeEngRef = useRef<StrokeTrialEngine | null>(null);
  const trialWordsRef = useRef<WordEntry[]>([]);
  const emielTargetLineRef = useRef("");
  const dictionaryRef = useRef<WordEntry[]>([]);
  const modeRef = useRef<GameMode>("kihon");
  const layoutRef = useRef<KeyboardLayout | null>(null);
  const pendingWordsRef = useRef<WordEntry[]>([]);
  const pendingLineRef = useRef("");
  const runPhaseRef = useRef<RunPhase>("loading");
  const lapAnchorMsRef = useRef(0);
  const lapStartedRef = useRef(false);

  const [deck, setDeck] = useState<DeckId>("jou1");
  const [pickerView, setPickerView] = useState<DeckPickerView>("merged");
  const [mergedTab, setMergedTab] = useState<MergedContentTab>("kihon");
  const [layout, setLayout] = useState<KeyboardLayout | null>(null);
  const [trialWords, setTrialWords] = useState<WordEntry[]>([]);
  const [emielTargetLine, setEmielTargetLine] = useState("");
  const [inputEpoch, setInputEpoch] = useState(0);
  const [, forceRender] = useReducer((x: number) => x + 1, 0);
  const [err, setErr] = useState<string | null>(null);
  const [runPhase, setRunPhase] = useState<RunPhase>("loading");
  const [countdownDigit, setCountdownDigit] = useState(3);
  const [laps, setLaps] = useState<LapSegment[]>([]);
  const playClick = useAudioClick();

  trialWordsRef.current = trialWords;
  emielTargetLineRef.current = emielTargetLine;
  layoutRef.current = layout;
  runPhaseRef.current = runPhase;

  const refillPendingTrial = useCallback(() => {
    const dict = dictionaryRef.current;
    if (!dict.length) return;
    const rand = mulberry32(Date.now() % 1_000_000);
    const lay = layoutRef.current ?? undefined;
    if (pickerView === "merged") {
      const spec = MERGED_SPECS[mergedTab];
      const { words: picked, emielTargetLine: line } = buildTrialSurfaceLineMerged(
        dict,
        spec.mode,
        TRIAL_STROKES,
        rand,
        8,
        spec.weights,
        8,
        lay
      );
      pendingWordsRef.current = picked;
      pendingLineRef.current = line;
    } else {
      const mode = modeRef.current;
      const { words: picked, emielTargetLine: line } = buildTrialSurfaceLine(
        dict,
        mode,
        TRIAL_STROKES,
        rand,
        8,
        8,
        lay
      );
      pendingWordsRef.current = picked;
      pendingLineRef.current = line;
    }
  }, [pickerView, mergedTab, layout]);

  const goToLobby = useCallback(
    (opts?: { keepPending?: boolean }) => {
      if (runPhaseRef.current === "loading") return;
      if (!opts?.keepPending) {
        refillPendingTrial();
      }
      setTrialWords([]);
      setEmielTargetLine("");
      trialWordsRef.current = [];
      emielTargetLineRef.current = "";
      autoRef.current = null;
      setLaps([]);
      setCountdownDigit(3);
      setRunPhase("lobby");
      setInputEpoch((n) => n + 1);
    },
    [refillPendingTrial]
  );

  const beginPlaySession = useCallback(() => {
    const words = pendingWordsRef.current;
    const line = pendingLineRef.current;
    if (!words.length || !line) return;
    lapStartedRef.current = false;
    setLaps([]);
    runPhaseRef.current = "playing";
    setRunPhase("playing");
    setTrialWords(words);
    setEmielTargetLine(line);
    trialWordsRef.current = words;
    emielTargetLineRef.current = line;
    setInputEpoch((n) => n + 1);
  }, []);

  /** 待機中: Enter / Space /「スタート」から共通 */
  const startTrialFromLobby = useCallback(() => {
    if (runPhaseRef.current !== "lobby") return;
    if (!pendingLineRef.current || pendingWordsRef.current.length === 0) return;
    setCountdownDigit(COUNTDOWN_SECONDS);
    setRunPhase("countdown");
  }, []);

  useEffect(() => {
    let cancelled = false;
    keyboard
      .detect(window)
      .then((lay) => {
        if (!cancelled) setLayout(lay);
      })
      .catch(() => {
        if (!cancelled) setLayout(keyboard.getQwertyJis());
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (pickerView !== "single") return;
    let cancelled = false;
    (async () => {
      try {
        setErr(null);
        setRunPhase("loading");
        setTrialWords([]);
        setEmielTargetLine("");
        autoRef.current = null;
        const spec = DECKS[deck];
        const res = await fetch(spec.url);
        if (!res.ok) throw new Error(`${spec.url} が読めません`);
        const rows = (await res.json()) as JouTripleRow[];
        if (cancelled) return;
        const words = jouTriplesToWordEntries(rows, spec.mode);
        dictionaryRef.current = words;
        modeRef.current = spec.mode;
        const lay = layoutRef.current ?? undefined;
        const { words: picked, emielTargetLine: line } = buildTrialSurfaceLine(
          words,
          spec.mode,
          TRIAL_STROKES,
          mulberry32(Date.now() % 1_000_000),
          8,
          8,
          lay
        );
        pendingWordsRef.current = picked;
        pendingLineRef.current = line;
        setRunPhase("lobby");
        setInputEpoch((n) => n + 1);
      } catch (e) {
        if (!cancelled) {
          setErr(e instanceof Error ? e.message : String(e));
          setRunPhase("lobby");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pickerView, deck, layout]);

  useEffect(() => {
    if (pickerView !== "merged") return;
    let cancelled = false;
    (async () => {
      try {
        setErr(null);
        setRunPhase("loading");
        setTrialWords([]);
        setEmielTargetLine("");
        autoRef.current = null;
        const spec = MERGED_SPECS[mergedTab];
        const rowsList = await Promise.all(
          spec.sources.map(async (s) => {
            const res = await fetch(s.url);
            if (!res.ok) throw new Error(`${s.url} が読めません`);
            return (await res.json()) as JouTripleRow[];
          })
        );
        if (cancelled) return;
        const words: WordEntry[] = [];
        for (let i = 0; i < spec.sources.length; i++) {
          const s = spec.sources[i]!;
          words.push(
            ...jouTriplesToWordEntries(rowsList[i]!, spec.mode, s.deck)
          );
        }
        dictionaryRef.current = words;
        modeRef.current = spec.mode;
        const lay = layoutRef.current ?? undefined;
        const { words: picked, emielTargetLine: line } = buildTrialSurfaceLineMerged(
          words,
          spec.mode,
          TRIAL_STROKES,
          mulberry32(Date.now() % 1_000_000),
          8,
          spec.weights,
          8,
          lay
        );
        pendingWordsRef.current = picked;
        pendingLineRef.current = line;
        setRunPhase("lobby");
        setInputEpoch((n) => n + 1);
      } catch (e) {
        if (!cancelled) {
          setErr(e instanceof Error ? e.message : String(e));
          setRunPhase("lobby");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pickerView, mergedTab, layout]);

  useEffect(() => {
    if (runPhase !== "lobby" || err) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key !== "Enter" && e.key !== " ") return;
      if (!pendingLineRef.current || pendingWordsRef.current.length === 0) return;
      e.preventDefault();
      startTrialFromLobby();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [runPhase, err, startTrialFromLobby]);

  useEffect(() => {
    if (runPhase !== "countdown") return;
    let cancelled = false;
    setCountdownDigit(3);
    const t2 = window.setTimeout(() => {
      if (!cancelled) setCountdownDigit(2);
    }, 1000);
    const t1 = window.setTimeout(() => {
      if (!cancelled) setCountdownDigit(1);
    }, 2000);
    const t0 = window.setTimeout(() => {
      if (!cancelled) beginPlaySession();
    }, 3000);
    return () => {
      cancelled = true;
      window.clearTimeout(t2);
      window.clearTimeout(t1);
      window.clearTimeout(t0);
    };
  }, [runPhase, beginPlaySession]);

  useEffect(() => {
    const onFnMode = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const phase = runPhaseRef.current;
      if (phase === "playing" || phase === "countdown") return;
      const hit = FN_TO_MERGED_TAB.find(([k]) => k === e.key);
      if (!hit) return;
      e.preventDefault();
      setPickerView("merged");
      setMergedTab(hit[1]);
    };
    window.addEventListener("keydown", onFnMode);
    return () => window.removeEventListener("keydown", onFnMode);
  }, []);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const phase = runPhaseRef.current;
      if (phase === "loading" || phase === "lobby") return;
      e.preventDefault();
      if (phase === "countdown") {
        goToLobby({ keepPending: true });
      } else {
        goToLobby({ keepPending: false });
      }
    };
    window.addEventListener("keydown", onEsc, { capture: true });
    return () => window.removeEventListener("keydown", onEsc, { capture: true });
  }, [goToLobby]);

  useEffect(() => {
    if (runPhase !== "playing") return;
    const id = window.setInterval(() => forceRender(), 100);
    return () => window.clearInterval(id);
  }, [runPhase, forceRender]);

  useEffect(() => {
    if (!layout || !emielTargetLine) {
      autoRef.current = null;
      return;
    }
    if (!strokeEngRef.current) {
      strokeEngRef.current = createStrokeTrialEngine(STROKE_TRIAL_RESET);
    }
    strokeEngRef.current.reset(STROKE_TRIAL_RESET);
    const roman = rule.getRoman(layout);
    try {
      autoRef.current = roman.build(emielTargetLine);
      setErr(null);
    } catch (e) {
      autoRef.current = null;
      setErr(e instanceof Error ? e.message : String(e));
    }
    setInputEpoch((n) => n + 1);
  }, [layout, emielTargetLine]);

  useEffect(() => {
    if (runPhase !== "playing") return;
    const a = autoRef.current;
    if (!a) return;
    const off = activateCompat(window, (e: InputEvent) => {
      if (runPhaseRef.current !== "playing") return;
      const auto = autoRef.current;
      if (!auto) return;
      if (auto.finishedStroke.length >= TRIAL_STROKES) return;

      // ローマ字オートマトンはストロークを keydown で扱う。keyup も input に渡すと、離鍵が再度
      // `failed` になり failedInputCount が二重に増えやすい（体感 1 ミスで 2）。
      // activateCompat 側の KeyboardState は keyup で更新済みなので、次の keydown の修飾状態は正しい。
      if (e.input.type !== "keydown") return;

      const before = auto.finishedStroke.length;
      const result = inputWithNnBeforeSpaceIfNeeded(auto, e);
      const after = auto.finishedStroke.length;
      const now = performance.now();
      strokeEngRef.current?.applyEmielStep(now, before, after);

      if (after > before) {
        if (!lapStartedRef.current) {
          lapStartedRef.current = true;
          lapAnchorMsRef.current = now;
        }
        for (let m = LAP_STROKE_INTERVAL; m <= after; m += LAP_STROKE_INTERVAL) {
          if (before < m && after >= m) {
            const seg = now - lapAnchorMsRef.current;
            lapAnchorMsRef.current = now;
            setLaps((prev) => [...prev, { stroke: m, segmentMs: seg }]);
          }
        }
      }

      if (after >= TRIAL_STROKES) {
        runPhaseRef.current = "finished";
        setRunPhase("finished");
      }

      if (
        (result.isKeySucceeded || result.isKanaSucceeded) &&
        after > before &&
        e.input.type === "keydown"
      ) {
        playClick();
      }

      forceRender();
    });
    return off;
  }, [inputEpoch, runPhase, playClick, forceRender]);

  useEffect(() => {
    const prevent = (e: KeyboardEvent) => {
      if (runPhaseRef.current !== "playing") return;
      const auto = autoRef.current;
      if (!auto || auto.finishedStroke.length >= TRIAL_STROKES) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key.length === 1 || e.key === "Backspace" || e.key === " ") {
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", prevent, { capture: true });
    return () => window.removeEventListener("keydown", prevent, { capture: true });
  }, [inputEpoch, runPhase]);

  const restart = () => {
    if (!layoutRef.current || !dictionaryRef.current.length) return;
    goToLobby({ keepPending: false });
  };

  const auto = autoRef.current;
  const strokeEng = strokeEngRef.current;
  const nowMs = performance.now();
  const trial: StrokeTrialRenderState | null = strokeEng
    ? strokeEng.getRenderState(nowMs)
    : null;

  const showGameSurface =
    (runPhase === "playing" || runPhase === "finished") && layout && auto && trial;
  const trialForStrip: StrokeTrialRenderState | null =
    strokeEng && (runPhase === "playing" || runPhase === "finished")
      ? strokeEng.getRenderState(nowMs)
      : null;

  const displayMeta =
    pickerView === "merged" ? MERGED_SPECS[mergedTab] : DECKS[deck];

  return (
    <section className="space-y-3 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="space-y-3">
        <div>
          <p className="m-0 mb-1.5 text-xs font-medium text-zinc-800">
            合成デッキ（本家 DetailLog 集計に近いデッキ比率）
          </p>
          <div
            className="flex flex-wrap gap-1.5"
            role="tablist"
            aria-label="合成モード"
          >
            {MERGED_TAB_ORDER.map((id) => {
              const selected = pickerView === "merged" && mergedTab === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => {
                    setPickerView("merged");
                    setMergedTab(id);
                  }}
                  className={
                    selected
                      ? "rounded-md border border-amber-500 bg-amber-100 px-2.5 py-1.5 text-xs font-semibold text-amber-950"
                      : "rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
                  }
                >
                  {MERGED_SPECS[id].tabLabel}
                </button>
              );
            })}
            <button
              type="button"
              role="tab"
              aria-selected={pickerView === "single"}
              onClick={() => setPickerView("single")}
              className={
                pickerView === "single"
                  ? "rounded-md border border-zinc-500 bg-zinc-200 px-2.5 py-1.5 text-xs font-semibold text-zinc-900"
                  : "rounded-md border border-dashed border-zinc-300 bg-white px-2.5 py-1.5 text-xs text-zinc-600 hover:bg-zinc-50"
              }
            >
              単一 JSON
            </button>
          </div>
          <p className="m-0 mt-1 text-[10px] text-zinc-500">
            ショートカット: F1 常用 · F2 カタカナ · F3 漢字 · F4 慣用句（試行・カウントダウン中は無効）
          </p>
        </div>

        {pickerView === "single" ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <label className="flex min-w-[min(100%,220px)] flex-1 flex-col gap-1 text-xs text-zinc-600">
              <span className="font-medium text-zinc-800">単一ファイル（従来）</span>
              <select
                value={deck}
                onChange={(e) => setDeck(e.target.value as DeckId)}
                className="rounded-md border border-zinc-300 bg-white px-2 py-2 text-sm text-zinc-900"
              >
                {decksByGroup().map(({ group, ids }) => (
                  <optgroup key={group} label={group}>
                    {ids.map((id) => (
                      <option key={id} value={id}>
                        {DECKS[id].caption}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {DECK_IDS.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setDeck(id)}
                  className={
                    deck === id
                      ? "rounded-md border border-amber-500 bg-amber-100 px-2 py-1 text-xs font-medium text-amber-950"
                      : "rounded-md border border-zinc-200 bg-zinc-100 px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-200"
                  }
                  title={DECKS[id].caption}
                >
                  {id.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
      {err ? (
        <p className="text-sm text-red-400">{err}</p>
      ) : !layout ? (
        <p className="text-sm text-zinc-600">キーボード配列を検出しています…</p>
      ) : runPhase === "loading" ? (
        <p className="text-sm text-zinc-600">語リストを読み込んでいます…</p>
      ) : (
        <>
          <div className="space-y-2.5">
            <TrialDeckHeading group={displayMeta.group} caption={displayMeta.caption} />
            <TrialStatusStrip
              runPhase={runPhase}
              trialForStrip={trialForStrip}
              missCount={
                auto && (runPhase === "playing" || runPhase === "finished")
                  ? auto.failedInputCount
                  : null
              }
            />
          </div>

          <div className="space-y-1.5">
            <div className={TRIAL_VIEWPORT_CLASS}>
              <div
                className={
                  "shrink-0 text-sm leading-snug " +
                  (showGameSurface && trial.finished && trial.resultLevelId != null
                    ? "min-h-[2.5rem] pb-0.5"
                    : "min-h-0")
                }
              >
                {showGameSurface && trial.finished && trial.resultLevelId != null ? (
                  <p className="m-0 text-blue-700">
                    {trial.resultLevelId === "-"
                      ? "試行終了 — チャート外（206s 以上帯）"
                      : `試行終了 — 国語Ｒラベル（Module1）: ${trial.resultLevelId}`}
                  </p>
                ) : null}
              </div>
              <div className="mt-1 w-full shrink-0 rounded border border-dashed border-zinc-300 bg-zinc-50 px-2.5 py-1.5">
                {showGameSurface && auto && trial ? (
                  <EmielTrialBody segments={trialWords} automaton={auto} trial={trial} />
                ) : (
                  <div className="text-sm leading-relaxed text-zinc-600">
                    {runPhase === "countdown" ? (
                      <span aria-live="polite">まもなくこの枠に問題が表示されます</span>
                    ) : runPhase === "playing" ? (
                      <span>オートマトンを準備しています…</span>
                    ) : (
                      <span>この枠内にワードセットが表示されます</span>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="min-h-[1.375rem] text-xs text-zinc-600">
              {showGameSurface && trial ? (
                <p
                  className="m-0"
                  title={`内製ペース EMA: ${trial.paceColor}（補助指標・ツールチップのみ）`}
                >
                  進捗 {Math.round(trial.progress01 * 100)}% — 確定ストローク{" "}
                  {trial.confirmedStrokeCount} / {trial.trialStrokeCount}
                </p>
              ) : (
                <p className="invisible m-0 select-none" aria-hidden>
                  進捗 000% — 確定ストローク 000 / {TRIAL_STROKES}
                </p>
              )}
            </div>
            <div className="shrink-0">
              <div className={TYPING_STATS_LAPS_BOX_CLASS}>
                <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
                  <span className="font-medium text-zinc-600">
                    {LAP_STROKE_INTERVAL} 打鍵ごとのラップ（その区間の秒）:{" "}
                  </span>
                  <span
                    className={
                      trialForStrip && laps.length > 0 ? "text-zinc-800" : "text-zinc-600"
                    }
                  >
                    {trialForStrip && laps.length > 0
                      ? laps.map((L) => `${L.stroke}: ${formatSeconds(L.segmentMs)}`).join(" · ")
                      : trialForStrip
                        ? "試行中、区間ごとの秒がここに並びます。"
                        : "（試行を開始すると表示されます）"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="-mt-1 shrink-0">
            <Module1ChartLadderRow runPhase={runPhase} trialForStrip={trialForStrip} />
          </div>

          <div className="border-t border-zinc-200 pt-2 text-xs text-zinc-600 sm:text-sm">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {runPhase === "lobby" && !err ? (
                <button
                  type="button"
                  onClick={startTrialFromLobby}
                  className="rounded bg-amber-600 px-3 py-1 font-medium text-white hover:bg-amber-500 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500"
                  disabled={!pendingWordsRef.current.length || !pendingLineRef.current}
                >
                  スタート
                </button>
              ) : null}
              <button
                type="button"
                onClick={restart}
                className="rounded bg-zinc-800 px-3 py-1 text-white hover:bg-zinc-700"
              >
                もう一度
              </button>
              {runPhase === "countdown" ? (
                <span
                  className="inline-flex items-baseline gap-1.5 rounded border border-amber-300 bg-amber-50 px-2 py-0.5 tabular-nums text-amber-950"
                  aria-live="assertive"
                  aria-label="カウントダウン"
                >
                  <span className="text-[10px] font-normal uppercase tracking-wide text-amber-800">
                    開始まで
                  </span>
                  <span className="text-lg font-semibold leading-none" key={countdownDigit}>
                    {countdownDigit}
                  </span>
                  <span className="text-[10px] text-amber-800">秒</span>
                </span>
              ) : null}
              {trialForStrip ? (
                <span>
                  確定ストローク {trialForStrip.confirmedStrokeCount} / {trialForStrip.trialStrokeCount}（
                  {displayMeta.caption}・国語Ｒ採点）
                </span>
              ) : (
                <span className="text-zinc-500">経過・ストロークは試行開始後に表示されます</span>
              )}
            </div>
          </div>

          <PracticeSettingsStubHub
            countdownSeconds={COUNTDOWN_SECONDS}
            surfaceHint={displayMeta.surfaceHint}
            trialStrokeCount={TRIAL_STROKES}
          />
        </>
      )}
    </section>
  );
}
