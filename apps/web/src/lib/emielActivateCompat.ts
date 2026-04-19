/**
 * emiel の `activate` は一部の `KeyboardEvent.code`（例: Backquote）が未対応で例外になる。
 * 公式実装に近い購読を維持しつつ、不足コードを補う（emiel 本体は触らない）。
 *
 * **OS キーリピート:** `keydown` の `repeat === true` は無視する。タイピングでは連続自動入力は起こらない想定であり、
 * 長押しで同キーの keydown が連打されるとローマ字が二重に入る（例: `utukushi` に `i` が余計）ため。
 *
 * @see https://github.com/tomoemon/emiel/blob/main/src/browser/eventHandler.ts
 */
import {
  InputEvent,
  InputStroke,
  KeyboardState,
  VirtualKeys,
  type VirtualKey,
} from "emiel";

const codeToVirtualKey: { [code: string]: VirtualKey } = {
  Escape: VirtualKeys.Escape,
  F1: VirtualKeys.F1,
  F2: VirtualKeys.F2,
  F3: VirtualKeys.F3,
  F4: VirtualKeys.F4,
  F5: VirtualKeys.F5,
  F6: VirtualKeys.F6,
  F7: VirtualKeys.F7,
  F8: VirtualKeys.F8,
  F9: VirtualKeys.F9,
  F10: VirtualKeys.F10,
  F11: VirtualKeys.F11,
  F12: VirtualKeys.F12,
  KeyA: VirtualKeys.A,
  KeyB: VirtualKeys.B,
  KeyC: VirtualKeys.C,
  KeyD: VirtualKeys.D,
  KeyE: VirtualKeys.E,
  KeyF: VirtualKeys.F,
  KeyG: VirtualKeys.G,
  KeyH: VirtualKeys.H,
  KeyI: VirtualKeys.I,
  KeyJ: VirtualKeys.J,
  KeyK: VirtualKeys.K,
  KeyL: VirtualKeys.L,
  KeyM: VirtualKeys.M,
  KeyN: VirtualKeys.N,
  KeyO: VirtualKeys.O,
  KeyP: VirtualKeys.P,
  KeyQ: VirtualKeys.Q,
  KeyR: VirtualKeys.R,
  KeyS: VirtualKeys.S,
  KeyT: VirtualKeys.T,
  KeyU: VirtualKeys.U,
  KeyV: VirtualKeys.V,
  KeyW: VirtualKeys.W,
  KeyX: VirtualKeys.X,
  KeyY: VirtualKeys.Y,
  KeyZ: VirtualKeys.Z,
  Digit1: VirtualKeys.Digit1,
  Digit2: VirtualKeys.Digit2,
  Digit3: VirtualKeys.Digit3,
  Digit4: VirtualKeys.Digit4,
  Digit5: VirtualKeys.Digit5,
  Digit6: VirtualKeys.Digit6,
  Digit7: VirtualKeys.Digit7,
  Digit8: VirtualKeys.Digit8,
  Digit9: VirtualKeys.Digit9,
  Digit0: VirtualKeys.Digit0,
  Minus: VirtualKeys.Minus,
  Equal: VirtualKeys.Equal,
  IntlYen: VirtualKeys.JpnYen,
  Backquote: VirtualKeys.Backquote,
  Backspace: VirtualKeys.Backspace,
  BracketLeft: VirtualKeys.BracketLeft,
  BracketRight: VirtualKeys.BracketRight,
  Enter: VirtualKeys.Enter,
  Semicolon: VirtualKeys.Semicolon,
  Quote: VirtualKeys.Quote,
  Backslash: VirtualKeys.Backslash,
  Comma: VirtualKeys.Comma,
  Period: VirtualKeys.Period,
  Slash: VirtualKeys.Slash,
  IntlRo: VirtualKeys.JpnRo,
  Tab: VirtualKeys.Tab,
  ShiftLeft: VirtualKeys.ShiftLeft,
  ShiftRight: VirtualKeys.ShiftRight,
  ControlLeft: VirtualKeys.ControlLeft,
  ControlRight: VirtualKeys.ControlRight,
  AltLeft: VirtualKeys.AltLeft,
  AltRight: VirtualKeys.AltRight,
  MetaLeft: VirtualKeys.MetaLeft,
  MetaRight: VirtualKeys.MetaRight,
  Space: VirtualKeys.Space,
  Lang2: VirtualKeys.LangLeft,
  Lang1: VirtualKeys.LangRight,
  NonConvert: VirtualKeys.LangLeft,
  Convert: VirtualKeys.LangRight,
  KanaMode: VirtualKeys.LangRight,
  OSLeft: VirtualKeys.MetaLeft,
  OSRight: VirtualKeys.MetaRight,
  CapsLock: VirtualKeys.CapsLock,
  Pause: VirtualKeys.Pause,
  ScrollLock: VirtualKeys.ScrollLock,
  Numpad0: VirtualKeys.Numpad0,
  Numpad1: VirtualKeys.Numpad1,
  Numpad2: VirtualKeys.Numpad2,
  Numpad3: VirtualKeys.Numpad3,
  Numpad4: VirtualKeys.Numpad4,
  Numpad5: VirtualKeys.Numpad5,
  Numpad6: VirtualKeys.Numpad6,
  Numpad7: VirtualKeys.Numpad7,
  Numpad8: VirtualKeys.Numpad8,
  Numpad9: VirtualKeys.Numpad9,
  NumpadDecimal: VirtualKeys.NumpadDecimal,
  NumpadSubtract: VirtualKeys.NumpadSubtract,
  NumpadAdd: VirtualKeys.NumpadAdd,
  NumpadMultiply: VirtualKeys.NumpadMultiply,
};

function toVirtualKeyFromEventCode(code: string): VirtualKey | undefined {
  return codeToVirtualKey[code];
}

function toInputKeyStrokeFromKeyboardEvent(
  evtType: "keyup" | "keydown",
  evt: KeyboardEvent,
  keyMap: Map<VirtualKey, VirtualKey>
): InputStroke | null {
  const vkey = toVirtualKeyFromEventCode(evt.code);
  if (vkey === undefined) return null;
  const replaced = keyMap.get(vkey) ?? vkey;
  return new InputStroke(replaced, evtType);
}

/**
 * `emiel.activate` と同形。未知の `code` は無視（コールバックも呼ばない）。
 */
export function activateCompat(
  target: EventTarget,
  keyEventHandler: (evt: InputEvent) => void
): () => void {
  const keyMap = new Map<VirtualKey, VirtualKey>();
  const keyboardState = new KeyboardState();

  const keyDownEventHandler = (evt: Event) => {
    const ke = evt as KeyboardEvent;
    if (ke.repeat) return;
    const keyStroke = toInputKeyStrokeFromKeyboardEvent(
      "keydown",
      ke,
      keyMap
    );
    if (!keyStroke) return;
    keyboardState.keydown(keyStroke.key);
    const ts = ke.timeStamp;
    keyEventHandler(
      new InputEvent(
        keyStroke,
        new KeyboardState([...keyboardState.downedKeys]),
        ts
      )
    );
  };

  const keyUpEventHandler = (evt: Event) => {
    const keyStroke = toInputKeyStrokeFromKeyboardEvent(
      "keyup",
      evt as KeyboardEvent,
      keyMap
    );
    if (!keyStroke) return;
    keyboardState.keyup(keyStroke.key);
    const ke = evt as KeyboardEvent;
    const ts = ke.timeStamp;
    keyEventHandler(
      new InputEvent(
        keyStroke,
        new KeyboardState([...keyboardState.downedKeys]),
        ts
      )
    );
  };

  target.addEventListener("keydown", keyDownEventHandler);
  target.addEventListener("keyup", keyUpEventHandler);
  return () => {
    target.removeEventListener("keydown", keyDownEventHandler);
    target.removeEventListener("keyup", keyUpEventHandler);
  };
}
