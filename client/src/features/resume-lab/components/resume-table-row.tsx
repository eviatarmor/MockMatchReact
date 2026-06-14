import { MoreHorizontal } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { ResumeATSBadge } from "./resume-ats-badge"
import { ResumeStatusBadge } from "./resume-status-badge"
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
  const avatarClass = AVATAR_COLORS[resume.avatarText] ?? "bg-muted text-muted-foreground"

  const subtitle = resume.company ?? t("resumeLab.table.noTargetRole")

  return (
    <tr className="group border-b border-border/40 hover:bg-muted/5 transition-colors">
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
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
        </div>
      </td>

      <td className="py-3 px-4 text-center">
        <ResumeATSBadge score={resume.atsScore} />
      </td>

      <td className="py-3 px-4">
        <ResumeStatusBadge status={resume.status} />
      </td>

      <td className="py-3 px-4 text-sm text-muted-foreground hidden sm:table-cell">
        {resume.updatedAt}
      </td>

      <td className="py-3 px-4 text-right">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </td>
    </tr>
  )
}
