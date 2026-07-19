import { useTranslation } from "react-i18next"
import { History } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
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
    <div className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-base font-semibold">{t("recorder.table.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("recorder.table.description")}</p>
        </div>
        <button className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
          <History className="size-3.5" />
          {t("recorder.table.viewAll")}
        </button>
      </div>

      <ScrollArea className="w-full">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground select-none">
              <th className="py-2 pr-6 font-medium">{t("recorder.table.columns.date")}</th>
              <th className="py-2 pr-6 font-medium">{t("recorder.table.columns.company")}</th>
              <th className="py-2 pr-6 font-medium">{t("recorder.table.columns.role")}</th>
              <th className="py-2 pr-6 font-medium">{t("recorder.table.columns.platform")}</th>
              <th className="py-2 pr-6 font-medium">{t("recorder.table.columns.duration")}</th>
              <th className="py-2 pr-6 font-medium">{t("recorder.table.columns.talkRatio")}</th>
              <th className="py-2 pr-6 font-medium">{t("recorder.table.columns.insights")}</th>
              <th className="py-2 font-medium">{t("recorder.table.columns.status")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {rows.map((row) => (
              <tr key={row.id} className="group hover:bg-muted/5 transition-colors">
                <td className="py-3 pr-6 text-sm text-primary">{row.date}</td>
                <td className="py-3 pr-6 text-sm font-semibold group-hover:text-primary transition-colors">{row.company}</td>
                <td className="py-3 pr-6 text-sm text-muted-foreground">{row.role}</td>
                <td className="py-3 pr-6 text-sm text-muted-foreground">{row.platform}</td>
                <td className="py-3 pr-6 text-sm">{row.durationMin} min</td>
                <td className="py-3 pr-6 text-sm">{row.talkRatio}%</td>
                <td className="py-3 pr-6 text-sm">{row.status === "processing" ? "—" : row.insightCount}</td>
                <td className="py-3">
                  <Badge variant={statusVariant(row.status)}>
                    {t(`recorder.table.status.${row.status}`)}
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
