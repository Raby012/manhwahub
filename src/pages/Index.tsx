import { useEffect, useState } from "react";
import { searchManga, type MangaResult } from "@/lib/mangadex";
import HeroBanner from "@/components/HeroBanner";
import ManhwaSection from "@/components/ManhwaSection";
import { Link } from "react-router-dom";

const GENRE_TAGS = [
  "Action", "Romance", "Fantasy", "Isekai", "Martial Arts",
  "Comedy", "Drama", "Horror", "School Life", "Slice of Life",
  "Adventure", "Sci-Fi",
];

export default function Index() {
  const [featured, setFeatured] = useState<MangaResult[]>([]);
  const [trending, setTrending] = useState<MangaResult[]>([]);
  const [topRated, setTopRated] = useState<MangaResult[]>([]);
  const [popular, setPopular] = useState<MangaResult[]>([]);
  const [latest, setLatest] = useState<MangaResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [f, t, r, p, l] = await Promise.all([
          searchManga({ order: { followedCount: "desc" }, limit: 5 }),
          searchManga({ originalLanguage: ["ko"], order: { followedCount: "desc" }, limit: 12 }),
          searchManga({ order: { rating: "desc" }, limit: 12 }),
          searchManga({ originalLanguage: ["ko"], order: { rating: "desc" }, limit: 12 }),
          searchManga({ order: { latestUploadedChapter: "desc" }, limit: 12 }),
        ]);
        setFeatured(f.data);
        setTrending(t.data);
        setTopRated(r.data);
        setPopular(p.data);
        setLatest(l.data);
      } catch (e) {
        console.error("Failed to load homepage data:", e);
      }
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="min-h-screen pt-20 pb-24 md:pb-10">
      <div className="container">
        <HeroBanner manga={featured} />

        {/* Genre quick filters */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-8 scrollbar-hide">
          {GENRE_TAGS.map((g) => (
            <Link
              key={g}
              to={`/browse?genre=${g.toLowerCase()}`}
              className="px-4 py-2 text-xs font-medium bg-muted rounded-full text-muted-foreground hover:text-foreground hover:bg-primary/20 hover:text-primary transition-colors whitespace-nowrap shrink-0"
            >
              {g}
            </Link>
          ))}
        </div>

        <ManhwaSection title="Trending Now" icon="🔥" manga={trending} loading={loading} />
        <ManhwaSection title="Latest Updates" icon="🆕" manga={latest} loading={loading} />
        <ManhwaSection title="Top Rated" icon="⭐" manga={topRated} loading={loading} />
        <ManhwaSection title="Popular Manhwa" icon="📚" manga={popular} loading={loading} />
      </div>
    </div>
  );
}
