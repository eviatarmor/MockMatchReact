import {
  getCoverLetterRoleTemplates,
  toTemplateItem,
} from "@/lib/document-templates"
import type { CoverLetterTemplate, CoverLetterTemplateCategory } from "./types"

export const TEMPLATE_CATEGORIES: CoverLetterTemplateCategory[] = [
  "tech",
  "healthcare",
  "finance",
  "consulting",
  "engineering",
  "legal",
]

/** 50 cover-letter role templates paired to the same top employers. */
export const MOCK_TEMPLATES: CoverLetterTemplate[] = getCoverLetterRoleTemplates().map(
  (t) => ({
    id: t.id,
    title: t.title,
    company: t.company,
    category: t.category,
    description: t.description,
    avatarText: t.avatarText,
    country: t.country,
  })
)

export const TEMPLATE_BROWSER_ITEMS = MOCK_TEMPLATES.map(toTemplateItem)
