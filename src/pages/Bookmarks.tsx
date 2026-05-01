import { useState } from "react";
import { Link } from "react-router-dom";
import { getBookmarks, toggleBookmark, type Bookmark } from "@/lib/storage";
import TypeBadge from "@/components/TypeBadge";
import { BookMarked, X } from "lucide-react";
import type { ContentType } from "@/lib/api";

export default function Bookmarks() {
  const [items, setItems] = useState<Bookmark[]>(getBookmarks());

  function remove(b: Bookmark) {
    toggleBookmark(b);
    setItems(getBookmarks());
  }

  return (
    <div className="min-h-screen pt-20 pb-24 md:pb-10">
      <div className="container">
        <div className="flex items-center gap-3 mb-6">
          <BookMarked className="w-7 h-7 text-primary" />
          <h1 className="text-2xl font-bold">Bookmarks</h1>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">You haven't bookmarked anything yet.</p>
            <Link to="/" className="text-primary text-sm">Browse titles →</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {items.map((b) => (
              <div key={`${b.source}-${b.id}`} className="relative group">
                <Link to={`/manga/${b.source}/${encodeURIComponent(b.id)}`} className="block rounded-lg overflow-hidden bg-card border border-border card-hover">
                  <div className="relative aspect-[2/3] bg-muted">
                    {b.cover && <img src={b.cover} alt={b.title} referrerPolicy="no-referrer" className="w-full h-full object-cover" />}
                    <div className="absolute top-2 left-2"><TypeBadge type={b.contentType as ContentType} /></div>
                  </div>
                  <div className="p-2.5">
                    <p className="text-sm font-medium line-clamp-2">{b.title}</p>
                  </div>
                </Link>
                <button
                  onClick={() => remove(b)}
                  className="absolute top-2 right-2 p-1 rounded-full bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Remove"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
