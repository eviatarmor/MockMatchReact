import { useState } from "react"
import { useTranslation } from "react-i18next"
import { History, Loader2 } from "lucide-react"
import type { DocumentKind } from "@mockmatch/schemas"
import { StaggerItem } from "@/components/ui/stagger"
import { cn } from "@/lib/utils"
import { formatRelativeTime } from "@/lib/format-relative-time"
import { trpc } from "@/lib/trpc"
import { VersionPreviewDialog } from "./version-preview-dialog"

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

  const list = trpc.documentVersions.list.useQuery(
    { kind, id: documentId },
    {
      staleTime: 3_000,
      refetchInterval: 8_000,
      refetchOnWindowFocus: true,
    }
  )

  const items = list.data?.items ?? []

  if (list.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        {t("history.loading")}
      </div>
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
      <ul className="space-y-0.5">
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
