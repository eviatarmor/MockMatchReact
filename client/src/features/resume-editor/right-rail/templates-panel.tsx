import { useTranslation } from "react-i18next"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { resolveStyleClasses } from "@/components/document-editor"
import { EDITOR_TEMPLATES } from "../constants"
import type { EditorTemplate, EditorTemplateId } from "../types"

interface TemplatesPanelProps {
  readonly activeTemplateId: EditorTemplateId
  readonly onSelect: (id: EditorTemplateId) => void
}

/** A stack of faux body lines shared by every preview. */
function PreviewBody({ accentBg, centered }: { readonly accentBg: string; readonly centered?: boolean }) {
  return (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className={cn(
            "h-1.5 rounded-sm",
            index % 3 === 0 ? cn("w-1/4", accentBg) : "w-full bg-neutral-200",
            centered && "self-center"
          )}
        />
      ))}
    </>
  )
}

/** Faux name + accent headline block. */
function PreviewIdentity({ accentBg, centered, onBand }: { readonly accentBg: string; readonly centered?: boolean; readonly onBand?: boolean }) {
  return (
    <>
      <div className={cn("h-2.5 w-2/3 rounded-sm", onBand ? "bg-white/90" : "bg-neutral-800", centered && "self-center")} />
      <div className={cn("h-1.5 w-1/3 rounded-sm", onBand ? "bg-white/60" : accentBg, centered && "self-center")} />
    </>
  )
}

/** Mini page preview rendered inside each template card — mirrors the header layout. */
function TemplatePreview({ template }: { readonly template: EditorTemplate }) {
  const accentBg = resolveStyleClasses(template.defaultStyle).accentBg
  const layout = template.layout

  if (layout === "banner") {
    return (
      <div className="flex aspect-[3/4] flex-col gap-1.5 overflow-hidden rounded-md bg-white">
        <div className={cn("flex flex-col gap-1.5 px-3 pb-3 pt-3", accentBg)}>
          <PreviewIdentity accentBg={accentBg} onBand />
        </div>
        <div className="flex flex-col gap-1.5 px-3 pb-3">
          <PreviewBody accentBg={accentBg} />
        </div>
      </div>
    )
  }

  const centered = layout === "centered" || layout === "elegant"
  return (
    <div className={cn("flex aspect-[3/4] flex-col gap-1.5 rounded-md bg-white p-3", centered && "items-center")}>
      <PreviewIdentity accentBg={accentBg} centered={centered} />
      <div className={cn("mt-1 h-[3px] w-full rounded-sm", layout === "grid" || layout === "compact" ? "bg-neutral-300" : accentBg)} />
      <PreviewBody accentBg={accentBg} centered={centered} />
    </div>
  )
}

export function TemplatesPanel({ activeTemplateId, onSelect }: TemplatesPanelProps) {
  const { t } = useTranslation("resume-editor")

  return (
    <div className="grid grid-cols-2 gap-3">
      {EDITOR_TEMPLATES.map((template) => {
        const isActive = template.id === activeTemplateId
        return (
          <button
            key={template.id}
            type="button"
            onClick={() => onSelect(template.id)}
            className="group flex cursor-pointer flex-col gap-2 text-left"
          >
            <div
              className={cn(
                "rounded-lg border-2 p-1.5 transition-colors",
                isActive ? "border-primary" : "border-transparent group-hover:border-border"
              )}
            >
              <TemplatePreview template={template} />
            </div>
            <div className="px-0.5">
              <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                {t(template.nameKey)}
                {isActive && <Check className="size-3.5 text-primary" />}
              </span>
              <p className="text-xs leading-snug text-muted-foreground">{t(template.descriptionKey)}</p>
            </div>
          </button>
        )
      })}
    </div>
  )
}
