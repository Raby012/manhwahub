import { corsHeaders } from "@supabase/supabase-js/cors";

const BASE_URL = "https://www.mangakakalot.gg";
const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Referer: "https://www.mangakakalot.gg/",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.5",
};

// Simple HTML text extraction helpers (no cheerio in Deno edge functions)
function extractBetween(html: string, startMarker: string, endMarker: string): string {
  const startIdx = html.indexOf(startMarker);
  if (startIdx === -1) return "";
  const afterStart = startIdx + startMarker.length;
  const endIdx = html.indexOf(endMarker, afterStart);
  if (endIdx === -1) return html.substring(afterStart);
  return html.substring(afterStart, endIdx);
}

function extractAll(html: string, startMarker: string, endMarker: string): string[] {
  const results: string[] = [];
  let pos = 0;
  while (true) {
    const startIdx = html.indexOf(startMarker, pos);
    if (startIdx === -1) break;
    const afterStart = startIdx + startMarker.length;
    const endIdx = html.indexOf(endMarker, afterStart);
    if (endIdx === -1) break;
    results.push(html.substring(afterStart, endIdx));
    pos = endIdx + endMarker.length;
  }
  return results;
}

function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

function extractAttr(tag: string, attr: string): string {
  const regex = new RegExp(`${attr}\\s*=\\s*["']([^"']*)["']`);
  const match = tag.match(regex);
  return match ? match[1] : "";
}

// ===== SCRAPING FUNCTIONS =====

async function fetchHTML(url: string): Promise<string> {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.text();
}

async function scrapeLatest(page: number) {
  const url = `${BASE_URL}/manga-list/latest-manga${page > 1 ? "?page=" + page : ""}`;
  const html = await fetchHTML(url);
  return parseMangaList(html);
}

async function scrapePopular(page: number) {
  const url = `${BASE_URL}/manga-list/hot-manga${page > 1 ? "?page=" + page : ""}`;
  const html = await fetchHTML(url);
  return parseMangaList(html);
}

async function scrapeSearch(query: string, page: number) {
  const encoded = encodeURIComponent(query).replace(/%20/g, "_");
  const url = `${BASE_URL}/search/story/${encoded}${page > 1 ? "?page=" + page : ""}`;
  const html = await fetchHTML(url);
  return parseSearchResults(html);
}

async function scrapeDetail(mangaId: string) {
  const url = `${BASE_URL}/manga/${mangaId}`;
  const html = await fetchHTML(url);
  return parseMangaDetail(html, mangaId);
}

async function scrapeChapter(mangaId: string, chapterId: string) {
  const url = `${BASE_URL}/manga/${mangaId}/${chapterId}`;
  const html = await fetchHTML(url);
  return parseChapterImages(html, mangaId, chapterId);
}

async function scrapeHome() {
  const html = await fetchHTML(BASE_URL);
  return parseHomePage(html);
}

// ===== PARSING FUNCTIONS =====

function parseMangaList(html: string) {
  const mangas: any[] = [];

  // Extract each manga item from list
  const items = extractAll(html, '<div class="list-truyen-item-wrap"', '</div>');

  for (const item of items) {
    // Get link and title from h3 > a
    const h3Content = extractBetween(item, "<h3", "</h3>");
    const linkTag = extractBetween(h3Content, "<a", "</a>");
    const href = extractAttr("<a" + linkTag, "href");
    const title = stripTags(linkTag);
    const id = href ? href.split("/manga/")[1] : "";

    // Get image
    const imgMatch = item.match(/<img[^>]*src\s*=\s*["']([^"']+)["']/);
    const image = imgMatch ? imgMatch[1] : "";

    // Get latest chapter
    const chapterMatch = item.match(/list-story-item-wrap-chapter[^>]*>([^<]*)</);
    const latestChapter = chapterMatch ? chapterMatch[1].trim() : "";

    if (id && title) {
      mangas.push({ id, title, image, latestChapter });
    }
  }

  // Pagination
  const totalPagesMatch = html.match(/Last\((\d+)\)/);
  const totalPages = totalPagesMatch ? parseInt(totalPagesMatch[1]) : 1;
  const currentPageMatch = html.match(/class="page_select">(\d+)</);
  const currentPage = currentPageMatch ? parseInt(currentPageMatch[1]) : 1;

  return { mangas, currentPage, totalPages, hasNextPage: currentPage < totalPages };
}

function parseSearchResults(html: string) {
  const mangas: any[] = [];

  // Search results use .story_item class
  const storySection = html.split('class="panel_story_list"')[1] || html;
  const items = storySection.split('class="story_item"').slice(1);

  for (const item of items) {
    // Title and link
    const nameSection = extractBetween(item, 'class="story_name"', "</a>");
    const hrefMatch = nameSection.match(/href\s*=\s*["']([^"']+)["']/);
    const href = hrefMatch ? hrefMatch[1] : "";
    const title = stripTags(nameSection);
    const id = href ? href.split("/manga/")[1]?.split('"')[0] : "";

    // Image
    const imgMatch = item.match(/<img[^>]*src\s*=\s*["']([^"']+)["']/);
    const image = imgMatch ? imgMatch[1] : "";

    // Author
    const authorMatch = item.match(/Author[^:]*:\s*<\/span>\s*([^<]*)/);
    const author = authorMatch ? authorMatch[1].trim() : "";

    if (id && title) {
      mangas.push({ id, title, image, author });
    }
  }

  const totalPagesMatch = html.match(/Last\((\d+)\)/);
  const totalPages = totalPagesMatch ? parseInt(totalPagesMatch[1]) : 1;

  return { mangas, totalPages };
}

function parseMangaDetail(html: string, mangaId: string) {
  // Title
  const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
  const title = titleMatch ? titleMatch[1].trim() : "";

  // Image
  const picSection = extractBetween(html, 'class="manga-info-pic"', "</div>");
  const imgMatch = picSection.match(/<img[^>]*src\s*=\s*["']([^"']+)["']/);
  const image = imgMatch ? imgMatch[1] : "";

  // Author
  const authorMatch = html.match(/Author[^:]*:\s*<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>/i) 
    || html.match(/Author[^:]*:[^<]*<\/li>/i);
  let author = "";
  if (authorMatch) {
    author = stripTags(authorMatch[1] || authorMatch[0]).replace(/Author\(s\)\s*:/i, "").trim();
  }

  // Status
  const statusMatch = html.match(/Status\s*:\s*<\/td>\s*<td[^>]*>([^<]+)/i)
    || html.match(/Status\s*:\s*([^<\n]+)/i);
  const status = statusMatch ? stripTags(statusMatch[1]).trim() : "";

  // Genres
  const genres: string[] = [];
  const genreMatches = html.match(/class="genres"[^>]*>([\s\S]*?)<\/li>/);
  if (genreMatches) {
    const genreLinks = genreMatches[1].match(/<a[^>]*>([^<]+)<\/a>/g) || [];
    for (const g of genreLinks) {
      genres.push(stripTags(g));
    }
  }

  // Description
  const descMatch = html.match(/id="contentBox"[^>]*>([\s\S]*?)<\/div>/i)
    || html.match(/id="panel-story-info-description"[^>]*>([\s\S]*?)<\/div>/i);
  const description = descMatch ? stripTags(descMatch[1]).replace(/Description\s*:/i, "").trim() : "";

  // Chapters
  const chapters: any[] = [];
  const chapterSection = html.split('class="chapter-list"')[1] || html.split('class="row-content-chapter"')[1] || "";
  
  // Try both formats
  const chapterRows = chapterSection ? chapterSection.split('class="row"').slice(1) : [];
  
  if (chapterRows.length > 0) {
    for (const row of chapterRows) {
      const linkMatch = row.match(/<a[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([^<]+)<\/a>/);
      if (linkMatch) {
        const chapterUrl = linkMatch[1];
        const chapterName = linkMatch[2].trim();
        const chapterId = chapterUrl.split("/").pop() || "";
        const dateMatch = row.match(/<span[^>]*title\s*=\s*["']([^"']+)["']/);
        const date = dateMatch ? dateMatch[1] : "";
        chapters.push({ id: chapterId, name: chapterName, date });
      }
    }
  } else {
    // Try alternate format: ul > li > a
    const chapterLinks = chapterSection ? 
      (chapterSection.match(/<li[^>]*>[\s\S]*?<\/li>/g) || []) : [];
    for (const li of chapterLinks) {
      const linkMatch = li.match(/<a[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([^<]+)<\/a>/);
      if (linkMatch) {
        const chapterUrl = linkMatch[1];
        const chapterName = linkMatch[2].trim();
        const chapterId = chapterUrl.split("/").pop() || "";
        chapters.push({ id: chapterId, name: chapterName, date: "" });
      }
    }
  }

  return {
    id: mangaId,
    title,
    image,
    author,
    status,
    genres,
    description,
    chapters,
  };
}

function parseChapterImages(html: string, mangaId: string, chapterId: string) {
  const images: string[] = [];

  // Extract images from container-chapter-reader
  const readerSection = html.split("container-chapter-reader")[1] || html;
  const imgMatches = readerSection.match(/<img[^>]*src\s*=\s*["']([^"']+)["'][^>]*>/g) || [];

  for (const imgTag of imgMatches) {
    const src = extractAttr(imgTag, "src");
    if (src && (src.includes("mangakakalot") || src.includes("mangaimage") || src.includes("chapmanganato") || src.includes("avt.mkklcdnv6temp") || src.includes("cm.") || src.includes("blog"))) {
      images.push(src);
    }
  }

  // Also try data-src
  if (images.length === 0) {
    const dataSrcMatches = readerSection.match(/data-src\s*=\s*["']([^"']+)["']/g) || [];
    for (const match of dataSrcMatches) {
      const src = match.replace(/data-src\s*=\s*["']/, "").replace(/["']$/, "");
      if (src.startsWith("http")) images.push(src);
    }
  }

  // Navigation
  let prevChapter: string | null = null;
  let nextChapter: string | null = null;

  const prevMatch = html.match(/class="[^"]*next[^"]*"[^>]*href\s*=\s*["']([^"']+)["']/);
  if (prevMatch) prevChapter = prevMatch[1].split("/").pop() || null;

  const nextMatch = html.match(/class="[^"]*back[^"]*"[^>]*href\s*=\s*["']([^"']+)["']/);
  if (nextMatch) nextChapter = nextMatch[1].split("/").pop() || null;

  // Also try navi-change-chapter buttons
  if (!prevChapter || !nextChapter) {
    const navBtns = html.match(/<a[^>]*class="[^"]*navi-change-chapter-btn[^"]*"[^>]*href="([^"]+)"[^>]*>/g) || [];
    for (const btn of navBtns) {
      const href = extractAttr(btn, "href");
      if (btn.includes("PREV") || btn.includes("prev")) {
        prevChapter = href.split("/").pop() || null;
      }
      if (btn.includes("NEXT") || btn.includes("next")) {
        nextChapter = href.split("/").pop() || null;
      }
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

function parseHomePage(html: string) {
  const popular: any[] = [];
  const latest: any[] = [];

  // Popular slider
  const sliderItems = html.split('class="item"').slice(1, 11);
  for (const item of sliderItems) {
    const linkMatch = item.match(/<a[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([^<]*)<\/a>/);
    const imgMatch = item.match(/<img[^>]*src\s*=\s*["']([^"']+)["']/);
    if (linkMatch) {
      const href = linkMatch[1];
      const title = linkMatch[2].trim() || stripTags(extractBetween(item, "<h3", "</h3>"));
      const id = href.split("/manga/")[1] || "";
      const image = imgMatch ? imgMatch[1] : "";
      if (id && title) popular.push({ id, title, image });
    }
  }

  // Latest updates
  const updateSection = html.split("contentstory")[1] || "";
  const updateItems = updateSection.split("itemupdate").slice(1, 25);
  for (const item of updateItems) {
    const h3 = extractBetween(item, "<h3", "</h3>");
    const linkMatch = h3.match(/<a[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([^<]*)<\/a>/);
    const imgMatch = item.match(/<img[^>]*(?:src|data-src)\s*=\s*["']([^"']+)["']/);
    if (linkMatch) {
      const href = linkMatch[1];
      const title = linkMatch[2].trim();
      const id = href.split("/manga/")[1] || "";
      const image = imgMatch ? imgMatch[1] : "";
      if (id && title) latest.push({ id, title, image });
    }
  }

  return { popular, latest };
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
        data = await scrapeHome();
        break;
      case "latest":
        data = await scrapeLatest(page);
        break;
      case "popular":
        data = await scrapePopular(page);
        break;
      case "search":
        data = await scrapeSearch(query, page);
        break;
      case "detail":
        if (!id) throw new Error("Missing 'id' parameter");
        data = await scrapeDetail(id);
        break;
      case "read":
        if (!id || !chapter) throw new Error("Missing 'id' or 'chapter' parameter");
        data = await scrapeChapter(id, chapter);
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
      JSON.stringify({ error: error.message || "Scraping failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
