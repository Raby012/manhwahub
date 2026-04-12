import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getMangaById, getAllChapters, getChapterPages, type MangaResult, type Chapter, type ChapterPages } from "@/lib/mangadex";
import { setProgress, markChapterRead } from "@/lib/storage";
import { ChevronLeft, ChevronRight, Settings, ArrowLeft, RefreshCw } from "lucide-react";

type ReadingMode = "vertical" | "horizontal";
type BgMode = "dark" | "light" | "sepia";

export default function Reader() {
  const { manhwaId, chapterId } = useParams<{ manhwaId: string; chapterId: string }>();
  const navigate = useNavigate();
  const [manga, setManga] = useState<MangaResult | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [mode, setMode] = useState<ReadingMode>("vertical");
  const [bg, setBg] = useState<BgMode>("dark");
  const [showSettings, setShowSettings] = useState(false);
  const [showUI, setShowUI] = useState(true);
  const [imgLoaded, setImgLoaded] = useState<Set<number>>(new Set());
  const [imgErrors, setImgErrors] = useState<Set<number>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const currentChapter = chapters.find((c) => c.id === chapterId);
  const currentIdx = chapters.findIndex((c) => c.id === chapterId);
  const prevChapter = currentIdx > 0 ? chapters[currentIdx - 1] : null;
  const nextChapter = currentIdx < chapters.length - 1 ? chapters[currentIdx + 1] : null;

  const loadPages = useCallback(async (chapId: string) => {
    setLoading(true);
    setError(null);
    setImageUrls([]);
    setImgLoaded(new Set());
    setImgErrors(new Set());
    setCurrentPage(0);

    try {
      const pagesData = await getChapterPages(chapId);

      if (!pagesData.baseUrl || !pagesData.hash) {
        throw new Error("Invalid chapter data received");
      }

      // Build image URLs - prefer full quality, fallback to data-saver
      const pageFiles = pagesData.pages.length > 0 ? pagesData.pages : pagesData.pagesLowRes;
      const quality = pagesData.pages.length > 0 ? "data" : "data-saver";

      if (pageFiles.length === 0) {
        throw new Error("NO_PAGES");
      }

      const urls = pageFiles.map(
        (filename) => `${pagesData.baseUrl}/${quality}/${pagesData.hash}/${filename}`
      );

      setImageUrls(urls);
    } catch (err: any) {
      console.error("Failed to load chapter pages:", err);
      if (err.message === "NO_PAGES") {
        setError("This chapter has no readable pages. It may be hosted externally.");
      } else {
        setError("Failed to load chapter pages. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!manhwaId || !chapterId) return;

    // Load manga info and chapters in parallel with pages
    Promise.all([
      getMangaById(manhwaId),
      getAllChapters(manhwaId),
    ]).then(([m, c]) => {
      setManga(m);
      setChapters(c);
      const ch = c.find((ch) => ch.id === chapterId);
      if (ch) {
        markChapterRead(manhwaId, ch.chapter);
        setProgress({ mangaId: manhwaId, chapterId, chapterNumber: ch.chapter, page: 0, timestamp: Date.now() });
      }
    }).catch(console.error);

    loadPages(chapterId);
  }, [manhwaId, chapterId, loadPages]);

  const goToPage = useCallback((page: number) => {
    const p = Math.max(0, Math.min(page, imageUrls.length - 1));
    setCurrentPage(p);
    if (manhwaId && currentChapter) {
      setProgress({ mangaId: manhwaId, chapterId: chapterId!, chapterNumber: currentChapter.chapter, page: p, timestamp: Date.now() });
    }
  }, [imageUrls.length, manhwaId, chapterId, currentChapter]);

  const goNextChapter = useCallback(() => {
    if (nextChapter) navigate(`/read/${manhwaId}/${nextChapter.id}`);
  }, [nextChapter, manhwaId, navigate]);

  const goPrevChapter = useCallback(() => {
    if (prevChapter) navigate(`/read/${manhwaId}/${prevChapter.id}`);
  }, [prevChapter, manhwaId, navigate]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (mode === "horizontal") {
        if (e.key === "ArrowRight" || e.key === " ") {
          e.preventDefault();
          if (currentPage >= imageUrls.length - 1) goNextChapter();
          else goToPage(currentPage + 1);
        }
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          if (currentPage <= 0) goPrevChapter();
          else goToPage(currentPage - 1);
        }
      }
      if (e.key === "Escape") setShowSettings(false);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [mode, currentPage, imageUrls.length, goToPage, goNextChapter, goPrevChapter]);

  function handleMouseMove() {
    setShowUI(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setShowUI(false), 3000);
  }

  const retryPage = (idx: number) => {
    setImgErrors((prev) => { const s = new Set(prev); s.delete(idx); return s; });
    setImgLoaded((prev) => { const s = new Set(prev); s.delete(idx); return s; });
    // Force reload by appending timestamp
    setImageUrls((prev) => {
      const updated = [...prev];
      const base = updated[idx].split("?")[0];
      updated[idx] = `${base}?t=${Date.now()}`;
      return updated;
    });
  };

  const bgClass = bg === "dark" ? "bg-background" : bg === "sepia" ? "bg-amber-50" : "bg-white";

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Loading chapter...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4 px-4 text-center">
        <p className="text-muted-foreground">{error}</p>
        <div className="flex gap-3">
          <button
            onClick={() => chapterId && loadPages(chapterId)}
            className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-primary/90 transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
          {nextChapter && (
            <button
              onClick={goNextChapter}
              className="px-6 py-2.5 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors"
            >
              Next Chapter →
            </button>
          )}
          <Link
            to={`/manhwa/${manhwaId}`}
            className="px-6 py-2.5 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors"
          >
            Go Back
          </Link>
        </div>
      </div>
    );
  }

  // No images
  if (imageUrls.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <p className="text-muted-foreground">No pages available for this chapter.</p>
        <div className="flex gap-3">
          {nextChapter && (
            <button onClick={goNextChapter} className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
              Next Chapter →
            </button>
          )}
          <Link to={`/manhwa/${manhwaId}`} className="px-6 py-2.5 bg-muted text-foreground rounded-lg text-sm font-medium">Go Back</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bgClass} transition-colors`} onMouseMove={handleMouseMove} onClick={() => mode === "horizontal" && setShowUI(!showUI)}>
      {/* Top bar */}
      <div className={`fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border transition-transform duration-300 ${showUI ? "translate-y-0" : "-translate-y-full"}`}>
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3 min-w-0">
            <Link to={`/manhwa/${manhwaId}`} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{manga?.title || "Loading..."}</p>
              <p className="text-xs text-muted-foreground">Chapter {currentChapter?.chapter || "?"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={chapterId}
              onChange={(e) => navigate(`/read/${manhwaId}/${e.target.value}`)}
              className="px-2 py-1 bg-muted rounded text-xs text-foreground border border-border max-w-[120px]"
            >
              {chapters.map((c) => (
                <option key={c.id} value={c.id}>Ch. {c.chapter}</option>
              ))}
            </select>
            <button onClick={() => setShowSettings(!showSettings)} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="fixed top-14 right-4 z-50 bg-card border border-border rounded-xl p-4 shadow-xl w-64 fade-in">
          <h3 className="text-sm font-semibold text-foreground mb-3">Settings</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Reading Mode</label>
              <div className="flex gap-2">
                <button onClick={() => setMode("vertical")} className={`flex-1 py-1.5 text-xs rounded-lg transition-colors ${mode === "vertical" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  Vertical
                </button>
                <button onClick={() => setMode("horizontal")} className={`flex-1 py-1.5 text-xs rounded-lg transition-colors ${mode === "horizontal" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  Horizontal
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Background</label>
              <div className="flex gap-2">
                {(["dark", "light", "sepia"] as BgMode[]).map((b) => (
                  <button
                    key={b}
                    onClick={() => setBg(b)}
                    className={`flex-1 py-1.5 text-xs rounded-lg capitalize transition-colors ${bg === b ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reader content */}
      <div ref={containerRef} className="pt-14 pb-16">
        {mode === "vertical" ? (
          <div className="max-w-3xl mx-auto">
            {imageUrls.map((url, idx) => (
              <div key={`${idx}-${url}`} className="relative">
                {imgErrors.has(idx) ? (
                  <div className="w-full aspect-[2/3] bg-muted flex flex-col items-center justify-center gap-3 text-muted-foreground text-sm">
                    <p>Failed to load page {idx + 1}</p>
                    <button
                      onClick={() => retryPage(idx)}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-medium flex items-center gap-2 hover:bg-primary/90 transition-colors"
                    >
                      <RefreshCw className="w-3 h-3" /> Retry
                    </button>
                  </div>
                ) : (
                  <>
                    {!imgLoaded.has(idx) && (
                      <div className="w-full aspect-[2/3] bg-muted animate-pulse flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">Loading page {idx + 1}...</span>
                      </div>
                    )}
                    <img
                      src={url}
                      alt={`Page ${idx + 1}`}
                      loading={idx < 3 ? "eager" : "lazy"}
                      referrerPolicy="no-referrer"
                      className={`w-full ${imgLoaded.has(idx) ? "" : "h-0 overflow-hidden"}`}
                      onLoad={() => setImgLoaded((prev) => new Set(prev).add(idx))}
                      onError={() => setImgErrors((prev) => new Set(prev).add(idx))}
                    />
                  </>
                )}
              </div>
            ))}
            {/* Next chapter prompt */}
            {nextChapter && (
              <div className="py-12 text-center">
                <p className="text-muted-foreground mb-4">End of Chapter {currentChapter?.chapter}</p>
                <button onClick={goNextChapter} className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors">
                  Next: Chapter {nextChapter.chapter} →
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="h-[calc(100vh-7.5rem)] flex items-center justify-center relative px-4">
            {imgErrors.has(currentPage) ? (
              <div className="w-96 aspect-[2/3] bg-muted rounded-lg flex flex-col items-center justify-center gap-3 text-muted-foreground">
                <p>Failed to load page {currentPage + 1}</p>
                <button
                  onClick={() => retryPage(currentPage)}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-medium flex items-center gap-2 hover:bg-primary/90 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" /> Retry
                </button>
              </div>
            ) : (
              <>
                {!imgLoaded.has(currentPage) && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                <img
                  src={imageUrls[currentPage]}
                  alt={`Page ${currentPage + 1}`}
                  referrerPolicy="no-referrer"
                  className="max-h-full max-w-full object-contain"
                  onLoad={() => setImgLoaded((prev) => new Set(prev).add(currentPage))}
                  onError={() => setImgErrors((prev) => new Set(prev).add(currentPage))}
                />
              </>
            )}
            {/* Click areas */}
            <button
              onClick={() => { if (currentPage <= 0) goPrevChapter(); else goToPage(currentPage - 1); }}
              className="absolute left-0 top-0 bottom-0 w-1/3 cursor-pointer"
            />
            <button
              onClick={() => { if (currentPage >= imageUrls.length - 1) goNextChapter(); else goToPage(currentPage + 1); }}
              className="absolute right-0 top-0 bottom-0 w-1/3 cursor-pointer"
            />
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className={`fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border transition-transform duration-300 ${showUI ? "translate-y-0" : "translate-y-full"}`}>
        <div className="flex items-center justify-between px-4 h-12">
          <button
            onClick={goPrevChapter}
            disabled={!prevChapter}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Prev
          </button>
          <span className="text-xs text-muted-foreground">
            {mode === "horizontal" ? `${currentPage + 1} / ${imageUrls.length}` : `${imageUrls.length} pages`}
          </span>
          <button
            onClick={goNextChapter}
            disabled={!nextChapter}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
