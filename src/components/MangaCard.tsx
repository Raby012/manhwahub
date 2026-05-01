import { Link } from "react-router-dom";
import type { MangaItem, MangaSource } from "@/lib/api";
import TypeBadge from "./TypeBadge";

export default function MangaCard({ item, source }: { item: MangaItem; source: MangaSource }) {
  return (
    <Link
      to={`/manga/${source}/${encodeURIComponent(item.id)}`}
      className="group block rounded-lg overflow-hidden bg-card border border-border card-hover"
    >
      <div className="relative aspect-[2/3] bg-muted overflow-hidden">
        {item.coverUrl ? (
          <img
            src={item.coverUrl}
            alt={item.title}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => ((e.target as HTMLImageElement).style.opacity = "0")}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
            No cover
          </div>
        )}
        <div className="absolute top-2 left-2">
          <TypeBadge type={item.contentType} />
        </div>
        {item.status && (
          <div className="absolute bottom-2 right-2 px-1.5 py-0.5 text-[10px] bg-black/70 text-white rounded">
            {item.status}
          </div>
        )}
      </div>
      <div className="p-2.5">
        <h3 className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
          {item.title}
        </h3>
        {item.genres && item.genres.length > 0 && (
          <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">
            {item.genres.slice(0, 3).join(" · ")}
          </p>
        )}
      </div>
    </Link>
  );
}
