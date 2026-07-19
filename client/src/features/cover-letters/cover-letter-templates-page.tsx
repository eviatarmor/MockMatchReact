import { TemplateBrowserPage } from "@/components/templates/template-browser-page"
import { MOCK_TEMPLATES, TEMPLATE_CATEGORIES } from "./constants"

export function CoverLetterTemplatesPageContent() {
  return (
    <TemplateBrowserPage
      items={MOCK_TEMPLATES}
      categories={TEMPLATE_CATEGORIES}
      translationPrefix="coverLetters.templates"
      backTo="/cover-letters"
    />
  )
}
