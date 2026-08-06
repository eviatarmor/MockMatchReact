import type {
  LandingBentoFeature,
  LandingChangelogItem,
  LandingCompany,
  LandingFaqItem,
  LandingIntegrationNode,
} from "./types"
import { DOCS_URL } from "./lib/urls"

export { DOCS_URL }
export { APP_URL, appPath } from "./lib/urls"

/** Public docs root — changelog section anchors the in-page product notes for now. */
export const CHANGELOG_HREF = "#changelog"

/**
 * Well-known employer marks under public/icons/companies.
 * Recognition only — never partnership claims.
 */
export const LANDING_COMPANIES: readonly LandingCompany[] = [
  { id: "google", name: "Google", logoSrc: "/icons/companies/google.svg" },
  { id: "microsoft", name: "Microsoft", logoSrc: "/icons/companies/microsoft.svg" },
  { id: "meta", name: "Meta", logoSrc: "/icons/companies/meta.svg" },
  { id: "amazon", name: "Amazon", logoSrc: "/icons/companies/amazon.svg" },
  { id: "apple", name: "Apple", logoSrc: "/icons/companies/apple.svg" },
  { id: "netflix", name: "Netflix", logoSrc: "/icons/companies/netflix.svg" },
  { id: "nvidia", name: "NVIDIA", logoSrc: "/icons/companies/nvidia.svg" },
  { id: "stripe", name: "Stripe", logoSrc: "/icons/companies/stripe.svg" },
  { id: "atlassian", name: "Atlassian", logoSrc: "/icons/companies/atlassian.svg" },
  { id: "canva", name: "Canva", logoSrc: "/icons/companies/canva.svg" },
] as const

export const LANDING_BENTO_FEATURES: readonly LandingBentoFeature[] = [
  {
    id: "resume",
    nameKey: "features.items.resume.name",
    descriptionKey: "features.items.resume.description",
    className: "sm:col-span-2 lg:col-span-2",
  },
  {
    id: "practice",
    nameKey: "features.items.practice.name",
    descriptionKey: "features.items.practice.description",
    className: "sm:col-span-1 lg:col-span-1",
  },
  {
    id: "jobs",
    nameKey: "features.items.jobs.name",
    descriptionKey: "features.items.jobs.description",
    className: "sm:col-span-1 lg:col-span-1",
  },
  {
    id: "readiness",
    nameKey: "features.items.readiness.name",
    descriptionKey: "features.items.readiness.description",
    className: "sm:col-span-2 lg:col-span-2",
  },
] as const

export const LANDING_INTEGRATION_NODES: readonly LandingIntegrationNode[] = [
  { id: "zoom", labelKey: "integrations.nodes.zoom" },
  { id: "meet", labelKey: "integrations.nodes.meet" },
  { id: "outlook", labelKey: "integrations.nodes.outlook" },
  { id: "gmail", labelKey: "integrations.nodes.gmail" },
  { id: "chat", labelKey: "integrations.nodes.chat" },
  { id: "calendar", labelKey: "integrations.nodes.calendar" },
] as const

export const LANDING_FAQ_ITEMS: readonly LandingFaqItem[] = [
  { id: "what", questionKey: "faq.items.what.q", answerKey: "faq.items.what.a" },
  { id: "free", questionKey: "faq.items.free.q", answerKey: "faq.items.free.a" },
  {
    id: "practice",
    questionKey: "faq.items.practice.q",
    answerKey: "faq.items.practice.a",
  },
  { id: "docs", questionKey: "faq.items.docs.q", answerKey: "faq.items.docs.a" },
  { id: "data", questionKey: "faq.items.data.q", answerKey: "faq.items.data.a" },
] as const

export const LANDING_CHANGELOG_ITEMS: readonly LandingChangelogItem[] = [
  {
    id: "simulations",
    labelKey: "changelog.items.simulations.label",
    bodyKey: "changelog.items.simulations.body",
  },
  {
    id: "docs",
    labelKey: "changelog.items.docs.label",
    bodyKey: "changelog.items.docs.body",
  },
  {
    id: "extension",
    labelKey: "changelog.items.extension.label",
    bodyKey: "changelog.items.extension.body",
  },
] as const

export const LANDING_IDEA_KEYS = [
  "ideas.items.0",
  "ideas.items.1",
  "ideas.items.2",
  "ideas.items.3",
  "ideas.items.4",
  "ideas.items.5",
  "ideas.items.6",
  "ideas.items.7",
] as const
