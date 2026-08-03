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
        "flex h-9 shrink-0 items-center gap-2 border-b border-border bg-background px-2",
        className
      )}
    >
      <div
        className="flex h-7 w-16 shrink-0 items-center justify-center rounded-md border border-border bg-muted/30 px-1 text-xs font-medium tabular-nums text-muted-foreground"
        aria-label={nameBoxAria}
        title={a1}
      >
        <span className="truncate">{a1}</span>
      </div>
      <FunctionSquare className="size-3.5 shrink-0 text-muted-foreground" />
      <Input
        aria-label={formulaBarAria}
        className="h-7 min-w-0 flex-1 border-0 bg-transparent px-1 shadow-none focus-visible:ring-0"
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
