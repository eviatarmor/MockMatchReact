import { useTranslation } from "react-i18next"
import { History } from "lucide-react"
import { Badge } from "@mockmatch/ui/badge"
import type { RecordedInterview } from "../types"

function statusVariant(status: RecordedInterview["status"]): "default" | "secondary" | "outline" {
  if (status === "analyzed")   return "default"
  if (status === "processing") return "secondary"
  return "outline"
}

interface RecorderInterviewsTableProps {
  readonly rows: readonly RecordedInterview[]
}

export function RecorderInterviewsTable({ rows }: RecorderInterviewsTableProps) {
  const { t } = useTranslation("common")

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border/60 bg-card p-5 shadow-sm ring-1 ring-foreground/5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <h2 className="font-heading text-base font-medium text-foreground">{t("recorder.table.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("recorder.table.description")}</p>
        </div>
        <button
          type="button"
          className="flex shrink-0 cursor-pointer items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <History className="size-3.5" />
          {t("recorder.table.viewAll")}
        </button>
      </div>

      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-border bg-muted/5 text-2xs font-medium text-muted-foreground select-none">
              <th className="py-2.5 pr-6 font-semibold">{t("recorder.table.columns.date")}</th>
              <th className="py-2.5 pr-6 font-semibold">{t("recorder.table.columns.company")}</th>
              <th className="py-2.5 pr-6 font-semibold">{t("recorder.table.columns.role")}</th>
              <th className="py-2.5 pr-6 font-semibold">{t("recorder.table.columns.platform")}</th>
              <th className="py-2.5 pr-6 font-semibold">{t("recorder.table.columns.duration")}</th>
              <th className="py-2.5 pr-6 font-semibold">{t("recorder.table.columns.talkRatio")}</th>
              <th className="py-2.5 pr-6 font-semibold">{t("recorder.table.columns.insights")}</th>
              <th className="py-2.5 font-semibold">{t("recorder.table.columns.status")}</th>
            </tr>
          </thead>
          <tbody className="entity-table-body divide-y divide-border/40">
            {rows.map((row) => (
              <tr key={row.id} className="group transition-colors hover:bg-muted/40">
                <td className="py-3 pr-6 text-sm tabular-nums text-muted-foreground">{row.date}</td>
                <td className="py-3 pr-6 text-sm font-medium text-foreground">{row.company}</td>
                <td className="py-3 pr-6 text-sm text-muted-foreground">{row.role}</td>
                <td className="py-3 pr-6 text-sm text-muted-foreground">{row.platform}</td>
                <td className="py-3 pr-6 text-sm tabular-nums text-foreground">{row.durationMin} min</td>
                <td className="py-3 pr-6 text-sm tabular-nums text-foreground">{row.talkRatio}%</td>
                <td className="py-3 pr-6 text-sm tabular-nums text-foreground">{row.status === "processing" ? "—" : row.insightCount}</td>
                <td className="py-3">
                  <Badge variant={statusVariant(row.status)}>
                    {t(`recorder.table.status.${row.status}`)}
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
