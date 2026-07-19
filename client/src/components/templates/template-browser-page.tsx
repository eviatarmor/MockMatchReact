import { useMemo, useState } from "react"
import { ArrowLeft, Search } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell"
import { TemplateCard } from "./template-card"
import { TemplatePreviewDialog } from "./template-preview-dialog"
import type { TemplateItem } from "./types"

interface TemplateBrowserPageProps {
  readonly items: readonly TemplateItem[]
  readonly categories: readonly string[]
  // i18n key prefix, e.g. "resumeLab.templates"
  readonly translationPrefix: string
  readonly backTo: string
}

export function TemplateBrowserPage({ items, categories, translationPrefix, backTo }: TemplateBrowserPageProps) {
  const { t } = useTranslation("common")
  const navigate = useNavigate()
  const [query, setQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState<string>("all")
  const [previewTemplate, setPreviewTemplate] = useState<TemplateItem | null>(null)

  const filteredTemplates = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return items.filter((template) => {
      const matchesCategory = activeCategory === "all" || template.category === activeCategory
      const matchesQuery =
        needle.length === 0 ||
        template.title.toLowerCase().includes(needle) ||
        template.company.toLowerCase().includes(needle)

      return matchesCategory && matchesQuery
    })
  }, [items, query, activeCategory])

  return (
    <DashboardPageShell title={t(`${translationPrefix}.browseTitle`)}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => navigate(backTo)}
            className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <ArrowLeft className="size-4" />
            {t(`${translationPrefix}.browseBackLink`)}
          </button>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t(`${translationPrefix}.browseTitle`)}
          </h1>
          <p className="text-sm text-muted-foreground">{t(`${translationPrefix}.browseDescription`)}</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative sm:w-64 sm:shrink-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t(`${translationPrefix}.searchPlaceholder`)}
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap gap-2 sm:justify-end">
            <Button
              variant={activeCategory === "all" ? "default" : "outline"}
              size="sm"
              className="cursor-pointer"
              onClick={() => setActiveCategory("all")}
            >
              {t(`${translationPrefix}.categories.all`)}
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                variant={activeCategory === category ? "default" : "outline"}
                size="sm"
                className="cursor-pointer"
                onClick={() => setActiveCategory(category)}
              >
                {t(`${translationPrefix}.categories.${category}`)}
              </Button>
            ))}
          </div>
        </div>

        {filteredTemplates.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                translationPrefix={translationPrefix}
                onPreview={setPreviewTemplate}
              />
            ))}
          </div>
        ) : (
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            {t(`${translationPrefix}.noResults`)}
          </div>
        )}
      </div>

      <TemplatePreviewDialog
        template={previewTemplate}
        onOpenChange={(open) => !open && setPreviewTemplate(null)}
        translationPrefix={translationPrefix}
      />
    </DashboardPageShell>
  )
}
