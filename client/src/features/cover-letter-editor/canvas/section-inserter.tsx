import { useTranslation } from "react-i18next"
import { Plus } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { LETTER_BLOCK_TYPES } from "../constants"
import type { LetterBlockType } from "../types"

interface SectionInserterProps {
  readonly onAdd: (type: LetterBlockType) => void
}

/**
 * Hover target sitting between two blocks: a straight rule + centered "+" that
 * appears on hover and opens the block-type menu, inserting at this position.
 */
export function SectionInserter({ onAdd }: SectionInserterProps) {
  const { t } = useTranslation("cover-letter-editor")

  return (
    <DropdownMenu>
      <div className="pan-ignore group/insert relative flex h-5 items-center justify-center">
        <span className="pointer-events-none absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-blue-400 opacity-0 transition-opacity group-hover/insert:opacity-100 group-has-data-[popup-open]/insert:opacity-100" />
        <DropdownMenuTrigger
          aria-label={t("addSection")}
          className="relative flex size-6 cursor-pointer items-center justify-center rounded-full bg-neutral-900 text-white opacity-0 shadow-md transition-opacity hover:bg-neutral-800 group-hover/insert:opacity-100 data-[popup-open]:opacity-100"
        >
          <Plus className="size-3.5" />
        </DropdownMenuTrigger>
      </div>
      <DropdownMenuContent align="center" className="pan-ignore w-56">
        {LETTER_BLOCK_TYPES.map((meta) => {
          const Icon = meta.icon
          return (
            <DropdownMenuItem key={meta.type} onClick={() => onAdd(meta.type)} className="cursor-pointer gap-2">
              <Icon className="size-4 text-muted-foreground" />
              {t(meta.labelKey)}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
