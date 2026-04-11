import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, BookMarked, Menu, X, Flame, Shuffle, Clock } from "lucide-react";
import { searchManga, type MangaResult } from "@/lib/mangadex";

const GENRES = [
  "Action", "Romance", "Fantasy", "Isekai", "Martial Arts",
  "Comedy", "Drama", "Horror", "School Life", "Slice of Life",
];

export default function Navbar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MangaResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const navigate = useNavigate();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleSearch(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await searchManga({ title: value, limit: 6 });
        setResults(res.data);
        setShowResults(true);
      } catch {}
      setSearching(false);
    }, 400);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      setShowResults(false);
      navigate(`/browse?q=${encodeURIComponent(query.trim())}`);
    }
  }

  function handleRandom() {
    const offset = Math.floor(Math.random() * 1000);
    searchManga({ limit: 1, offset, order: { followedCount: "desc" } }).then((res) => {
      if (res.data[0]) navigate(`/manhwa/${res.data[0].id}`);
    });
  }

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border">
        <div className="container flex items-center justify-between h-16 gap-4">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <Flame className="w-7 h-7 text-primary" />
            <span className="text-xl font-bold text-gradient hidden sm:block">ManhwaHub</span>
          </Link>

          {/* Search */}
          <div ref={searchRef} className="relative flex-1 max-w-lg">
            <form onSubmit={handleSubmit}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search manhwa, manhua, manga..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                />
              </div>
            </form>
            {showResults && (
              <div className="absolute top-full mt-2 left-0 right-0 bg-card border border-border rounded-lg shadow-xl overflow-hidden z-50">
                {searching && <div className="p-4 text-center text-muted-foreground text-sm">Searching...</div>}
                {!searching && results.length === 0 && (
                  <div className="p-4 text-center text-muted-foreground text-sm">No results found</div>
                )}
                {results.map((m) => (
                  <Link
                    key={m.id}
                    to={`/manhwa/${m.id}`}
                    onClick={() => setShowResults(false)}
                    className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors"
                  >
                    <img
                      src={m.coverUrl}
                      alt={m.title}
                      referrerPolicy="no-referrer"
                      className="w-10 h-14 rounded object-cover bg-muted"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate text-foreground">{m.title}</p>
                      <p className="text-xs text-muted-foreground capitalize">{m.type} · {m.status}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            <Link to="/browse" className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted/50">
              Browse
            </Link>
            <Link to="/bookmarks" className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted/50 flex items-center gap-1">
              <BookMarked className="w-4 h-4" /> Bookmarks
            </Link>
            <Link to="/history" className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted/50 flex items-center gap-1">
              <Clock className="w-4 h-4" /> History
            </Link>
            <button onClick={handleRandom} className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted/50 flex items-center gap-1">
              <Shuffle className="w-4 h-4" /> Random
            </button>
          </div>

          <button className="md:hidden p-2" onClick={() => setMobileMenu(!mobileMenu)}>
            {mobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileMenu && (
        <div className="fixed inset-0 top-16 z-40 bg-background/95 backdrop-blur-xl md:hidden fade-in">
          <div className="flex flex-col p-4 gap-2">
            <Link to="/browse" onClick={() => setMobileMenu(false)} className="px-4 py-3 text-foreground hover:bg-muted/50 rounded-lg">Browse</Link>
            <Link to="/bookmarks" onClick={() => setMobileMenu(false)} className="px-4 py-3 text-foreground hover:bg-muted/50 rounded-lg flex items-center gap-2">
              <BookMarked className="w-4 h-4" /> Bookmarks
            </Link>
            <Link to="/history" onClick={() => setMobileMenu(false)} className="px-4 py-3 text-foreground hover:bg-muted/50 rounded-lg flex items-center gap-2">
              <Clock className="w-4 h-4" /> History
            </Link>
            <button onClick={() => { handleRandom(); setMobileMenu(false); }} className="px-4 py-3 text-left text-foreground hover:bg-muted/50 rounded-lg flex items-center gap-2">
              <Shuffle className="w-4 h-4" /> Random
            </button>
            <div className="border-t border-border mt-2 pt-4">
              <p className="px-4 text-xs text-muted-foreground mb-2">Genres</p>
              <div className="flex flex-wrap gap-2 px-4">
                {GENRES.map((g) => (
                  <Link key={g} to={`/browse?genre=${g.toLowerCase()}`} onClick={() => setMobileMenu(false)} className="px-3 py-1 text-xs bg-muted rounded-full text-muted-foreground hover:text-foreground hover:bg-primary/20 transition-colors">
                    {g}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-xl border-t border-border md:hidden">
        <div className="flex items-center justify-around py-2">
          <Link to="/" className="flex flex-col items-center gap-1 px-4 py-1 text-muted-foreground hover:text-primary transition-colors">
            <Flame className="w-5 h-5" />
            <span className="text-[10px]">Home</span>
          </Link>
          <Link to="/browse" className="flex flex-col items-center gap-1 px-3 py-1 text-muted-foreground hover:text-primary transition-colors">
            <Search className="w-5 h-5" />
            <span className="text-[10px]">Browse</span>
          </Link>
          <Link to="/bookmarks" className="flex flex-col items-center gap-1 px-3 py-1 text-muted-foreground hover:text-primary transition-colors">
            <BookMarked className="w-5 h-5" />
            <span className="text-[10px]">Saved</span>
          </Link>
          <Link to="/history" className="flex flex-col items-center gap-1 px-3 py-1 text-muted-foreground hover:text-primary transition-colors">
            <Clock className="w-5 h-5" />
            <span className="text-[10px]">History</span>
          </Link>
        </div>
      </div>
    </>
  );
}
