import {
  getResumeRoleTemplates,
  toTemplateItem,
} from "@/lib/document-templates"
import type { ResumeTemplate, ResumeTemplateCategory } from "./types"

export const TEMPLATE_CATEGORIES: ResumeTemplateCategory[] = [
  "tech",
  "healthcare",
  "finance",
  "consulting",
  "engineering",
  "legal",
]

/** 50 role templates for major US / UK / AU employers. */
export const MOCK_TEMPLATES: ResumeTemplate[] = getResumeRoleTemplates().map((t) => ({
  id: t.id,
  title: t.title,
  company: t.company,
  category: t.category,
  description: t.description,
  avatarText: t.avatarText,
  country: t.country,
}))

export const TEMPLATE_BROWSER_ITEMS = MOCK_TEMPLATES.map(toTemplateItem)
