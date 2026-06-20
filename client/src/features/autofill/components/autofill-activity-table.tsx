import { useTranslation } from "react-i18next"
import { History } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { BADGE_TONES } from "@/components/data/badge-tones"
import type { ActivityRow, ActivityStatus } from "../types"

function statusClasses(status: ActivityStatus): string {
  if (status === "submitted")   return BADGE_TONES.emerald
  if (status === "needsReview") return BADGE_TONES.amber
  return ""
}

interface AutofillActivityTableProps {
  readonly rows: readonly ActivityRow[]
}

export function AutofillActivityTable({ rows }: AutofillActivityTableProps) {
  const { t } = useTranslation("common")

  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-base font-semibold">{t("autofill.activity.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("autofill.activity.description")}</p>
        </div>
        <button className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
          <History className="size-3.5" />
          {t("autofill.activity.fullLog")}
        </button>
      </div>

      <ScrollArea className="w-full">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground select-none">
              <th className="py-2 pr-6 font-medium">{t("autofill.activity.columns.company")}</th>
              <th className="py-2 pr-6 font-medium">{t("autofill.activity.columns.role")}</th>
              <th className="py-2 pr-6 font-medium">{t("autofill.activity.columns.site")}</th>
              <th className="py-2 pr-6 font-medium">{t("autofill.activity.columns.date")}</th>
              <th className="py-2 pr-6 font-medium">{t("autofill.activity.columns.fieldsFilled")}</th>
              <th className="py-2 font-medium">{t("autofill.activity.columns.status")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {rows.map((row) => (
              <tr key={row.id} className="group hover:bg-muted/5 transition-colors">
                <td className="py-3 pr-6 text-sm font-semibold group-hover:text-primary transition-colors">{row.company}</td>
                <td className="py-3 pr-6 text-sm text-muted-foreground">{row.role}</td>
                <td className="py-3 pr-6 text-sm text-primary">{row.site}</td>
                <td className="py-3 pr-6 text-sm text-muted-foreground">{row.date}</td>
                <td className="py-3 pr-6 text-sm">{row.fieldsFilled}</td>
                <td className="py-3">
                  <Badge variant="outline" className={statusClasses(row.status)}>
                    {t(`autofill.activity.status.${row.status}`)}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollArea>
    </div>
  )
}
