import { useTranslation } from "react-i18next"
import { CoverLetterTableRow } from "./cover-letter-table-row"
import type { CoverLetterItem } from "../types"

interface CoverLetterTableProps {
  readonly coverLetters: CoverLetterItem[]
}

export function CoverLetterTable({ coverLetters }: CoverLetterTableProps) {
  const { t } = useTranslation("common")

  return (
    <div className="w-full overflow-x-auto rounded-xl border bg-card shadow-sm">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-border bg-muted/5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground select-none">
            <th className="py-3 px-4 font-bold">{t("coverLetters.table.columns.coverLetter")}</th>
            <th className="py-3 px-4 font-bold">{t("coverLetters.table.columns.status")}</th>
            <th className="py-3 px-4 font-bold hidden sm:table-cell">
              {t("coverLetters.table.columns.updated")}
            </th>
            <th className="py-3 px-4 text-right w-12"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/40">
          {coverLetters.length > 0 ? (
            coverLetters.map((coverLetter) => (
              <CoverLetterTableRow key={coverLetter.id} coverLetter={coverLetter} />
            ))
          ) : (
            <tr>
              <td colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                No cover letters found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
