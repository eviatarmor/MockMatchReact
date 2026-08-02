import type {
  CoverLetterItem,
  ExtensionSettings,
  ProfileSummary,
  ResumeItem,
  ReviewField,
  SessionUser,
} from "../types"

export const MOCK_USER: SessionUser = {
  id: "u1",
  fullName: "Alex Rivera",
  email: "alex@example.com",
  initials: "AR",
}

export const MOCK_PROFILE: ProfileSummary = {
  fullName: "Alex Rivera",
  email: "alex@example.com",
  phone: "+1 (415) 555-0142",
  linkedIn: "linkedin.com/in/alexrivera",
  location: "San Francisco, CA",
}

export const MOCK_RESUMES: readonly ResumeItem[] = [
  {
    id: "r1",
    title: "Staff Engineer — general",
    updatedLabel: "Updated 2d ago",
  },
  {
    id: "r2",
    title: "Product Design lead",
    updatedLabel: "Updated yesterday",
  },
  {
    id: "r3",
    title: "Fit: Linear · Senior PM",
    updatedLabel: "Generated today",
    isFit: true,
  },
]

export const MOCK_COVER_LETTERS: readonly CoverLetterItem[] = [
  {
    id: "c1",
    title: "General product roles",
    updatedLabel: "Updated last week",
  },
  {
    id: "c2",
    title: "Infrastructure / platform",
    updatedLabel: "Updated 4d ago",
  },
  {
    id: "c3",
    title: "Fit: Vercel Staff Designer",
    updatedLabel: "Generated today",
  },
]

export const DEFAULT_SETTINGS: ExtensionSettings = {
  theme: "system",
  autoDetectForms: true,
  autoOpenPanelOnDetect: true,
  highlightFilledFields: true,
  rememberLastResume: true,
  defaultCoverLetterMode: "existing",
  prepareApplications: false,
  confirmBeforeFill: true,
}

export const MOCK_REVIEW_FIELDS: readonly ReviewField[] = [
  {
    id: "f1",
    label: "Full name",
    value: "Alex Rivera",
    confidence: "high",
    needsReview: false,
  },
  {
    id: "f2",
    label: "Email",
    value: "alex@example.com",
    confidence: "high",
    needsReview: false,
  },
  {
    id: "f3",
    label: "Phone",
    value: "+1 (415) 555-0142",
    confidence: "high",
    needsReview: false,
  },
  {
    id: "f4",
    label: "LinkedIn URL",
    value: "linkedin.com/in/alexrivera",
    confidence: "high",
    needsReview: false,
  },
  {
    id: "f5",
    label: "Years of experience",
    value: "8",
    confidence: "medium",
    needsReview: false,
  },
  {
    id: "f6",
    label: "Work authorization",
    value: "",
    confidence: "low",
    needsReview: true,
  },
  {
    id: "f7",
    label: "Why this role?",
    value: "Drafted from cover letter — confirm tone",
    confidence: "medium",
    needsReview: true,
  },
]

export const TAILOR_DRAFT_SAMPLE = `Dear Hiring Team,

I'm excited to apply for the Senior Product Designer role at Linear. Over the past eight years I've led design systems and product craft for developer-facing tools, focusing on clarity under density and calm, high-trust interfaces.

At my current role I partnered with engineering to ship a design system used across 40+ surfaces and cut onboarding time for new designers by half. I'm especially drawn to Linear's product philosophy — speed without chaos, and software that disappears into the work.

I'd welcome the chance to bring that same focus to your team.

Best regards,
Alex Rivera`

