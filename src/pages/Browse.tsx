import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { getAll, type MangaListItem } from "@/lib/api";
import ManhwaCard from "@/components/ManhwaCard";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Browse() {
  const [params] = useSearchParams();
  const initialQ = params.get("q") || "";

  const [query, setQuery] = useState(initialQ);
  const [items, setItems] = useState<MangaListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const data = await getAll(p);
      setItems(data);
    } catch (e) {
      console.error("Browse fetch error:", e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData(page);
  }, [page, fetchData]);

  // Client-side filter by search query
  const filtered = query.trim()
    ? items.filter((m) => m.title.toLowerCase().includes(query.toLowerCase()))
    : items;

  return (
    <div className="min-h-screen pt-20 pb-24 md:pb-10">
      <div className="container">
        <h1 className="text-2xl font-bold text-foreground mb-6">Browse</h1>

        {/* Search bar */}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title..."
          className="w-full p-3 mb-6 bg-muted rounded-lg text-foreground placeholder:text-muted-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
        />

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-muted-foreground text-lg">No results found</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
            {filtered.map((m) => (
              <ManhwaCard key={m.slug} item={m} />
            ))}
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-center gap-3 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="flex items-center gap-1 px-4 py-2 bg-muted rounded-lg text-sm text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Prev
          </button>
          <span className="text-sm text-foreground font-medium">Page {page}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={items.length === 0}
            className="flex items-center gap-1 px-4 py-2 bg-muted rounded-lg text-sm text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
