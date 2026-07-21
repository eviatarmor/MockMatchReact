import { TemplateBrowserPage } from "@/components/templates/template-browser-page"
import { useStartFromTemplate } from "@/hooks/use-start-from-template"
import { MOCK_TEMPLATES, TEMPLATE_BROWSER_ITEMS, TEMPLATE_CATEGORIES } from "./constants"

export function CoverLetterTemplatesPageContent() {
  const { startFromTemplate, pendingId } = useStartFromTemplate("cover-letter")

  return (
    <TemplateBrowserPage
      items={TEMPLATE_BROWSER_ITEMS.length ? TEMPLATE_BROWSER_ITEMS : MOCK_TEMPLATES}
      categories={TEMPLATE_CATEGORIES}
      translationPrefix="coverLetters.templates"
      backTo="/cover-letters"
      pendingId={pendingId}
      onUse={(template) => startFromTemplate(template.id)}
    />
  )
}
