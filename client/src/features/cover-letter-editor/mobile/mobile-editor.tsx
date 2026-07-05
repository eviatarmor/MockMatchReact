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
import { ChevronRight, GripVertical, UserRound, Building2, CalendarDays, LayoutTemplate, Palette, Sparkles, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { LETTER_BLOCK_TYPES } from "../constants"
import { snippet } from "../section-snippet"
import type { CoverLetterHandlers } from "../hooks/use-cover-letter-document"
import type { CoverLetterDocument, EditorTemplateId, LetterBlock } from "../types"
import { MobileEditSheet } from "./mobile-edit-sheet"
import { MobileCustomizeSheet, type CustomizePanel } from "./mobile-customize-sheet"
import { SpeedDial, type DocumentStyle, type ResolvedStyle } from "@/components/document-editor"
import type { MobileRow } from "./mobile-rows"

interface MobileEditorProps {
  readonly document: CoverLetterDocument
  readonly style: ResolvedStyle
  readonly documentStyle: DocumentStyle
  readonly onStyleChange: (patch: Partial<DocumentStyle>) => void
  readonly templateId: EditorTemplateId
  readonly onTemplateChange: (id: EditorTemplateId) => void
  readonly handlers: CoverLetterHandlers
}

const BLOCK_META = new Map(LETTER_BLOCK_TYPES.map((m) => [m.type, m]))

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

/** Sortable body-block row with a drag handle for reordering. */
function BlockRow({ block, onOpen }: { readonly block: LetterBlock; readonly onOpen: () => void }) {
  const { t } = useTranslation("cover-letter-editor")
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id })
  const meta = BLOCK_META.get(block.type)
  const Icon = meta?.icon ?? UserRound
  const label = meta ? t(meta.labelKey) : block.type

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(isDragging && "z-10 opacity-80")}
    >
      <RowShell
        icon={Icon}
        label={label}
        preview={snippet(block).trim()}
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
  const { t } = useTranslation("cover-letter-editor")
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
              label={t("mobile.rows.basicInfo")}
              preview={[document.sender.name, document.sender.title].filter(Boolean).join(" · ")}
              openLabel={t("mobile.openSection", { section: t("mobile.rows.basicInfo") })}
              onOpen={() => setActiveRow({ kind: "basic-info" })}
            />
          </li>
          <li>
            <RowShell
              icon={Building2}
              label={t("mobile.rows.recipient")}
              preview={[document.recipient.name, document.recipient.company].filter(Boolean).join(" · ")}
              openLabel={t("mobile.openSection", { section: t("mobile.rows.recipient") })}
              onOpen={() => setActiveRow({ kind: "recipient" })}
            />
          </li>
          <li>
            <RowShell
              icon={CalendarDays}
              label={t("mobile.rows.date")}
              preview={document.date}
              openLabel={t("mobile.openSection", { section: t("mobile.rows.date") })}
              onOpen={() => setActiveRow({ kind: "date" })}
            />
          </li>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={document.blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
              {document.blocks.map((block) => (
                <BlockRow key={block.id} block={block} onOpen={() => setActiveRow({ kind: "block", blockId: block.id })} />
              ))}
            </SortableContext>
          </DndContext>
        </ul>

        <div className="mt-6 border-t pt-5">
          <div className="mx-auto flex w-full max-w-xl flex-col gap-2.5">
            <Label className="text-sm font-semibold text-foreground">{t("addSection")}</Label>
            <div className="grid grid-cols-2 gap-2">
              {LETTER_BLOCK_TYPES.map((meta) => {
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
