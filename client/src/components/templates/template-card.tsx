import { useState } from "react"
import { Plus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@mockmatch/ui/button"
import { Badge } from "@mockmatch/ui/badge"
import { Spinner } from "@mockmatch/ui/spinner"
import type { TemplateItem } from "./types"

interface TemplateCardProps {
  readonly template: TemplateItem
  // i18n key prefix, e.g. "resumeLab.templates"
  readonly translationPrefix: string
  readonly onUse?: (template: TemplateItem) => void
  readonly isUsing?: boolean
}

const AVATAR_COLORS = [
  "bg-primary/12 text-primary",
  "bg-muted text-muted-foreground",
  "bg-secondary text-secondary-foreground",
  "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
  "bg-primary/20 text-primary",
  "bg-foreground/10 text-foreground",
]

function avatarColor(id: string) {
  const index = id.charCodeAt(id.length - 1) % AVATAR_COLORS.length
  return AVATAR_COLORS[index]
}

function TemplateAvatar({ template }: { readonly template: TemplateItem }) {
  const [imgFailed, setImgFailed] = useState(false)
  const showLogo = Boolean(template.logoUrl) && !imgFailed

  if (showLogo && template.logoUrl) {
    return (
      <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border/60 bg-white p-1.5 dark:bg-neutral-100">
        <img
          src={template.logoUrl}
          alt=""
          className="size-full object-contain"
          loading="lazy"
          decoding="async"
          onError={() => setImgFailed(true)}
        />
      </div>
    )
  }

  return (
    <div
      className={`flex size-9 shrink-0 items-center justify-center rounded-lg text-sm font-semibold select-none ${avatarColor(template.id)}`}
    >
      {template.avatarText}
    </div>
  )
}

export function TemplateCard({
  template,
  translationPrefix,
  onUse,
  isUsing = false,
}: TemplateCardProps) {
  const { t } = useTranslation("common")

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border/60 bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <TemplateAvatar template={template} />
        <Badge variant="outline" className="text-2xs font-medium">
          {t(`${translationPrefix}.categories.${template.category}`)}
        </Badge>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-sm font-semibold text-foreground">{template.title}</span>
        <span className="text-sm font-medium text-primary">{template.company}</span>
        <span className="line-clamp-3 text-xs text-muted-foreground">{template.description}</span>
      </div>

      <div className="mt-auto flex items-center gap-2">
        <Button
          className="h-8 w-full cursor-pointer gap-1.5"
          disabled={isUsing || !onUse}
          onClick={() => onUse?.(template)}
          aria-busy={isUsing}
        >
          {isUsing ? <Spinner className="size-3.5" /> : <Plus className="size-4" />}
          {t(`${translationPrefix}.useTemplate`)}
        </Button>
      </div>
    </div>
  )
}
