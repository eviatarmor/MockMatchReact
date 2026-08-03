import type { TemplateItem } from "@/components/templates/types"
import { companyLogoUrl } from "@/lib/company-logos"
import { STYLE, buildCoverLetterDocument, buildResumeDocument } from "./builders"
import { ROLE_DIRECTORY } from "./role-directory"
import { getRoleSeed } from "./seeds"
import type { CoverLetterRoleTemplate, ResumeRoleTemplate } from "./types"

const PEOPLE: Record<
  string,
  { name: string; email: string; phone: string; linkedin: string }
> = {
  usT: { name: "Jordan Lee", email: "jordan.lee@email.com", phone: "+1 (650) 555-0142", linkedin: "in/jordanlee" },
  usF: { name: "Alex Morgan", email: "alex.morgan@email.com", phone: "+1 (212) 555-0190", linkedin: "in/alexmorgan" },
  usC: { name: "Casey Rivera", email: "casey.rivera@email.com", phone: "+1 (312) 555-0175", linkedin: "in/caseyrivera" },
  usH: { name: "Sam Patel", email: "sam.patel@email.com", phone: "+1 (507) 555-0128", linkedin: "in/sampatel" },
  usE: { name: "Riley Quinn", email: "riley.quinn@email.com", phone: "+1 (512) 555-0160", linkedin: "in/rileyquinn" },
  usL: { name: "Jamie Chen", email: "jamie.chen@email.com", phone: "+1 (212) 555-0182", linkedin: "in/jamiechen" },
  ukT: { name: "Amelia Croft", email: "amelia.croft@email.com", phone: "+44 20 7946 0958", linkedin: "in/ameliacroft" },
  ukF: { name: "Oliver Grant", email: "oliver.grant@email.com", phone: "+44 20 7946 0123", linkedin: "in/olivergrant" },
  ukC: { name: "Sophie Hale", email: "sophie.hale@email.com", phone: "+44 20 7946 0456", linkedin: "in/sophiehale" },
  ukH: { name: "Emily Ward", email: "emily.ward@email.com", phone: "+44 20 7946 0789", linkedin: "in/emilyward" },
  ukE: { name: "James Okafor", email: "james.okafor@email.com", phone: "+44 121 555 0144", linkedin: "in/jamesokafor" },
  ukL: { name: "Hannah Price", email: "hannah.price@email.com", phone: "+44 20 7946 0333", linkedin: "in/hannahprice" },
  auT: { name: "Harper Walsh", email: "harper.walsh@email.com", phone: "+61 2 5550 2211", linkedin: "in/harperwalsh" },
  auF: { name: "Liam Nguyen", email: "liam.nguyen@email.com", phone: "+61 2 5550 4400", linkedin: "in/liamnguyen" },
  auC: { name: "Zoe Mitchell", email: "zoe.mitchell@email.com", phone: "+61 3 5550 1100", linkedin: "in/zoemitchell" },
  auH: { name: "Ava Singh", email: "ava.singh@email.com", phone: "+61 2 5550 6600", linkedin: "in/avasingh" },
  auE: { name: "Noah Fraser", email: "noah.fraser@email.com", phone: "+61 8 5550 7700", linkedin: "in/noahfraser" },
  auL: { name: "Isla Bennett", email: "isla.bennett@email.com", phone: "+61 2 5550 8800", linkedin: "in/islabennett" },
}

function personFor(
  entry: (typeof ROLE_DIRECTORY)[number],
  seedPerson?: {
    name: string
    email: string
    phone: string
    linkedin: string
    website?: string
  }
) {
  const base = seedPerson ?? PEOPLE[entry.personKey] ?? PEOPLE.usT
  return {
    name: base.name,
    email: base.email,
    phone: base.phone,
    linkedin: base.linkedin,
    website: seedPerson?.website,
    headline: entry.headline,
    location: entry.location,
  }
}

/** Full resume role templates (50) — unique content per company/role. */
export function getResumeRoleTemplates(): readonly ResumeRoleTemplate[] {
  return ROLE_DIRECTORY.map((entry) => {
    const seed = getRoleSeed(entry.id)
    if (!seed) {
      throw new Error(`[document-templates] missing role seed for "${entry.id}"`)
    }
    const person = personFor(entry, seed.person)
    return {
      id: entry.id,
      title: entry.title,
      company: entry.company,
      country: entry.country,
      category: entry.category,
      description: entry.description,
      avatarText: entry.avatarText,
      layoutId: entry.resumeLayout,
      style: { ...STYLE[entry.styleKey] },
      person,
      summary: seed.summary,
      experience: seed.experience,
      education: seed.education,
      skills: seed.skills,
      projects: seed.projects,
      certifications: seed.certifications,
      languages: seed.languages,
    } satisfies ResumeRoleTemplate
  })
}

/** Full cover-letter role templates (50) — paired unique letters. */
export function getCoverLetterRoleTemplates(): readonly CoverLetterRoleTemplate[] {
  return ROLE_DIRECTORY.map((entry) => {
    const seed = getRoleSeed(entry.id)
    if (!seed) {
      throw new Error(`[document-templates] missing role seed for "${entry.id}"`)
    }
    const person = personFor(entry, seed.person)
    const hq = entry.location
    return {
      id: entry.id,
      title: entry.title,
      company: entry.company,
      country: entry.country,
      category: entry.category,
      description: entry.description.replace("CV", "letter").replace("format", "tone"),
      avatarText: entry.avatarText,
      layoutId: entry.letterLayout,
      style: { ...STYLE[entry.styleKey] },
      person,
      date: "March 15, 2026",
      recipient: {
        name: "Hiring Manager",
        title: "Talent Acquisition",
        company: entry.company,
        addressLines: [hq],
      },
      greeting: seed.letter.greeting,
      paragraphs: seed.letter.paragraphs,
      closing: seed.letter.closing,
    } satisfies CoverLetterRoleTemplate
  })
}

export function toTemplateItem(t: {
  readonly id: string
  readonly title: string
  readonly company: string
  readonly description: string
  readonly avatarText: string
  readonly category: string
  readonly country?: "US" | "UK" | "AU"
}): TemplateItem {
  return {
    id: t.id,
    title: t.title,
    company: t.company,
    description: t.description,
    avatarText: t.avatarText,
    logoUrl: companyLogoUrl(t.company),
    category: t.category,
    country: t.country,
  }
}

export function buildResumeFromRoleId(id: string) {
  const template = getResumeRoleTemplates().find((t) => t.id === id)
  if (!template) return null
  return {
    template,
    document: buildResumeDocument(template),
  }
}

export function buildCoverLetterFromRoleId(id: string) {
  const template = getCoverLetterRoleTemplates().find((t) => t.id === id)
  if (!template) return null
  return {
    template,
    document: buildCoverLetterDocument(template),
  }
}

export { ROLE_DIRECTORY }
export type { ResumeRoleTemplate, CoverLetterRoleTemplate }
