import { useTranslation } from "react-i18next"
import { Trash2 } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { BlockFields } from "../canvas/block-fields"
import { LETTER_BLOCK_TYPES } from "../constants"
import type { ResolvedStyle } from "@/components/document-editor"
import type { CoverLetterHandlers } from "../hooks/use-cover-letter-document"
import type { CoverLetterDocument, LetterBlock } from "../types"
import type { MobileRow } from "./mobile-rows"

interface MobileEditSheetProps {
  readonly row: MobileRow | null
  readonly document: CoverLetterDocument
  readonly style: ResolvedStyle
  readonly handlers: CoverLetterHandlers
  readonly onClose: () => void
}

const BLOCK_META = new Map(LETTER_BLOCK_TYPES.map((m) => [m.type, m]))

/** Labelled text input wired to a string field. */
function Field({ label, value, onChange, placeholder }: {
  readonly label: string
  readonly value: string
  readonly onChange: (value: string) => void
  readonly placeholder?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="h-10" />
    </div>
  )
}

function BasicInfoBody({ document, handlers }: { readonly document: CoverLetterDocument; readonly handlers: CoverLetterHandlers }) {
  const { t } = useTranslation("cover-letter-editor")
  const { sender } = document
  return (
    <div className="flex flex-col gap-4">
      <Field label={t("fields.name")} value={sender.name} onChange={(v) => handlers.setSenderField("name", v)} />
      <Field label={t("fields.title")} value={sender.title} onChange={(v) => handlers.setSenderField("title", v)} />
      {sender.contacts.map((contact) => (
        <Field
          key={contact.id}
          label={t(`contacts.${contact.id}`, { defaultValue: contact.id })}
          value={contact.value}
          onChange={(v) => handlers.setContact(contact.id, v)}
        />
      ))}
    </div>
  )
}

function RecipientBody({ document, handlers }: { readonly document: CoverLetterDocument; readonly handlers: CoverLetterHandlers }) {
  const { t } = useTranslation("cover-letter-editor")
  const { recipient } = document
  return (
    <div className="flex flex-col gap-4">
      <Field label={t("fields.recipientName")} value={recipient.name ?? ""} onChange={(v) => handlers.setRecipientField("name", v)} />
      <Field label={t("fields.recipientTitle")} value={recipient.title ?? ""} onChange={(v) => handlers.setRecipientField("title", v)} />
      <Field label={t("fields.company")} value={recipient.company} onChange={(v) => handlers.setRecipientField("company", v)} />
    </div>
  )
}

function DateBody({ document, handlers }: { readonly document: CoverLetterDocument; readonly handlers: CoverLetterHandlers }) {
  const { t } = useTranslation("cover-letter-editor")
  return (
    <div className="flex flex-col gap-4">
      <Field label={t("fields.date")} value={document.date} onChange={(v) => handlers.setDate(v)} />
    </div>
  )
}

function BlockBody({ block, style, handlers }: {
  readonly block: LetterBlock
  readonly style: ResolvedStyle
  readonly handlers: CoverLetterHandlers
}) {
  // `tone="surface"` makes the editor text follow the theme `foreground` token
  // so it stays legible on the sheet in both light and dark mode. The wrapper
  // sets the inherited color for fields that don't specify their own.
  return (
    <div className="rounded-lg border bg-muted/20 p-3 text-foreground">
      <BlockFields block={block} style={style} update={(patch) => handlers.updateBlock(block.id, patch)} tone="surface" />
    </div>
  )
}

/** Resolve the sheet title for a row. */
function useRowTitle(row: MobileRow | null, document: CoverLetterDocument): string {
  const { t } = useTranslation("cover-letter-editor")
  if (!row) return ""
  if (row.kind === "basic-info") return t("mobile.rows.basicInfo")
  if (row.kind === "recipient") return t("mobile.rows.recipient")
  if (row.kind === "date") return t("mobile.rows.date")
  const block = document.blocks.find((b) => b.id === row.blockId)
  const meta = block && BLOCK_META.get(block.type)
  return meta ? t(meta.labelKey) : ""
}

export function MobileEditSheet({ row, document, style, handlers, onClose }: MobileEditSheetProps) {
  const { t } = useTranslation("cover-letter-editor")
  const title = useRowTitle(row, document)

  const block = row?.kind === "block" ? document.blocks.find((b) => b.id === row.blockId) ?? null : null

  return (
    <Sheet open={row !== null} onOpenChange={(next) => !next && onClose()}>
      <SheetContent side="bottom" className="grid max-h-[85svh] grid-rows-[auto_minmax(0,1fr)_auto] gap-0 p-0">
        <SheetHeader className="border-b">
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>

        <ScrollArea className="min-h-0">
          <div className="p-4">
            {row?.kind === "basic-info" && <BasicInfoBody document={document} handlers={handlers} />}
            {row?.kind === "recipient" && <RecipientBody document={document} handlers={handlers} />}
            {row?.kind === "date" && <DateBody document={document} handlers={handlers} />}
            {block && <BlockBody block={block} style={style} handlers={handlers} />}
          </div>
        </ScrollArea>

        {block && (
          <SheetFooter className="border-t">
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => {
                handlers.removeBlock(block.id)
                onClose()
              }}
            >
              <Trash2 className="size-4" />
              {t("blockToolbar.delete")}
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  )
}
