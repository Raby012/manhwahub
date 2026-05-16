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

// Call MangaDex directly from the browser for chapter list (CORS enabled).
// Railway aggregator is unreliable for this endpoint.
export async function getChapters(
  id: string,
  _source?: MangaSource,
  page = 1,
  lang = "en",
  _title?: string,
  limit = 96,
): Promise<{ source: string; chapters: ChapterItem[]; total?: number }> {
  const offset = (Math.max(1, page) - 1) * limit;
  const params = new URLSearchParams();
  params.append("limit", String(limit));
  params.append("offset", String(offset));
  params.append("order[chapter]", "asc");
  params.append("includeExternalUrl", "1");
  ["safe", "suggestive", "erotica", "pornographic"].forEach((r) =>
    params.append("contentRating[]", r),
  );
  params.append("translatedLanguage[]", lang);
  params.append("includes[]", "scanlation_group");

  const res = await fetch(`https://api.mangadex.org/manga/${encodeURIComponent(id)}/feed?${params}`);
  if (!res.ok) throw new Error(`MangaDex ${res.status}`);
  const data = await res.json();

  const chapters: ChapterItem[] = (data.data ?? [])
    .map((c: any) => ({
      id: c.id,
      chapter: c.attributes?.chapter ?? "",
      title: c.attributes?.title ?? null,
      source: "mangadex" as MangaSource,
      lang: c.attributes?.translatedLanguage ?? "en",
      publishedAt: c.attributes?.publishAt ?? "",
      scanlationGroup:
        c.relationships?.find((r: any) => r.type === "scanlation_group")?.attributes?.name ??
        "Unknown",
      pages: c.attributes?.pages ?? 0,
      isExternal: !!c.attributes?.externalUrl,
    }))
    .filter((c: ChapterItem & { isExternal: boolean }) => !c.isExternal);

  return { source: "mangadex", chapters, total: data.total ?? 0 };
}

// Call MangaDex At-Home directly, return Railway-proxied image URLs.
export async function getChapterPages(
  _id: string,
  chapterId: string,
  _source?: MangaSource,
  _chapterSource?: MangaSource,
): Promise<{ source: string; chapterId: string; pages: string[] }> {
  const res = await fetch(`https://api.mangadex.org/at-home/server/${encodeURIComponent(chapterId)}`);
  if (!res.ok) throw new Error(`MangaDex at-home ${res.status}`);
  const data = await res.json();
  const base = data.baseUrl ?? "https://uploads.mangadex.org";
  const hash = data.chapter?.hash ?? "";
  const files: string[] = data.chapter?.data ?? [];
  const pages = files.map((p) => PROXY_IMG(`${base}/data/${hash}/${p}`));
  return { source: "mangadex", chapterId, pages };
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
