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

/** Mini page preview rendered inside each template card. */
function TemplatePreview({ template }: { readonly template: EditorTemplate }) {
  const accentBg = resolveStyleClasses(template.defaultStyle).accentBg
  return (
    <div className={cn("flex aspect-[3/4] flex-col gap-1.5 rounded-md bg-white p-3", template.id === "classic" && "items-center")}>
      <div className="h-2.5 w-2/3 rounded-sm bg-neutral-800" />
      <div className={cn("h-1.5 w-1/3 rounded-sm", accentBg)} />
      <div className={cn("mt-1 h-[3px] w-full rounded-sm", accentBg)} />
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className={cn(
            "h-1.5 rounded-sm",
            index % 3 === 0 ? cn("w-1/4", accentBg) : "w-full bg-neutral-200",
            template.id === "classic" && "self-center"
          )}
        />
      ))}
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
