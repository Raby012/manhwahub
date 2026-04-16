const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const SCRAPER_URL = `${SUPABASE_URL}/functions/v1/manga-scraper`;

const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 min

async function scraperFetch<T>(params: Record<string, string>): Promise<T> {
  const qs = new URLSearchParams(params).toString();
  const url = `${SCRAPER_URL}?${qs}`;

  const cached = cache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T;
  }

  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  if (data.error) throw new Error(data.error);
  cache.set(url, { data, timestamp: Date.now() });
  return data as T;
}

// --- Types ---

export interface MangaListItem {
  id: string;
  title: string;
  image: string;
  latestChapter?: string;
  author?: string;
  views?: number;
  genres?: string[];
}

export interface MangaDetail {
  id: string;
  title: string;
  image: string;
  author: string;
  status: string;
  genres: string[];
  description: string;
  chapters: ChapterListItem[];
}

export interface ChapterListItem {
  id: string;
  name: string;
  date?: string;
  views?: number;
}

export interface ChapterData {
  mangaId: string;
  chapterId: string;
  images: string[];
  prevChapter: string | null;
  nextChapter: string | null;
}

export interface HomeData {
  popular: MangaListItem[];
  latest: MangaListItem[];
}

export interface MangaListResponse {
  mangas: MangaListItem[];
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
}

export interface SearchResponse {
  mangas: MangaListItem[];
  totalPages: number;
}

// --- API calls ---

export async function getHome(): Promise<HomeData> {
  return scraperFetch<HomeData>({ action: "home" });
}

export async function getLatest(page = 1): Promise<MangaListResponse> {
  return scraperFetch<MangaListResponse>({ action: "latest", page: String(page) });
}

export async function getPopular(page = 1): Promise<MangaListResponse> {
  return scraperFetch<MangaListResponse>({ action: "popular", page: String(page) });
}

export async function searchManga(query: string, page = 1): Promise<SearchResponse> {
  return scraperFetch<SearchResponse>({ action: "search", q: query, page: String(page) });
}

export async function getMangaDetail(id: string): Promise<MangaDetail> {
  return scraperFetch<MangaDetail>({ action: "detail", id });
}

export async function getChapterImages(mangaId: string, chapterId: string): Promise<ChapterData> {
  return scraperFetch<ChapterData>({ action: "read", id: mangaId, chapter: chapterId });
}
