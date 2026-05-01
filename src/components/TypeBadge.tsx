import type { ContentType } from "@/lib/api";

const styles: Record<ContentType, string> = {
  manga: "bg-rose-500/20 text-rose-300 border-rose-500/30",
  manhwa: "bg-primary/20 text-primary border-primary/30",
  manhua: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  unknown: "bg-muted text-muted-foreground border-border",
};

export default function TypeBadge({ type, className = "" }: { type?: ContentType; className?: string }) {
  const t = (type ?? "unknown") as ContentType;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${styles[t]} ${className}`}
    >
      {t}
    </span>
  );
}
