import { useTranslation } from "react-i18next"

interface CoverLetterStatusBadgeProps {
  readonly status: "active" | "draft" | "archived"
}

export function CoverLetterStatusBadge({ status }: CoverLetterStatusBadgeProps) {
  const { t } = useTranslation("common")

  if (status === "active") {
    return (
      <span className="inline-flex items-center rounded-full bg-blue-600 px-2.5 py-0.5 text-xs font-semibold text-white dark:bg-blue-500">
        {t("coverLetters.table.statusLabels.active")}
      </span>
    )
  }

  return (
    <span className="inline-flex items-center rounded-full border border-border bg-muted/40 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
      {t(`coverLetters.table.statusLabels.${status}`)}
    </span>
  )
}
