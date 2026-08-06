import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { DocumentStatusBadge } from "@/components/data/document-status-badge"
import { EntityRowActions } from "@/components/data/entity-row-actions"
import { formatRelativeTime } from "@/lib/format-relative-time"
import { avatarClassFor } from "@/lib/title-avatar"
import { CoverLetterScoreBadge } from "./cover-letter-score-badge"
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
  readonly isColumnVisible?: (columnId: string) => boolean
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
  isColumnVisible = () => true,
}: CoverLetterTableRowProps) {
  const { t } = useTranslation("common")
  const navigate = useNavigate()
  const avatarClass = avatarClassFor(coverLetter.avatarText)
  const subtitle = coverLetter.company ?? t("coverLetters.table.noTargetRole")
  const openEditor = () => navigate(`/cover-letters/${coverLetter.id}`)

  return (
    <tr className="group border-b border-border/40 transition-colors hover:bg-muted/5">
      {isColumnVisible("coverLetter") ? (
        <td className="px-4 py-3">
          <button
            type="button"
            onClick={openEditor}
            className="flex w-full cursor-pointer items-center gap-3 text-left"
          >
            <div
              className={`flex size-10 shrink-0 select-none items-center justify-center rounded-xl text-sm font-semibold ${avatarClass}`}
            >
              {coverLetter.avatarText}
            </div>
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                {coverLetter.title}
              </span>
              <span className="truncate text-xs text-muted-foreground">{subtitle}</span>
            </div>
          </button>
        </td>
      ) : null}

      {isColumnVisible("score") ? (
        <td className="px-4 py-3 text-center">
          <CoverLetterScoreBadge score={coverLetter.generalScore} />
        </td>
      ) : null}

      {isColumnVisible("status") ? (
        <td className="px-4 py-3">
          <DocumentStatusBadge
            status={coverLetter.status}
            translationPrefix="coverLetters.table.statusLabels"
          />
        </td>
      ) : null}

      {isColumnVisible("updated") ? (
        <td className="hidden px-4 py-3 text-sm text-muted-foreground sm:table-cell">
          {formatRelativeTime(coverLetter.updatedAt)}
        </td>
      ) : null}

      {isColumnVisible("actions") ? (
        <td className="px-4 py-3 text-right">
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
      ) : null}
    </tr>
  )
}
