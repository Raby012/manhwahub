export default function CardSkeleton() {
  return (
    <div className="rounded-lg overflow-hidden bg-card border border-border">
      <div className="aspect-[2/3] bg-muted animate-pulse" />
      <div className="p-2.5 space-y-2">
        <div className="h-3 bg-muted rounded animate-pulse w-3/4" />
        <div className="h-2 bg-muted rounded animate-pulse w-1/2" />
      </div>
    </div>
  );
}

export function GridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
