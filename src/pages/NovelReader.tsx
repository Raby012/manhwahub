import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getNovelChapter, type NovelChapterContent } from "@/lib/api";
import { ArrowLeft, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";

export default function NovelReader() {
  const { slug, chapterSlug } = useParams<{ slug: string; chapterSlug: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<NovelChapterContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!slug || !chapterSlug) return;
    setLoading(true);
    setError(null);
    try {
      const d = await getNovelChapter(slug, chapterSlug);
      setData(d);
      window.scrollTo(0, 0);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [slug, chapterSlug]);

  useEffect(() => { load(); }, [load]);

  function go(target?: string | null) {
    if (!target || !slug) return;
    navigate(`/novels/${encodeURIComponent(slug)}/chapter/${encodeURIComponent(target)}`);
  }

  return (
    <div className="min-h-screen pt-20 pb-24 md:pb-10">
      <div className="container max-w-3xl">
        <Link to={`/novels/${encodeURIComponent(slug ?? "")}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to chapters
        </Link>

        {loading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-8 bg-muted rounded w-3/4" />
            {Array.from({ length: 12 }).map((_, i) => <div key={i} className="h-4 bg-muted rounded" />)}
          </div>
        ) : error ? (
          <div className="text-center py-10">
            <p className="text-destructive mb-3">{error}</p>
            <button onClick={load} className="px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm flex items-center gap-2 mx-auto">
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
          </div>
        ) : data ? (
          <>
            <h1 className="text-2xl sm:text-3xl font-bold mb-6">{data.title}</h1>
            <article
              className="prose prose-invert max-w-none prose-p:text-foreground/90 prose-p:leading-relaxed prose-p:my-4 prose-headings:text-foreground"
              dangerouslySetInnerHTML={{ __html: data.content }}
            />
            <div className="flex items-center justify-between gap-3 mt-10 pt-6 border-t border-border">
              <button disabled={!data.prev} onClick={() => go(data.prev)} className="px-4 py-2 bg-muted rounded-lg text-sm flex items-center gap-1 disabled:opacity-40">
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              <button disabled={!data.next} onClick={() => go(data.next)} className="px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm flex items-center gap-1 disabled:opacity-40">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
