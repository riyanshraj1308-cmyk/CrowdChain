export default function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded-md bg-ink-950/8 ${className}`} aria-hidden="true" />;
}

export function CampaignCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-ink-950/10 bg-paper-50">
      <Skeleton className="h-44 w-full rounded-none" />
      <div className="flex flex-col gap-3 p-5">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-2 w-full" />
        <div className="flex justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </div>
  );
}
