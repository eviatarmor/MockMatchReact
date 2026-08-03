import { FunctionSquare } from "lucide-react"
import { Input } from "@mockmatch/ui/input"
import { cn } from "@mockmatch/ui/utils"

export type FormulaBarProps = {
  readonly a1: string
  readonly value: string
  readonly onChange: (v: string) => void
  readonly onCommit: () => void
  readonly readOnly?: boolean
  readonly nameBoxAria: string
  readonly formulaBarAria: string
  readonly className?: string
}

/**
 * Name box + formula field using shadcn {@link Input} chrome.
 */
export function FormulaBar({
  a1,
  value,
  onChange,
  onCommit,
  readOnly = false,
  nameBoxAria,
  formulaBarAria,
  className,
}: FormulaBarProps) {
  return (
    <div
      className={cn(
        "flex h-11 shrink-0 items-center gap-2 border-b border-border/60 bg-neutral-50/75 px-2 backdrop-blur-md dark:bg-neutral-950/75",
        className
      )}
    >
      <Input
        readOnly
        tabIndex={-1}
        aria-label={nameBoxAria}
        title={a1}
        value={a1}
        className="h-8 w-16 shrink-0 cursor-default px-1.5 text-center text-xs font-medium tabular-nums"
      />
      <FunctionSquare
        className="size-4 shrink-0 text-muted-foreground"
        aria-hidden
      />
      <Input
        aria-label={formulaBarAria}
        className="h-8 min-w-0 flex-1 caret-blue-500 selection:bg-blue-400/40 selection:text-neutral-900 dark:selection:text-neutral-50"
        value={value}
        readOnly={readOnly}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault()
            onCommit()
          }
        }}
        onBlur={() => onCommit()}
      />
    </div>
  )
}
