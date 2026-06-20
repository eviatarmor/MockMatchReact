import { MoreHorizontal, Eye, Pencil, Download, Copy, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { DocumentStatusBadge } from "@/components/data/document-status-badge"
import type { CoverLetterItem } from "../types"

interface CoverLetterTableRowProps {
  readonly coverLetter: CoverLetterItem
}

const AVATAR_COLORS: Record<string, string> = {
  DR: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
  A: "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
  L: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",
  N: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
  G: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  V: "bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400",
}

export function CoverLetterTableRow({ coverLetter }: CoverLetterTableRowProps) {
  const { t } = useTranslation("common")
  const navigate = useNavigate()
  const avatarClass = AVATAR_COLORS[coverLetter.avatarText] ?? "bg-muted text-muted-foreground"

  const subtitle = coverLetter.company ?? t("coverLetters.table.noTargetRole")
  const openEditor = () => navigate(`/cover-letters/${coverLetter.id}`)

  return (
    <tr
      onClick={openEditor}
      className="group cursor-pointer border-b border-border/40 hover:bg-muted/5 transition-colors"
    >
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
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
        </div>
      </td>

      <td className="py-3 px-4">
        <DocumentStatusBadge status={coverLetter.status} translationPrefix="coverLetters.table.statusLabels" />
      </td>

      <td className="py-3 px-4 text-sm text-muted-foreground hidden sm:table-cell">
        {coverLetter.updatedAt}
      </td>

      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
              />
            }
          >
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="cursor-pointer" onClick={openEditor}>
              <Eye />
              {t("coverLetters.table.rowActions.preview")}
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={openEditor}>
              <Pencil />
              {t("coverLetters.table.rowActions.edit")}
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <Download />
              {t("coverLetters.table.rowActions.export")}
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <Copy />
              {t("coverLetters.table.rowActions.duplicate")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" className="cursor-pointer">
              <Trash2 />
              {t("coverLetters.table.rowActions.delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  )
}
