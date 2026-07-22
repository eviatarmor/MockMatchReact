import { useMemo, useState } from "react"
import { ArrowLeft, Search } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell"
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
  const [activeCountry, setActiveCountry] = useState<string>("all")

  const filteredTemplates = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return items.filter((template) => {
      const matchesCategory = activeCategory === "all" || template.category === activeCategory
      const matchesCountry =
        activeCountry === "all" || template.country === activeCountry
      const matchesQuery =
        needle.length === 0 ||
        template.title.toLowerCase().includes(needle) ||
        template.company.toLowerCase().includes(needle) ||
        template.description.toLowerCase().includes(needle)

      return matchesCategory && matchesCountry && matchesQuery
    })
  }, [items, query, activeCategory, activeCountry])

  const countries = ["US", "UK", "AU"] as const

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
          <p className="text-sm text-muted-foreground">
            {t(`${translationPrefix}.browseDescription`, { count: items.length })}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="relative sm:w-72 sm:shrink-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t(`${translationPrefix}.searchPlaceholder`)}
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant={activeCountry === "all" ? "default" : "outline"}
              size="sm"
              className="cursor-pointer"
              onClick={() => setActiveCountry("all")}
            >
              {t(`${translationPrefix}.countries.all`)}
            </Button>
            {countries.map((country) => (
              <Button
                key={country}
                variant={activeCountry === country ? "default" : "outline"}
                size="sm"
                className="cursor-pointer"
                onClick={() => setActiveCountry(country)}
              >
                {t(`${translationPrefix}.countries.${country}`)}
              </Button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
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
                onUse={onUse}
                isUsing={pendingId === template.id}
              />
            ))}
          </div>
        ) : (
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            {t(`${translationPrefix}.noResults`)}
          </div>
        )}
      </div>
    </DashboardPageShell>
  )
}
