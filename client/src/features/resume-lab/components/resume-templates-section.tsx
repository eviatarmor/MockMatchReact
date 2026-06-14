import { useState } from "react"
import { ArrowRight } from "lucide-react"
import { useTranslation } from "react-i18next"
import { ResumeTemplateCard } from "./resume-template-card"
import { ResumeTemplatesDialog } from "./resume-templates-dialog"
import { MOCK_TEMPLATES } from "../constants"

const FEATURED_COUNT = 5

export function ResumeTemplatesSection() {
  const { t } = useTranslation("common")
  const [dialogOpen, setDialogOpen] = useState(false)
  const featuredTemplates = MOCK_TEMPLATES.slice(0, FEATURED_COUNT)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold text-foreground">
            {t("resumeLab.templates.title")}
          </h2>
          <p className="text-sm text-muted-foreground">{t("resumeLab.templates.description")}</p>
        </div>
        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          className="flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline cursor-pointer"
        >
          {t("resumeLab.templates.browseAll")}
          <ArrowRight className="size-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {featuredTemplates.map((template) => (
          <ResumeTemplateCard key={template.id} template={template} />
        ))}
      </div>

      <ResumeTemplatesDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}
