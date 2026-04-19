"use client";

/**
 * emiel `Automaton` へのキー入力適用を差し替え可能にする（テスト・実験用）。
 * 既定は {@link inputWithNnBeforeSpaceIfNeeded}（語末「ん」→語間 Space 補助）。
 */
import { createContext, useContext, type ReactNode } from "react";
import type { Automaton, InputEvent, InputResult } from "emiel";
import { inputWithNnBeforeSpaceIfNeeded } from "./emielNsSpaceAssist";

export type AutomatonInputHandler = (
  automaton: Automaton,
  evt: InputEvent
) => InputResult;

/** 既定: Mozc 風「ん + 語間 Space」補助つき。 */
export const defaultAutomatonInputHandler: AutomatonInputHandler =
  inputWithNnBeforeSpaceIfNeeded;

/** 補助なし（`automaton.input` のみ）。 */
export const passthroughAutomatonInput: AutomatonInputHandler = (automaton, evt) =>
  automaton.input(evt);

const AutomatonInputContext = createContext<AutomatonInputHandler | undefined>(
  undefined
);

/** アプリでは {@link AutomatonInputRoot} 経由で `value` を注入（RSC は関数を子へ渡せないため）。 */
export function AutomatonInputProvider({
  value,
  children,
}: {
  value: AutomatonInputHandler;
  children: ReactNode;
}) {
  return (
    <AutomatonInputContext.Provider value={value}>{children}</AutomatonInputContext.Provider>
  );
}

export function useAutomatonInputHandler(): AutomatonInputHandler {
  const h = useContext(AutomatonInputContext);
  if (h === undefined) {
    throw new Error(
      "useAutomatonInputHandler must be used within AutomatonInputProvider (pass value, e.g. defaultAutomatonInputHandler)"
    );
  }
  return h;
}
