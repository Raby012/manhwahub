const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const MANGADEX = "https://api.mangadex.org";

function getTitle(attrs: any): string {
  return attrs.title?.en || attrs.title?.["ja-ro"] || attrs.title?.ja || Object.values(attrs.title || {})[0] as string || "Untitled";
}

function getCover(manga: any): string {
  const cover = manga.relationships?.find((r: any) => r.type === "cover_art");
  if (cover?.attributes?.fileName) {
    return `https://uploads.mangadex.org/covers/${manga.id}/${cover.attributes.fileName}.512.jpg`;
  }
  return "";
}

function getCoverThumb(manga: any): string {
  const cover = manga.relationships?.find((r: any) => r.type === "cover_art");
  if (cover?.attributes?.fileName) {
    return `https://uploads.mangadex.org/covers/${manga.id}/${cover.attributes.fileName}.256.jpg`;
  }
  return "";
}

function getAuthor(manga: any): string {
  const author = manga.relationships?.find((r: any) => r.type === "author");
  return author?.attributes?.name || "";
}

async function mdFetch(path: string) {
  const res = await fetch(`${MANGADEX}${path}`, {
    headers: { "User-Agent": "ManhwaHub/1.0" },
  });
  if (!res.ok) throw new Error(`MangaDex error: ${res.status}`);
  return res.json();
}

// ===== API FUNCTIONS =====

async function getPopular(page: number) {
  const offset = (page - 1) * 24;
  const data = await mdFetch(
    `/manga?limit=24&offset=${offset}&order[followedCount]=desc&contentRating[]=safe&contentRating[]=suggestive&includes[]=cover_art&includes[]=author&availableTranslatedLanguage[]=en`
  );
  return {
    mangas: data.data.map((m: any) => ({
      id: m.id,
      title: getTitle(m.attributes),
      image: getCoverThumb(m),
      author: getAuthor(m),
      status: m.attributes.status,
    })),
    total: data.total,
    currentPage: page,
    totalPages: Math.ceil(data.total / 24),
    hasNextPage: offset + 24 < data.total,
  };
}

async function getLatest(page: number) {
  const offset = (page - 1) * 24;
  const data = await mdFetch(
    `/manga?limit=24&offset=${offset}&order[latestUploadedChapter]=desc&contentRating[]=safe&contentRating[]=suggestive&includes[]=cover_art&includes[]=author&availableTranslatedLanguage[]=en`
  );
  return {
    mangas: data.data.map((m: any) => ({
      id: m.id,
      title: getTitle(m.attributes),
      image: getCoverThumb(m),
      author: getAuthor(m),
      status: m.attributes.status,
    })),
    total: data.total,
    currentPage: page,
    totalPages: Math.ceil(data.total / 24),
    hasNextPage: offset + 24 < data.total,
  };
}

async function searchManga(query: string, page: number) {
  const offset = (page - 1) * 24;
  const data = await mdFetch(
    `/manga?limit=24&offset=${offset}&title=${encodeURIComponent(query)}&contentRating[]=safe&contentRating[]=suggestive&includes[]=cover_art&includes[]=author&availableTranslatedLanguage[]=en&order[relevance]=desc`
  );
  return {
    mangas: data.data.map((m: any) => ({
      id: m.id,
      title: getTitle(m.attributes),
      image: getCoverThumb(m),
      author: getAuthor(m),
      status: m.attributes.status,
    })),
    total: data.total,
    totalPages: Math.ceil(data.total / 24),
  };
}

async function getMangaDetail(id: string) {
  const [mangaRes, chaptersRes] = await Promise.all([
    mdFetch(`/manga/${id}?includes[]=cover_art&includes[]=author&includes[]=artist`),
    mdFetch(`/manga/${id}/feed?limit=500&translatedLanguage[]=en&order[chapter]=asc&includes[]=scanlation_group`),
  ]);

  const manga = mangaRes.data;
  const attrs = manga.attributes;

  // Deduplicate chapters by chapter number (keep first)
  const seen = new Set<string>();
  const chapters = chaptersRes.data
    .filter((c: any) => {
      const num = c.attributes.chapter || c.id;
      if (seen.has(num)) return false;
      seen.add(num);
      return true;
    })
    .map((c: any) => ({
      id: c.id,
      name: `Chapter ${c.attributes.chapter || "?"}${c.attributes.title ? " - " + c.attributes.title : ""}`,
      chapter: c.attributes.chapter,
      date: c.attributes.publishAt?.split("T")[0] || "",
    }));

  const description = attrs.description?.en || attrs.description?.["ja-ro"] || Object.values(attrs.description || {})[0] as string || "";

  return {
    id: manga.id,
    title: getTitle(attrs),
    image: getCover(manga),
    author: getAuthor(manga),
    status: attrs.status || "",
    genres: (attrs.tags || [])
      .filter((t: any) => t.attributes?.group === "genre")
      .map((t: any) => t.attributes.name?.en || ""),
    description,
    chapters,
  };
}

async function getChapterImages(chapterId: string) {
  const atHomeRes = await fetch(`${MANGADEX}/at-home/server/${chapterId}`);
  if (!atHomeRes.ok) throw new Error(`at-home error: ${atHomeRes.status}`);
  const atHome = await atHomeRes.json();

  const baseUrl = atHome.baseUrl;
  const hash = atHome.chapter.hash;
  const images = atHome.chapter.data.map((f: string) => `${baseUrl}/data/${hash}/${f}`);

  // Get chapter info for navigation
  const chapterRes = await mdFetch(`/chapter/${chapterId}?includes[]=manga`);
  const chapter = chapterRes.data;
  const mangaId = chapter.relationships?.find((r: any) => r.type === "manga")?.id || "";
  const chapterNum = chapter.attributes.chapter;

  // Get prev/next chapters
  let prevChapter: string | null = null;
  let nextChapter: string | null = null;

  if (mangaId && chapterNum) {
    const num = parseFloat(chapterNum);
    // Get next
    const nextRes = await mdFetch(
      `/manga/${mangaId}/feed?limit=1&translatedLanguage[]=en&order[chapter]=asc&chapter[]=${num + 1}`
    );
    if (nextRes.data.length > 0) nextChapter = nextRes.data[0].id;

    // Get prev
    if (num > 1) {
      const prevRes = await mdFetch(
        `/manga/${mangaId}/feed?limit=1&translatedLanguage[]=en&order[chapter]=desc&chapter[]=${num - 1}`
      );
      if (prevRes.data.length > 0) prevChapter = prevRes.data[0].id;
    }
  }

  return {
    mangaId,
    chapterId,
    images,
    prevChapter,
    nextChapter,
  };
}

async function getHome() {
  const [popularRes, latestRes] = await Promise.all([
    mdFetch(`/manga?limit=10&order[followedCount]=desc&contentRating[]=safe&contentRating[]=suggestive&includes[]=cover_art&availableTranslatedLanguage[]=en`),
    mdFetch(`/manga?limit=18&order[latestUploadedChapter]=desc&contentRating[]=safe&contentRating[]=suggestive&includes[]=cover_art&availableTranslatedLanguage[]=en`),
  ]);

  return {
    popular: popularRes.data.map((m: any) => ({
      id: m.id,
      title: getTitle(m.attributes),
      image: getCover(m),
    })),
    latest: latestRes.data.map((m: any) => ({
      id: m.id,
      title: getTitle(m.attributes),
      image: getCoverThumb(m),
    })),
  };
}

// ===== MAIN HANDLER =====

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "home";
    const page = parseInt(url.searchParams.get("page") || "1");
    const id = url.searchParams.get("id") || "";
    const chapter = url.searchParams.get("chapter") || "";
    const query = url.searchParams.get("q") || "";

    let data: any;

    switch (action) {
      case "home":
        data = await getHome();
        break;
      case "latest":
        data = await getLatest(page);
        break;
      case "popular":
        data = await getPopular(page);
        break;
      case "search":
        data = await searchManga(query, page);
        break;
      case "detail":
        if (!id) throw new Error("Missing 'id' parameter");
        data = await getMangaDetail(id);
        break;
      case "read":
        if (!chapter) throw new Error("Missing 'chapter' parameter");
        data = await getChapterImages(chapter);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "public, max-age=300" },
    });
  } catch (error) {
    console.error("Scraper error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to fetch data" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
