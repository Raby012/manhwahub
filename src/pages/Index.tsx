import { useEffect, useState } from "react";
import { getLatest, type MangaListItem } from "@/lib/api";
import HeroBanner from "@/components/HeroBanner";
import ManhwaSection from "@/components/ManhwaSection";
import { Link } from "react-router-dom";

const GENRE_TAGS = [
  "Action", "Romance", "Fantasy", "Isekai", "Martial Arts",
  "Comedy", "Drama", "Horror", "School Life", "Slice of Life",
  "Adventure", "Sci-Fi",
];

export default function Index() {
  const [items, setItems] = useState<MangaListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getLatest(1)
      .then(setItems)
      .catch((e) => {
        console.error("Failed to load homepage:", e);
        setError("Failed to load content. Please try again.");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen pt-20 pb-24 md:pb-10">
      <div className="container">
        {error && items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-destructive text-lg mb-4">{error}</p>
            <button onClick={() => window.location.reload()} className="px-6 py-2 bg-primary text-primary-foreground rounded-lg">Retry</button>
          </div>
        )}

        <HeroBanner items={items.slice(0, 5)} />

        {/* Genre quick filters */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-8 scrollbar-hide">
          {GENRE_TAGS.map((g) => (
            <Link
              key={g}
              to={`/browse?genre=${g.toLowerCase()}`}
              className="px-4 py-2 text-xs font-medium bg-muted rounded-full text-muted-foreground hover:text-foreground hover:bg-primary/20 transition-colors whitespace-nowrap shrink-0"
            >
              {g}
            </Link>
          ))}
        </div>

        <ManhwaSection title="Latest Updates" icon="🆕" items={items.slice(0, 12)} loading={loading} />
        <ManhwaSection title="Trending Now" icon="🔥" items={items.slice(12, 24)} loading={loading} />
      </div>
    </div>
  );
}
