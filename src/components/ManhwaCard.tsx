import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import type { MangaResult } from "@/lib/mangadex";

interface Props {
  manga: MangaResult;
  showType?: boolean;
}

export default function ManhwaCard({ manga, showType = true }: Props) {
  return (
    <Link to={`/manhwa/${manga.id}`} className="group block card-hover">
      <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-muted">
        <img
          src={manga.coverUrl}
          alt={manga.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
        
        {/* Status badge */}
        <div className="absolute top-2 left-2">
          <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full uppercase tracking-wider ${
            manga.status === "completed"
              ? "bg-success/20 text-success"
              : manga.status === "ongoing"
              ? "bg-primary/20 text-primary"
              : "bg-gold/20 text-gold"
          }`}>
            {manga.status}
          </span>
        </div>

        {/* Type badge */}
        {showType && (
          <div className="absolute top-2 right-2">
            <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-secondary/20 text-secondary uppercase">
              {manga.type}
            </span>
          </div>
        )}

        {/* Bottom info */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="text-sm font-semibold line-clamp-2 text-foreground leading-tight">{manga.title}</h3>
          <div className="flex items-center gap-2 mt-1">
            {manga.lastChapter && (
              <span className="text-[10px] text-muted-foreground">Ch. {manga.lastChapter}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
