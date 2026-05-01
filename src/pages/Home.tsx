import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getTrending, type MangaItem, type MangaSource } from "@/lib/api";
import MangaCard from "@/components/MangaCard";
import { GridSkeleton } from "@/components/CardSkeleton";
import { BookOpen, Flame, Sparkles, TrendingUp } from "lucide-react";

interface SectionState {
  loading: boolean;
  items: MangaItem[];
  error?: string;
}

function Section({
  title,
  icon,
  source,
  state,
}: {
  title: string;
  icon: React.ReactNode;
  source: MangaSource;
  state: SectionState;
}) {
  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
          {icon} {title}
        </h2>
      </div>
      {state.loading ? (
        <GridSkeleton count={12} />
      ) : state.error ? (
        <p className="text-sm text-muted-foreground">{state.error}</p>
      ) : state.items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No results.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {state.items.slice(0, 12).map((item) => (
            <MangaCard key={`${source}-${item.id}`} item={item} source={source} />
          ))}
        </div>
      )}
    </section>
  );
}

export default function Home() {
  const [trendingManhwa, setTrendingManhwa] = useState<SectionState>({ loading: true, items: [] });
  const [trendingManga, setTrendingManga] = useState<SectionState>({ loading: true, items: [] });
  const [newReleases, setNewReleases] = useState<SectionState>({ loading: true, items: [] });

  useEffect(() => {
    getTrending({ source: "mangadex", type: "manhwa" })
      .then((d) => setTrendingManhwa({ loading: false, items: d.results || [] }))
      .catch((e) => setTrendingManhwa({ loading: false, items: [], error: e.message }));

    getTrending({ source: "mangadex", type: "manga" })
      .then((d) => setTrendingManga({ loading: false, items: d.results || [] }))
      .catch((e) => setTrendingManga({ loading: false, items: [], error: e.message }));

    getTrending({ source: "mangadex", page: 2 })
      .then((d) => setNewReleases({ loading: false, items: d.results || [] }))
      .catch((e) => setNewReleases({ loading: false, items: [], error: e.message }));
  }, []);

  const hero = trendingManhwa.items[0];

  return (
    <div className="min-h-screen pt-20 pb-24 md:pb-10">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/20 via-background to-background pointer-events-none" />
        <div className="container relative py-10 sm:py-16">
          <div className="max-w-3xl">
            <h1 className="text-3xl sm:text-5xl font-extrabold mb-3">
              Read <span className="text-gradient">manhwa, manga & novels</span> in one place
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg mb-6">
              Trending titles from MangaDex, ComicK, WeebCentral & AsuraScans plus a full novel library.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/search" className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Browse all
              </Link>
              <Link to="/novels" className="px-5 py-2.5 bg-muted text-foreground rounded-lg font-medium hover:bg-muted/70 transition flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> Light novels
              </Link>
            </div>
          </div>

          {hero && (
            <Link
              to={`/manga/mangadex/${encodeURIComponent(hero.id)}`}
              className="mt-8 flex gap-4 p-3 sm:p-4 bg-card border border-border rounded-xl max-w-2xl hover:border-primary/50 transition-colors"
            >
              {hero.coverUrl && (
                <img src={hero.coverUrl} alt={hero.title} referrerPolicy="no-referrer" className="w-16 sm:w-24 aspect-[2/3] object-cover rounded-md bg-muted shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[11px] uppercase tracking-wider text-primary font-semibold mb-1">🔥 Trending now</p>
                <h3 className="font-bold text-base sm:text-lg line-clamp-2">{hero.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 sm:line-clamp-3 mt-1">{hero.description}</p>
              </div>
            </Link>
          )}
        </div>
      </div>

      <div className="container mt-6">
        <Section title="Trending Manhwa" icon={<Flame className="w-5 h-5 text-primary" />} source="mangadex" state={trendingManhwa} />
        <Section title="Trending Manga" icon={<TrendingUp className="w-5 h-5 text-secondary" />} source="mangadex" state={trendingManga} />
        <Section title="New Releases" icon={<Sparkles className="w-5 h-5 text-gold" />} source="mangadex" state={newReleases} />
      </div>
    </div>
  );
}
