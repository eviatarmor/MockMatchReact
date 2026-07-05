import { useState } from "react"
import { useTranslation } from "react-i18next"
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { ChevronRight, GripVertical, UserRound, LayoutTemplate, Palette, Sparkles, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { SpeedDial, type DocumentStyle, type ResolvedStyle } from "@/components/document-editor"
import { RESUME_SECTION_TYPES } from "../constants"
import { snippet } from "../section-snippet"
import type { ResumeHandlers } from "../hooks/use-resume-document"
import type { ResumeDocument, EditorTemplateId, ResumeSection } from "../types"
import { MobileEditSheet } from "./mobile-edit-sheet"
import { MobileCustomizeSheet, type CustomizePanel } from "./mobile-customize-sheet"
import type { MobileRow } from "./mobile-rows"

interface MobileEditorProps {
  readonly document: ResumeDocument
  readonly style: ResolvedStyle
  readonly documentStyle: DocumentStyle
  readonly onStyleChange: (patch: Partial<DocumentStyle>) => void
  readonly templateId: EditorTemplateId
  readonly onTemplateChange: (id: EditorTemplateId) => void
  readonly handlers: ResumeHandlers
}

const SECTION_META = new Map(RESUME_SECTION_TYPES.map((m) => [m.type, m]))

/** Shared row chrome: icon + label + preview + trailing slot. `dragHandle` optional. */
function RowShell({ icon: Icon, label, preview, onOpen, openLabel, dragHandle }: {
  readonly icon: LucideIcon
  readonly label: string
  readonly preview?: string
  readonly onOpen: () => void
  readonly openLabel: string
  readonly dragHandle?: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-1 rounded-xl border bg-background pr-3 transition-colors hover:bg-muted/50">
      {dragHandle}
      <button
        type="button"
        onClick={onOpen}
        aria-label={openLabel}
        className={cn("flex min-w-0 flex-1 cursor-pointer items-center gap-3 py-3.5 text-left", !dragHandle && "pl-4")}
      >
        <Icon className="size-5 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{label}</p>
          {preview && <p className="truncate text-xs text-muted-foreground">{preview}</p>}
        </div>
        <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
      </button>
    </div>
  )
}

/** Sortable section row with a drag handle for reordering. */
function SectionRow({ section, onOpen }: { readonly section: ResumeSection; readonly onOpen: () => void }) {
  const { t } = useTranslation("resume-editor")
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id })
  const meta = SECTION_META.get(section.type)
  const Icon = meta?.icon ?? UserRound
  const label = meta ? t(meta.labelKey) : section.type

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(isDragging && "z-10 opacity-80")}
    >
      <RowShell
        icon={Icon}
        label={label}
        preview={snippet(section).trim()}
        openLabel={t("mobile.openSection", { section: label })}
        onOpen={onOpen}
        dragHandle={
          <button
            type="button"
            {...attributes}
            {...listeners}
            aria-label={t("blockToolbar.drag")}
            className="flex size-9 shrink-0 cursor-grab touch-none items-center justify-center text-muted-foreground/50 hover:text-muted-foreground active:cursor-grabbing"
          >
            <GripVertical className="size-4" />
          </button>
        }
      />
    </li>
  )
}

export function MobileEditor({ document, style, documentStyle, onStyleChange, templateId, onTemplateChange, handlers }: MobileEditorProps) {
  const { t } = useTranslation("resume-editor")
  const [activeRow, setActiveRow] = useState<MobileRow | null>(null)
  const [customizePanel, setCustomizePanel] = useState<CustomizePanel | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) handlers.reorderBlocks(String(active.id), String(over.id))
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col rounded-xl border bg-background p-4 shadow-sm">
      <div className="w-full pb-20">
        <ul className="flex flex-col gap-2">
          <li>
            <RowShell
              icon={UserRound}
              label={t("mobile.rows.header")}
              preview={[document.header.name, document.header.headline].filter(Boolean).join(" · ")}
              openLabel={t("mobile.openSection", { section: t("mobile.rows.header") })}
              onOpen={() => setActiveRow({ kind: "header" })}
            />
          </li>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={document.sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              {document.sections.map((section) => (
                <SectionRow key={section.id} section={section} onOpen={() => setActiveRow({ kind: "section", sectionId: section.id })} />
              ))}
            </SortableContext>
          </DndContext>
        </ul>

        <div className="mt-6 border-t pt-5">
          <div className="mx-auto flex w-full max-w-xl flex-col gap-2.5">
            <Label className="text-sm font-semibold text-foreground">{t("addSection")}</Label>
            <div className="grid grid-cols-2 gap-2">
              {RESUME_SECTION_TYPES.map((meta) => {
                const Icon = meta.icon
                return (
                  <button
                    key={meta.type}
                    type="button"
                    onClick={() => handlers.addBlock(meta.type)}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-lg border border-dashed px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors",
                      "hover:border-border hover:bg-muted/40 hover:text-foreground"
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    {t(meta.labelKey)}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <SpeedDial
        openLabel={t("mobile.customize")}
        actions={[
          { id: "templates", icon: LayoutTemplate, label: t("rail.templates"), onClick: () => setCustomizePanel("templates") },
          { id: "style", icon: Palette, label: t("rail.style"), onClick: () => setCustomizePanel("style") },
          { id: "ai", icon: Sparkles, label: t("rail.ai"), onClick: () => setCustomizePanel("ai") },
        ]}
      />

      <MobileEditSheet
        row={activeRow}
        document={document}
        style={style}
        handlers={handlers}
        onClose={() => setActiveRow(null)}
      />
      <MobileCustomizeSheet
        panel={customizePanel}
        onClose={() => setCustomizePanel(null)}
        activeTemplateId={templateId}
        onTemplateChange={onTemplateChange}
        style={documentStyle}
        onStyleChange={onStyleChange}
      />
    </div>
  )
}
