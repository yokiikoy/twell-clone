/**
 * IndexedDB: Web trial summaries + imported native rows (Phase D).
 * See docs/spec/d-phase-prep-local-store.md.
 */

import type {
  NativeBinaryTimeLikeArtifactKindV0,
  NativeFloatBlobArtifactKindV0,
  NativeLogTextArtifactKindV0,
  PastLogBinaryRecordV0,
  TimeKHJYBinaryRecordV0,
  TimeLogSuffix,
} from "@typewell-jr/engine";
import {
  pastLogDateDdMmYySortMs,
  sortMsFromNativeTextLineV0,
  timeBinaryV0SortMs,
} from "@typewell-jr/engine";

const DB_NAME = "typewell-jr-web";
const DB_VERSION = 2;
const STORE_TRIALS = "trial_sessions_v1";
const STORE_IMPORTS = "imported_native_v1";

export type LocalTrialDeckKind = "merged" | "single";

export type LocalTrialSessionRecordV1 = {
  schemaVersion: 1;
  id: string;
  savedAt: string;
  deckKind: LocalTrialDeckKind;
  mergedTab?: "kihon" | "katakana" | "kanji" | "kanyoku";
  singleDeckId?: string;
  gameMode: string;
  deckCaption: string;
  trialStrokeTarget: number;
  confirmedStrokes: number;
  /** Wall-clock trial duration from stroke engine (`elapsedMs` at finish). */
  elapsedMs: number;
  resultLevelId: string | null;
  missCount: number;
};

export type LocalTrialSessionsExportV1 = {
  exportKind: "trial_sessions_v1";
  exportedAt: string;
  records: LocalTrialSessionRecordV1[];
};

export type NativeImportTextArtifactKindV1 = NativeLogTextArtifactKindV0;

/** One row from native Time/Dtld/Bptn/Poor `*.log` when bytes match 120B Time V0 probe. */
export type NativeImportTimeBinaryV1 = {
  schemaVersion: 1;
  id: string;
  importedAt: string;
  origin: "native_import";
  artifactKind: NativeBinaryTimeLikeArtifactKindV0;
  timeLogSuffix: TimeLogSuffix | null;
  sourceFileName: string;
  sourceByteLength: number;
  recordIndex: number;
  sortMs: number;
  record: TimeKHJYBinaryRecordV0;
};

/** One non-empty text line (Boot, JRmemo, or line-oriented Dtld/Bptn/Poor when heuristic passes). */
export type NativeImportTextLineV1 = {
  schemaVersion: 1;
  id: string;
  importedAt: string;
  origin: "native_import";
  artifactKind: NativeImportTextArtifactKindV1;
  timeLogSuffix: TimeLogSuffix | null;
  sourceFileName: string;
  sourceByteLength: number;
  recordIndex: number;
  sortMs: number;
  textLine: string;
};

/** One 50-byte `Past.log` record (V0). */
export type NativeImportPastBinaryV1 = {
  schemaVersion: 1;
  id: string;
  importedAt: string;
  origin: "native_import";
  artifactKind: "past_binary_v0";
  timeLogSuffix: null;
  sourceFileName: string;
  sourceByteLength: number;
  recordIndex: number;
  sortMs: number;
  record: PastLogBinaryRecordV0;
};

/** One `Dtld` / `Bptn` / `Poor` file as a single float32 payload (TWJR216 V0). */
export type NativeImportFloat32BlobV1 = {
  schemaVersion: 1;
  id: string;
  importedAt: string;
  origin: "native_import";
  artifactKind: NativeFloatBlobArtifactKindV0;
  timeLogSuffix: TimeLogSuffix | null;
  sourceFileName: string;
  sourceByteLength: number;
  /** Always 0 — one logical row per file (sort uses `sortMs` + `id`). */
  recordIndex: 0;
  sortMs: number;
  /** Dtld triplet header only; Bptn/Poor use `null`. */
  headerLabel: string | null;
  floatCount: number;
  floatPreviewHead: readonly number[];
  floats: Float32Array;
};

export type NativeImportRecordV1 =
  | NativeImportTimeBinaryV1
  | NativeImportTextLineV1
  | NativeImportPastBinaryV1
  | NativeImportFloat32BlobV1;

export type UnifiedTimelineEntryV1 =
  | { source: "web"; sortMs: number; id: string; web: LocalTrialSessionRecordV1 }
  | { source: "native"; sortMs: number; id: string; native: NativeImportRecordV1 };

function idb(): IDBFactory | null {
  return typeof indexedDB !== "undefined" ? indexedDB : null;
}

function idbReq<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("IndexedDB request failed"));
  });
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> | null {
  const factory = idb();
  if (!factory) return null;
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const open = factory.open(DB_NAME, DB_VERSION);
      open.onupgradeneeded = () => {
        const db = open.result;
        if (!db.objectStoreNames.contains(STORE_TRIALS)) {
          const store = db.createObjectStore(STORE_TRIALS, { keyPath: "id" });
          store.createIndex("savedAt", "savedAt", { unique: false });
        }
        if (!db.objectStoreNames.contains(STORE_IMPORTS)) {
          const imp = db.createObjectStore(STORE_IMPORTS, { keyPath: "id" });
          imp.createIndex("sourceFileName", "sourceFileName", { unique: false });
          imp.createIndex("sortMs", "sortMs", { unique: false });
        }
      };
      open.onsuccess = () => resolve(open.result);
      open.onerror = () =>
        reject(open.error ?? new Error("IndexedDB open failed"));
    });
  }
  return dbPromise;
}

export type TrialSessionWriteV1 = Omit<
  LocalTrialSessionRecordV1,
  "schemaVersion" | "id" | "savedAt"
>;

export async function appendTrialSessionRecord(
  row: TrialSessionWriteV1
): Promise<void> {
  const p = openDb();
  if (!p) return;
  const db = await p;
  const rec: LocalTrialSessionRecordV1 = {
    schemaVersion: 1,
    id: crypto.randomUUID(),
    savedAt: new Date().toISOString(),
    ...row,
  };
  const tx = db.transaction(STORE_TRIALS, "readwrite");
  const done = new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("IndexedDB transaction failed"));
    tx.onabort = () => reject(new Error("IndexedDB transaction aborted"));
  });
  await idbReq(tx.objectStore(STORE_TRIALS).add(rec));
  await done;
}

export async function listTrialSessionsDescending(
  limit = 50
): Promise<LocalTrialSessionRecordV1[]> {
  const p = openDb();
  if (!p) return [];
  const db = await p;
  const tx = db.transaction(STORE_TRIALS, "readonly");
  const store = tx.objectStore(STORE_TRIALS);
  const idx = store.index("savedAt");
  const rows: LocalTrialSessionRecordV1[] = [];
  await new Promise<void>((resolve, reject) => {
    const cur = idx.openCursor(null, "prev");
    cur.onerror = () => reject(cur.error ?? new Error("cursor failed"));
    cur.onsuccess = () => {
      const c = cur.result;
      if (!c || rows.length >= limit) {
        resolve();
        return;
      }
      rows.push(c.value as LocalTrialSessionRecordV1);
      c.continue();
    };
  });
  return rows;
}

function cloneBinaryRecord(rec: TimeKHJYBinaryRecordV0): TimeKHJYBinaryRecordV0 {
  return {
    ...rec,
    floats1: [...rec.floats1],
    floats2: [...rec.floats2],
  };
}

export type ReplaceImportedTimeBinaryFileV0Input = {
  sourceFileName: string;
  sourceByteLength: number;
  timeLogSuffix: TimeLogSuffix | null;
  /** Filename-derived when possible; default `time_binary_v0` for unknown `*.log` bytes. */
  binaryArtifactKind: NativeBinaryTimeLikeArtifactKindV0;
  records: readonly TimeKHJYBinaryRecordV0[];
};

/**
 * Replaces any prior rows from the same `sourceFileName`, then inserts
 * parsed records (same-file re-import is idempotent aside from new `id`s).
 */
export async function replaceImportedTimeBinaryFileV0(
  input: ReplaceImportedTimeBinaryFileV0Input
): Promise<{ added: number }> {
  const p = openDb();
  if (!p) throw new Error("IndexedDB unavailable");
  const db = await p;
  const importedAt = new Date().toISOString();
  const { sourceFileName, sourceByteLength, timeLogSuffix, binaryArtifactKind, records } =
    input;

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_IMPORTS, "readwrite");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("import tx failed"));
    tx.onabort = () => reject(new Error("import tx aborted"));
    const store = tx.objectStore(STORE_IMPORTS);
    const byName = store.index("sourceFileName");
    const del = byName.openCursor(IDBKeyRange.only(sourceFileName));
    del.onerror = () => reject(del.error);
    del.onsuccess = () => {
      const c = del.result;
      if (c) {
        c.delete();
        c.continue();
        return;
      }
      for (let i = 0; i < records.length; i++) {
        const rec = records[i]!;
        const row: NativeImportTimeBinaryV1 = {
          schemaVersion: 1,
          id: crypto.randomUUID(),
          importedAt,
          origin: "native_import",
          artifactKind: binaryArtifactKind,
          timeLogSuffix,
          sourceFileName,
          sourceByteLength,
          recordIndex: i,
          sortMs: timeBinaryV0SortMs(rec.dateAscii, rec.timeAscii),
          record: cloneBinaryRecord(rec),
        };
        store.add(row);
      }
    };
  });

  return { added: records.length };
}

export type ReplaceImportedNativeTextFileV0Input = {
  sourceFileName: string;
  sourceByteLength: number;
  artifactKind: NativeImportTextArtifactKindV1;
  timeLogSuffix: TimeLogSuffix | null;
  lines: readonly string[];
};

/** Replaces prior rows for the same basename, then one IndexedDB row per non-empty line. */
export async function replaceImportedNativeTextFileV0(
  input: ReplaceImportedNativeTextFileV0Input
): Promise<{ added: number }> {
  const p = openDb();
  if (!p) throw new Error("IndexedDB unavailable");
  const db = await p;
  const importedAt = new Date().toISOString();
  const importedAtMs = Date.parse(importedAt);
  const baseMs = Number.isFinite(importedAtMs) ? importedAtMs : 0;
  const { sourceFileName, sourceByteLength, artifactKind, timeLogSuffix, lines } = input;

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_IMPORTS, "readwrite");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("import tx failed"));
    tx.onabort = () => reject(new Error("import tx aborted"));
    const store = tx.objectStore(STORE_IMPORTS);
    const byName = store.index("sourceFileName");
    const del = byName.openCursor(IDBKeyRange.only(sourceFileName));
    del.onerror = () => reject(del.error);
    del.onsuccess = () => {
      const c = del.result;
      if (c) {
        c.delete();
        c.continue();
        return;
      }
      for (let i = 0; i < lines.length; i++) {
        const textLine = lines[i]!;
        const row: NativeImportTextLineV1 = {
          schemaVersion: 1,
          id: crypto.randomUUID(),
          importedAt,
          origin: "native_import",
          artifactKind,
          timeLogSuffix,
          sourceFileName,
          sourceByteLength,
          recordIndex: i,
          sortMs: sortMsFromNativeTextLineV0(textLine, baseMs, i),
          textLine,
        };
        store.add(row);
      }
    };
  });

  return { added: lines.length };
}

export type ReplaceImportedPastBinaryFileV0Input = {
  sourceFileName: string;
  sourceByteLength: number;
  records: readonly PastLogBinaryRecordV0[];
};

/** Replaces prior rows for the same `Past.log` basename. */
export async function replaceImportedPastBinaryFileV0(
  input: ReplaceImportedPastBinaryFileV0Input
): Promise<{ added: number }> {
  const p = openDb();
  if (!p) throw new Error("IndexedDB unavailable");
  const db = await p;
  const importedAt = new Date().toISOString();
  const { sourceFileName, sourceByteLength, records } = input;

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_IMPORTS, "readwrite");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("import tx failed"));
    tx.onabort = () => reject(new Error("import tx aborted"));
    const store = tx.objectStore(STORE_IMPORTS);
    const byName = store.index("sourceFileName");
    const del = byName.openCursor(IDBKeyRange.only(sourceFileName));
    del.onerror = () => reject(del.error);
    del.onsuccess = () => {
      const c = del.result;
      if (c) {
        c.delete();
        c.continue();
        return;
      }
      for (let i = 0; i < records.length; i++) {
        const rec = records[i]!;
        const row: NativeImportPastBinaryV1 = {
          schemaVersion: 1,
          id: crypto.randomUUID(),
          importedAt,
          origin: "native_import",
          artifactKind: "past_binary_v0",
          timeLogSuffix: null,
          sourceFileName,
          sourceByteLength,
          recordIndex: i,
          sortMs: pastLogDateDdMmYySortMs(rec.dateAscii) + Math.min(i, 999),
          record: { ...rec },
        };
        store.add(row);
      }
    };
  });

  return { added: records.length };
}

const FLOAT_BLOB_PREVIEW_HEAD = 40;

export type ReplaceImportedFloat32BlobFileV0Input = {
  sourceFileName: string;
  sourceByteLength: number;
  artifactKind: NativeFloatBlobArtifactKindV0;
  timeLogSuffix: TimeLogSuffix | null;
  headerLabel: string | null;
  floats: Float32Array;
};

/** Replaces prior imports for the same `sourceFileName`, then stores one blob row. */
export async function replaceImportedFloat32BlobFileV0(
  input: ReplaceImportedFloat32BlobFileV0Input
): Promise<{ added: 1 }> {
  const p = openDb();
  if (!p) throw new Error("IndexedDB unavailable");
  const db = await p;
  const importedAt = new Date().toISOString();
  const importedAtMs = Date.parse(importedAt);
  const sortMs = Number.isFinite(importedAtMs) ? importedAtMs : 0;
  const {
    sourceFileName,
    sourceByteLength,
    artifactKind,
    timeLogSuffix,
    headerLabel,
    floats,
  } = input;

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_IMPORTS, "readwrite");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("import tx failed"));
    tx.onabort = () => reject(new Error("import tx aborted"));
    const store = tx.objectStore(STORE_IMPORTS);
    const byName = store.index("sourceFileName");
    const del = byName.openCursor(IDBKeyRange.only(sourceFileName));
    del.onerror = () => reject(del.error);
    del.onsuccess = () => {
      const c = del.result;
      if (c) {
        c.delete();
        c.continue();
        return;
      }
      const n = floats.length;
      const row: NativeImportFloat32BlobV1 = {
        schemaVersion: 1,
        id: crypto.randomUUID(),
        importedAt,
        origin: "native_import",
        artifactKind,
        timeLogSuffix,
        sourceFileName,
        sourceByteLength,
        recordIndex: 0,
        sortMs,
        headerLabel,
        floatCount: n,
        floatPreviewHead: Array.from(floats.subarray(0, Math.min(FLOAT_BLOB_PREVIEW_HEAD, n))),
        floats: new Float32Array(floats),
      };
      store.add(row);
    };
  });

  return { added: 1 };
}

export async function listImportedNativeDescending(
  limit = 200
): Promise<NativeImportRecordV1[]> {
  const p = openDb();
  if (!p) return [];
  const db = await p;
  if (!db.objectStoreNames.contains(STORE_IMPORTS)) return [];
  const tx = db.transaction(STORE_IMPORTS, "readonly");
  const store = tx.objectStore(STORE_IMPORTS);
  const idx = store.index("sortMs");
  const rows: NativeImportRecordV1[] = [];
  await new Promise<void>((resolve, reject) => {
    const cur = idx.openCursor(null, "prev");
    cur.onerror = () => reject(cur.error ?? new Error("cursor failed"));
    cur.onsuccess = () => {
      const c = cur.result;
      if (!c || rows.length >= limit) {
        resolve();
        return;
      }
      rows.push(c.value as NativeImportRecordV1);
      c.continue();
    };
  });
  return rows;
}

export function trialWebSortMs(savedAt: string): number {
  const t = Date.parse(savedAt);
  return Number.isFinite(t) ? t : 0;
}

function compareUnified(a: UnifiedTimelineEntryV1, b: UnifiedTimelineEntryV1): number {
  if (b.sortMs !== a.sortMs) return b.sortMs - a.sortMs;
  if (
    a.source === "native" &&
    b.source === "native" &&
    a.native.sourceFileName === b.native.sourceFileName
  ) {
    return b.native.recordIndex - a.native.recordIndex;
  }
  return b.id.localeCompare(a.id);
}

/** Web trials + native imports, newest first (by `sortMs` / `savedAt`). */
export async function listUnifiedTimelineDescending(
  limit = 50
): Promise<UnifiedTimelineEntryV1[]> {
  const cap = Math.max(limit, 100);
  const [webRows, natRows] = await Promise.all([
    listTrialSessionsDescending(cap),
    listImportedNativeDescending(cap),
  ]);
  const merged: UnifiedTimelineEntryV1[] = [
    ...webRows.map((web) => ({
      source: "web" as const,
      sortMs: trialWebSortMs(web.savedAt),
      id: web.id,
      web,
    })),
    ...natRows.map((native) => ({
      source: "native" as const,
      sortMs:
        native.sortMs > 0
          ? native.sortMs
          : Number.isFinite(Date.parse(native.importedAt))
            ? Date.parse(native.importedAt)
            : 0,
      id: native.id,
      native,
    })),
  ];
  merged.sort(compareUnified);
  return merged.slice(0, limit);
}

export async function exportTrialSessionsJson(): Promise<string> {
  const records = await listTrialSessionsDescending(10_000);
  const payload: LocalTrialSessionsExportV1 = {
    exportKind: "trial_sessions_v1",
    exportedAt: new Date().toISOString(),
    records,
  };
  return JSON.stringify(payload, null, 2);
}
