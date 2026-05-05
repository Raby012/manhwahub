import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  getMangaInfo,
  getChapters,
  type MangaItem,
  type ChapterItem,
  type MangaSource,
} from "@/lib/api";
import TypeBadge from "@/components/TypeBadge";
import { isBookmarked, toggleBookmark } from "@/lib/storage";
import { BookMarked, BookOpen, ChevronLeft, ChevronRight } from "lucide-react";

export default function MangaDetail() {
  const { source, id } = useParams<{ source: MangaSource; id: string }>();
  const [info, setInfo] = useState<MangaItem | null>(null);
  const [chapters, setChapters] = useState<ChapterItem[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [chLoading, setChLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!source || !id) return;
    setLoading(true);
    setError(null);
    getMangaInfo(id, source)
      .then((d) => {
        setInfo(d);
        setSaved(isBookmarked(source, id));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [source, id]);

  useEffect(() => {
    if (!source || !id || !info) return;
    setChLoading(true);
    getChapters(id, source, page, "en", info.title)
      .then((d) => setChapters(d.chapters || []))
      .catch(() => setChapters([]))
      .finally(() => setChLoading(false));
  }, [source, id, page, info]);

  function handleBookmark() {
    if (!info || !source || !id) return;
    const now = toggleBookmark({
      source,
      id,
      title: info.title,
      cover: info.coverUrl,
      contentType: info.contentType,
    });
    setSaved(now);
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-20 container">
        <div className="flex flex-col sm:flex-row gap-6 animate-pulse">
          <div className="w-44 sm:w-56 aspect-[2/3] bg-muted rounded-lg shrink-0" />
          <div className="flex-1 space-y-3">
            <div className="h-7 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-20 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !info) {
    return (
      <div className="min-h-screen pt-20 container text-center">
        <p className="text-destructive mb-3">{error ?? "Not found"}</p>
        <Link to="/" className="text-primary text-sm">← Back to home</Link>
      </div>
    );
  }

  const firstChapter = chapters[chapters.length - 1] ?? chapters[0];

  return (
    <div className="min-h-screen pt-20 pb-24 md:pb-10">
      <div className="container">
        <div className="flex flex-col sm:flex-row gap-6 mb-8">
          {info.coverUrl && (
            <img
              src={info.coverUrl}
              alt={info.title}
              referrerPolicy="no-referrer"
              className="w-44 sm:w-56 aspect-[2/3] object-cover rounded-lg bg-muted shrink-0 mx-auto sm:mx-0"
            />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <TypeBadge type={info.contentType} />
              {info.status && <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{info.status}</span>}
              {info.rating && <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{info.rating}</span>}
            </div>
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
              <p className="text-sm text-muted-foreground leading-relaxed mb-5 line-clamp-6">{info.description}</p>
            )}
            <div className="flex gap-3 flex-wrap">
              {firstChapter && (
                <Link
                  to={`/manga/${source}/${encodeURIComponent(id!)}/chapter/${encodeURIComponent(firstChapter.id)}`}
                  className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition flex items-center gap-2"
                >
                  <BookOpen className="w-4 h-4" /> Start Reading
                </Link>
              )}
              <button
                onClick={handleBookmark}
                className={`px-5 py-2.5 rounded-lg font-medium transition flex items-center gap-2 ${
                  saved ? "bg-primary/20 text-primary border border-primary/30" : "bg-muted text-foreground hover:bg-muted/70"
                }`}
              >
                <BookMarked className="w-4 h-4" /> {saved ? "Bookmarked" : "Bookmark"}
              </button>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-3">Chapters</h2>
          {chLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : chapters.length === 0 ? (
            <p className="text-sm text-muted-foreground">No chapters found.</p>
          ) : (
            <div className="space-y-1.5">
              {chapters.map((ch, i) => {
                const num = ch.chapter && ch.chapter.trim() && ch.chapter !== "0" ? ch.chapter : null;
                const hasTitle = ch.title && ch.title.trim();
                const label = num
                  ? `Ch. ${num}${hasTitle ? ` — ${ch.title}` : ""}`
                  : hasTitle
                  ? ch.title!
                  : `Ch. ${chapters.length - i}`;
                const src = ch.source === "comick" ? "CK" : ch.source === "mangadex" ? "MD" : null;
                return (
                  <Link
                    key={ch.id}
                    to={`/manga/${source}/${encodeURIComponent(id!)}/chapter/${encodeURIComponent(ch.id)}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors"
                  >
                    <div className="min-w-0 flex items-center gap-2">
                      {src && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/15 text-primary shrink-0">
                          {src}
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{label}</p>
                        {ch.scanlationGroup && (
                          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{ch.scanlationGroup}</p>
                        )}
                      </div>
                    </div>
                    {ch.publishedAt && num && (
                      <span className="text-[11px] text-muted-foreground shrink-0 ml-3">
                        {new Date(ch.publishedAt).toLocaleDateString()}
                      </span>
                    )}
                  </Link>
                );
              })}
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
    </div>
  );
}
