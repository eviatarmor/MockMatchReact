import { useTranslation } from "react-i18next"

type DocumentStatus = "active" | "draft" | "archived"

interface DocumentStatusBadgeProps {
  readonly status: DocumentStatus
  // i18n key prefix, e.g. "resumeLab.table.statusLabels"
  readonly translationPrefix: string
}

// Document lifecycle pill: solid accent when active, muted outline otherwise.
export function DocumentStatusBadge({ status, translationPrefix }: DocumentStatusBadgeProps) {
  const { t } = useTranslation("common")

  if (status === "active") {
    return (
      <span className="inline-flex items-center rounded-full bg-blue-600 px-2.5 py-0.5 text-xs font-semibold text-white dark:bg-blue-500">
        {t(`${translationPrefix}.active`)}
      </span>
    )
  }

  return (
    <span className="inline-flex items-center rounded-full border border-border bg-muted/40 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
      {t(`${translationPrefix}.${status}`)}
    </span>
  )
}
