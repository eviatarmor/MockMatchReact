import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  Underline,
  WrapText,
} from "lucide-react"
import type { ReactNode } from "react"
import { Button } from "@mockmatch/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@mockmatch/ui/tooltip"
import { cn } from "@mockmatch/ui/utils"
import { getActiveSheet } from "../../document"
import type { CellStyle, NumberFormatId, SpreadsheetShellLabels } from "../../types"
import type { SpreadsheetPlugin, SpreadsheetPluginContext } from "../../plugin-system"
import {
  applyStyleToSelection,
  selectionBounds,
} from "../selection-utils"

const FILL_SWATCHES = [
  "#fef08a",
  "#bbf7d0",
  "#bfdbfe",
  "#fecaca",
  "#e9d5ff",
] as const

function L(
  ctx: SpreadsheetPluginContext,
  key: keyof SpreadsheetShellLabels,
  fallback: string
): string {
  const v = ctx.getLabels()[key]
  return typeof v === "string" && v.length > 0 ? v : fallback
}

function activeStyle(ctx: SpreadsheetPluginContext): CellStyle | undefined {
  const sheet = getActiveSheet(ctx.getDocument())
  const a = ctx.getSelection().active
  return sheet?.cells[`${a.row}:${a.col}`]?.style
}

function applyFormat(ctx: SpreadsheetPluginContext, format: NumberFormatId) {
  const sheet = getActiveSheet(ctx.getDocument())
  if (!sheet || !ctx.canEdit()) return
  const b = selectionBounds(ctx)
  const cells: {
    row: number
    col: number
    raw: string
    format: NumberFormatId
  }[] = []
  for (let r = b.startRow; r <= b.endRow; r++) {
    for (let c = b.startCol; c <= b.endCol; c++) {
      cells.push({
        row: r,
        col: c,
        raw: sheet.cells[`${r}:${c}`]?.raw ?? "",
        format,
      })
    }
  }
  ctx.dispatch({ type: "setCells", cells })
}

/** Clear fill while keeping other style flags. */
function clearFill(ctx: SpreadsheetPluginContext) {
  const sheet = getActiveSheet(ctx.getDocument())
  if (!sheet || !ctx.canEdit()) return
  const b = selectionBounds(ctx)
  const writes: {
    row: number
    col: number
    raw: string
    style: CellStyle | null
  }[] = []
  for (let r = b.startRow; r <= b.endRow; r++) {
    for (let c = b.startCol; c <= b.endCol; c++) {
      const prev = sheet.cells[`${r}:${c}`]
      const s = prev?.style
      if (!s?.fill) {
        writes.push({
          row: r,
          col: c,
          raw: prev?.raw ?? "",
          style: s ?? null,
        })
        continue
      }
      const next: CellStyle = {
        ...(s.bold ? { bold: true as const } : {}),
        ...(s.italic ? { italic: true as const } : {}),
        ...(s.underline ? { underline: true as const } : {}),
        ...(s.align ? { align: s.align } : {}),
        ...(s.color ? { color: s.color } : {}),
        ...(s.wrap ? { wrap: true as const } : {}),
      }
      writes.push({
        row: r,
        col: c,
        raw: prev?.raw ?? "",
        style: Object.keys(next).length > 0 ? next : null,
      })
    }
  }
  ctx.dispatch({ type: "setCells", cells: writes })
}

function ToolBtn({
  title,
  pressed,
  disabled,
  onClick,
  children,
}: {
  title: string
  pressed?: boolean
  disabled?: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant={pressed ? "secondary" : "ghost"}
            size="icon-sm"
            className="size-7 shrink-0"
            disabled={disabled}
            aria-label={title}
            aria-pressed={pressed}
            onClick={onClick}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent side="bottom">{title}</TooltipContent>
    </Tooltip>
  )
}

/** Compact format toolbar (bold/align/fill/number formats). */
export function createToolbarPlugin(): SpreadsheetPlugin {
  return {
    id: "toolbar",
    /** Above formula bar (50) so strip order is toolbar → formula → grid. */
    order: 48,
    renderChrome(ctx, slot) {
      if (slot !== "top") return null
      const style = activeStyle(ctx)
      const ro = !ctx.canEdit()
      return (
        <TooltipProvider delay={200} key="format-toolbar">
          <div
            role="toolbar"
            aria-label={L(ctx, "toolbarAria", "Format")}
            className={cn(
              // No border-b — formula bar owns the single rule under chrome.
              "flex h-9 shrink-0 items-center gap-0.5 overflow-x-auto bg-muted/30 px-2"
            )}
          >
            <ToolBtn
              title={L(ctx, "bold", "Bold")}
              pressed={Boolean(style?.bold)}
              disabled={ro}
              onClick={() =>
                applyStyleToSelection(ctx, { bold: !style?.bold })
              }
            >
              <Bold className="size-3.5" />
            </ToolBtn>
            <ToolBtn
              title={L(ctx, "italic", "Italic")}
              pressed={Boolean(style?.italic)}
              disabled={ro}
              onClick={() =>
                applyStyleToSelection(ctx, { italic: !style?.italic })
              }
            >
              <Italic className="size-3.5" />
            </ToolBtn>
            <ToolBtn
              title={L(ctx, "underline", "Underline")}
              pressed={Boolean(style?.underline)}
              disabled={ro}
              onClick={() =>
                applyStyleToSelection(ctx, {
                  underline: !style?.underline,
                })
              }
            >
              <Underline className="size-3.5" />
            </ToolBtn>

            <div className="mx-1 h-4 w-px shrink-0 bg-border" />

            <ToolBtn
              title={L(ctx, "alignLeft", "Align left")}
              pressed={style?.align === "left"}
              disabled={ro}
              onClick={() => applyStyleToSelection(ctx, { align: "left" })}
            >
              <AlignLeft className="size-3.5" />
            </ToolBtn>
            <ToolBtn
              title={L(ctx, "alignCenter", "Align center")}
              pressed={style?.align === "center"}
              disabled={ro}
              onClick={() => applyStyleToSelection(ctx, { align: "center" })}
            >
              <AlignCenter className="size-3.5" />
            </ToolBtn>
            <ToolBtn
              title={L(ctx, "alignRight", "Align right")}
              pressed={style?.align === "right"}
              disabled={ro}
              onClick={() => applyStyleToSelection(ctx, { align: "right" })}
            >
              <AlignRight className="size-3.5" />
            </ToolBtn>
            <ToolBtn
              title={L(ctx, "wrapText", "Wrap text")}
              pressed={Boolean(style?.wrap)}
              disabled={ro}
              onClick={() =>
                applyStyleToSelection(ctx, { wrap: !style?.wrap })
              }
            >
              <WrapText className="size-3.5" />
            </ToolBtn>

            <div className="mx-1 h-4 w-px shrink-0 bg-border" />

            <button
              type="button"
              disabled={ro}
              title={L(ctx, "fillColor", "Clear fill")}
              aria-label={L(ctx, "fillColor", "Clear fill")}
              className="size-5 shrink-0 rounded-sm ring-1 ring-inset ring-border/70 bg-background"
              onClick={() => clearFill(ctx)}
            />
            {FILL_SWATCHES.map((color) => (
              <button
                key={color}
                type="button"
                disabled={ro}
                title={L(ctx, "fillColor", "Fill")}
                aria-label={L(ctx, "fillColor", "Fill")}
                className="size-5 shrink-0 rounded-sm ring-1 ring-inset ring-black/10 dark:ring-white/15"
                style={{ backgroundColor: color }}
                onClick={() => applyStyleToSelection(ctx, { fill: color })}
              />
            ))}

            <div className="mx-1 h-4 w-px shrink-0 bg-border" />

            {(
              [
                ["general", "formatGeneral", "General"],
                ["number", "formatNumber", "Number"],
                ["percent", "formatPercent", "%"],
                ["currency", "formatCurrency", "$"],
                ["integer", "formatInteger", "0"],
              ] as const
            ).map(([id, labelKey, fallback]) => (
              <Button
                key={id}
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 shrink-0 px-1.5 text-2xs"
                disabled={ro}
                onClick={() => applyFormat(ctx, id)}
              >
                {L(ctx, labelKey, fallback)}
              </Button>
            ))}
          </div>
        </TooltipProvider>
      )
    },
  }
}
