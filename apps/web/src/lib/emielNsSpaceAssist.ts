/**
 * emiel のローマ字オートマトンは、ターゲットが **かな＋語間の半角スペース（U+0020）** の 1 行
 * （`typingKana.join(" ")`）で構築される。語末が「ん」のとき、Mozc 系では **nn** などで ん を確定してから
 * スペース打鍵が必要なことが多く、**n の直後にスペース**だけだと `failed` になりやすい。
 *
 * 本家で「n + 半角スペース」が通る体感に寄せるため、**スペースが失敗した直後**に限り、
 * 残りターゲットが「ん」で始まるなら **同じキー状態で N の keydown を 1 回だけ合成**してから
 * ユーザーのスペースをそのまま再入力する（＝実質 `n` → `nn` → `Space`）。
 *
 * emiel の `build` に渡すターゲット行（語＋語間スペースの 1 行）は変えない。
 *
 * **400 打鍵（`finishedStroke.length`）:** 補助は emiel 上で「成功した N 1 打＋成功した Space 1 打」と数えられる。
 * 手打ちで `n` `n` `Space` とした場合と **同じ遷移数**（試行を最後まで打ち切るまでの総ストロークは狂わない）。
 * すでに `nn` まで打って次が語間スペースだけのときは Space がそのまま成功するため **補助は走らない**。
 *
 * **`xn` 等:** 直前の成功打鍵が `N` でないときは補助しない（`x` のあとに誤 Space しても合成 N を入れない）。
 *
 * **問題ない旨（`TypingCanvas` の試行カウントとの整合）:**
 *
 * - **400 打鍵:** `finishedStroke.length` は補助でも **emiel が成功と数えた打鍵だけ**が増える。補助 1 回は
 *   手打ち `n`→`n`→`Space` と **同じ段数**であり、試行終了までの総数が意図せずズレるものではない。
 * - **`nn`:** 語間スペースの時点では `pendingWord` 先頭は `ん` ではないため Space は最初から成功し、**補助分岐に入らない**
 *   （余計な合成 N で「ミス扱い」にはならない）。
 * - **`xn` / その他:** `lastSucceededKeyWasN` により **直前が N のときだけ**補助するので、`x` 直後の誤 Space などで
 *   合成 N が紛れ込まない。
 * - **失敗カウント:** 補助に入る前に `testInput(Space)` が失敗でも、合成 N が通れば最終的に Space は成功し、
 *   従来どおり **1 回の Space 押下に対する「無意味な二重 failed」にはならない**（失敗は `applySpace` の通常経路）。
 */
import {
  InputEvent,
  InputStroke,
  type Automaton,
  type InputResult,
  type RuleStroke,
  VirtualKeys,
} from "emiel";

const HIRAGANA_N = "\u3093";
const KATAKANA_N = "\u30f3";

function nextKanaNeedsNnAssist(pendingWord: string): boolean {
  const ch = pendingWord[0];
  return ch === HIRAGANA_N || ch === KATAKANA_N;
}

function ruleStrokePrimaryIsN(stroke: RuleStroke): boolean {
  if (stroke.kind === "single") return stroke.key === VirtualKeys.N;
  return stroke.keys.includes(VirtualKeys.N);
}

/** 直前に成功した打鍵が N か（xn 途中の誤 Space などで補助しない） */
function lastSucceededKeyWasN(automaton: Automaton): boolean {
  const hist = automaton.inputHistory;
  for (let i = hist.length - 1; i >= 0; i--) {
    const entry = hist[i]!;
    if ("back" in entry) continue;
    if (!entry.result.isSucceeded || !entry.edge) continue;
    return ruleStrokePrimaryIsN(entry.edge.input);
  }
  return false;
}

function syntheticNKeydown(from: InputEvent): InputEvent {
  return new InputEvent(
    new InputStroke(VirtualKeys.N, "keydown"),
    from.keyboardState,
    new Date()
  );
}

/**
 * Space の keydown を、必要なら先行 N で補助してから emiel に渡す。
 * Space 以外はそのまま `automaton.input`。
 *
 * 上記モジュールコメントの「問題ない旨」どおり、試行の打鍵数・`nn` / `xn` との整合を崩さない前提で使う。
 */
export function inputWithNnBeforeSpaceIfNeeded(
  automaton: Automaton,
  evt: InputEvent
): InputResult {
  const { input } = evt;
  if (input.type !== "keydown" || input.key !== VirtualKeys.Space) {
    return automaton.input(evt);
  }

  const [spaceProbe, applySpace] = automaton.testInput(evt);
  if (!spaceProbe.isFailed) {
    applySpace();
    return spaceProbe;
  }

  if (
    nextKanaNeedsNnAssist(automaton.getPendingWord()) &&
    lastSucceededKeyWasN(automaton)
  ) {
    const nEvt = syntheticNKeydown(evt);
    const [nProbe, applyN] = automaton.testInput(nEvt);
    if (!nProbe.isFailed) {
      applyN();
      return automaton.input(evt);
    }
  }

  applySpace();
  return spaceProbe;
}
