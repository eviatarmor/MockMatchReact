import { useTranslation } from "react-i18next"
import { ResumeTableRow } from "./resume-table-row"
import type { ResumeItem } from "../types"

interface ResumeTableProps {
  readonly resumes: ResumeItem[]
}

export function ResumeTable({ resumes }: ResumeTableProps) {
  const { t } = useTranslation("common")

  return (
    <div className="w-full overflow-x-auto rounded-xl border bg-card shadow-sm">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-border bg-muted/5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground select-none">
            <th className="py-3 px-4 font-bold">{t("resumeLab.table.columns.resume")}</th>
            <th className="py-3 px-4 font-bold text-center">{t("resumeLab.table.columns.ats")}</th>
            <th className="py-3 px-4 font-bold">{t("resumeLab.table.columns.status")}</th>
            <th className="py-3 px-4 font-bold hidden sm:table-cell">
              {t("resumeLab.table.columns.updated")}
            </th>
            <th className="py-3 px-4 text-right w-12"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/40">
          {resumes.length > 0 ? (
            resumes.map((resume) => <ResumeTableRow key={resume.id} resume={resume} />)
          ) : (
            <tr>
              <td colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                No resumes found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
