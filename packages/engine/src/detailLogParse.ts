import type { GameMode, WordListFile } from "./types.js";
import { romajiToTypingKana } from "./twelljr/romajiTypingKana.js";

const DETAIL_LINE =
  /^(?<key>.?)\s+(?<time>\d+)\s+(?<loss>\d+)\s*(?<word>[^\r\n]*)$/;

function inferModeFromHeader(line: string): GameMode {
  if (line.includes("基本常用語")) return "kihon";
  if (line.includes("カタカナ")) return "katakana";
  if (line.includes("漢字")) return "kanji";
  if (line.includes("慣用") || line.includes("ことわざ")) return "kanyoku";
  return "kihon";
}

/** Parse 国語Ｒ Detail.txt / DetailLog body into structured word entries. */
export function parseDetailLogText(
  text: string,
  defaultMode: GameMode = "kihon"
): WordListFile {
  const lines = text.split(/\r?\n/);
  let mode = defaultMode;
  let i = 0;
  if (lines[0] && !lines[0].includes("Time") && lines[0].trim()) {
    mode = inferModeFromHeader(lines[0]);
    i = 1;
  }
  if (lines[i]?.includes("Time")) i += 1;

  const words: WordListFile["words"] = [];
  let readingChars: string[] = [];
  let currentSurface: string | null = null;

  const flushWord = () => {
    if (!currentSurface) return;
    const reading = readingChars.join("").toLowerCase();
    readingChars = [];
    if (reading.length > 0) {
      words.push({
        surface: currentSurface,
        reading,
        typingKana: romajiToTypingKana(reading),
        mode,
      });
    }
    currentSurface = null;
  };

  for (; i < lines.length; i++) {
    const raw = lines[i];
    if (!raw?.trim()) continue;
    const m = raw.match(DETAIL_LINE);
    if (!m?.groups) continue;
    const key = (m.groups.key ?? "").trim();
    const wordCol = (m.groups.word ?? "").trim();

    if (wordCol) {
      flushWord();
      currentSurface = wordCol;
    }
    if (key && /^[a-zA-Z-]$/.test(key)) {
      readingChars.push(key.toLowerCase());
    }
  }
  flushWord();

  const dedup = new Map<string, (typeof words)[0]>();
  for (const w of words) {
    dedup.set(`${w.surface}\0${w.reading}`, w);
  }
  return { version: 1, source: "detail-log-parse", words: [...dedup.values()] };
}
