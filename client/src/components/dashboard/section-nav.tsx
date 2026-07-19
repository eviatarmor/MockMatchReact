import { useTranslation } from "react-i18next"
import { Link, useLocation } from "react-router-dom"
import { PanelLeftClose } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { NAV_SECTIONS } from "@/components/dashboard/constants"
import type { NavSection } from "@/components/dashboard/types"

interface SectionNavProps {
  readonly section: NavSection
  readonly collapsed: boolean
  readonly onToggle: () => void
}

// Label column: active section title + every section as a grouped, labelled
// list. Collapses to zero width (the icon rail stays as the fallback nav).
export function SectionNav({ section, collapsed, onToggle }: SectionNavProps) {
  const { t } = useTranslation("common")
  const { pathname } = useLocation()

  return (
    <div
      className={cn(
        "h-full min-h-0 overflow-hidden bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-linear",
        collapsed ? "w-0" : "w-60"
      )}
    >
      <div className="flex h-full min-h-0 w-60 flex-col">
        <div className="flex h-14 shrink-0 items-center justify-between pl-5 pr-2">
          <h2 className="truncate text-lg font-semibold">{t(section.labelKey)}</h2>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 cursor-pointer text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            onClick={onToggle}
            aria-label={t("nav.collapse")}
          >
            <PanelLeftClose className="size-4" />
          </Button>
        </div>

        <ScrollArea className="min-h-0 flex-1">
          <div className="flex flex-col gap-5 px-3 pb-4">
            {NAV_SECTIONS.map((group) => (
              <div key={group.id} className="flex flex-col gap-1">
                <span className="px-3 pb-1 text-[11px] font-medium uppercase tracking-wider text-sidebar-foreground/45">
                  {t(group.labelKey)}
                </span>
                {group.items.map((item) => {
                  const isActive = Boolean(item.href && pathname.startsWith(item.href))
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      to={item.href ?? "/"}
                      className={cn(
                        "flex h-9 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-foreground ring-1 ring-sidebar-border"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      )}
                    >
                      {Icon && <Icon className="size-4 shrink-0" />}
                      <span className="truncate">{t(item.title ?? "")}</span>
                    </Link>
                  )
                })}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
