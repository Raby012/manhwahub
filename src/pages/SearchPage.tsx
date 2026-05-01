import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { searchManga, type MangaItem, type MangaSource } from "@/lib/api";
import MangaCard from "@/components/MangaCard";
import { GridSkeleton } from "@/components/CardSkeleton";
import { Search } from "lucide-react";

const SOURCES: { key: MangaSource; label: string }[] = [
  { key: "mangadex", label: "MangaDex" },
  { key: "comick", label: "ComicK" },
  { key: "weebcentral", label: "WeebCentral" },
  { key: "asura", label: "AsuraScans" },
];
const TYPES = ["all", "manga", "manhwa", "manhua"] as const;

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const source = (params.get("source") as MangaSource) ?? "mangadex";
  const type = (params.get("type") ?? "all") as (typeof TYPES)[number];
  const page = Number(params.get("page") ?? 1);

  const [input, setInput] = useState(q);
  const [results, setResults] = useState<MangaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setInput(q), [q]);

  useEffect(() => {
    if (!q) {
      setResults([]);
      return;
    }
    setLoading(true);
    setError(null);
    searchManga({ q, source, type: type === "all" ? undefined : type, page })
      .then((d) => setResults(d.results || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [q, source, type, page]);

  function update(next: Record<string, string | undefined>) {
    const p = new URLSearchParams(params);
    Object.entries(next).forEach(([k, v]) => {
      if (v === undefined || v === "" || v === "all") p.delete(k);
      else p.set(k, v);
    });
    if (!("page" in next)) p.delete("page");
    setParams(p);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    update({ q: input.trim() });
  }

  return (
    <div className="min-h-screen pt-20 pb-24 md:pb-10">
      <div className="container">
        <form onSubmit={submit} className="relative max-w-2xl mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Search titles..."
            className="w-full pl-10 pr-3 py-3 rounded-lg bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </form>

        {/* Source tabs */}
        <div className="flex gap-1 overflow-x-auto pb-2 mb-3 -mx-1 px-1">
          {SOURCES.map((s) => (
            <button
              key={s.key}
              onClick={() => update({ source: s.key })}
              className={`px-3 py-1.5 text-sm rounded-md whitespace-nowrap transition-colors ${
                source === s.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Type pills */}
        <div className="flex gap-2 flex-wrap mb-6">
          {TYPES.map((t) => (
            <button
              key={t}
              onClick={() => update({ type: t })}
              className={`px-3 py-1 text-xs rounded-full uppercase tracking-wider transition-colors ${
                type === t ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {!q ? (
          <p className="text-muted-foreground text-sm">Enter a search query above.</p>
        ) : loading ? (
          <GridSkeleton count={12} />
        ) : error ? (
          <div className="py-10 text-center">
            <p className="text-destructive mb-3">{error}</p>
            <button onClick={() => update({})} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm">Retry</button>
          </div>
        ) : results.length === 0 ? (
          <p className="text-muted-foreground text-sm">No results for "{q}" on {source}.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {results.map((item) => (
                <MangaCard key={`${source}-${item.id}`} item={item} source={source} />
              ))}
            </div>
            <div className="flex items-center justify-center gap-3 mt-8">
              <button
                disabled={page <= 1}
                onClick={() => update({ page: String(page - 1) })}
                className="px-4 py-2 bg-muted rounded-lg text-sm disabled:opacity-40"
              >
                Prev
              </button>
              <span className="text-sm text-muted-foreground">Page {page}</span>
              <button
                onClick={() => update({ page: String(page + 1) })}
                className="px-4 py-2 bg-muted rounded-lg text-sm"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
