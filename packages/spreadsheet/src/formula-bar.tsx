import { FunctionSquare } from "lucide-react"
import { Input } from "@mockmatch/ui/input"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@mockmatch/ui/resizable"
import { cn } from "@mockmatch/ui/utils"
import { FormulaInput } from "./formula-input"

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
 * Name box + formula field. Name box width uses shadcn {@link ResizablePanelGroup}
 * (Excel-style drag between name box and formula).
 *
 * Note: react-resizable-panels v4 — **numbers = pixels**, **strings = percent**.
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
        "flex h-11 shrink-0 items-stretch border-b border-border/60 bg-neutral-50/75 px-2 backdrop-blur-md dark:bg-neutral-950/75",
        className
      )}
    >
      <ResizablePanelGroup
        orientation="horizontal"
        className="h-full min-h-0 w-full"
        id="spreadsheet-formula-bar"
      >
        {/* Pixel sizes — name box stays a compact Excel-like control */}
        <ResizablePanel
          id="name-box"
          defaultSize={100}
          minSize={64}
          maxSize={280}
          className="min-w-0"
        >
          <div className="flex h-full min-w-0 items-center pr-1">
            <Input
              readOnly
              tabIndex={-1}
              aria-label={nameBoxAria}
              title={a1}
              value={a1}
              className="h-8 w-full min-w-0 cursor-default px-1.5 text-center text-xs font-medium tabular-nums"
            />
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel id="formula" minSize={160} className="min-w-0">
          <div className="flex h-full min-w-0 items-center gap-2 pl-1">
            <FunctionSquare
              className="size-4 shrink-0 text-muted-foreground"
              aria-hidden
            />
            <FormulaInput
              aria-label={formulaBarAria}
              className="h-8 min-w-0"
              value={value}
              readOnly={readOnly}
              onChange={onChange}
              onCommit={onCommit}
              onBlur={() => onCommit()}
            />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
