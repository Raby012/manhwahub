import { useState } from "react";
import { Link } from "react-router-dom";
import { clearHistory, getHistory, type HistoryEntry } from "@/lib/storage";
import { Clock, Trash2 } from "lucide-react";

export default function History() {
  const [items, setItems] = useState<HistoryEntry[]>(getHistory());

  function clearAll() {
    clearHistory();
    setItems([]);
  }

  return (
    <div className="min-h-screen pt-20 pb-24 md:pb-10">
      <div className="container">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Clock className="w-7 h-7 text-primary" />
            <h1 className="text-2xl font-bold">Reading History</h1>
          </div>
          {items.length > 0 && (
            <button onClick={clearAll} className="px-3 py-1.5 text-sm bg-muted hover:bg-muted/70 rounded-md flex items-center gap-1.5">
              <Trash2 className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">No reading history yet.</p>
            <Link to="/" className="text-primary text-sm">Start reading →</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((h) => (
              <Link
                key={`${h.source}-${h.id}-${h.chapterId}`}
                to={`/manga/${h.source}/${encodeURIComponent(h.id)}/chapter/${encodeURIComponent(h.chapterId)}`}
                className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors"
              >
                <div className="w-12 h-16 bg-muted rounded shrink-0 overflow-hidden">
                  {h.cover && <img src={h.cover} alt={h.title} referrerPolicy="no-referrer" className="w-full h-full object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{h.title}</p>
                  <p className="text-[11px] text-muted-foreground">{h.chapterLabel} · {new Date(h.updatedAt).toLocaleString()}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
