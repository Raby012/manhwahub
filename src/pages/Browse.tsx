import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { searchManga, getTags, type MangaResult } from "@/lib/mangadex";
import ManhwaCard from "@/components/ManhwaCard";
import { Filter, ChevronDown } from "lucide-react";

const TYPE_OPTIONS = [
  { label: "All", value: "" },
  { label: "Manhwa", value: "ko" },
  { label: "Manhua", value: "zh" },
  { label: "Manga", value: "ja" },
];

const STATUS_OPTIONS = [
  { label: "All", value: "" },
  { label: "Ongoing", value: "ongoing" },
  { label: "Completed", value: "completed" },
  { label: "Hiatus", value: "hiatus" },
];

const ORDER_OPTIONS = [
  { label: "Popularity", value: "followedCount" },
  { label: "Rating", value: "rating" },
  { label: "Latest", value: "latestUploadedChapter" },
  { label: "A-Z", value: "title" },
];

export default function Browse() {
  const [params] = useSearchParams();
  const initialQ = params.get("q") || "";
  const initialGenre = params.get("genre") || "";

  const [query, setQuery] = useState(initialQ);
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [order, setOrder] = useState("followedCount");
  const [genre, setGenre] = useState(initialGenre);
  const [results, setResults] = useState<MangaResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [tags, setTags] = useState<{ id: string; name: string; group: string }[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingMore = useRef(false);

  useEffect(() => {
    getTags().then(setTags).catch(() => {});
  }, []);

  const fetchData = useCallback(
    async (reset = true) => {
      if (loadingMore.current && !reset) return;
      loadingMore.current = true;
      const newOffset = reset ? 0 : offset;
      if (reset) setLoading(true);

      try {
        const lang = type ? [type] : undefined;
        const genreTag = tags.find(
          (t) => t.name.toLowerCase() === genre.toLowerCase() && t.group === "genre"
        );

        const res = await searchManga({
          title: query || undefined,
          originalLanguage: lang,
          status: status || undefined,
          includedTags: genreTag ? [genreTag.id] : undefined,
          order: { [order]: order === "title" ? "asc" : "desc" },
          limit: 24,
          offset: newOffset,
        });

        if (reset) {
          setResults(res.data);
        } else {
          setResults((prev) => [...prev, ...res.data]);
        }
        setTotal(res.total);
        setOffset(newOffset + 24);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
      loadingMore.current = false;
    },
    [query, type, status, order, genre, offset, tags]
  );

  useEffect(() => {
    fetchData(true);
  }, [query, type, status, order, genre, tags]);

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && results.length < total && !loading) {
          fetchData(false);
        }
      },
      { rootMargin: "400px" }
    );
    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [results.length, total, loading, fetchData]);

  const genreNames = tags.filter((t) => t.group === "genre").map((t) => t.name).sort();

  return (
    <div className="min-h-screen pt-20 pb-24 md:pb-10">
      <div className="container">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">Browse</h1>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Filter className="w-4 h-4" /> Filters <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-card border border-border rounded-xl p-4 mb-6 fade-in grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Type</label>
              <select value={type} onChange={(e) => setType(e.target.value)} className="w-full p-2 bg-muted rounded-lg text-sm text-foreground border border-border">
                {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full p-2 bg-muted rounded-lg text-sm text-foreground border border-border">
                {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Order by</label>
              <select value={order} onChange={(e) => setOrder(e.target.value)} className="w-full p-2 bg-muted rounded-lg text-sm text-foreground border border-border">
                {ORDER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Genre</label>
              <select value={genre} onChange={(e) => setGenre(e.target.value)} className="w-full p-2 bg-muted rounded-lg text-sm text-foreground border border-border">
                <option value="">All Genres</option>
                {genreNames.map((g) => <option key={g} value={g.toLowerCase()}>{g}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* Search bar */}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title..."
          className="w-full p-3 mb-6 bg-muted rounded-lg text-foreground placeholder:text-muted-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
        />

        {/* Results */}
        {loading && results.length === 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">{total.toLocaleString()} results</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
              {results.map((m) => (
                <ManhwaCard key={m.id} manga={m} />
              ))}
            </div>
            <div ref={sentinelRef} className="h-10" />
            {loadingMore.current && (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
