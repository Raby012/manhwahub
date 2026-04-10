import { useState, useEffect } from "react";
import { searchManga, type MangaResult } from "@/lib/mangadex";
import ManhwaCard from "./ManhwaCard";

interface Props {
  manga: MangaResult;
}

export default function SimilarManhwa({ manga }: Props) {
  const [similar, setSimilar] = useState<MangaResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!manga.tags.length) { setLoading(false); return; }
    const tagIds = manga.tags.slice(0, 3).map((t) => t.id);
    searchManga({
      includedTags: tagIds,
      originalLanguage: manga.type === "manhwa" ? ["ko"] : manga.type === "manhua" ? ["zh", "zh-hk"] : undefined,
      order: { followedCount: "desc" },
      limit: 12,
    })
      .then((res) => setSimilar(res.data.filter((m) => m.id !== manga.id).slice(0, 6)))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [manga.id]);

  if (!loading && similar.length === 0) return null;

  return (
    <div className="mt-8">
      <h2 className="text-lg font-bold text-foreground mb-4">🔗 Similar {manga.type === "manhwa" ? "Manhwa" : manga.type === "manhua" ? "Manhua" : "Manga"}</h2>
      {loading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {similar.map((m) => (
            <ManhwaCard key={m.id} manga={m} />
          ))}
        </div>
      )}
    </div>
  );
}
