import type { ResumeTemplate, ResumeTemplateCategory } from "./types"

export const TEMPLATE_CATEGORIES: ResumeTemplateCategory[] = [
  "tech",
  "healthcare",
  "finance",
  "consulting",
  "engineering",
  "legal",
]

export const MOCK_TEMPLATES: ResumeTemplate[] = [
  {
    id: "t1",
    title: "Software Engineer",
    company: "Microsoft",
    category: "tech",
    description: "Big-tech engineering format",
    avatarText: "MS",
  },
  {
    id: "t2",
    title: "Investment Banking Analyst",
    company: "Goldman Sachs",
    category: "finance",
    description: "Deal-sheet structure",
    avatarText: "GS",
  },
  {
    id: "t3",
    title: "Cardiologist",
    company: "Sheba — Tel HaShomer",
    category: "healthcare",
    description: "Clinical CV with publications",
    avatarText: "S",
  },
  {
    id: "t4",
    title: "Management Consultant",
    company: "McKinsey & Company",
    category: "consulting",
    description: "Case-driven impact format",
    avatarText: "MC",
  },
  {
    id: "t5",
    title: "Mechanical Engineer",
    company: "Tesla",
    category: "engineering",
    description: "Hardware project showcase",
    avatarText: "T",
  },
  {
    id: "t6",
    title: "Corporate Associate",
    company: "Skadden",
    category: "legal",
    description: "Practice-area focused CV",
    avatarText: "SK",
  },
  {
    id: "t7",
    title: "Frontend Engineer",
    company: "Vercel",
    category: "tech",
    description: "Startup product format",
    avatarText: "V",
  },
  {
    id: "t8",
    title: "Registered Nurse",
    company: "Mayo Clinic",
    category: "healthcare",
    description: "Patient-care experience format",
    avatarText: "MC",
  },
]
