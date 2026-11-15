import type { EditorDoc } from "@/lib/editor/format";

/**
 * Crash recovery between commits: the editor writes its state to IndexedDB on
 * every change. It's only a safety net for this browser, never a source of
 * truth (PLAN.md 2.2). Every call swallows errors, since storage can be
 * unavailable (private windows, blocked site data).
 */

export interface LocalDraft {
  doc: EditorDoc;
  /** The branch head the edits were made on (null: not saved to a branch yet). */
  head: string | null;
  savedAt: number;
}

const DB = "mdev-editor";
const STORE = "drafts";

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function run<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T | undefined> {
  try {
    const db = await open();
    return await new Promise<T>((resolve, reject) => {
      const request = fn(db.transaction(STORE, mode).objectStore(STORE));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    }).finally(() => db.close());
  } catch {
    return undefined;
  }
}

export const readLocalDraft = (key: string) => run<LocalDraft | undefined>("readonly", (s) => s.get(key));
export const writeLocalDraft = (key: string, draft: LocalDraft) => run("readwrite", (s) => s.put(draft, key));
export const clearLocalDraft = (key: string) => run("readwrite", (s) => s.delete(key));
