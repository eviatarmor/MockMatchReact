import { Eye, Plus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { ResumeTemplate } from "../types"

interface ResumeTemplateCardProps {
  readonly template: ResumeTemplate
}

const AVATAR_COLORS = [
  "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
  "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
  "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
  "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",
  "bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400",
  "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
]

function avatarColor(id: string) {
  const index = id.charCodeAt(id.length - 1) % AVATAR_COLORS.length
  return AVATAR_COLORS[index]
}

export function ResumeTemplateCard({ template }: ResumeTemplateCardProps) {
  const { t } = useTranslation("common")

  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div
          className={`flex size-9 shrink-0 items-center justify-center rounded-lg text-sm font-semibold select-none ${avatarColor(template.id)}`}
        >
          {template.avatarText}
        </div>
        <Badge variant="outline" className="font-normal text-muted-foreground">
          {t(`resumeLab.templates.categories.${template.category}`)}
        </Badge>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-sm font-semibold text-foreground">{template.title}</span>
        <span className="text-sm text-primary">{template.company}</span>
        <span className="text-xs text-muted-foreground">{template.description}</span>
      </div>

      <div className="mt-auto flex items-center gap-2">
        <Button className="h-8 flex-1 gap-1.5 cursor-pointer">
          <Plus className="size-4" />
          {t("resumeLab.templates.useTemplate")}
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 shrink-0 cursor-pointer"
          aria-label={t("resumeLab.templates.preview")}
        >
          <Eye className="size-4" />
        </Button>
      </div>
    </div>
  )
}
