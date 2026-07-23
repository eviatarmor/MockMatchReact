import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { DocumentStatusBadge } from "@/components/data/document-status-badge"
import { EntityRowActions } from "@/components/data/entity-row-actions"
import { formatRelativeTime } from "@/lib/format-relative-time"
import { avatarClassFor } from "@/lib/title-avatar"
import type { CoverLetterItem } from "../types"

interface CoverLetterTableRowProps {
  readonly coverLetter: CoverLetterItem
  readonly onDelete: () => void
  readonly onExport: () => void
  readonly onDuplicate: () => void
  readonly onPreview: () => void
  readonly isDeleting?: boolean
  readonly isExporting?: boolean
  readonly isDuplicating?: boolean
}

export function CoverLetterTableRow({
  coverLetter,
  onDelete,
  onExport,
  onDuplicate,
  onPreview,
  isDeleting,
  isExporting,
  isDuplicating,
}: CoverLetterTableRowProps) {
  const { t } = useTranslation("common")
  const navigate = useNavigate()
  const avatarClass = avatarClassFor(coverLetter.avatarText)
  const subtitle = coverLetter.company ?? t("coverLetters.table.noTargetRole")
  const openEditor = () => navigate(`/cover-letters/${coverLetter.id}`)

  return (
    <tr className="group border-b border-border/40 hover:bg-muted/5 transition-colors">
      <td className="py-3 px-4">
        <button type="button" onClick={openEditor} className="flex w-full items-center gap-3 text-left cursor-pointer">
          <div
            className={`flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold select-none ${avatarClass}`}
          >
            {coverLetter.avatarText}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
              {coverLetter.title}
            </span>
            <span className="text-xs text-muted-foreground truncate">{subtitle}</span>
          </div>
        </button>
      </td>

      <td className="py-3 px-4">
        <DocumentStatusBadge
          status={coverLetter.status}
          translationPrefix="coverLetters.table.statusLabels"
        />
      </td>

      <td className="py-3 px-4 text-sm text-muted-foreground hidden sm:table-cell">
        {formatRelativeTime(coverLetter.updatedAt)}
      </td>

      <td className="py-3 px-4 text-right">
        <EntityRowActions
          translationPrefix="coverLetters.table"
          entityTitle={coverLetter.title}
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
