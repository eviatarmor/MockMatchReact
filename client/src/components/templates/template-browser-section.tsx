import { ArrowRight } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { StaggerItem } from "@mockmatch/ui/stagger"
import { TemplateCard } from "./template-card"
import type { TemplateItem } from "./types"

interface TemplateBrowserSectionProps {
  readonly items: readonly TemplateItem[]
  // i18n key prefix, e.g. "resumeLab.templates"
  readonly translationPrefix: string
  readonly browseAllTo: string
  readonly featuredCount?: number
  readonly onUse?: (template: TemplateItem) => void
  readonly pendingId?: string | null
}

// Featured template strip + link to the full "browse all templates" page. Shared by resume and cover-letter labs.
export function TemplateBrowserSection({
  items,
  translationPrefix,
  browseAllTo,
  featuredCount = 5,
  onUse,
  pendingId = null,
}: TemplateBrowserSectionProps) {
  const { t } = useTranslation("common")
  const navigate = useNavigate()
  const featuredTemplates = items.slice(0, featuredCount)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="font-heading text-base font-medium text-foreground">
            {t(`${translationPrefix}.title`)}
          </h2>
          <p className="text-sm text-muted-foreground">{t(`${translationPrefix}.description`)}</p>
        </div>
        <button
          type="button"
          onClick={() => navigate(browseAllTo)}
          className="flex shrink-0 cursor-pointer items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          {t(`${translationPrefix}.browseAll`)}
          <ArrowRight className="size-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {featuredTemplates.map((template, index) => (
          <StaggerItem key={template.id} index={index} direction="left">
            <TemplateCard
              template={template}
              translationPrefix={translationPrefix}
              onUse={onUse}
              isUsing={pendingId === template.id}
            />
          </StaggerItem>
        ))}
      </div>
    </div>
  )
}
