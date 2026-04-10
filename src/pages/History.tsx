import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getRecentlyViewed, getAllProgress, type RecentlyViewed } from "@/lib/storage";
import { Clock, Play } from "lucide-react";

export default function History() {
  const [items, setItems] = useState<RecentlyViewed[]>([]);
  const [progress, setProgressMap] = useState<Record<string, { chapterId: string; chapterNumber: string }>>({});

  useEffect(() => {
    setItems(getRecentlyViewed());
    const p = getAllProgress();
    const mapped: Record<string, { chapterId: string; chapterNumber: string }> = {};
    Object.entries(p).forEach(([k, v]) => { mapped[k] = { chapterId: v.chapterId, chapterNumber: v.chapterNumber }; });
    setProgressMap(mapped);
  }, []);

  const grouped = {
    today: [] as RecentlyViewed[],
    yesterday: [] as RecentlyViewed[],
    thisWeek: [] as RecentlyViewed[],
    older: [] as RecentlyViewed[],
  };

  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  items.forEach((item) => {
    const diff = now - item.viewedAt;
    if (diff < dayMs) grouped.today.push(item);
    else if (diff < 2 * dayMs) grouped.yesterday.push(item);
    else if (diff < 7 * dayMs) grouped.thisWeek.push(item);
    else grouped.older.push(item);
  });

  const sections = [
    { label: "Today", data: grouped.today },
    { label: "Yesterday", data: grouped.yesterday },
    { label: "This Week", data: grouped.thisWeek },
    { label: "Older", data: grouped.older },
  ].filter((s) => s.data.length > 0);

  return (
    <div className="min-h-screen pt-20 pb-24 md:pb-10">
      <div className="container">
        <h1 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
          <Clock className="w-6 h-6 text-primary" /> Reading History
        </h1>

        {items.length === 0 ? (
          <div className="text-center py-20">
            <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">No reading history yet</p>
            <Link to="/browse" className="text-primary hover:underline text-sm">Browse manhwa</Link>
          </div>
        ) : (
          sections.map((section) => (
            <div key={section.label} className="mb-8">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">{section.label}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {section.data.map((item) => (
                  <div key={item.id} className="group relative">
                    <Link to={`/manhwa/${item.id}`} className="block card-hover">
                      <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-muted">
                        <img src={item.coverUrl} alt={item.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
                        <div className="absolute top-2 right-2">
                          <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-secondary/20 text-secondary uppercase">{item.type}</span>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <h3 className="text-sm font-semibold line-clamp-2 text-foreground">{item.title}</h3>
                          {progress[item.id] && (
                            <p className="text-[10px] text-muted-foreground mt-1">Ch. {progress[item.id].chapterNumber}</p>
                          )}
                        </div>
                      </div>
                    </Link>
                    {progress[item.id] && (
                      <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link to={`/read/${item.id}/${progress[item.id].chapterId}`} className="p-1.5 bg-primary/90 rounded-full text-primary-foreground hover:bg-primary transition-colors inline-flex">
                          <Play className="w-3 h-3" />
                        </Link>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
