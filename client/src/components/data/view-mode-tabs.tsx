import { LayoutGrid, List } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Tabs, TabsList, TabsTrigger } from "@mockmatch/ui/tabs"
import { cn } from "@/lib/utils"

export type ListViewMode = "table" | "grid"

interface ViewModeTabsProps {
  readonly value: ListViewMode
  readonly onValueChange: (value: ListViewMode) => void
  readonly className?: string
}

/**
 * Compact shadcn tabs for table vs grid list layouts.
 * Controlled — pair with local state; render content outside TabsContent.
 */
export function ViewModeTabs({ value, onValueChange, className }: ViewModeTabsProps) {
  const { t } = useTranslation("common")

  return (
    <Tabs
      value={value}
      onValueChange={(next) => {
        if (next === "table" || next === "grid") onValueChange(next)
      }}
      className={cn("w-fit", className)}
    >
      <TabsList className="h-8">
        <TabsTrigger
          value="table"
          className="h-full cursor-pointer px-2.5"
          aria-label={t("viewMode.table")}
          title={t("viewMode.table")}
        >
          <List className="size-4" />
        </TabsTrigger>
        <TabsTrigger
          value="grid"
          className="h-full cursor-pointer px-2.5"
          aria-label={t("viewMode.grid")}
          title={t("viewMode.grid")}
        >
          <LayoutGrid className="size-4" />
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
