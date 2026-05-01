import { useState } from "react";
import { Link } from "react-router-dom";
import { searchNovels, type NovelItem } from "@/lib/api";
import { Search, BookOpen } from "lucide-react";

export default function NovelsHome() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<NovelItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const data = await searchNovels(q.trim());
      setItems(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e.message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen pt-20 pb-24 md:pb-10">
      <div className="container">
        <div className="flex items-center gap-3 mb-6">
          <BookOpen className="w-7 h-7 text-primary" />
          <h1 className="text-2xl sm:text-3xl font-bold">Light Novels</h1>
        </div>
        <p className="text-muted-foreground mb-6">Search thousands of web novels and light novels.</p>

        <form onSubmit={submit} className="relative max-w-xl mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search novels (e.g. Solo Leveling, Reverend Insanity)"
            className="w-full pl-10 pr-3 py-3 rounded-lg bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </form>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-16 bg-card rounded-lg animate-pulse" />)}
          </div>
        ) : error ? (
          <p className="text-destructive">{error}</p>
        ) : !searched ? (
          <p className="text-sm text-muted-foreground">Enter a title above to find novels.</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No novels found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {items.map((n) => (
              <Link
                key={n.slug}
                to={`/novels/${encodeURIComponent(n.slug)}`}
                className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors"
              >
                <div className="w-12 h-16 bg-muted rounded shrink-0 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{n.title}</p>
                  {n.latestChapter && <p className="text-[11px] text-muted-foreground truncate">{n.latestChapter}</p>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
