import { useTranslation } from "react-i18next"
import { GripVertical, Lock } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { EDITOR_SECTIONS } from "../constants"

/** Toggle/reorder document sections (presentational scaffold). */
export function SectionsPanel() {
  const { t } = useTranslation("cover-letter-editor")

  return (
    <ul className="flex flex-col gap-1.5">
      {EDITOR_SECTIONS.map((section) => (
        <li
          key={section.id}
          className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-2.5 py-2"
        >
          <GripVertical className="size-4 shrink-0 cursor-grab text-muted-foreground/60" />
          <span className="flex-1 text-sm font-medium text-foreground">{t(section.labelKey)}</span>
          {section.removable ? (
            <Switch defaultChecked aria-label={t(section.labelKey)} />
          ) : (
            <Lock className="size-3.5 text-muted-foreground/60" />
          )}
        </li>
      ))}
    </ul>
  )
}
