import { useTranslation } from "react-i18next"
import { Badge } from "@mockmatch/ui/badge"
import { cn } from "@/lib/utils"

type DocumentStatus = "active" | "draft" | "archived"

interface DocumentStatusBadgeProps {
  readonly status: DocumentStatus
  // i18n key prefix, e.g. "resumeLab.table.statusLabels"
  readonly translationPrefix: string
  readonly className?: string
}

// Document lifecycle pill: solid accent when active, muted outline otherwise.
export function DocumentStatusBadge({
  status,
  translationPrefix,
  className,
}: DocumentStatusBadgeProps) {
  const { t } = useTranslation("common")

  return (
    <Badge
      variant={status === "active" ? "default" : "outline"}
      className={cn(className)}
    >
      {t(`${translationPrefix}.${status}`)}
    </Badge>
  )
}
