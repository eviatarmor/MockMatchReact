import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { DocumentStatusBadge } from "@/components/data/document-status-badge"
import { EntityRowActions } from "@/components/data/entity-row-actions"
import { StaggerItem } from "@/components/ui/stagger"
import { formatRelativeTime } from "@/lib/format-relative-time"
import { avatarClassFor } from "@/lib/title-avatar"
import { ResumeScoreBadge } from "./resume-score-badge"
import type { ResumeItem } from "../types"

interface ResumeTableRowProps {
  readonly resume: ResumeItem
  readonly index: number
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
  index,
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
    <StaggerItem
      as="tr"
      index={index}
      className="group border-b border-border/40 transition-colors hover:bg-muted/5"
    >
      <td className="py-3 px-4">
        <button type="button" onClick={openEditor} className="flex w-full items-center gap-3 text-left cursor-pointer">
          <div
            className={`flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold select-none ${avatarClass}`}
          >
            {resume.avatarText}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
              {resume.title}
            </span>
            <span className="text-xs text-muted-foreground truncate">{subtitle}</span>
          </div>
        </button>
      </td>

      <td className="py-3 px-4 text-center">
        <ResumeScoreBadge score={resume.generalScore} />
      </td>

      <td className="py-3 px-4">
        <DocumentStatusBadge status={resume.status} translationPrefix="resumeLab.table.statusLabels" />
      </td>

      <td className="py-3 px-4 text-sm text-muted-foreground hidden sm:table-cell">
        {formatRelativeTime(resume.updatedAt)}
      </td>

      <td className="py-3 px-4 text-right">
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
    </StaggerItem>
  )
}
