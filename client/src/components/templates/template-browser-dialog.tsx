import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import { useTranslation } from "react-i18next"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { TemplateCard } from "./template-card"
import type { TemplateItem } from "./types"

interface TemplateBrowserDialogProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly items: readonly TemplateItem[]
  readonly categories: readonly string[]
  // i18n key prefix, e.g. "resumeLab.templates"
  readonly translationPrefix: string
}

export function TemplateBrowserDialog({ open, onOpenChange, items, categories, translationPrefix }: TemplateBrowserDialogProps) {
  const { t } = useTranslation("common")
  const [query, setQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState<string>("all")

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[80vh] w-[80vw] max-w-none flex-col sm:max-w-none">
        <DialogHeader>
          <DialogTitle>{t(`${translationPrefix}.browseTitle`)}</DialogTitle>
          <DialogDescription>{t(`${translationPrefix}.browseDescription`)}</DialogDescription>
        </DialogHeader>

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

        <div className="min-h-0 flex-1 overflow-y-auto">
          {filteredTemplates.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredTemplates.map((template) => (
                <TemplateCard key={template.id} template={template} translationPrefix={translationPrefix} />
              ))}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              {t(`${translationPrefix}.noResults`)}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
