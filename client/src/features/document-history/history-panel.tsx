import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useInView } from "react-intersection-observer"
import { History } from "lucide-react"
import type { DocumentKind } from "@mockmatch/schemas"
import { Skeleton } from "@mockmatch/ui/skeleton"
import { StaggerItem } from "@mockmatch/ui/stagger"
import { cn } from "@/lib/utils"
import { formatRelativeTime } from "@/lib/format-relative-time"
import { trpc } from "@/lib/trpc"
import { VersionPreviewDialog } from "./version-preview-dialog"

const PAGE_SIZE = 15
const SKELETON_ROWS = 6

function HistoryRowSkeleton() {
  return (
    <div className="rounded-lg px-2.5 py-2">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="mt-1.5 h-3 w-20" />
    </div>
  )
}

type HistoryPanelProps = {
  readonly kind: DocumentKind
  readonly documentId: string
  readonly canRestore: boolean
  readonly onRestored?: (detail: {
    title: string
    templateId: string
    style: unknown
    document: unknown
  }) => void
  /** i18n namespace: resume-editor | cover-letter-editor */
  readonly i18nNs: "resume-editor" | "cover-letter-editor"
}

export function HistoryPanel({
  kind,
  documentId,
  canRestore,
  onRestored,
  i18nNs,
}: HistoryPanelProps) {
  const { t } = useTranslation(i18nNs)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const list = trpc.documentVersions.list.useInfiniteQuery(
    { kind, id: documentId, pageSize: PAGE_SIZE },
    {
      staleTime: 3_000,
      refetchInterval: 8_000,
      refetchOnWindowFocus: true,
      getNextPageParam: (lastPage) => {
        const loaded = lastPage.page * lastPage.pageSize
        return loaded < lastPage.total ? lastPage.page + 1 : undefined
      },
    }
  )

  const items = useMemo(
    () => list.data?.pages.flatMap((page) => page.items) ?? [],
    [list.data?.pages]
  )

  // Nested overflow in editor rail clips the list — observer still works
  // (overflow ancestors clip intersection vs viewport root).
  const { ref: loadMoreRef, inView } = useInView({
    rootMargin: "120px",
    threshold: 0,
  })

  useEffect(() => {
    if (inView && list.hasNextPage && !list.isFetchingNextPage) {
      void list.fetchNextPage()
    }
  }, [inView, list.hasNextPage, list.isFetchingNextPage, list.fetchNextPage])

  if (list.isLoading) {
    return (
      <ul className="space-y-0.5" aria-busy="true" aria-label={t("history.loading")}>
        {Array.from({ length: SKELETON_ROWS }, (_, i) => (
          <li key={i}>
            <HistoryRowSkeleton />
          </li>
        ))}
      </ul>
    )
  }

  if (list.isError) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        {t("history.loadError")}
      </p>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center">
        <History className="size-8 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">{t("history.empty")}</p>
      </div>
    )
  }

  return (
    <>
      <ul className="space-y-0.5" aria-busy={list.isFetchingNextPage}>
        {items.map((item, idx) => (
          <StaggerItem key={item.id} index={idx} as="li">
            <button
              type="button"
              onClick={() => setSelectedId(item.id)}
              className={cn(
                "w-full cursor-pointer rounded-lg px-2.5 py-2 text-left transition-colors",
                "hover:bg-muted/80",
                selectedId === item.id && "bg-muted"
              )}
            >
              <p className="text-sm font-medium text-foreground">
                {formatRelativeTime(item.createdAt)}
              </p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {item.actorName}
              </p>
            </button>
          </StaggerItem>
        ))}
      </ul>

      <div ref={loadMoreRef} className="h-1 w-full" aria-hidden />

      {list.isFetchingNextPage && (
        <ul className="mt-0.5 space-y-0.5" aria-busy="true" aria-label={t("history.loading")}>
          <li>
            <HistoryRowSkeleton />
          </li>
          <li>
            <HistoryRowSkeleton />
          </li>
        </ul>
      )}

      <VersionPreviewDialog
        open={selectedId != null}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null)
        }}
        kind={kind}
        documentId={documentId}
        versionId={selectedId}
        canRestore={canRestore}
        onRestored={(detail) => {
          setSelectedId(null)
          onRestored?.(detail)
        }}
        i18nNs={i18nNs}
      />
    </>
  )
}
