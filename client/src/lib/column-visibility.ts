import { cn } from "@/lib/utils"

/**
 * Table cell className with Display visibility.
 * When hidden by Display, force `hidden` (overrides responsive `sm:table-cell` etc.).
 */
export function columnCellClass(
  isVisible: boolean,
  ...classes: Array<string | false | null | undefined>
): string {
  if (!isVisible) return "hidden"
  return cn(...classes)
}
