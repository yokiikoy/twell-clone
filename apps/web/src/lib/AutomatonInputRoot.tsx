"use client";

import type { ReactNode } from "react";
import {
  AutomatonInputProvider,
  defaultAutomatonInputHandler,
} from "./emielAutomatonInput";

/** Server `layout` からは関数を渡せないため、既定ハンドラの注入はクライアント境界で行う。 */
export function AutomatonInputRoot({ children }: { children: ReactNode }) {
  return (
    <AutomatonInputProvider value={defaultAutomatonInputHandler}>
      {children}
    </AutomatonInputProvider>
  );
}
