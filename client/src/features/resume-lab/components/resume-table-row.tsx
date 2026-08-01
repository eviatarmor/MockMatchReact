import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { DocumentStatusBadge } from "@/components/data/document-status-badge"
import { EntityRowActions } from "@/components/data/entity-row-actions"
import { formatRelativeTime } from "@/lib/format-relative-time"
import { avatarClassFor } from "@/lib/title-avatar"
import { ResumeScoreBadge } from "./resume-score-badge"
import type { ResumeItem } from "../types"

interface ResumeTableRowProps {
  readonly resume: ResumeItem
  readonly onDelete: () => void
  readonly onExport: () => void
  readonly onDuplicate: () => void
  readonly onPreview: () => void
  readonly isDeleting?: boolean
  readonly isExporting?: boolean
  readonly isDuplicating?: boolean
}

export function ResumeTableRow({
  resume,
  onDelete,
  onExport,
  onDuplicate,
  onPreview,
  isDeleting,
  isExporting,
  isDuplicating,
}: ResumeTableRowProps) {
  const { t } = useTranslation("common")
  const navigate = useNavigate()
  const avatarClass = avatarClassFor(resume.avatarText)
  const subtitle = resume.company ?? resume.targetRole ?? t("resumeLab.table.noTargetRole")
  const openEditor = () => navigate(`/resumes/${resume.id}`)

  return (
    <tr className="group border-b border-border/40 transition-colors hover:bg-muted/5">
      <td className="px-4 py-3">
        <button
          type="button"
          onClick={openEditor}
          className="flex w-full cursor-pointer items-center gap-3 text-left"
        >
          <div
            className={`flex size-10 shrink-0 select-none items-center justify-center rounded-xl text-sm font-semibold ${avatarClass}`}
          >
            {resume.avatarText}
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
              {resume.title}
            </span>
            <span className="truncate text-xs text-muted-foreground">{subtitle}</span>
          </div>
        </button>
      </td>

      <td className="px-4 py-3 text-center">
        <ResumeScoreBadge score={resume.generalScore} />
      </td>

      <td className="px-4 py-3">
        <DocumentStatusBadge status={resume.status} translationPrefix="resumeLab.table.statusLabels" />
      </td>

      <td className="hidden px-4 py-3 text-sm text-muted-foreground sm:table-cell">
        {formatRelativeTime(resume.updatedAt)}
      </td>

      <td className="px-4 py-3 text-right">
        <EntityRowActions
          translationPrefix="resumeLab.table"
          entityTitle={resume.title}
          onOpen={openEditor}
          onPreview={onPreview}
          onDelete={onDelete}
          onExport={onExport}
          onDuplicate={onDuplicate}
          isDeleting={isDeleting}
          isExporting={isExporting}
          isDuplicating={isDuplicating}
        />
      </td>
    </tr>
  )
}
