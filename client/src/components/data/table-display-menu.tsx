import { ChevronDown, Columns3 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@mockmatch/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@mockmatch/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import type { TableDisplayColumnDef } from "@/hooks/use-table-column-visibility"

interface TableDisplayMenuProps {
  readonly columns: readonly TableDisplayColumnDef[]
  readonly isVisible: (columnId: string) => boolean
  readonly onToggle: (columnId: string) => void
  readonly className?: string
}

/**
 * Linear-style Display control: toggle table column visibility.
 * Locked columns stay checked and non-interactive.
 */
export function TableDisplayMenu({
  columns,
  isVisible,
  onToggle,
  className,
}: TableDisplayMenuProps) {
  const { t } = useTranslation("common")

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-8 cursor-pointer gap-1.5 border-border/60 bg-background px-2.5 text-muted-foreground hover:text-foreground",
              className
            )}
            aria-label={t("tableChrome.display")}
          />
        }
      >
        <Columns3 className="size-3.5" />
        <span className="text-sm font-medium">{t("tableChrome.display")}</span>
        <ChevronDown className="size-3.5 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-44">
        <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
          {t("tableChrome.displayColumns")}
        </DropdownMenuLabel>
        {columns.map((column) => (
          <DropdownMenuCheckboxItem
            key={column.id}
            checked={isVisible(column.id)}
            disabled={column.locked === true}
            onCheckedChange={() => {
              if (!column.locked) onToggle(column.id)
            }}
            className={cn(
              "cursor-pointer",
              column.locked && "opacity-60"
            )}
          >
            {column.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
