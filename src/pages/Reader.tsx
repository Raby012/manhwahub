import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  getChapterPages,
  getChapters,
  getMangaInfo,
  PROXY_IMG,
  type MangaSource,
  type ChapterItem,
} from "@/lib/api";
import { pushHistory } from "@/lib/storage";
import { ArrowLeft, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";

export default function Reader() {
  const { source, id, chapterId } = useParams<{ source: MangaSource; id: string; chapterId: string }>();
  const navigate = useNavigate();
  const [pages, setPages] = useState<string[]>([]);
  const [chapters, setChapters] = useState<ChapterItem[]>([]);
  const [info, setInfo] = useState<{ title: string; cover?: string; contentType?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imgErr, setImgErr] = useState<Set<number>>(new Set());

  const load = useCallback(async () => {
    if (!source || !id || !chapterId) return;
    setLoading(true);
    setError(null);
    setPages([]);
    setImgErr(new Set());
    try {
      const info = await getMangaInfo(id, source).catch(() => null);
      const ch = await getChapters(id, source, 1, "en", info?.title).catch(() => ({ chapters: [] as ChapterItem[] }));
      const currentCh = (ch.chapters || []).find((c) => c.id === chapterId);
      let pg = await getChapterPages(id, chapterId, source, currentCh?.source).catch(() => null as any);
      if (!pg || !pg.pages || pg.pages.length === 0) {
        pg = await getChapterPages(id, chapterId, "comick", "comick").catch(() => null as any);
      }
      if (!pg || !pg.pages || pg.pages.length === 0) {
        throw new Error("No pages available. This chapter may be exclusively on an official platform.");
      }
      setPages(pg.pages);
      setChapters(ch.chapters || []);
      if (info) {
        setInfo({ title: info.title, cover: info.coverUrl, contentType: info.contentType });
        const current = (ch.chapters || []).find((c) => c.id === chapterId);
        pushHistory({
          source,
          id,
          title: info.title,
          cover: info.coverUrl,
          chapterId,
          chapterLabel: current ? `Ch. ${current.chapter}` : "Reading",
        });
      }
    } catch (e: any) {
      setError(e.message || "Failed to load chapter.");
    } finally {
      setLoading(false);
    }
  }, [source, id, chapterId]);

  useEffect(() => {
    load();
    window.scrollTo(0, 0);
  }, [load]);

  // chapters list often newest-first → prev = newer, next = older. We invert: "next" = next chronological number.
  const sorted = [...chapters].sort((a, b) => parseFloat(a.chapter) - parseFloat(b.chapter));
  const idx = sorted.findIndex((c) => c.id === chapterId);
  const prevCh = idx > 0 ? sorted[idx - 1] : null;
  const nextCh = idx >= 0 && idx < sorted.length - 1 ? sorted[idx + 1] : null;

  function go(ch: ChapterItem | null) {
    if (!ch || !source || !id) return;
    navigate(`/manga/${source}/${encodeURIComponent(id)}/chapter/${encodeURIComponent(ch.id)}`);
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between gap-3 px-4 h-14">
          <Link to={source && id ? `/manga/${source}/${encodeURIComponent(id)}` : "/"} className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm">
            <ArrowLeft className="w-4 h-4" />
            <span className="truncate max-w-[40vw]">{info?.title ?? "Back"}</span>
          </Link>
          <div className="flex items-center gap-2">
            <button onClick={() => go(prevCh)} disabled={!prevCh} className="p-2 rounded-md bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => go(nextCh)} disabled={!nextCh} className="p-2 rounded-md bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      {loading ? (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading chapter...</p>
        </div>
      ) : error ? (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4 text-center">
          <p className="text-muted-foreground">{error}</p>
          <button onClick={load} className="px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto pb-16">
          {pages.map((url, i) => {
            const proxied = PROXY_IMG(url);
            return (
              <div key={i} className="relative">
                {imgErr.has(i) ? (
                  <div className="w-full aspect-[2/3] bg-muted flex flex-col items-center justify-center gap-3 text-muted-foreground text-sm">
                    <p>Failed to load page {i + 1}</p>
                    <button
                      onClick={() => setImgErr((s) => { const n = new Set(s); n.delete(i); return n; })}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs flex items-center gap-2"
                    >
                      <RefreshCw className="w-3 h-3" /> Retry
                    </button>
                  </div>
                ) : (
                  <img
                    src={proxied}
                    alt={`Page ${i + 1}`}
                    loading={i < 3 ? "eager" : "lazy"}
                    referrerPolicy="no-referrer"
                    className="w-full block bg-muted"
                    onError={() => setImgErr((s) => new Set(s).add(i))}
                  />
                )}
              </div>
            );
          })}

          <div className="py-12 text-center flex flex-col items-center gap-4">
            <p className="text-muted-foreground text-sm">End of chapter</p>
            <div className="flex gap-3">
              {prevCh && (
                <button onClick={() => go(prevCh)} className="px-5 py-2.5 bg-muted rounded-lg flex items-center gap-2">
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>
              )}
              {nextCh && (
                <button onClick={() => go(nextCh)} className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg flex items-center gap-2">
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
