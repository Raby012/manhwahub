import { useEffect, useState } from "react";
import { getHome, getLatest, type MangaListItem, type HomeData } from "@/lib/api";
import HeroBanner from "@/components/HeroBanner";
import ManhwaSection from "@/components/ManhwaSection";
import { Link } from "react-router-dom";

const GENRE_TAGS = [
  "Action", "Romance", "Fantasy", "Isekai", "Martial Arts",
  "Comedy", "Drama", "Horror", "School Life", "Slice of Life",
  "Adventure", "Sci-Fi",
];

export default function Index() {
  const [homeData, setHomeData] = useState<HomeData | null>(null);
  const [latestData, setLatestData] = useState<MangaListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getHome(), getLatest(1)])
      .then(([home, latest]) => {
        setHomeData(home);
        setLatestData(latest.mangas || []);
      })
      .catch((e) => {
        console.error("Failed to load homepage:", e);
        setError("Failed to load content. Please try again.");
      })
      .finally(() => setLoading(false));
  }, []);

  const heroItems = homeData?.popular?.slice(0, 5) || [];
  const trendingItems = homeData?.popular?.slice(0, 12) || [];
  const latestItems = latestData.slice(0, 18);

  return (
    <div className="min-h-screen pt-20 pb-24 md:pb-10">
      <div className="container">
        {error && !homeData && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-destructive text-lg mb-4">{error}</p>
            <button onClick={() => window.location.reload()} className="px-6 py-2 bg-primary text-primary-foreground rounded-lg">Retry</button>
          </div>
        )}

        <HeroBanner items={heroItems} />

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

        <ManhwaSection title="Trending Now" icon="🔥" items={trendingItems} loading={loading} />
        <ManhwaSection title="Latest Updates" icon="🆕" items={latestItems} loading={loading} />
      </div>
    </div>
  );
}
