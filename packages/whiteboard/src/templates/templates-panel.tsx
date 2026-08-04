import { Check } from "lucide-react"
import { StaggerItem } from "@mockmatch/ui/stagger"
import { cn } from "@mockmatch/ui/utils"
import { WHITEBOARD_TEMPLATES } from "./catalog"
import type { WhiteboardTemplate, WhiteboardTemplateId } from "../types"

export type WhiteboardTemplatesPanelLabels = {
  readonly title: string
  readonly resolveTitle: (key: string) => string
  readonly resolveDescription: (key: string) => string
}

export type WhiteboardTemplatesPanelProps = {
  readonly activeTemplateId?: WhiteboardTemplateId | null
  readonly onSelect: (template: WhiteboardTemplate) => void
  readonly labels: WhiteboardTemplatesPanelLabels
  readonly className?: string
}

function MiniPreview({ id }: { readonly id: WhiteboardTemplateId }) {
  if (id === "blank") {
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-md border border-dashed border-neutral-200 bg-neutral-50 text-[10px] text-neutral-400 dark:border-neutral-700 dark:bg-neutral-900">
        —
      </div>
    )
  }
  if (id === "system-design") {
    return (
      <div className="flex aspect-[4/3] items-center justify-center gap-1 rounded-md bg-neutral-50 p-2 dark:bg-neutral-900">
        <div className="h-4 w-6 rounded-sm bg-blue-200" />
        <div className="h-px w-2 bg-neutral-400" />
        <div className="h-4 w-6 rounded-sm bg-green-200" />
        <div className="h-px w-2 bg-neutral-400" />
        <div className="h-4 w-6 rounded-sm bg-amber-200" />
      </div>
    )
  }
  if (id === "2x2-matrix" || id === "swot" || id === "empathy-map") {
    return (
      <div className="grid aspect-[4/3] grid-cols-2 gap-1 rounded-md bg-neutral-50 p-2 dark:bg-neutral-900">
        <div className="rounded-sm bg-green-200" />
        <div className="rounded-sm bg-amber-200" />
        <div className="rounded-sm bg-neutral-200" />
        <div className="rounded-sm bg-red-200" />
      </div>
    )
  }
  if (id === "flowchart" || id === "mind-map") {
    return (
      <div className="flex aspect-[4/3] flex-col items-center justify-center gap-1 rounded-md bg-neutral-50 p-2 dark:bg-neutral-900">
        <div className="h-3 w-8 rounded-full bg-green-200" />
        <div className="h-4 w-6 rotate-45 bg-amber-200" />
        <div className="flex gap-3">
          <div className="h-3 w-6 rounded-sm bg-blue-200" />
          <div className="h-3 w-6 rounded-sm bg-red-200" />
        </div>
      </div>
    )
  }
  if (id === "quick-retrospective" || id === "kanban") {
    return (
      <div className="flex aspect-[4/3] items-stretch justify-center gap-1 rounded-md bg-neutral-50 p-2 dark:bg-neutral-900">
        <div className="flex-1 rounded-sm bg-green-200" />
        <div className="flex-1 rounded-sm bg-red-200" />
        <div className="flex-1 rounded-sm bg-blue-200" />
      </div>
    )
  }
  if (id === "business-model-canvas") {
    return (
      <div className="grid aspect-[4/3] grid-cols-3 gap-0.5 rounded-md bg-neutral-50 p-1.5 dark:bg-neutral-900">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "rounded-sm",
              i % 3 === 0
                ? "bg-blue-200"
                : i % 3 === 1
                  ? "bg-green-200"
                  : "bg-amber-200"
            )}
          />
        ))}
      </div>
    )
  }
  return (
    <div className="flex aspect-[4/3] items-end justify-center gap-1 rounded-md bg-neutral-50 p-2 dark:bg-neutral-900">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-8 w-3 rounded-sm bg-sky-200" />
      ))}
    </div>
  )
}

export function WhiteboardTemplatesPanel({
  activeTemplateId,
  onSelect,
  labels,
  className,
}: WhiteboardTemplatesPanelProps) {
  return (
    <div className={cn("flex flex-col gap-3 p-3", className)}>
      {labels.title ? (
        <h3 className="text-sm font-medium text-foreground">{labels.title}</h3>
      ) : null}
      <ul className="grid grid-cols-1 gap-2">
        {WHITEBOARD_TEMPLATES.map((template, index) => {
          const active = activeTemplateId === template.id
          return (
            <StaggerItem key={template.id} as="li" index={index} direction="left">
              <button
                type="button"
                onClick={() => onSelect(template)}
                className={cn(
                  "group relative w-full rounded-lg border p-2 text-left transition-colors",
                  "hover:border-blue-300 hover:bg-blue-50/50 dark:hover:border-blue-700 dark:hover:bg-blue-950/30",
                  active
                    ? "border-blue-400 bg-blue-50/80 ring-1 ring-blue-300 dark:border-blue-600 dark:bg-blue-950/40"
                    : "border-border bg-card"
                )}
              >
                <MiniPreview id={template.id} />
                <div className="mt-2 flex items-start justify-between gap-1">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium">
                      {labels.resolveTitle(template.titleKey)}
                    </p>
                    <p className="line-clamp-2 text-[10px] text-muted-foreground">
                      {labels.resolveDescription(template.descriptionKey)}
                    </p>
                  </div>
                  {active ? (
                    <Check className="size-3.5 shrink-0 text-blue-600" />
                  ) : null}
                </div>
              </button>
            </StaggerItem>
          )
        })}
      </ul>
    </div>
  )
}
