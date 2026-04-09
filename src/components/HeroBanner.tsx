import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { MangaResult } from "@/lib/mangadex";

interface Props {
  manga: MangaResult[];
}

export default function HeroBanner({ manga }: Props) {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % manga.length);
  }, [manga.length]);

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + manga.length) % manga.length);
  }, [manga.length]);

  useEffect(() => {
    timerRef.current = setInterval(next, 6000);
    return () => clearInterval(timerRef.current);
  }, [next]);

  if (manga.length === 0) {
    return (
      <div className="relative h-[50vh] md:h-[60vh] bg-muted animate-pulse rounded-2xl" />
    );
  }

  const m = manga[current];

  return (
    <div className="relative h-[50vh] md:h-[60vh] rounded-2xl overflow-hidden mb-10">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-700"
        style={{ backgroundImage: `url(${m.coverUrl.replace('.256.', '.512.')})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/30" />

      {/* Content */}
      <div className="relative h-full flex items-end p-6 md:p-10">
        <div className="max-w-lg fade-in" key={m.id}>
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-primary/20 text-primary uppercase mb-3 inline-block">
            {m.type} · {m.status}
          </span>
          <h1 className="text-2xl md:text-4xl font-bold text-foreground mb-3 leading-tight">{m.title}</h1>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{m.description.replace(/<[^>]*>/g, '').slice(0, 200)}</p>
          <div className="flex gap-3">
            <Link
              to={`/manhwa/${m.id}`}
              className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors"
            >
              Read Now
            </Link>
            <Link
              to={`/manhwa/${m.id}`}
              className="px-6 py-2.5 bg-muted text-foreground rounded-lg font-medium text-sm hover:bg-muted/80 transition-colors"
            >
              Details
            </Link>
          </div>
        </div>
      </div>

      {/* Nav buttons */}
      <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/50 hover:bg-background/80 transition-colors">
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/50 hover:bg-background/80 transition-colors">
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {manga.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-2 h-2 rounded-full transition-all ${i === current ? "w-6 bg-primary" : "bg-muted-foreground/40"}`}
          />
        ))}
      </div>
    </div>
  );
}
