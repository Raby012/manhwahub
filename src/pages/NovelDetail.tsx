import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getNovelChapters, getNovelInfo, type NovelChapter, type NovelDetail } from "@/lib/api";
import { BookOpen, ChevronLeft, ChevronRight } from "lucide-react";

export default function NovelDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [info, setInfo] = useState<NovelDetail | null>(null);
  const [chapters, setChapters] = useState<NovelChapter[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [chLoading, setChLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    getNovelInfo(slug)
      .then(setInfo)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    setChLoading(true);
    getNovelChapters(slug, page)
      .then((d) => {
        const list = Array.isArray(d) ? d : (d.chapters || []);
        setChapters(list);
      })
      .catch(() => setChapters([]))
      .finally(() => setChLoading(false));
  }, [slug, page]);

  if (loading) {
    return (
      <div className="min-h-screen pt-20 container animate-pulse space-y-3">
        <div className="h-8 bg-muted rounded w-1/2" />
        <div className="h-24 bg-muted rounded" />
      </div>
    );
  }

  if (error || !info) {
    return (
      <div className="min-h-screen pt-20 container text-center">
        <p className="text-destructive mb-3">{error ?? "Novel not found"}</p>
        <Link to="/novels" className="text-primary text-sm">← Back to novels</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-24 md:pb-10">
      <div className="container">
        <div className="flex flex-col sm:flex-row gap-6 mb-8">
          <div className="w-32 sm:w-44 aspect-[2/3] bg-muted rounded-lg flex items-center justify-center shrink-0 mx-auto sm:mx-0 overflow-hidden">
            {info.cover ? (
              <img src={info.cover.startsWith("http") ? info.cover : `https://novelfull.net${info.cover}`} alt={info.title} referrerPolicy="no-referrer" className="w-full h-full object-cover" onError={(e) => ((e.currentTarget.style.display = "none"))} />
            ) : (
              <BookOpen className="w-10 h-10 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">{info.title}</h1>
            {info.author && <p className="text-sm text-muted-foreground mb-3">by {info.author}</p>}
            {info.genres && info.genres.length > 0 && (
              <div className="flex gap-1.5 flex-wrap mb-4">
                {info.genres.map((g) => (
                  <span key={g} className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">{g}</span>
                ))}
              </div>
            )}
            {info.description && (
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-6">{info.description}</p>
            )}
          </div>
        </div>

        <h2 className="text-xl font-bold mb-3">Chapters</h2>
        {chLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-10 bg-muted rounded animate-pulse" />)}
          </div>
        ) : chapters.length === 0 ? (
          <p className="text-sm text-muted-foreground">No chapters found.</p>
        ) : (
          <div className="space-y-1.5">
            {chapters.map((ch) => (
              <Link
                key={ch.slug}
                to={`/novels/${encodeURIComponent(slug!)}/chapter/${encodeURIComponent(ch.slug)}`}
                className="block p-3 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors text-sm"
              >
                {ch.title}
              </Link>
            ))}
          </div>
        )}

        <div className="flex items-center justify-center gap-3 mt-6">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-4 py-2 bg-muted rounded-lg text-sm disabled:opacity-40 flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" /> Prev
          </button>
          <span className="text-sm text-muted-foreground">Page {page}</span>
          <button onClick={() => setPage((p) => p + 1)} className="px-4 py-2 bg-muted rounded-lg text-sm flex items-center gap-1">
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
