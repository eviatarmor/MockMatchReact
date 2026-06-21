import type { LucideIcon } from "lucide-react"
import { Plus } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"

export interface InserterItem {
  readonly id: string
  readonly icon: LucideIcon
  readonly label: string
}

interface SectionInserterProps {
  readonly items: readonly InserterItem[]
  readonly onAdd: (id: string) => void
  readonly addLabel: string
}

/**
 * Hover target sitting between two blocks: a straight rule + centered "+" that
 * appears on hover and opens a menu of insertable block types, inserting at this
 * position. Schema-agnostic — caller supplies the menu `items`.
 */
export function SectionInserter({ items, onAdd, addLabel }: SectionInserterProps) {
  return (
    <DropdownMenu>
      <div className="pan-ignore group/insert relative flex h-5 items-center justify-center">
        <span className="pointer-events-none absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-blue-400 opacity-0 transition-opacity group-hover/insert:opacity-100 group-has-data-[popup-open]/insert:opacity-100" />
        <DropdownMenuTrigger
          aria-label={addLabel}
          className="relative flex size-6 cursor-pointer items-center justify-center rounded-full bg-neutral-900 text-white opacity-0 shadow-md transition-opacity hover:bg-neutral-800 group-hover/insert:opacity-100 data-[popup-open]:opacity-100"
        >
          <Plus className="size-3.5" />
        </DropdownMenuTrigger>
      </div>
      <DropdownMenuContent align="center" className="pan-ignore w-56">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <DropdownMenuItem key={item.id} onClick={() => onAdd(item.id)} className="cursor-pointer gap-2">
              <Icon className="size-4 text-muted-foreground" />
              {item.label}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
