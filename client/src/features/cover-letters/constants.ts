import type { CoverLetterTemplate, CoverLetterTemplateCategory } from "./types"

export const TEMPLATE_CATEGORIES: CoverLetterTemplateCategory[] = [
  "tech",
  "healthcare",
  "finance",
  "consulting",
  "engineering",
  "legal",
]

export const MOCK_TEMPLATES: CoverLetterTemplate[] = [
  {
    id: "t1",
    title: "Software Engineer",
    company: "Microsoft",
    category: "tech",
    description: "Big-tech engineering tone",
    avatarText: "MS",
  },
  {
    id: "t2",
    title: "Investment Banking Analyst",
    company: "Goldman Sachs",
    category: "finance",
    description: "Formal deal-desk tone",
    avatarText: "GS",
  },
  {
    id: "t3",
    title: "Cardiologist",
    company: "Sheba — Tel HaShomer",
    category: "healthcare",
    description: "Clinical motivation letter",
    avatarText: "S",
  },
  {
    id: "t4",
    title: "Management Consultant",
    company: "McKinsey & Company",
    category: "consulting",
    description: "Impact-driven narrative",
    avatarText: "MC",
  },
  {
    id: "t5",
    title: "Mechanical Engineer",
    company: "Tesla",
    category: "engineering",
    description: "Project-led narrative",
    avatarText: "T",
  },
  {
    id: "t6",
    title: "Corporate Associate",
    company: "Skadden",
    category: "legal",
    description: "Practice-area focused tone",
    avatarText: "SK",
  },
  {
    id: "t7",
    title: "Frontend Engineer",
    company: "Vercel",
    category: "tech",
    description: "Startup-friendly tone",
    avatarText: "V",
  },
  {
    id: "t8",
    title: "Registered Nurse",
    company: "Mayo Clinic",
    category: "healthcare",
    description: "Patient-care motivation letter",
    avatarText: "MC",
  },
]
