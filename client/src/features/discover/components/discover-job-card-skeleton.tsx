import { Skeleton } from "@/components/ui/skeleton"

export function DiscoverJobCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Skeleton className="size-10 shrink-0 rounded-xl" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-28" />
            <div className="mt-1 flex flex-wrap gap-3">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-14" />
            </div>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-center gap-1.5">
          <Skeleton className="size-14 rounded-full" />
          <Skeleton className="h-2.5 w-16" />
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-12 flex-1 rounded-lg" />
        <div className="flex shrink-0 items-center gap-1.5">
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="size-8 rounded-md" />
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-24 rounded-full" />
      </div>
    </div>
  )
}
