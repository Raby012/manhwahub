import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { getLatest, searchManga, type MangaListItem } from "@/lib/api";
import ManhwaCard from "@/components/ManhwaCard";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

export default function Browse() {
  const [params] = useSearchParams();
  const initialQ = params.get("q") || "";

  const [query, setQuery] = useState(initialQ);
  const [items, setItems] = useState<MangaListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchData = useCallback(async (p: number, q: string) => {
    setLoading(true);
    try {
      if (q.trim()) {
        const data = await searchManga(q, p);
        setItems(data.mangas || []);
        setTotalPages(data.totalPages || 1);
      } else {
        const data = await getLatest(p);
        setItems(data.mangas || []);
        setTotalPages(data.totalPages || 1);
      }
    } catch (e) {
      console.error("Browse fetch error:", e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData(page, query);
  }, [page, fetchData]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchData(1, query);
  }

  return (
    <div className="min-h-screen pt-20 pb-24 md:pb-10">
      <div className="container">
        <h1 className="text-2xl font-bold text-foreground mb-6">Browse</h1>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search manga / manhwa..."
            className="w-full pl-10 pr-4 py-3 bg-muted rounded-lg text-foreground placeholder:text-muted-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </form>

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-muted-foreground text-lg">No results found</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
            {items.map((m) => (
              <ManhwaCard key={m.id} item={m} />
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
          <span className="text-sm text-foreground font-medium">Page {page} / {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="flex items-center gap-1 px-4 py-2 bg-muted rounded-lg text-sm text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
