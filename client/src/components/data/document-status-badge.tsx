import { useTranslation } from "react-i18next"
import { Badge } from "@/components/ui/badge"

type DocumentStatus = "active" | "draft" | "archived"

interface DocumentStatusBadgeProps {
  readonly status: DocumentStatus
  // i18n key prefix, e.g. "resumeLab.table.statusLabels"
  readonly translationPrefix: string
}

// Document lifecycle pill: solid accent when active, muted outline otherwise.
export function DocumentStatusBadge({ status, translationPrefix }: DocumentStatusBadgeProps) {
  const { t } = useTranslation("common")

  return (
    <Badge variant={status === "active" ? "default" : "outline"}>
      {t(`${translationPrefix}.${status}`)}
    </Badge>
  )
}
