import { useState } from "react"
import { ArrowRight } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { TemplateCard } from "./template-card"
import { TemplatePreviewDialog } from "./template-preview-dialog"
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

// Featured template grid + link to the full "browse all templates" page. Shared by resume and cover-letter labs.
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
  const [previewTemplate, setPreviewTemplate] = useState<TemplateItem | null>(null)
  const featuredTemplates = items.slice(0, featuredCount)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold text-foreground">{t(`${translationPrefix}.title`)}</h2>
          <p className="text-sm text-muted-foreground">{t(`${translationPrefix}.description`)}</p>
        </div>
        <button
          type="button"
          onClick={() => navigate(browseAllTo)}
          className="flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline cursor-pointer"
        >
          {t(`${translationPrefix}.browseAll`)}
          <ArrowRight className="size-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {featuredTemplates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            translationPrefix={translationPrefix}
            onPreview={setPreviewTemplate}
            onUse={onUse}
            isUsing={pendingId === template.id}
          />
        ))}
      </div>

      <TemplatePreviewDialog
        template={previewTemplate}
        onOpenChange={(open) => !open && setPreviewTemplate(null)}
        translationPrefix={translationPrefix}
        onUse={onUse}
        isUsing={previewTemplate ? pendingId === previewTemplate.id : false}
      />
    </div>
  )
}
