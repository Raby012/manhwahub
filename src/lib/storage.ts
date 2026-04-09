export interface Bookmark {
  id: string;
  title: string;
  coverUrl: string;
  type: string;
  addedAt: number;
}

export interface ReadingProgress {
  mangaId: string;
  chapterId: string;
  chapterNumber: string;
  page: number;
  timestamp: number;
}

export interface RecentlyViewed {
  id: string;
  title: string;
  coverUrl: string;
  type: string;
  viewedAt: number;
}

const BOOKMARKS_KEY = "manhwahub_bookmarks";
const PROGRESS_KEY = "manhwahub_progress";
const RECENT_KEY = "manhwahub_recent";
const READ_CHAPTERS_KEY = "manhwahub_read_chapters";

function getJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Bookmarks
export function getBookmarks(): Bookmark[] {
  return getJson<Bookmark[]>(BOOKMARKS_KEY, []);
}

export function addBookmark(b: Bookmark) {
  const all = getBookmarks().filter((x) => x.id !== b.id);
  all.unshift(b);
  setJson(BOOKMARKS_KEY, all);
}

export function removeBookmark(id: string) {
  setJson(BOOKMARKS_KEY, getBookmarks().filter((x) => x.id !== id));
}

export function isBookmarked(id: string): boolean {
  return getBookmarks().some((x) => x.id === id);
}

// Reading progress
export function getProgress(mangaId: string): ReadingProgress | null {
  const all = getJson<Record<string, ReadingProgress>>(PROGRESS_KEY, {});
  return all[mangaId] || null;
}

export function setProgress(p: ReadingProgress) {
  const all = getJson<Record<string, ReadingProgress>>(PROGRESS_KEY, {});
  all[p.mangaId] = p;
  setJson(PROGRESS_KEY, all);
}

export function getAllProgress(): Record<string, ReadingProgress> {
  return getJson<Record<string, ReadingProgress>>(PROGRESS_KEY, {});
}

// Read chapters
export function markChapterRead(mangaId: string, chapterNumber: string) {
  const all = getJson<Record<string, string[]>>(READ_CHAPTERS_KEY, {});
  if (!all[mangaId]) all[mangaId] = [];
  if (!all[mangaId].includes(chapterNumber)) all[mangaId].push(chapterNumber);
  setJson(READ_CHAPTERS_KEY, all);
}

export function getReadChapters(mangaId: string): string[] {
  return getJson<Record<string, string[]>>(READ_CHAPTERS_KEY, {})[mangaId] || [];
}

// Recently viewed
export function getRecentlyViewed(): RecentlyViewed[] {
  return getJson<RecentlyViewed[]>(RECENT_KEY, []);
}

export function addRecentlyViewed(item: RecentlyViewed) {
  const all = getRecentlyViewed().filter((x) => x.id !== item.id);
  all.unshift(item);
  setJson(RECENT_KEY, all.slice(0, 50));
}
