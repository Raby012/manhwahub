const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const PROXY_BASE = `${SUPABASE_URL}/functions/v1/mangadex-proxy`;

const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

async function cachedFetch<T>(path: string, query: string): Promise<T> {
  const cacheKey = `${path}?${query}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data as T;
  }
  try {
    const url = `${PROXY_BASE}?path=${encodeURIComponent(path)}&query=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
      },
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const data = await res.json();
    if (data?.fallback) throw new Error(data.error || "Service unavailable");
    cache.set(cacheKey, { data, timestamp: Date.now() });
    return data as T;
  } catch (err) {
    console.error("MangaDex fetch error:", err);
    throw err;
  }
}

export interface MangaResult {
  id: string;
  title: string;
  altTitles: string[];
  description: string;
  status: string;
  year: number | null;
  contentRating: string;
  tags: { id: string; name: string }[];
  coverUrl: string;
  author: string;
  artist: string;
  type: "manhwa" | "manhua" | "manga";
  lastChapter: string;
  rating: number;
  followCount: number;
}

export interface Chapter {
  id: string;
  chapter: string;
  title: string;
  publishAt: string;
  pages: number;
  volume: string | null;
}

export interface ChapterPages {
  baseUrl: string;
  hash: string;
  pages: string[];
  pagesLowRes: string[];
}

function extractManga(manga: any): MangaResult {
  const attrs = manga.attributes;
  const title =
    attrs.title?.en ||
    attrs.title?.ko ||
    attrs.title?.["ko-ro"] ||
    attrs.title?.ja ||
    attrs.title?.["ja-ro"] ||
    attrs.title?.zh ||
    Object.values(attrs.title || {})[0] ||
    "Unknown";

  const altTitles = (attrs.altTitles || [])
    .map((t: any) => Object.values(t)[0])
    .filter(Boolean)
    .slice(0, 5) as string[];

  const description = attrs.description?.en || Object.values(attrs.description || {})[0] || "";

  const coverRel = manga.relationships?.find((r: any) => r.type === "cover_art");
  const coverFileName = coverRel?.attributes?.fileName || "";
  const coverUrl = coverFileName
    ? `https://uploads.mangadex.org/covers/${manga.id}/${coverFileName}.256.jpg`
    : "";

  const authorRel = manga.relationships?.find((r: any) => r.type === "author");
  const artistRel = manga.relationships?.find((r: any) => r.type === "artist");

  const tags = (attrs.tags || []).map((t: any) => ({
    id: t.id,
    name: t.attributes?.name?.en || Object.values(t.attributes?.name || {})[0] || "",
  }));

  const lang = attrs.originalLanguage;
  let type: "manhwa" | "manhua" | "manga" = "manga";
  if (lang === "ko") type = "manhwa";
  else if (lang === "zh" || lang === "zh-hk") type = "manhua";

  return {
    id: manga.id,
    title: title as string,
    altTitles,
    description: description as string,
    status: attrs.status || "unknown",
    year: attrs.year,
    contentRating: attrs.contentRating,
    tags,
    coverUrl,
    author: authorRel?.attributes?.name || "Unknown",
    artist: artistRel?.attributes?.name || "",
    type,
    lastChapter: attrs.lastChapter || "",
    rating: 0,
    followCount: 0,
  };
}

export async function searchManga(options: {
  title?: string;
  originalLanguage?: string[];
  status?: string;
  includedTags?: string[];
  order?: Record<string, string>;
  limit?: number;
  offset?: number;
}): Promise<{ data: MangaResult[]; total: number }> {
  const params = new URLSearchParams();
  params.append("limit", String(options.limit || 20));
  params.append("offset", String(options.offset || 0));
  params.append("includes[]", "cover_art");
  params.append("includes[]", "author");
  params.append("includes[]", "artist");
  params.append("contentRating[]", "safe");
  params.append("contentRating[]", "suggestive");

  if (options.title) params.append("title", options.title);
  if (options.originalLanguage) {
    options.originalLanguage.forEach((l) => params.append("originalLanguage[]", l));
  }
  if (options.status) params.append("status[]", options.status);
  if (options.includedTags) {
    options.includedTags.forEach((t) => params.append("includedTags[]", t));
  }
  if (options.order) {
    Object.entries(options.order).forEach(([k, v]) => params.append(`order[${k}]`, v));
  }

  const res = await cachedFetch<any>("/manga", params.toString());
  return {
    data: (res.data || []).map(extractManga),
    total: res.total || 0,
  };
}

export async function getMangaById(id: string): Promise<MangaResult> {
  const params = new URLSearchParams();
  params.append("includes[]", "cover_art");
  params.append("includes[]", "author");
  params.append("includes[]", "artist");
  const res = await cachedFetch<any>(`/manga/${id}`, params.toString());
  return extractManga(res.data);
}

export async function getChapters(
  mangaId: string,
  offset = 0,
  limit = 100
): Promise<{ data: Chapter[]; total: number }> {
  const params = new URLSearchParams();
  params.append("order[chapter]", "asc");
  params.append("limit", String(limit));
  params.append("offset", String(offset));

  const res = await cachedFetch<any>(`/manga/${mangaId}/feed`, params.toString());
  
  const chapters: Chapter[] = (res.data || []).map((ch: any) => ({
    id: ch.id,
    chapter: ch.attributes.chapter || "0",
    title: ch.attributes.title || "",
    publishAt: ch.attributes.publishAt || "",
    pages: ch.attributes.pages || 0,
    volume: ch.attributes.volume,
  }));

  // Deduplicate by chapter number, keep first
  const seen = new Set<string>();
  const deduped = chapters.filter((ch) => {
    if (seen.has(ch.chapter)) return false;
    seen.add(ch.chapter);
    return true;
  });

  return { data: deduped, total: res.total || 0 };
}

export async function getAllChapters(mangaId: string): Promise<Chapter[]> {
  let allChapters: Chapter[] = [];
  let offset = 0;
  const limit = 500;
  let total = Infinity;

  while (offset < total) {
    const res = await getChapters(mangaId, offset, limit);
    allChapters = [...allChapters, ...res.data];
    total = res.total;
    offset += limit;
  }

  // Deduplicate
  const seen = new Set<string>();
  return allChapters.filter((ch) => {
    if (seen.has(ch.chapter)) return false;
    seen.add(ch.chapter);
    return true;
  });
}

export async function getChapterPages(chapterId: string): Promise<ChapterPages> {
  const res = await cachedFetch<any>(`/at-home/server/${chapterId}`, "");
  return {
    baseUrl: res.baseUrl,
    hash: res.chapter.hash,
    pages: res.chapter.data || [],
    pagesLowRes: res.chapter.dataSaver || [],
  };
}

export async function getTags(): Promise<{ id: string; name: string; group: string }[]> {
  const res = await cachedFetch<any>("/manga/tag", "");
  return (res.data || []).map((t: any) => ({
    id: t.id,
    name: t.attributes?.name?.en || "",
    group: t.attributes?.group || "",
  }));
}

export function getCoverUrl(mangaId: string, fileName: string, size: 256 | 512 = 256): string {
  return `https://uploads.mangadex.org/covers/${mangaId}/${fileName}.${size}.jpg`;
}

export function getFullCoverUrl(mangaId: string, fileName: string): string {
  return `https://uploads.mangadex.org/covers/${mangaId}/${fileName}`;
}
