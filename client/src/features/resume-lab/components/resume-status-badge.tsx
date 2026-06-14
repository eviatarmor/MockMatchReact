import { useTranslation } from "react-i18next"

interface ResumeStatusBadgeProps {
  readonly status: "active" | "draft" | "archived"
}

export function ResumeStatusBadge({ status }: ResumeStatusBadgeProps) {
  const { t } = useTranslation("common")

  if (status === "active") {
    return (
      <span className="inline-flex items-center rounded-full bg-blue-600 px-2.5 py-0.5 text-xs font-semibold text-white dark:bg-blue-500">
        {t("resumeLab.table.statusLabels.active")}
      </span>
    )
  }

  return (
    <span className="inline-flex items-center rounded-full border border-border bg-muted/40 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
      {t(`resumeLab.table.statusLabels.${status}`)}
    </span>
  )
}
