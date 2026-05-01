// LocalStorage helpers for bookmarks + reading history.

const BOOKMARKS_KEY = "mh:bookmarks";
const HISTORY_KEY = "mh:history";

export interface Bookmark {
  source: string;
  id: string;
  title: string;
  cover?: string;
  contentType?: string;
  addedAt: number;
}

export interface HistoryEntry {
  source: string;
  id: string;
  title: string;
  cover?: string;
  chapterId: string;
  chapterLabel: string;
  updatedAt: number;
}

function read<T>(key: string): T[] {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T[]) : [];
  } catch {
    return [];
  }
}
function write<T>(key: string, value: T[]) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

// Bookmarks
export const getBookmarks = () => read<Bookmark>(BOOKMARKS_KEY);
export function isBookmarked(source: string, id: string) {
  return getBookmarks().some((b) => b.source === source && b.id === id);
}
export function toggleBookmark(b: Omit<Bookmark, "addedAt">) {
  const list = getBookmarks();
  const idx = list.findIndex((x) => x.source === b.source && x.id === b.id);
  if (idx >= 0) list.splice(idx, 1);
  else list.unshift({ ...b, addedAt: Date.now() });
  write(BOOKMARKS_KEY, list);
  return idx < 0;
}

// History
export const getHistory = () => read<HistoryEntry>(HISTORY_KEY);
export function pushHistory(e: Omit<HistoryEntry, "updatedAt">) {
  const list = getHistory().filter((x) => !(x.source === e.source && x.id === e.id));
  list.unshift({ ...e, updatedAt: Date.now() });
  write(HISTORY_KEY, list.slice(0, 100));
}
export function clearHistory() {
  write(HISTORY_KEY, []);
}
