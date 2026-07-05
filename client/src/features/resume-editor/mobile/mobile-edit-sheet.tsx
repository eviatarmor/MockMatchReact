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
import { RESUME_SECTION_TYPES } from "../constants"
import type { ResolvedStyle } from "@/components/document-editor"
import type { ResumeHandlers } from "../hooks/use-resume-document"
import type { ResumeDocument, ResumeSection } from "../types"
import type { MobileRow } from "./mobile-rows"

interface MobileEditSheetProps {
  readonly row: MobileRow | null
  readonly document: ResumeDocument
  readonly style: ResolvedStyle
  readonly handlers: ResumeHandlers
  readonly onClose: () => void
}

const SECTION_META = new Map(RESUME_SECTION_TYPES.map((m) => [m.type, m]))

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

function HeaderBody({ document, handlers }: { readonly document: ResumeDocument; readonly handlers: ResumeHandlers }) {
  const { t } = useTranslation("resume-editor")
  const { header } = document
  return (
    <div className="flex flex-col gap-4">
      <Field label={t("fields.name")} value={header.name} onChange={(v) => handlers.setHeaderField("name", v)} />
      <Field label={t("fields.headline")} value={header.headline} onChange={(v) => handlers.setHeaderField("headline", v)} />
      {header.contacts.map((contact) => (
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

function SectionBody({ section, style, handlers }: {
  readonly section: ResumeSection
  readonly style: ResolvedStyle
  readonly handlers: ResumeHandlers
}) {
  // `tone="surface"` makes the editor text follow the theme `foreground` token
  // so it stays legible on the sheet in both light and dark mode.
  return (
    <div className="rounded-lg border bg-muted/20 p-3 text-foreground">
      <BlockFields block={section} style={style} update={(patch) => handlers.updateBlock(section.id, patch)} tone="surface" />
    </div>
  )
}

/** Resolve the sheet title for a row. */
function useRowTitle(row: MobileRow | null, document: ResumeDocument): string {
  const { t } = useTranslation("resume-editor")
  if (!row) return ""
  if (row.kind === "header") return t("mobile.rows.header")
  const section = document.sections.find((s) => s.id === row.sectionId)
  const meta = section && SECTION_META.get(section.type)
  return meta ? t(meta.labelKey) : ""
}

export function MobileEditSheet({ row, document, style, handlers, onClose }: MobileEditSheetProps) {
  const { t } = useTranslation("resume-editor")
  const title = useRowTitle(row, document)

  const section = row?.kind === "section" ? document.sections.find((s) => s.id === row.sectionId) ?? null : null

  return (
    <Sheet open={row !== null} onOpenChange={(next) => !next && onClose()}>
      <SheetContent side="bottom" className="grid max-h-[85svh] grid-rows-[auto_minmax(0,1fr)_auto] gap-0 p-0">
        <SheetHeader className="border-b">
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>

        <ScrollArea className="min-h-0">
          <div className="p-4">
            {row?.kind === "header" && <HeaderBody document={document} handlers={handlers} />}
            {section && <SectionBody section={section} style={style} handlers={handlers} />}
          </div>
        </ScrollArea>

        {section && (
          <SheetFooter className="border-t">
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => {
                handlers.removeBlock(section.id)
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
