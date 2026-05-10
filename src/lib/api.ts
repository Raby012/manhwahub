// Central API client for the manga/novel Railway API.
// Direct browser fetch — API supports CORS. Image proxy is built-in to the API.

export const API_BASE = "https://manga-novel-api-production.up.railway.app";

export const PROXY_IMG = (url: string) =>
  `${API_BASE}/api/proxy/image?url=${encodeURIComponent(url)}`;

// --- Types ---
export type MangaSource = "comick" | "mangadex" | "weebcentral" | "asura";
export type ContentType = "manga" | "manhwa" | "manhua" | "unknown";

export interface MangaItem {
  id: string;
  title: string;
  contentType: ContentType;
  coverUrl?: string;
  status?: string;
  rating?: string;
  genres?: string[];
  themes?: string[];
  description?: string;
  author?: string;
  artist?: string;
  altTitles?: string[];
}

export interface ChapterItem {
  id: string;
  chapter: string;
  title: string | null;
  lang?: string;
  publishedAt?: string;
  scanlationGroup?: string;
  pages?: number;
  source?: MangaSource;
}

export interface PagesResponse {
  source: string;
  chapterId: string;
  pages: string[];
}

export interface NovelItem {
  title: string;
  slug: string;
  cover?: string;
  latestChapter?: string;
}

export interface NovelDetail {
  title: string;
  slug: string;
  cover?: string;
  author?: string;
  status?: string;
  genres?: string[];
  description?: string;
}

export interface NovelChapter {
  title: string;
  slug: string;
}

export interface NovelChapterContent {
  title: string;
  content: string; // HTML
  prev?: string | null;
  next?: string | null;
}

// --- Helpers ---
const cache = new Map<string, { data: unknown; t: number }>();
const CACHE_TTL = 5 * 60 * 1000;

async function get<T>(path: string, useCache = true): Promise<T> {
  const url = `${API_BASE}${path}`;
  if (useCache) {
    const c = cache.get(url);
    if (c && Date.now() - c.t < CACHE_TTL) return c.data as T;
  }
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  const data = await res.json();
  if (data && typeof data === "object" && "error" in data && data.error) {
    throw new Error(String(data.error));
  }
  if (useCache) cache.set(url, { data, t: Date.now() });
  return data as T;
}

// --- Manga ---
export async function listSources(): Promise<{ sources: MangaSource[] }> {
  return get("/api/manga/sources");
}

export async function searchManga(opts: {
  q: string;
  source?: MangaSource;
  type?: "manga" | "manhwa" | "manhua";
  page?: number;
}): Promise<{ source: string; query: string; results: MangaItem[] }> {
  const p = new URLSearchParams({
    q: opts.q,
    source: opts.source ?? "mangadex",
    page: String(opts.page ?? 1),
  });
  if (opts.type) p.set("type", opts.type);
  return get(`/api/manga/search?${p.toString()}`);
}

export async function getTrending(opts: {
  source?: MangaSource;
  type?: "manga" | "manhwa" | "manhua";
  page?: number;
}): Promise<{ source: string; results: MangaItem[] }> {
  const p = new URLSearchParams({
    source: opts.source ?? "mangadex",
    page: String(opts.page ?? 1),
  });
  if (opts.type) p.set("type", opts.type);
  return get(`/api/manga/trending?${p.toString()}`);
}

export async function getMangaInfo(id: string, source: MangaSource): Promise<MangaItem & { source: string }> {
  return get(`/api/manga/${encodeURIComponent(id)}?source=${source}`);
}

export async function getChapters(
  id: string,
  source: MangaSource,
  page = 1,
  lang = "en",
  title?: string,
  altTitles?: string[],
): Promise<{ source: string; chapters: ChapterItem[] }> {
  const p = new URLSearchParams({ source, page: String(page), lang });
  if (title) p.set("title", title);
  p.set("altTitles", (altTitles ?? []).join(","));
  return get(`/api/manga/${encodeURIComponent(id)}/chapters?${p.toString()}`);
}

export async function getChapterPages(
  id: string,
  chapterId: string,
  source: MangaSource,
  chapterSource?: MangaSource,
): Promise<PagesResponse> {
  const p = new URLSearchParams({ source });
  if (chapterSource) p.set("chapterSource", chapterSource);
  return get(
    `/api/manga/${encodeURIComponent(id)}/chapters/${encodeURIComponent(chapterId)}/pages?${p.toString()}`,
    false,
  );
}

// New unified server-side endpoint that handles MangaDex → Comick fallback internally.
export async function getChapterImages(
  chapterId: string,
  opts: { num?: string | number; mangaId?: string },
): Promise<{ pages: string[]; source: string; total: number }> {
  const p = new URLSearchParams();
  if (opts.num != null && opts.num !== "") p.set("num", String(opts.num));
  if (opts.mangaId) p.set("mangaId", opts.mangaId);
  return get(
    `/api/proxy/chapter/${encodeURIComponent(chapterId)}?${p.toString()}`,
    false,
  );
}

// --- Novels ---
// novelfull slugs sometimes need .html suffix on detail/chapter endpoints
function novelSlug(slug: string): string {
  return slug.endsWith(".html") ? slug : `${slug}.html`;
}

export async function searchNovels(q: string): Promise<NovelItem[]> {
  return get(`/api/novels/search?q=${encodeURIComponent(q)}`);
}

export async function getNovelInfo(slug: string): Promise<NovelDetail> {
  return get(`/api/novels/${encodeURIComponent(novelSlug(slug))}`);
}

export async function getNovelChapters(
  slug: string,
  page = 1,
): Promise<{ chapters: NovelChapter[]; totalPages?: number } | NovelChapter[]> {
  return get(`/api/novels/${encodeURIComponent(novelSlug(slug))}/chapters?page=${page}`);
}

export async function getNovelChapter(
  slug: string,
  chapterSlug: string,
): Promise<NovelChapterContent> {
  return get(
    `/api/novels/${encodeURIComponent(novelSlug(slug))}/chapters/${encodeURIComponent(chapterSlug)}`,
    false,
  );
}
