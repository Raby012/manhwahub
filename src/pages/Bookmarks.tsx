import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getBookmarks, removeBookmark, getAllProgress, type Bookmark } from "@/lib/storage";
import { BookMarked, Play, Trash2 } from "lucide-react";

export default function Bookmarks() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [progress, setProgressMap] = useState<Record<string, { chapterId: string; chapterNumber: string }>>({});

  useEffect(() => {
    setBookmarks(getBookmarks());
    const p = getAllProgress();
    const mapped: Record<string, { chapterId: string; chapterNumber: string }> = {};
    Object.entries(p).forEach(([k, v]) => { mapped[k] = { chapterId: v.chapterId, chapterNumber: v.chapterNumber }; });
    setProgressMap(mapped);
  }, []);

  function handleRemove(id: string) {
    removeBookmark(id);
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  }

  return (
    <div className="min-h-screen pt-20 pb-24 md:pb-10">
      <div className="container">
        <h1 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
          <BookMarked className="w-6 h-6 text-primary" /> Bookmarks
        </h1>

        {bookmarks.length === 0 ? (
          <div className="text-center py-20">
            <BookMarked className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">No bookmarks yet</p>
            <Link to="/browse" className="text-primary hover:underline text-sm">Browse manhwa</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {bookmarks.map((b) => (
              <div key={b.id} className="group relative">
                <Link to={`/manhwa/${b.id}`} className="block card-hover">
                  <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-muted">
                    <img src={b.coverUrl} alt={b.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
                    <div className="absolute top-2 right-2">
                      <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-secondary/20 text-secondary uppercase">{b.type}</span>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <h3 className="text-sm font-semibold line-clamp-2 text-foreground">{b.title}</h3>
                      {progress[b.id] && (
                        <p className="text-[10px] text-muted-foreground mt-1">Reading Ch. {progress[b.id].chapterNumber}</p>
                      )}
                    </div>
                  </div>
                </Link>
                <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {progress[b.id] && (
                    <Link to={`/read/${b.id}/${progress[b.id].chapterId}`} className="p-1.5 bg-primary/90 rounded-full text-primary-foreground hover:bg-primary transition-colors">
                      <Play className="w-3 h-3" />
                    </Link>
                  )}
                  <button onClick={() => handleRemove(b.id)} className="p-1.5 bg-destructive/90 rounded-full text-destructive-foreground hover:bg-destructive transition-colors">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
