import { TemplateBrowserPage } from "@/components/templates/template-browser-page"
import { useStartFromTemplate } from "@/hooks/use-start-from-template"
import { MOCK_TEMPLATES, TEMPLATE_BROWSER_ITEMS, TEMPLATE_CATEGORIES } from "./constants"

export function ResumeTemplatesPageContent() {
  const { startFromTemplate, pendingId } = useStartFromTemplate("resume")

  return (
    <TemplateBrowserPage
      items={TEMPLATE_BROWSER_ITEMS.length ? TEMPLATE_BROWSER_ITEMS : MOCK_TEMPLATES}
      categories={TEMPLATE_CATEGORIES}
      translationPrefix="resumeLab.templates"
      backTo="/resume-lab"
      pendingId={pendingId}
      onUse={(template) => startFromTemplate(template.id)}
    />
  )
}
