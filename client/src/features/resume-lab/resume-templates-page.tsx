import { TemplateBrowserPage } from "@/components/templates/template-browser-page"
import { MOCK_TEMPLATES, TEMPLATE_CATEGORIES } from "./constants"

export function ResumeTemplatesPageContent() {
  return (
    <TemplateBrowserPage
      items={MOCK_TEMPLATES}
      categories={TEMPLATE_CATEGORIES}
      translationPrefix="resumeLab.templates"
      backTo="/resume-lab"
    />
  )
}
