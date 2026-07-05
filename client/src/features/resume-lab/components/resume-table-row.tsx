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
import { ResumeATSBadge } from "./resume-ats-badge"
import { DocumentStatusBadge } from "@/components/data/document-status-badge"
import type { ResumeItem } from "../types"

interface ResumeTableRowProps {
  readonly resume: ResumeItem
}

const AVATAR_COLORS: Record<string, string> = {
  DR: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
  A: "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
  L: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",
  N: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
  G: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  V: "bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400",
}

export function ResumeTableRow({ resume }: ResumeTableRowProps) {
  const { t } = useTranslation("common")
  const navigate = useNavigate()
  const avatarClass = AVATAR_COLORS[resume.avatarText] ?? "bg-muted text-muted-foreground"

  const subtitle = resume.company ?? t("resumeLab.table.noTargetRole")
  const openEditor = () => navigate(`/resumes/${resume.id}`)

  return (
    <tr className="group border-b border-border/40 hover:bg-muted/5 transition-colors">
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
        <ResumeATSBadge score={resume.atsScore} />
      </td>

      <td className="py-3 px-4">
        <DocumentStatusBadge status={resume.status} translationPrefix="resumeLab.table.statusLabels" />
      </td>

      <td className="py-3 px-4 text-sm text-muted-foreground hidden sm:table-cell">
        {resume.updatedAt}
      </td>

      <td className="py-3 px-4 text-right">
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
              {t("resumeLab.table.rowActions.preview")}
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={openEditor}>
              <Pencil />
              {t("resumeLab.table.rowActions.edit")}
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <Download />
              {t("resumeLab.table.rowActions.export")}
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <Copy />
              {t("resumeLab.table.rowActions.duplicate")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" className="cursor-pointer">
              <Trash2 />
              {t("resumeLab.table.rowActions.delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  )
}
