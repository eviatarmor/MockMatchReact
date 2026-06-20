import { useState } from "react"
import { ArrowRight } from "lucide-react"
import { useTranslation } from "react-i18next"
import { TemplateCard } from "./template-card"
import { TemplateBrowserDialog } from "./template-browser-dialog"
import type { TemplateItem } from "./types"

interface TemplateBrowserSectionProps {
  readonly items: readonly TemplateItem[]
  readonly categories: readonly string[]
  // i18n key prefix, e.g. "resumeLab.templates"
  readonly translationPrefix: string
  readonly featuredCount?: number
}

// Featured template grid + "browse all" dialog. Shared by resume and cover-letter labs.
export function TemplateBrowserSection({ items, categories, translationPrefix, featuredCount = 5 }: TemplateBrowserSectionProps) {
  const { t } = useTranslation("common")
  const [dialogOpen, setDialogOpen] = useState(false)
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
          onClick={() => setDialogOpen(true)}
          className="flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline cursor-pointer"
        >
          {t(`${translationPrefix}.browseAll`)}
          <ArrowRight className="size-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {featuredTemplates.map((template) => (
          <TemplateCard key={template.id} template={template} translationPrefix={translationPrefix} />
        ))}
      </div>

      <TemplateBrowserDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        items={items}
        categories={categories}
        translationPrefix={translationPrefix}
      />
    </div>
  )
}
