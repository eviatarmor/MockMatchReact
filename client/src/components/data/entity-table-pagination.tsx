import { useTranslation } from "react-i18next"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface EntityTablePaginationProps {
  readonly page: number
  readonly totalPages: number
  readonly total: number
  readonly onPageChange: (page: number) => void
  readonly disabled?: boolean
}

export function EntityTablePagination({
  page,
  totalPages,
  total,
  onPageChange,
  disabled,
}: EntityTablePaginationProps) {
  const { t } = useTranslation("common")

  if (total === 0) return null

  return (
    <div className="flex items-center justify-between gap-3 px-1 py-2">
      <p className="text-xs text-muted-foreground">
        {t("dashboard.pagination.summary", { page, totalPages, total })}
      </p>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 cursor-pointer gap-1"
          disabled={disabled || page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label={t("dashboard.pagination.prev")}
        >
          <ChevronLeft className="size-4" />
          <span className="hidden sm:inline">{t("dashboard.pagination.prev")}</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 cursor-pointer gap-1"
          disabled={disabled || page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label={t("dashboard.pagination.next")}
        >
          <span className="hidden sm:inline">{t("dashboard.pagination.next")}</span>
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}
