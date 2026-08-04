import { useTranslation } from "react-i18next"
import { History } from "lucide-react"
import { Badge } from "@mockmatch/ui/badge"
import type { ActivityRow, ActivityStatus } from "../types"

function statusVariant(status: ActivityStatus): "default" | "secondary" | "outline" {
  if (status === "submitted")   return "default"
  if (status === "needsReview") return "secondary"
  return "outline"
}

interface AutofillActivityTableProps {
  readonly rows: readonly ActivityRow[]
}

export function AutofillActivityTable({ rows }: AutofillActivityTableProps) {
  const { t } = useTranslation("common")

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border/60 bg-card p-5 shadow-sm ring-1 ring-foreground/5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <h2 className="font-heading text-base font-medium text-foreground">{t("autofill.activity.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("autofill.activity.description")}</p>
        </div>
        <button
          type="button"
          className="flex shrink-0 cursor-pointer items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <History className="size-3.5" />
          {t("autofill.activity.fullLog")}
        </button>
      </div>

      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-border bg-muted/5 text-2xs font-medium text-muted-foreground select-none">
              <th className="py-2.5 pr-6 font-semibold">{t("autofill.activity.columns.company")}</th>
              <th className="py-2.5 pr-6 font-semibold">{t("autofill.activity.columns.role")}</th>
              <th className="py-2.5 pr-6 font-semibold">{t("autofill.activity.columns.site")}</th>
              <th className="py-2.5 pr-6 font-semibold">{t("autofill.activity.columns.date")}</th>
              <th className="py-2.5 pr-6 font-semibold">{t("autofill.activity.columns.fieldsFilled")}</th>
              <th className="py-2.5 font-semibold">{t("autofill.activity.columns.status")}</th>
            </tr>
          </thead>
          <tbody className="entity-table-body divide-y divide-border/40">
            {rows.map((row) => (
              <tr key={row.id} className="group transition-colors hover:bg-muted/40">
                <td className="py-3 pr-6 text-sm font-medium text-foreground">{row.company}</td>
                <td className="py-3 pr-6 text-sm text-muted-foreground">{row.role}</td>
                <td className="py-3 pr-6 text-sm font-medium text-primary">{row.site}</td>
                <td className="py-3 pr-6 text-sm text-muted-foreground tabular-nums">{row.date}</td>
                <td className="py-3 pr-6 text-sm tabular-nums text-foreground">{row.fieldsFilled}</td>
                <td className="py-3">
                  <Badge variant={statusVariant(row.status)}>
                    {t(`autofill.activity.status.${row.status}`)}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
