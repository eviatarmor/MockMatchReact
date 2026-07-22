/**
 * Company brand marks for template browser avatars.
 * SVGs from theSVG (https://thesvg.org) — MIT library; brand marks remain
 * trademarks of their respective owners. Local copies under public/icons/companies.
 *
 * Companies without a theSVG entry fall back to avatar initials in the UI.
 */

const LOGO_BASE = "/icons/companies"

/** Company display name → local theSVG slug filename (without .svg). */
const COMPANY_LOGO_SLUG: Record<string, string> = {
  Google: "google",
  Amazon: "amazon",
  Microsoft: "microsoft",
  Meta: "meta",
  Apple: "apple",
  Netflix: "netflix",
  NVIDIA: "nvidia",
  Stripe: "stripe",
  Atlassian: "atlassian",
  Canva: "canva",
  "Google DeepMind": "deepmind",
  "Goldman Sachs": "goldman-sachs",
  "JPMorgan Chase": "chase",
  "Morgan Stanley": "morgan-stanley",
  "Bank of America": "bank-of-america",
  Citi: "citibank",
  HSBC: "hsbc",
  Barclays: "barclays",
  "Commonwealth Bank": "commonwealth-bank",
  Accenture: "accenture",
  "Mayo Clinic": "mayo-clinic",
  Pfizer: "pfizer",
  "Johnson & Johnson": "johnson-and-johnson",
  AstraZeneca: "astrazeneca",
  Tesla: "tesla",
  Boeing: "boeing",
  "GE Vernova": "gevernova",
  "Lockheed Martin": "lockheed-martin",
  "Rolls-Royce": "rolls-royce",
}

/** Resolve local logo path for a company name, or undefined if no theSVG asset. */
export function companyLogoUrl(company: string): string | undefined {
  const slug = COMPANY_LOGO_SLUG[company]
  if (!slug) return undefined
  return `${LOGO_BASE}/${slug}.svg`
}
