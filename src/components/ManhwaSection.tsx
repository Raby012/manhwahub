import type { MangaListItem } from "@/lib/api";
import ManhwaCard from "./ManhwaCard";

interface Props {
  title: string;
  icon?: string;
  items: MangaListItem[];
  loading?: boolean;
}

export default function ManhwaSection({ title, icon, items = [], loading }: Props) {
  if (loading) {
    return (
      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          {icon && <span>{icon}</span>} {title}
        </h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (items.length === 0) return null;

  return (
    <section className="mb-10 slide-up">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-foreground">
        {icon && <span>{icon}</span>} {title}
      </h2>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
        {items.map((item) => (
          <ManhwaCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
