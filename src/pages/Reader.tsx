import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getChapterImages, type ChapterData } from "@/lib/api";
import { setProgress, markChapterRead } from "@/lib/storage";
import { ArrowLeft, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";

export default function Reader() {
  const { manhwaId, chapterId } = useParams<{ manhwaId: string; chapterId: string }>();
  const navigate = useNavigate();
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [nav, setNav] = useState<{ prev: string; next: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imgLoaded, setImgLoaded] = useState<Set<number>>(new Set());
  const [imgErrors, setImgErrors] = useState<Set<number>>(new Set());
  const [showUI, setShowUI] = useState(true);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const loadChapter = useCallback(async () => {
    if (!manhwaId || !chapterId) return;
    setLoading(true);
    setError(null);
    setImageUrls([]);
    setImgLoaded(new Set());
    setImgErrors(new Set());

    try {
      const data = await getChapterImages(manhwaId, chapterId);

      if (!data.chapters || data.chapters.length === 0) {
        throw new Error("No pages found for this chapter.");
      }

      const urls = data.chapters.map((c) => c.ch);
      setImageUrls(urls);

      if (data.nav && data.nav.length > 0) {
        setNav(data.nav[0]);
      }

      markChapterRead(manhwaId, chapterId);
      setProgress({ mangaId: manhwaId, chapterId, chapterNumber: chapterId, page: 0, timestamp: Date.now() });
    } catch (err: any) {
      console.error("Failed to load chapter:", err);
      setError(err.message || "Failed to load chapter. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [manhwaId, chapterId]);

  useEffect(() => {
    loadChapter();
  }, [loadChapter]);

  const retryPage = (idx: number) => {
    setImgErrors((prev) => { const s = new Set(prev); s.delete(idx); return s; });
    setImgLoaded((prev) => { const s = new Set(prev); s.delete(idx); return s; });
    setImageUrls((prev) => {
      const updated = [...prev];
      const base = updated[idx].split("?")[0];
      updated[idx] = `${base}?t=${Date.now()}`;
      return updated;
    });
  };

  const goNext = useCallback(() => {
    if (nav?.next && manhwaId) {
      const nextChId = nav.next.split("/").filter(Boolean).pop() || "";
      if (nextChId) navigate(`/read/${manhwaId}/${nextChId}`);
    }
  }, [nav, manhwaId, navigate]);

  const goPrev = useCallback(() => {
    if (nav?.prev && manhwaId) {
      const prevChId = nav.prev.split("/").filter(Boolean).pop() || "";
      if (prevChId) navigate(`/read/${manhwaId}/${prevChId}`);
    }
  }, [nav, manhwaId, navigate]);

  function handleMouseMove() {
    setShowUI(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setShowUI(false), 3000);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Loading chapter...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4 px-4 text-center">
        <p className="text-muted-foreground">{error}</p>
        <div className="flex gap-3">
          <button onClick={loadChapter} className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-primary/90 transition-colors">
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
          <Link to={`/manhwa/${manhwaId}`} className="px-6 py-2.5 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors">
            Go Back
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background transition-colors" onMouseMove={handleMouseMove}>
      {/* Top bar */}
      <div className={`fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border transition-transform duration-300 ${showUI ? "translate-y-0" : "-translate-y-full"}`}>
        <div className="flex items-center justify-between px-4 h-14">
          <Link to={`/manhwa/${manhwaId}`} className="p-1 text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Back to details</span>
          </Link>
        </div>
      </div>

      {/* Vertical scroll reader */}
      <div className="pt-14 pb-16">
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

          {/* Next/prev chapter prompt */}
          <div className="py-12 text-center flex flex-col items-center gap-4">
            <p className="text-muted-foreground">End of chapter</p>
            <div className="flex gap-3">
              {nav?.prev && (
                <button onClick={goPrev} className="px-6 py-3 bg-muted text-foreground rounded-lg font-medium hover:bg-muted/80 transition-colors flex items-center gap-2">
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>
              )}
              {nav?.next && (
                <button onClick={goNext} className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center gap-2">
                  Next Chapter <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className={`fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border transition-transform duration-300 ${showUI ? "translate-y-0" : "translate-y-full"}`}>
        <div className="flex items-center justify-between px-4 h-12">
          <button onClick={goPrev} disabled={!nav?.prev} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Prev
          </button>
          <span className="text-xs text-muted-foreground">{imageUrls.length} pages</span>
          <button onClick={goNext} disabled={!nav?.next} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors">
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
