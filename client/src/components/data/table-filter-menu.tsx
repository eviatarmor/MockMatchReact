import { ChevronDown, ListFilter } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@mockmatch/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@mockmatch/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export interface TableFilterOption {
  readonly value: string
  readonly label: string
}

export interface TableFilterField {
  readonly id: string
  readonly label: string
  readonly options: readonly TableFilterOption[]
}

interface TableFilterMenuProps {
  readonly fields: readonly TableFilterField[]
  readonly isValueSelected: (fieldId: string, value: string) => boolean
  readonly onToggleValue: (fieldId: string, value: string) => void
  readonly onClearAll?: () => void
  readonly activeCount?: number
  readonly className?: string
}

/**
 * Linear-style Filter control: field submenus with multi-select values.
 * Host owns filter state via useTableFilters (or equivalent).
 */
export function TableFilterMenu({
  fields,
  isValueSelected,
  onToggleValue,
  onClearAll,
  activeCount = 0,
  className,
}: TableFilterMenuProps) {
  const { t } = useTranslation("common")
  const activeChrome =
    activeCount > 0
      ? {
          trigger: "border-primary/40 text-foreground",
          badge: "",
          clear: "cursor-pointer text-muted-foreground",
        }
      : {
          trigger: "",
          badge: "invisible",
          clear: "hidden",
        }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-8 cursor-pointer gap-1.5 border-border/60 bg-background px-2.5 text-muted-foreground hover:text-foreground",
              activeChrome.trigger,
              className
            )}
            aria-label={t("tableChrome.filter")}
          />
        }
      >
        <ListFilter className="size-3.5" />
        <span className="text-sm font-medium">{t("tableChrome.filter")}</span>
        <span
          className={cn(
            "flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-2xs font-semibold text-primary-foreground",
            activeChrome.badge
          )}
        >
          {activeCount}
        </span>
        <ChevronDown className="size-3.5 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-44">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
            {t("tableChrome.filter")}
          </DropdownMenuLabel>
          {fields.map((field) => (
            <DropdownMenuSub key={field.id}>
              <DropdownMenuSubTrigger className="cursor-pointer">
                {field.label}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="min-w-40">
                <DropdownMenuGroup>
                  {field.options.map((option) => (
                    <DropdownMenuCheckboxItem
                      key={option.value}
                      checked={isValueSelected(field.id, option.value)}
                      onCheckedChange={() =>
                        onToggleValue(field.id, option.value)
                      }
                      className="cursor-pointer"
                    >
                      {option.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          ))}
          <DropdownMenuSeparator className={activeChrome.clear} />
          <DropdownMenuItem
            className={activeChrome.clear}
            disabled={!onClearAll}
            onClick={onClearAll}
          >
            {t("tableChrome.clearFilters")}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
