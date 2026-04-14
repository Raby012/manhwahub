import { Link } from "react-router-dom";
import type { MangaListItem } from "@/lib/api";

interface Props {
  item: MangaListItem;
}

export default function ManhwaCard({ item }: Props) {
  return (
    <Link to={`/manhwa/${item.slug}`} className="group block card-hover">
      <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-muted">
        <img
          src={item.image}
          alt={item.title}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="text-sm font-semibold line-clamp-2 text-foreground leading-tight">{item.title}</h3>
        </div>
      </div>
    </Link>
  );
}
