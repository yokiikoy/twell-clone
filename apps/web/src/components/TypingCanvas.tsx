"use client";

import {
  basRomanTypingGuide,
  buildTrialSurfaceLine,
  createStrokeTrialEngine,
  jouTriplesToWordEntries,
  mulberry32,
  type GameMode,
  type JouTripleRow,
  type StrokeTrialEngine,
  type StrokeTrialRenderState,
  type WordEntry,
} from "@typewell-jr/engine";
import { keyboard, rule, type Automaton, type InputEvent, type KeyboardLayout } from "emiel";
import { activateCompat } from "../lib/emielActivateCompat";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";

/** 国語Ｒ Web 版: 確定ストローク数（emiel `finishedStroke.length`） */
const TRIAL_STROKES = 400;

const COUNTDOWN_SECONDS = 3;
const LAP_STROKE_INTERVAL = 50;

const STROKE_TRIAL_RESET = {
  trialStrokeCount: TRIAL_STROKES,
  goalLevelId: "J",
  scoringProfile: "twelljr" as const,
};

/** 高さ固定（vh 一定）＋内側スクロールで、待機→試行で枠位置が縦に跳ねないようにする */
const TRIAL_VIEWPORT_CLASS =
  "flex h-[min(52vh,560px)] max-h-[min(52vh,560px)] shrink-0 flex-col overflow-hidden rounded border border-zinc-800 bg-black/80 p-3";

function TrialHintParagraph({ surfaceHint }: { surfaceHint: string }) {
  return (
    <div className="space-y-1 text-[11px] leading-snug text-zinc-500">
      <p>
        <span className="font-medium text-zinc-400">{surfaceHint}</span>
        {" · "}
        Mozc系（emiel）· 確定ストローク {TRIAL_STROKES}（語間スペース）
      </p>
      <p>
        ターゲットかなは平仮名のみの語は表層のまま、それ以外は BAS を正規化してから wanakana で一度だけ変換（打鍵中は
        wanakana 不使用）。下のローマ字ガイドは BAS の reading（本家・tsuikyo 系の綴り）に合わせ、打鍵の受理は emiel（Mozc）です。
      </p>
    </div>
  );
}

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

type RunPhase = "loading" | "lobby" | "countdown" | "playing" | "finished";

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
  emielTargetLine,
  automaton,
  trial,
}: {
  segments: WordEntry[];
  emielTargetLine: string;
  automaton: Automaton;
  trial: StrokeTrialRenderState;
}) {
  const { finished } = trial;
  const jpLen = automaton.finishedWord.length;
  const activeSeg = finished ? -1 : wordIndexFromTypingProgress(segments, jpLen);

  const segmentWordClass = (wi: number) =>
    wi === activeSeg
      ? "text-amber-300 underline decoration-amber-500/70 underline-offset-2"
      : wi < activeSeg || finished
        ? "text-zinc-500"
        : "text-zinc-300";

  const jpFont =
    '"Yu Gothic UI","Yu Gothic",Meiryo,"Hiragino Sans","Hiragino Kaku Gothic ProN",sans-serif';

  const { finishedRoman, pendingRoman } = basRomanTypingGuide(
    segments,
    emielTargetLine,
    automaton.finishedWord
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col text-sm leading-relaxed text-zinc-200">
      <div className="min-h-0 whitespace-pre-wrap break-words font-sans tracking-normal" style={{ fontFamily: jpFont }}>
        {segments.map((seg, wi) => (
          <span key={`jp-${wi}`}>
            {wi > 0 ? (
              <span className="select-none text-zinc-600" aria-hidden>
                {" "}
              </span>
            ) : null}
            <span className={segmentWordClass(wi)}>{seg.surface}</span>
          </span>
        ))}
      </div>
      <div
        className="mt-2 min-h-[2.5rem] shrink-0 whitespace-pre-wrap break-all font-mono text-[11px] tracking-wide text-zinc-500 sm:text-xs"
        aria-label="BAS reading に基づくローマ字ガイド"
      >
        <span className="text-emerald-400/90">{finishedRoman}</span>
        {Array.from(pendingRoman).map((ch, j) => (
          <span
            key={`pr-${j}`}
            className={
              j === 0 && !finished
                ? "rounded-sm bg-amber-900/50 px-0.5 text-amber-100 ring-1 ring-amber-500/80"
                : "text-zinc-500"
            }
          >
            {ch}
          </span>
        ))}
      </div>
      <p className="mt-2 min-h-[2.75rem] shrink-0 text-[10px] leading-snug text-zinc-600">
        琥珀枠はガイド上の次の 1 文字。emiel の内部経路と綴りが違う場合でも、表層・かなターゲットに沿って打鍵すれば確定します。
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
  const deckRef = useRef<DeckId>("jou1");
  const layoutRef = useRef<KeyboardLayout | null>(null);
  const pendingWordsRef = useRef<WordEntry[]>([]);
  const pendingLineRef = useRef("");
  const runPhaseRef = useRef<RunPhase>("loading");
  const lapAnchorMsRef = useRef(0);
  const lapStartedRef = useRef(false);

  const [deck, setDeck] = useState<DeckId>("jou1");
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

  deckRef.current = deck;
  trialWordsRef.current = trialWords;
  emielTargetLineRef.current = emielTargetLine;
  layoutRef.current = layout;
  runPhaseRef.current = runPhase;

  const refillPendingTrial = useCallback(() => {
    const dict = dictionaryRef.current;
    const mode = modeRef.current;
    if (!dict.length) return;
    const { words: picked, emielTargetLine: line } = buildTrialSurfaceLine(
      dict,
      mode,
      TRIAL_STROKES,
      mulberry32(Date.now() % 1_000_000),
      8
    );
    pendingWordsRef.current = picked;
    pendingLineRef.current = line;
  }, []);

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
        const { words: picked, emielTargetLine: line } = buildTrialSurfaceLine(
          words,
          spec.mode,
          TRIAL_STROKES,
          mulberry32(Date.now() % 1_000_000),
          8
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
  }, [deck]);

  useEffect(() => {
    if (runPhase !== "lobby" || err) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key !== "Enter" && e.key !== " ") return;
      if (!pendingLineRef.current || pendingWordsRef.current.length === 0) return;
      e.preventDefault();
      setCountdownDigit(COUNTDOWN_SECONDS);
      setRunPhase("countdown");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [runPhase, err]);

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

      const before = auto.finishedStroke.length;
      const result = auto.input(e);
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
  const typingElapsedMs = trial?.elapsedMs ?? 0;

  const showGameSurface =
    (runPhase === "playing" || runPhase === "finished") && layout && auto && trial;
  const trialForStrip: StrokeTrialRenderState | null =
    strokeEng && (runPhase === "playing" || runPhase === "finished")
      ? strokeEng.getRenderState(nowMs)
      : null;

  return (
    <section className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
      <p className="text-[11px] text-zinc-500">
        ローマ字入力は{" "}
        <a
          className="text-amber-600/90 underline hover:text-amber-500"
          href="https://github.com/tomoemon/emiel"
          target="_blank"
          rel="noreferrer"
        >
          emiel
        </a>
        （Mozc 相当）。キー配列は Chrome / Edge で自動検出（失敗時は QWERTY JIS 想定）。Firefox / Safari
        では物理キー認識に制限がある場合があります（emiel README 参照）。
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <label className="flex min-w-[min(100%,220px)] flex-1 flex-col gap-1 text-xs text-zinc-400">
          <span className="font-medium text-zinc-300">語リスト（本家デコンパイル由来・全件）</span>
          <select
            value={deck}
            onChange={(e) => setDeck(e.target.value as DeckId)}
            className="rounded-md border border-zinc-600 bg-zinc-950 px-2 py-2 text-sm text-zinc-100"
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
                  ? "rounded-md border border-amber-600/80 bg-amber-950/40 px-2 py-1 text-xs text-amber-100"
                  : "rounded-md border border-zinc-700 bg-zinc-800/60 px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-800"
              }
              title={DECKS[id].caption}
            >
              {id.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      {err ? (
        <p className="text-sm text-red-400">{err}</p>
      ) : !layout ? (
        <p className="text-sm text-zinc-500">キーボード配列を検出しています…</p>
      ) : runPhase === "loading" ? (
        <p className="text-sm text-zinc-500">語リストを読み込んでいます…</p>
      ) : (
        <>
          <p className="text-xs leading-relaxed text-zinc-500">
            <kbd className="rounded border border-zinc-600 bg-zinc-900 px-1 py-0.5 font-mono text-[10px] text-zinc-300">
              Enter
            </kbd>{" "}
            /{" "}
            <kbd className="rounded border border-zinc-600 bg-zinc-900 px-1 py-0.5 font-mono text-[10px] text-zinc-300">
              Space
            </kbd>
            で開始（{COUNTDOWN_SECONDS} 秒カウントダウンは下の帯）。ワード枠は常に同じ位置です。Esc
            はカウントダウン中・試行中・終了後に待機へ（試行中・終了後は語を抽選し直し）。
          </p>

          <div className="space-y-2">
            <div className={TRIAL_VIEWPORT_CLASS}>
              <div className="shrink-0 min-h-[5.5rem] overflow-y-auto">
                <TrialHintParagraph surfaceHint={DECKS[deck].surfaceHint} />
              </div>
              <div className="shrink-0 min-h-[2.75rem] text-sm leading-snug">
                {showGameSurface && trial.finished && trial.resultLevelId != null ? (
                  <p className="text-blue-400">
                    {trial.resultLevelId === "-"
                      ? "試行終了 — チャート外（206s 以上帯）"
                      : `試行終了 — 国語Ｒラベル（Module1）: ${trial.resultLevelId}`}
                  </p>
                ) : null}
              </div>
              <div className="mt-2 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded border border-dashed border-zinc-700/80 bg-zinc-950/25 px-3 py-2">
                <div className="min-h-0 flex-1 overflow-y-auto">
                  {showGameSurface && auto && trial ? (
                    <EmielTrialBody
                      segments={trialWords}
                      emielTargetLine={emielTargetLine}
                      automaton={auto}
                      trial={trial}
                    />
                  ) : (
                    <div className="text-sm leading-relaxed text-zinc-500">
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
            </div>
            <div className="min-h-[1.375rem] text-xs text-zinc-500">
              {showGameSurface && trial ? (
                <p>
                  進捗 {Math.round(trial.progress01 * 100)}% · pace:{" "}
                  <span className="text-zinc-400">{trial.paceColor}</span>
                  {" · "}
                  確定ストローク {trial.confirmedStrokeCount} / {trial.trialStrokeCount}
                </p>
              ) : (
                <p className="invisible select-none" aria-hidden>
                  進捗 000% · pace: gray · 確定ストローク 000 / {TRIAL_STROKES}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 border-t border-zinc-800/80 pt-2 text-xs text-zinc-400 sm:text-sm">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <button
                type="button"
                onClick={restart}
                className="rounded bg-zinc-700 px-3 py-1 text-zinc-100 hover:bg-zinc-600"
              >
                もう一度
              </button>
              {runPhase === "countdown" ? (
                <span
                  className="inline-flex items-baseline gap-1.5 rounded border border-amber-700/40 bg-amber-950/25 px-2 py-0.5 tabular-nums text-amber-100"
                  aria-live="assertive"
                  aria-label="カウントダウン"
                >
                  <span className="text-[10px] font-normal uppercase tracking-wide text-amber-500/90">
                    開始まで
                  </span>
                  <span className="text-lg font-semibold leading-none" key={countdownDigit}>
                    {countdownDigit}
                  </span>
                  <span className="text-[10px] text-amber-600/90">秒</span>
                </span>
              ) : null}
              {trialForStrip ? (
                <>
                  <span>
                    確定ストローク {trialForStrip.confirmedStrokeCount} / {trialForStrip.trialStrokeCount}（
                    {DECKS[deck].caption}・国語Ｒ採点）
                  </span>
                  <span className="text-zinc-300">
                    打鍵時間（初回確定〜終了、完了後は固定） {formatSeconds(typingElapsedMs)}
                  </span>
                </>
              ) : (
                <span className="text-zinc-500">経過・ストロークは試行開始後に表示されます</span>
              )}
            </div>
            {laps.length > 0 && trialForStrip ? (
              <div className="rounded border border-zinc-800 bg-black/40 px-3 py-2 text-xs text-zinc-400">
                <span className="font-medium text-zinc-500">
                  {LAP_STROKE_INTERVAL} 打鍵ごとのラップ（その区間の秒）:{" "}
                </span>
                <span className="text-zinc-300">
                  {laps.map((L) => `${L.stroke}: ${formatSeconds(L.segmentMs)}`).join(" · ")}
                </span>
              </div>
            ) : null}
          </div>
        </>
      )}
    </section>
  );
}
