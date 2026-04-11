import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getMangaById, getAllChapters, type MangaResult, type Chapter } from "@/lib/mangadex";
import { addBookmark, removeBookmark, isBookmarked, getProgress, addRecentlyViewed } from "@/lib/storage";
import { BookMarked, Play, ArrowLeft, Clock, ChevronDown, ChevronUp, Search } from "lucide-react";
import SimilarManhwa from "@/components/SimilarManhwa";

export default function ManhwaDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [manga, setManga] = useState<MangaResult | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookmarked, setBookmarked] = useState(false);
  const [sortAsc, setSortAsc] = useState(true);
  const [chapterSearch, setChapterSearch] = useState("");
  const [showAllChapters, setShowAllChapters] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([getMangaById(id), getAllChapters(id)])
      .then(([m, c]) => {
        setManga(m);
        setChapters(c);
        setBookmarked(isBookmarked(id));
        addRecentlyViewed({ id: m.id, title: m.title, coverUrl: m.coverUrl, type: m.type, viewedAt: Date.now() });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading || !manga) {
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

  const progress = getProgress(manga.id);
  const isNew = (date: string) => Date.now() - new Date(date).getTime() < 7 * 24 * 60 * 60 * 1000;

  const filteredChapters = chapters
    .filter((c) => !chapterSearch || c.chapter.includes(chapterSearch) || c.title.toLowerCase().includes(chapterSearch.toLowerCase()))
    .sort((a, b) => sortAsc ? parseFloat(a.chapter) - parseFloat(b.chapter) : parseFloat(b.chapter) - parseFloat(a.chapter));

  const displayChapters = showAllChapters ? filteredChapters : filteredChapters.slice(0, 50);

  function toggleBookmark() {
    if (bookmarked) {
      removeBookmark(manga!.id);
    } else {
      addBookmark({ id: manga!.id, title: manga!.title, coverUrl: manga!.coverUrl, type: manga!.type, addedAt: Date.now() });
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
          <div className="absolute inset-0 bg-cover bg-center opacity-20 blur-2xl" style={{ backgroundImage: `url(${manga.coverUrl})` }} />
          <div className="relative flex flex-col md:flex-row gap-6 p-6">
            <img src={manga.coverUrl.replace('.256.', '.512.')} alt={manga.title} referrerPolicy="no-referrer" className="w-48 md:w-56 aspect-[3/4] object-cover rounded-xl shadow-2xl shadow-primary/10 shrink-0" />
            <div className="flex-1">
              <span className="px-3 py-1 text-xs font-semibold rounded-full bg-primary/20 text-primary uppercase mb-2 inline-block">
                {manga.type}
              </span>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">{manga.title}</h1>
              {manga.altTitles.length > 0 && (
                <p className="text-sm text-muted-foreground mb-3">{manga.altTitles.slice(0, 3).join(" · ")}</p>
              )}
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-3">
                <span>Author: <span className="text-foreground">{manga.author}</span></span>
                {manga.artist && manga.artist !== manga.author && (
                  <span>Artist: <span className="text-foreground">{manga.artist}</span></span>
                )}
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${manga.status === "completed" ? "bg-success/20 text-success" : manga.status === "ongoing" ? "bg-primary/20 text-primary" : "bg-gold/20 text-gold"}`}>
                  {manga.status}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {manga.tags.slice(0, 10).map((t) => (
                  <Link key={t.id} to={`/browse?genre=${t.name.toLowerCase()}`} className="px-2.5 py-1 text-xs bg-muted rounded-full text-muted-foreground hover:text-foreground hover:bg-primary/20 transition-colors">
                    {t.name}
                  </Link>
                ))}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-4">{manga.description.replace(/<[^>]*>/g, '')}</p>
              
              <div className="flex flex-wrap gap-3">
                {chapters.length > 0 && (
                  <Link
                    to={`/read/${manga.id}/${chapters[0].id}`}
                    className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors flex items-center gap-2"
                  >
                    <Play className="w-4 h-4" /> Start Reading
                  </Link>
                )}
                {progress && (
                  <Link
                    to={`/read/${manga.id}/${progress.chapterId}`}
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
              {sortAsc ? "Oldest first" : "Newest first"}
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
            {displayChapters.map((ch) => (
              <Link
                key={ch.id}
                to={`/read/${manga.id}/${ch.id}`}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                    Chapter {ch.chapter}
                  </span>
                  {ch.title && <span className="text-sm text-muted-foreground truncate">— {ch.title}</span>}
                  {isNew(ch.publishAt) && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-secondary/20 text-secondary rounded">NEW</span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {new Date(ch.publishAt).toLocaleDateString()}
                </span>
              </Link>
            ))}
          </div>

          {filteredChapters.length > 50 && !showAllChapters && (
            <button onClick={() => setShowAllChapters(true)} className="w-full mt-4 py-2 text-sm text-primary hover:text-primary/80 transition-colors">
              Show all {filteredChapters.length} chapters
            </button>
          )}
        </div>
        <SimilarManhwa manga={manga} />
      </div>
    </div>
  );
}
