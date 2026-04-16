import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getMangaDetail, type MangaDetail } from "@/lib/api";
import { addBookmark, removeBookmark, isBookmarked, getProgress, addRecentlyViewed } from "@/lib/storage";
import { BookMarked, Play, ArrowLeft, Clock, ChevronDown, ChevronUp, Search } from "lucide-react";

export default function ManhwaDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [info, setInfo] = useState<MangaDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [sortAsc, setSortAsc] = useState(true);
  const [chapterSearch, setChapterSearch] = useState("");
  const [showAllChapters, setShowAllChapters] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    getMangaDetail(id)
      .then((data) => {
        setInfo(data);
        setBookmarked(isBookmarked(id));
        addRecentlyViewed({ id, title: data.title, coverUrl: data.image, type: "manhwa", viewedAt: Date.now() });
      })
      .catch((e) => {
        console.error(e);
        setError("Failed to load manga details.");
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading || !info) {
    return (
      <div className="min-h-screen pt-20 pb-24">
        <div className="container">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-48 md:w-64 aspect-[3/4] bg-muted animate-pulse rounded-xl shrink-0" />
            <div className="flex-1 space-y-4">
              <div className="h-8 w-2/3 bg-muted animate-pulse rounded" />
              <div className="h-4 w-1/3 bg-muted animate-pulse rounded" />
              <div className="h-20 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pt-20 pb-24 flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive text-lg mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="px-6 py-2 bg-primary text-primary-foreground rounded-lg">Retry</button>
        </div>
      </div>
    );
  }

  const chapters = info.chapters || [];
  const progress = id ? getProgress(id) : null;

  const filteredChapters = chapters
    .filter((c) => !chapterSearch || c.name.toLowerCase().includes(chapterSearch.toLowerCase()));

  const sortedChapters = sortAsc ? filteredChapters : [...filteredChapters].reverse();
  const displayChapters = showAllChapters ? sortedChapters : sortedChapters.slice(0, 50);

  const firstChapterId = chapters.length > 0 ? chapters[chapters.length - 1].id : null;

  function toggleBookmark() {
    if (!id || !info) return;
    if (bookmarked) {
      removeBookmark(id);
    } else {
      addBookmark({ id, title: info.title, coverUrl: info.image, type: "manhwa", addedAt: Date.now() });
    }
    setBookmarked(!bookmarked);
  }

  return (
    <div className="min-h-screen pt-20 pb-24 md:pb-10">
      <div className="container">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {/* Hero */}
        <div className="relative rounded-2xl overflow-hidden mb-8">
          <div className="absolute inset-0 bg-cover bg-center opacity-20 blur-2xl" style={{ backgroundImage: `url(${info.image})` }} />
          <div className="relative flex flex-col md:flex-row gap-6 p-6">
            <img src={info.image} alt={info.title} referrerPolicy="no-referrer" className="w-48 md:w-56 aspect-[3/4] object-cover rounded-xl shadow-2xl shadow-primary/10 shrink-0" />
            <div className="flex-1">
              {info.status && (
                <span className={`px-3 py-1 text-xs font-semibold rounded-full uppercase mb-2 inline-block ${info.status.toLowerCase() === "completed" ? "bg-success/20 text-success" : "bg-primary/20 text-primary"}`}>
                  {info.status}
                </span>
              )}
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">{info.title}</h1>
              {info.author && <p className="text-sm text-muted-foreground mb-3">Author: <span className="text-foreground">{info.author}</span></p>}
              <div className="flex flex-wrap gap-2 mb-4">
                {info.genres.map((g) => (
                  <Link key={g} to={`/browse?genre=${g.toLowerCase()}`} className="px-2.5 py-1 text-xs bg-muted rounded-full text-muted-foreground hover:text-foreground hover:bg-primary/20 transition-colors">
                    {g}
                  </Link>
                ))}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-4">{info.description}</p>

              <div className="flex flex-wrap gap-3">
                {firstChapterId && (
                  <Link
                    to={`/read/${id}/${firstChapterId}`}
                    className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors flex items-center gap-2"
                  >
                    <Play className="w-4 h-4" /> Start Reading
                  </Link>
                )}
                {progress && (
                  <Link
                    to={`/read/${id}/${progress.chapterId}`}
                    className="px-6 py-2.5 bg-secondary text-secondary-foreground rounded-lg font-medium text-sm hover:bg-secondary/90 transition-colors flex items-center gap-2"
                  >
                    <Clock className="w-4 h-4" /> Continue Ch. {progress.chapterNumber}
                  </Link>
                )}
                <button
                  onClick={toggleBookmark}
                  className={`px-6 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors ${bookmarked ? "bg-gold/20 text-gold" : "bg-muted text-muted-foreground hover:text-foreground"}`}
                >
                  <BookMarked className="w-4 h-4" /> {bookmarked ? "Bookmarked" : "Bookmark"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Chapter list */}
        <div className="bg-card border border-border rounded-xl p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground">{chapters.length} Chapters</h2>
            <button onClick={() => setSortAsc(!sortAsc)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
              {sortAsc ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {sortAsc ? "First to Last" : "Last to First"}
            </button>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={chapterSearch}
              onChange={(e) => setChapterSearch(e.target.value)}
              placeholder="Search chapters..."
              className="w-full pl-10 pr-4 py-2 bg-muted rounded-lg text-sm text-foreground placeholder:text-muted-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="space-y-1 max-h-[60vh] overflow-y-auto">
            {displayChapters.map((ch, idx) => (
              <Link
                key={idx}
                to={`/read/${id}/${ch.id}`}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors group"
              >
                <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                  {ch.name}
                </span>
                {ch.date && (
                  <span className="text-xs text-muted-foreground shrink-0 ml-2">{ch.date}</span>
                )}
              </Link>
            ))}
          </div>

          {sortedChapters.length > 50 && !showAllChapters && (
            <button onClick={() => setShowAllChapters(true)} className="w-full mt-4 py-2 text-sm text-primary hover:text-primary/80 transition-colors">
              Show all {sortedChapters.length} chapters
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
