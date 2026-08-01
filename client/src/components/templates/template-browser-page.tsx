import { useMemo, useState } from "react"
import { ArrowLeft } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { Button } from "@mockmatch/ui/button"
import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell"
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header"
import { TableToolbar } from "@/components/dashboard/table-toolbar"
import { StaggerItem } from "@mockmatch/ui/stagger"
import { cn } from "@/lib/utils"
import { TemplateCard } from "./template-card"
import type { TemplateItem } from "./types"

interface TemplateBrowserPageProps {
  readonly items: readonly TemplateItem[]
  readonly categories: readonly string[]
  // i18n key prefix, e.g. "resumeLab.templates"
  readonly translationPrefix: string
  readonly backTo: string
  readonly onUse?: (template: TemplateItem) => void
  readonly pendingId?: string | null
}

export function TemplateBrowserPage({
  items,
  categories,
  translationPrefix,
  backTo,
  onUse,
  pendingId = null,
}: TemplateBrowserPageProps) {
  const { t } = useTranslation("common")
  const navigate = useNavigate()
  const [query, setQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState<string>("all")

  const filteredTemplates = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return items.filter((template) => {
      const matchesCategory = activeCategory === "all" || template.category === activeCategory
      const matchesQuery =
        needle.length === 0 ||
        template.title.toLowerCase().includes(needle) ||
        template.company.toLowerCase().includes(needle) ||
        template.description.toLowerCase().includes(needle)

      return matchesCategory && matchesQuery
    })
  }, [items, query, activeCategory])

  return (
    <DashboardPageShell title={t(`${translationPrefix}.browseTitle`)}>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => navigate(backTo)}
            className="flex w-fit cursor-pointer items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            {t(`${translationPrefix}.browseBackLink`)}
          </button>
          <DashboardPageHeader
            title={t(`${translationPrefix}.browseTitle`)}
            description={t(`${translationPrefix}.browseDescription`, { count: items.length })}
          />
        </div>

        <TableToolbar
          searchPlaceholder={t(`${translationPrefix}.searchPlaceholder`)}
          search={query}
          onSearchChange={setQuery}
          searchClassName="max-w-full sm:max-w-xs"
          filters={
            <div className="flex flex-wrap items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-8 cursor-pointer",
                  activeCategory === "all" &&
                    "border-primary/30 bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
                )}
                onClick={() => setActiveCategory("all")}
              >
                {t(`${translationPrefix}.categories.all`)}
              </Button>
              {categories.map((category) => (
                <Button
                  key={category}
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-8 cursor-pointer",
                    activeCategory === category &&
                      "border-primary/30 bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
                  )}
                  onClick={() => setActiveCategory(category)}
                >
                  {t(`${translationPrefix}.categories.${category}`)}
                </Button>
              ))}
            </div>
          }
        />

        {filteredTemplates.length > 0 ? (
          <div
            key={`${activeCategory}:${query}`}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {filteredTemplates.map((template, index) => (
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
        ) : (
          <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-border/70 bg-card/40 text-sm text-muted-foreground">
            {t(`${translationPrefix}.noResults`)}
          </div>
        )}
      </div>
    </DashboardPageShell>
  )
}
