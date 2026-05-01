import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, BookMarked, Clock, Flame, BookOpen, Menu, X } from "lucide-react";

export default function Navbar() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (q.trim()) {
      navigate(`/search?q=${encodeURIComponent(q.trim())}`);
      setOpen(false);
    }
  }

  return (
    <>
      <nav className="fixed top-0 inset-x-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border">
        <div className="container flex items-center gap-3 h-16">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <Flame className="w-6 h-6 text-primary" />
            <span className="text-lg font-bold text-gradient hidden sm:block">MangaHub</span>
          </Link>

          <form onSubmit={submit} className="flex-1 max-w-lg relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search manga, manhwa, manhua..."
              className="w-full pl-10 pr-3 py-2 rounded-lg bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </form>

          <div className="hidden md:flex items-center gap-1">
            <NavLink to="/" icon={<Flame className="w-4 h-4" />}>Home</NavLink>
            <NavLink to="/novels" icon={<BookOpen className="w-4 h-4" />}>Novels</NavLink>
            <NavLink to="/bookmarks" icon={<BookMarked className="w-4 h-4" />}>Bookmarks</NavLink>
            <NavLink to="/history" icon={<Clock className="w-4 h-4" />}>History</NavLink>
          </div>

          <button className="md:hidden p-2" onClick={() => setOpen((v) => !v)} aria-label="Menu">
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="fixed inset-0 top-16 z-40 bg-background/95 backdrop-blur-xl md:hidden p-4 space-y-2 fade-in">
          <MobileLink to="/" onClick={() => setOpen(false)} icon={<Flame className="w-4 h-4" />}>Home</MobileLink>
          <MobileLink to="/novels" onClick={() => setOpen(false)} icon={<BookOpen className="w-4 h-4" />}>Novels</MobileLink>
          <MobileLink to="/bookmarks" onClick={() => setOpen(false)} icon={<BookMarked className="w-4 h-4" />}>Bookmarks</MobileLink>
          <MobileLink to="/history" onClick={() => setOpen(false)} icon={<Clock className="w-4 h-4" />}>History</MobileLink>
        </div>
      )}

      {/* Mobile bottom nav */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-background/90 backdrop-blur-xl border-t border-border md:hidden">
        <div className="flex justify-around py-2">
          <BottomLink to="/" icon={<Flame className="w-5 h-5" />} label="Home" />
          <BottomLink to="/search" icon={<Search className="w-5 h-5" />} label="Search" />
          <BottomLink to="/novels" icon={<BookOpen className="w-5 h-5" />} label="Novels" />
          <BottomLink to="/bookmarks" icon={<BookMarked className="w-5 h-5" />} label="Saved" />
          <BottomLink to="/history" icon={<Clock className="w-5 h-5" />} label="History" />
        </div>
      </div>
    </>
  );
}

function NavLink({ to, icon, children }: { to: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link to={to} className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md flex items-center gap-1.5 transition-colors">
      {icon}{children}
    </Link>
  );
}
function MobileLink({ to, icon, children, onClick }: { to: string; icon: React.ReactNode; children: React.ReactNode; onClick: () => void }) {
  return (
    <Link to={to} onClick={onClick} className="px-4 py-3 text-foreground hover:bg-muted/50 rounded-lg flex items-center gap-2">
      {icon}{children}
    </Link>
  );
}
function BottomLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link to={to} className="flex flex-col items-center gap-0.5 px-3 py-1 text-muted-foreground hover:text-primary transition-colors">
      {icon}
      <span className="text-[10px]">{label}</span>
    </Link>
  );
}
