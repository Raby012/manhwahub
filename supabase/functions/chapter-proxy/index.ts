import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const comicKHeaders = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
  "Accept": "application/json",
  "Referer": "https://comick.io/",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "public, max-age=120" },
  });
}

function message(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function getChapterId(url: URL) {
  const parts = url.pathname.split("/").filter(Boolean);
  return decodeURIComponent(parts[parts.length - 1] || "");
}

function pickEnglishTitle(mangaData: any) {
  const titleObj = mangaData?.data?.attributes?.title || {};
  const altTitles = mangaData?.data?.attributes?.altTitles || [];

  for (const alt of altTitles) {
    if (alt?.en) return alt.en;
  }

  return titleObj.en || Object.values(titleObj).find(Boolean) || "";
}

function comicKImageUrl(img: any) {
  if (typeof img?.url === "string" && img.url) return img.url;
  if (typeof img?.b2key === "string" && img.b2key) {
    return `https://meo.comick.pictures/${img.b2key.replace(/^\/+/, "")}`;
  }
  return "";
}

async function getMangaDexPages(chapterId: string) {
  const mdRes = await fetch(`https://api.mangadex.org/at-home/server/${encodeURIComponent(chapterId)}`, {
    headers: { "Accept": "application/json" },
  });

  if (!mdRes.ok) return [];

  const data = await mdRes.json();
  const { baseUrl, chapter } = data;
  const files = Array.isArray(chapter?.dataSaver) && chapter.dataSaver.length > 0 ? chapter.dataSaver : chapter?.data || [];
  const quality = files === chapter?.dataSaver ? "data-saver" : "data";

  if (!baseUrl || !chapter?.hash || files.length === 0) return [];

  return files.map((file: string) => `${baseUrl}/${quality}/${chapter.hash}/${file}`);
}

async function getComicKPages(mangaId: string | null, chapterNum: string | null) {
  if (!mangaId || !chapterNum) return [];

  const infoRes = await fetch(`https://api.mangadex.org/manga/${encodeURIComponent(mangaId)}?includes[]=cover_art`, {
    headers: { "Accept": "application/json" },
  });
  if (!infoRes.ok) return [];

  const title = String(pickEnglishTitle(await infoRes.json()) || "");
  if (!title) return [];

  const searchRes = await fetch(`https://api.comick.fun/v1.0/search?q=${encodeURIComponent(title)}&limit=5`, {
    headers: comicKHeaders,
  });
  if (!searchRes.ok) return [];

  const searchData = await searchRes.json();
  const hid = Array.isArray(searchData) ? searchData[0]?.hid : searchData?.[0]?.hid;
  if (!hid) return [];

  const chapRes = await fetch(`https://api.comick.fun/comic/${encodeURIComponent(hid)}/chapters?lang=en&limit=500`, {
    headers: comicKHeaders,
  });
  if (!chapRes.ok) return [];

  const chapData = await chapRes.json();
  const chapters = Array.isArray(chapData?.chapters) ? chapData.chapters : [];
  const wanted = Number.parseFloat(chapterNum);
  const target = chapters.find((chapter: any) => Number.parseFloat(String(chapter?.chap || "")) === wanted);
  if (!target?.hid) return [];

  const imgRes = await fetch(`https://api.comick.fun/chapter/${encodeURIComponent(target.hid)}`, {
    headers: comicKHeaders,
  });
  if (!imgRes.ok) return [];

  const imgData = await imgRes.json();
  const images = imgData?.chapter?.images || imgData?.images || [];

  return images.map(comicKImageUrl).filter(Boolean);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "GET") return json({ error: "Method not allowed" }, 405);

  const url = new URL(req.url);
  const chapterId = getChapterId(url);
  const chapterNum = url.searchParams.get("num");
  const mangaId = url.searchParams.get("mangaId");

  if (!chapterId) return json({ pages: [], source: "none", total: 0 });

  try {
    const pages = await getMangaDexPages(chapterId);
    if (pages.length > 0) return json({ pages, source: "mangadex", total: pages.length });
  } catch (error) {
    console.log("MangaDex failed:", message(error));
  }

  try {
    const pages = await getComicKPages(mangaId, chapterNum);
    if (pages.length > 0) return json({ pages, source: "comick", total: pages.length });
  } catch (error) {
    console.log("Comick failed:", message(error));
  }

  return json({ pages: [], source: "none", total: 0 });
});