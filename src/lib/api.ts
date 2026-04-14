const BASE = "https://manhwa-api-production.up.railway.app";

const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 min

async function cachedFetch<T>(url: string): Promise<T> {
  const cached = cache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T;
  }
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const data = await res.json();
  cache.set(url, { data, timestamp: Date.now() });
  return data as T;
}

// --- Types ---

export interface MangaListItem {
  title: string;
  slug: string;
  image: string;
  url: string;
}

export interface MangaInfo {
  page: string;
  poster: string;
  description: string;
  status: string;
  authors: string;
  genres: string[];
  ch_list: ChapterListItem[];
}

export interface ChapterListItem {
  ch_title: string;
  url: string;
  time: string;
}

export interface ChapterData {
  chapters: { ch: string }[];
  nav: { prev: string; next: string }[];
}

// --- API calls ---

export async function getLatest(page = 1): Promise<MangaListItem[]> {
  const data = await cachedFetch<{ list: MangaListItem[] }>(`${BASE}/api/latest/${page}`);
  return data.list || [];
}

export async function getAll(page = 1): Promise<MangaListItem[]> {
  const data = await cachedFetch<{ list: MangaListItem[] }>(`${BASE}/api/all/${page}`);
  return data.list || [];
}

export async function getMangaInfo(slug: string): Promise<MangaInfo> {
  return cachedFetch<MangaInfo>(`${BASE}/api/info/${slug}`);
}

export async function getChapterImages(mangaSlug: string, chapter: string): Promise<ChapterData> {
  return cachedFetch<ChapterData>(`${BASE}/api/chapter/${mangaSlug}/${chapter}`);
}

// --- Helpers ---

/** Extract chapter identifier from a ch_list url like "/chapter/slug/ch-123" or similar */
export function extractChapterFromUrl(url: string): string {
  // url might be like "/title/uuid/chapter-id" or contain the chapter segment
  const parts = url.split("/").filter(Boolean);
  return parts[parts.length - 1] || "";
}

/** Extract manga slug from a ch_list url */
export function extractMangaSlugFromUrl(url: string): string {
  const parts = url.split("/").filter(Boolean);
  // Usually: /chapter/manga-slug/chapter-id  OR  /title/manga-slug/chapter-id
  return parts.length >= 2 ? parts[parts.length - 2] : "";
}
