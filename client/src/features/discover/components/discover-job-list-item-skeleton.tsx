import { Skeleton } from "@mockmatch/ui/skeleton"

export function DiscoverJobListItemSkeleton() {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-card p-3 ring-1 ring-foreground/10">
      <Skeleton className="size-9 shrink-0 rounded-lg" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-3/4 max-w-48" />
        <Skeleton className="h-3 w-24" />
        <div className="flex gap-3">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-14" />
        </div>
      </div>
      <Skeleton className="h-5 w-8 shrink-0 rounded-full" />
    </div>
  )
}
