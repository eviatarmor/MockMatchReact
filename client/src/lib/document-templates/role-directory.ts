import type { RoleTemplateCategory, TemplateCountry } from "./types"

/**
 * 50 target roles at major US / UK / AU employers.
 * Descriptions encode real recruiting format expectations by industry.
 */
export interface RoleDirectoryEntry {
  readonly id: string
  readonly title: string
  readonly company: string
  readonly country: TemplateCountry
  readonly category: RoleTemplateCategory
  readonly avatarText: string
  readonly description: string
  /** Shared visual layout seed for resume + cover letter (paired). */
  readonly resumeLayout:
    | "modern"
    | "classic"
    | "minimal"
    | "technical"
    | "executive"
    | "compact"
    | "banner"
    | "editorial"
    | "elegant"
  readonly letterLayout:
    | "modern"
    | "classic"
    | "minimal"
    | "technical"
    | "executive"
    | "compact"
    | "banner"
    | "editorial"
    | "elegant"
  readonly styleKey:
    | "tech"
    | "finance"
    | "consulting"
    | "healthcare"
    | "engineering"
    | "legal"
    | "product"
  readonly personKey: string
  readonly location: string
  readonly headline: string
}

export const ROLE_DIRECTORY: readonly RoleDirectoryEntry[] = [
  // Tech (12)
  { id: "google-swe", title: "Software Engineer", company: "Google", country: "US", category: "tech", avatarText: "G", description: "Single-column ATS + systems impact metrics — Google L3–L5 eng screens (GCA + depth).", resumeLayout: "technical", letterLayout: "technical", styleKey: "tech", personKey: "usT", location: "Mountain View, CA", headline: "Software Engineer · Distributed Systems" },
  { id: "amazon-sde", title: "Software Development Engineer", company: "Amazon", country: "US", category: "tech", avatarText: "A", description: "Leadership-principle bullets with hard metrics — Amazon SDE loop standard.", resumeLayout: "compact", letterLayout: "compact", styleKey: "tech", personKey: "usT", location: "Seattle, WA", headline: "SDE · Backend Services" },
  { id: "microsoft-swe", title: "Software Engineer", company: "Microsoft", country: "US", category: "tech", avatarText: "MS", description: "Cloud + collaboration impact — Microsoft Azure/Office platform eng style.", resumeLayout: "modern", letterLayout: "modern", styleKey: "tech", personKey: "usT", location: "Redmond, WA", headline: "Software Engineer · Cloud Platform" },
  { id: "meta-frontend", title: "Frontend Engineer", company: "Meta", country: "US", category: "tech", avatarText: "M", description: "Product impact + Web Vitals — Meta frontend expectations.", resumeLayout: "modern", letterLayout: "modern", styleKey: "product", personKey: "usT", location: "Menlo Park, CA", headline: "Frontend Engineer · Web Performance" },
  { id: "apple-ios", title: "iOS Engineer", company: "Apple", country: "US", category: "tech", avatarText: "AP", description: "Swift craft, privacy, accessibility — Apple product eng bar.", resumeLayout: "minimal", letterLayout: "minimal", styleKey: "product", personKey: "usT", location: "Cupertino, CA", headline: "iOS Engineer · Consumer Apps" },
  { id: "netflix-backend", title: "Senior Backend Engineer", company: "Netflix", country: "US", category: "tech", avatarText: "N", description: "Multi-region reliability, chaos, cost — senior Netflix-style eng narrative.", resumeLayout: "editorial", letterLayout: "editorial", styleKey: "tech", personKey: "usT", location: "Los Angeles, CA", headline: "Senior Backend Engineer · Platform" },
  { id: "nvidia-cuda", title: "CUDA Systems Engineer", company: "NVIDIA", country: "US", category: "tech", avatarText: "NV", description: "GPU kernels, profiling, throughput — NVIDIA systems hiring bar.", resumeLayout: "technical", letterLayout: "technical", styleKey: "engineering", personKey: "usE", location: "Santa Clara, CA", headline: "Systems Engineer · GPU Compute" },
  { id: "stripe-backend", title: "Backend Engineer", company: "Stripe", country: "US", category: "tech", avatarText: "S", description: "Payments correctness, idempotency, auditability — Stripe backend bar.", resumeLayout: "classic", letterLayout: "classic", styleKey: "tech", personKey: "usT", location: "San Francisco, CA", headline: "Backend Engineer · Payments" },
  { id: "bloomberg-swe", title: "Software Engineer", company: "Bloomberg", country: "US", category: "tech", avatarText: "BB", description: "Low-latency market data + C++/Java depth — Bloomberg eng screens.", resumeLayout: "compact", letterLayout: "compact", styleKey: "finance", personKey: "usF", location: "New York, NY", headline: "Software Engineer · Market Data" },
  { id: "atlassian-fullstack", title: "Full-Stack Engineer", company: "Atlassian", country: "AU", category: "tech", avatarText: "AT", description: "Product-engineering hybrid — Atlassian AU SaaS delivery style.", resumeLayout: "modern", letterLayout: "modern", styleKey: "product", personKey: "auT", location: "Sydney, NSW", headline: "Full-Stack Engineer · B2B SaaS" },
  { id: "canva-frontend", title: "Frontend Engineer", company: "Canva", country: "AU", category: "tech", avatarText: "C", description: "Canvas perf, design systems, i18n — Canva creative-tool eng style.", resumeLayout: "banner", letterLayout: "banner", styleKey: "product", personKey: "auT", location: "Sydney, NSW", headline: "Frontend Engineer · Creative Tools" },
  { id: "deepmind-research-eng", title: "Research Engineer", company: "Google DeepMind", country: "UK", category: "tech", avatarText: "DM", description: "Research–engineering hybrid: evals + production ML — DeepMind UK bar.", resumeLayout: "elegant", letterLayout: "elegant", styleKey: "tech", personKey: "ukT", location: "London, UK", headline: "Research Engineer · Machine Learning" },

  // Finance (10)
  { id: "goldman-ibd", title: "Investment Banking Analyst", company: "Goldman Sachs", country: "US", category: "finance", avatarText: "GS", description: "One-page deal-sheet density — classic bulge-bracket IBD format.", resumeLayout: "compact", letterLayout: "compact", styleKey: "finance", personKey: "usF", location: "New York, NY", headline: "Investment Banking Analyst · M&A" },
  { id: "jpm-markets", title: "Markets Analyst", company: "JPMorgan Chase", country: "US", category: "finance", avatarText: "JP", description: "Markets products + coverage metrics — JPM markets program style.", resumeLayout: "compact", letterLayout: "compact", styleKey: "finance", personKey: "usF", location: "New York, NY", headline: "Markets Analyst · Fixed Income" },
  { id: "ms-ib", title: "Investment Banking Analyst", company: "Morgan Stanley", country: "US", category: "finance", avatarText: "MS", description: "ECM/M&A hybrid deal list — Morgan Stanley IBD reverse-chron.", resumeLayout: "classic", letterLayout: "classic", styleKey: "finance", personKey: "usF", location: "New York, NY", headline: "Investment Banking Analyst · ECM" },
  { id: "blackrock-am", title: "Investment Analyst", company: "BlackRock", country: "US", category: "finance", avatarText: "BR", description: "Research process + portfolio risk language — asset manager format.", resumeLayout: "modern", letterLayout: "modern", styleKey: "finance", personKey: "usF", location: "New York, NY", headline: "Investment Analyst · Multi-Asset" },
  { id: "bofa-credit", title: "Credit Analyst", company: "Bank of America", country: "US", category: "finance", avatarText: "BA", description: "Credit memos, covenants, risk ratings — commercial banking style.", resumeLayout: "classic", letterLayout: "classic", styleKey: "finance", personKey: "usF", location: "Charlotte, NC", headline: "Credit Analyst · Commercial Banking" },
  { id: "citi-risk", title: "Risk Analyst", company: "Citi", country: "US", category: "finance", avatarText: "CI", description: "VaR, limits, regulatory reporting — markets risk program style.", resumeLayout: "technical", letterLayout: "technical", styleKey: "finance", personKey: "usF", location: "New York, NY", headline: "Risk Analyst · Market Risk" },
  { id: "hsbc-cb", title: "Corporate Banking Analyst", company: "HSBC", country: "UK", category: "finance", avatarText: "HS", description: "UK corporate banking: coverage, cash, trade — HSBC-style.", resumeLayout: "classic", letterLayout: "classic", styleKey: "finance", personKey: "ukF", location: "London, UK", headline: "Analyst · Corporate Banking" },
  { id: "barclays-markets", title: "Markets Analyst", company: "Barclays", country: "UK", category: "finance", avatarText: "BX", description: "UK markets graduate format with MiFID/best-execution awareness.", resumeLayout: "compact", letterLayout: "compact", styleKey: "finance", personKey: "ukF", location: "London, UK", headline: "Markets Analyst · Equities" },
  { id: "macquarie-ib", title: "Investment Banking Analyst", company: "Macquarie", country: "AU", category: "finance", avatarText: "MQ", description: "AU infrastructure/project finance flavor — Macquarie-style deals.", resumeLayout: "executive", letterLayout: "executive", styleKey: "finance", personKey: "auF", location: "Sydney, NSW", headline: "Analyst · Infrastructure & Energy" },
  { id: "cba-risk", title: "Credit Risk Analyst", company: "Commonwealth Bank", country: "AU", category: "finance", avatarText: "CB", description: "Major AU bank risk: portfolio monitoring and policy exceptions.", resumeLayout: "modern", letterLayout: "modern", styleKey: "finance", personKey: "auF", location: "Sydney, NSW", headline: "Credit Risk Analyst · Retail" },

  // Consulting (8)
  { id: "mckinsey-ba", title: "Business Analyst", company: "McKinsey & Company", country: "US", category: "consulting", avatarText: "Mc", description: "MBB one-pager: MECE bullets + impact metrics — McKinsey BA bar.", resumeLayout: "classic", letterLayout: "classic", styleKey: "consulting", personKey: "usC", location: "New York, NY", headline: "Business Analyst · Strategy" },
  { id: "bcg-associate", title: "Associate", company: "Boston Consulting Group", country: "US", category: "consulting", avatarText: "BC", description: "Hypothesis-driven digital/ops impact — BCG associate narrative.", resumeLayout: "classic", letterLayout: "classic", styleKey: "consulting", personKey: "usC", location: "Boston, MA", headline: "Associate · Digital & Ops" },
  { id: "bain-ac", title: "Associate Consultant", company: "Bain & Company", country: "US", category: "consulting", avatarText: "Bn", description: "PE diligence speed + results orientation — Bain AC style.", resumeLayout: "modern", letterLayout: "modern", styleKey: "consulting", personKey: "usC", location: "Chicago, IL", headline: "Associate Consultant · PE DD" },
  { id: "deloitte-so", title: "Strategy Consultant", company: "Deloitte", country: "US", category: "consulting", avatarText: "D", description: "Big-4 S&O: program delivery + change management scale.", resumeLayout: "modern", letterLayout: "modern", styleKey: "consulting", personKey: "usC", location: "New York, NY", headline: "Consultant · Strategy & Operations" },
  { id: "accenture-strategy", title: "Strategy Analyst", company: "Accenture", country: "US", category: "consulting", avatarText: "Ac", description: "Tech strategy roadmaps and business cases — Accenture style.", resumeLayout: "banner", letterLayout: "banner", styleKey: "consulting", personKey: "usC", location: "San Francisco, CA", headline: "Strategy Analyst · Technology" },
  { id: "pwc-strategy", title: "Senior Associate", company: "PwC", country: "UK", category: "consulting", avatarText: "Pw", description: "UK Strategy& storylines + regulated industries awareness.", resumeLayout: "classic", letterLayout: "classic", styleKey: "consulting", personKey: "ukC", location: "London, UK", headline: "Senior Associate · Strategy&" },
  { id: "ey-parthenon", title: "Consultant", company: "EY-Parthenon", country: "UK", category: "consulting", avatarText: "EY", description: "Commercial diligence / transaction strategy — UK EY-P style.", resumeLayout: "executive", letterLayout: "executive", styleKey: "consulting", personKey: "ukC", location: "London, UK", headline: "Consultant · Transaction Strategy" },
  { id: "kpmg-advisory", title: "Advisor", company: "KPMG", country: "AU", category: "consulting", avatarText: "KP", description: "AU deal advisory: QoE, carve-outs, mid-market diligence.", resumeLayout: "modern", letterLayout: "modern", styleKey: "consulting", personKey: "auC", location: "Melbourne, VIC", headline: "Advisor · Deal Advisory" },

  // Healthcare (7)
  { id: "mayo-rn", title: "Registered Nurse", company: "Mayo Clinic", country: "US", category: "healthcare", avatarText: "MC", description: "Clinical CV: acuity, certifications, outcomes — top US hospital nursing format.", resumeLayout: "modern", letterLayout: "modern", styleKey: "healthcare", personKey: "usH", location: "Rochester, MN", headline: "Registered Nurse · Acute Care" },
  { id: "cleveland-pa", title: "Physician Assistant", company: "Cleveland Clinic", country: "US", category: "healthcare", avatarText: "CC", description: "APP CV: volume, procedures, collaborative practice — academic health system.", resumeLayout: "classic", letterLayout: "classic", styleKey: "healthcare", personKey: "usH", location: "Cleveland, OH", headline: "Physician Assistant · Cardiology" },
  { id: "kaiser-pm", title: "Digital Health Product Manager", company: "Kaiser Permanente", country: "US", category: "healthcare", avatarText: "KP", description: "Member outcomes + compliance — integrated delivery digital PM style.", resumeLayout: "banner", letterLayout: "banner", styleKey: "product", personKey: "usH", location: "Oakland, CA", headline: "Product Manager · Digital Health" },
  { id: "pfizer-cra", title: "Clinical Research Associate", company: "Pfizer", country: "US", category: "healthcare", avatarText: "Pf", description: "Trial monitoring + GCP — large pharma research ops format.", resumeLayout: "compact", letterLayout: "compact", styleKey: "healthcare", personKey: "usH", location: "New York, NY", headline: "CRA · Oncology" },
  { id: "jnj-qa", title: "Quality Assurance Specialist", company: "Johnson & Johnson", country: "US", category: "healthcare", avatarText: "JJ", description: "CAPA, ISO 13485, audits — med device quality systems language.", resumeLayout: "classic", letterLayout: "classic", styleKey: "healthcare", personKey: "usH", location: "New Brunswick, NJ", headline: "QA Specialist · Medical Devices" },
  { id: "az-medical", title: "Medical Affairs Associate", company: "AstraZeneca", country: "UK", category: "healthcare", avatarText: "AZ", description: "UK medical affairs: scientific exchange + evidence generation.", resumeLayout: "elegant", letterLayout: "elegant", styleKey: "healthcare", personKey: "ukH", location: "Cambridge, UK", headline: "Medical Affairs · Oncology" },
  { id: "nhs-cns", title: "Clinical Nurse Specialist", company: "NHS", country: "UK", category: "healthcare", avatarText: "NH", description: "NHS service improvement + MDT pathways — banded clinical leadership CV.", resumeLayout: "modern", letterLayout: "modern", styleKey: "healthcare", personKey: "ukH", location: "London, UK", headline: "CNS · Diabetes" },

  // Engineering (7)
  { id: "tesla-me", title: "Mechanical Engineer", company: "Tesla", country: "US", category: "engineering", avatarText: "T", description: "DFM, yield, cycle time — manufacturing hardware impact style.", resumeLayout: "compact", letterLayout: "compact", styleKey: "engineering", personKey: "usE", location: "Austin, TX", headline: "Mechanical Engineer · Manufacturing" },
  { id: "boeing-systems", title: "Systems Engineer", company: "Boeing", country: "US", category: "engineering", avatarText: "B", description: "Requirements, V&V, safety — aerospace systems rigor.", resumeLayout: "technical", letterLayout: "technical", styleKey: "engineering", personKey: "usE", location: "Seattle, WA", headline: "Systems Engineer · Avionics" },
  { id: "ge-electrical", title: "Electrical Engineer", company: "GE Vernova", country: "US", category: "engineering", avatarText: "GE", description: "Power systems, protection, standards — energy OEM style.", resumeLayout: "modern", letterLayout: "modern", styleKey: "engineering", personKey: "usE", location: "Schenectady, NY", headline: "Electrical Engineer · Power Systems" },
  { id: "lockheed-se", title: "Systems Engineer", company: "Lockheed Martin", country: "US", category: "engineering", avatarText: "LM", description: "Defense integration + test — mission systems format.", resumeLayout: "compact", letterLayout: "compact", styleKey: "engineering", personKey: "usE", location: "Bethesda, MD", headline: "Systems Engineer · Defense" },
  { id: "rolls-royce-aero", title: "Aerospace Engineer", company: "Rolls-Royce", country: "UK", category: "engineering", avatarText: "RR", description: "Turbomachinery reliability + in-service support — UK OEM style.", resumeLayout: "classic", letterLayout: "classic", styleKey: "engineering", personKey: "ukE", location: "Derby, UK", headline: "Aerospace Engineer · Turbomachinery" },
  { id: "bhp-mining", title: "Mining Engineer", company: "BHP", country: "AU", category: "engineering", avatarText: "BH", description: "Safety + production + cost — major AU miner expectations.", resumeLayout: "technical", letterLayout: "technical", styleKey: "engineering", personKey: "auE", location: "Perth, WA", headline: "Mining Engineer · Open Pit" },
  { id: "riotinto-process", title: "Process Engineer", company: "Rio Tinto", country: "AU", category: "engineering", avatarText: "RT", description: "Recovery/throughput optimization — mineral processing ops tech.", resumeLayout: "modern", letterLayout: "modern", styleKey: "engineering", personKey: "auE", location: "Brisbane, QLD", headline: "Process Engineer · Mineral Processing" },

  // Legal (6)
  { id: "skadden-associate", title: "Corporate Associate", company: "Skadden", country: "US", category: "legal", avatarText: "SK", description: "BigLaw corporate: deal lists, diligence, no fluff — elite US firm style.", resumeLayout: "classic", letterLayout: "classic", styleKey: "legal", personKey: "usL", location: "New York, NY", headline: "Corporate Associate · M&A" },
  { id: "latham-ma", title: "M&A Associate", company: "Latham & Watkins", country: "US", category: "legal", avatarText: "LW", description: "PE M&A + financing coordination — Latham-style intensity.", resumeLayout: "classic", letterLayout: "classic", styleKey: "legal", personKey: "usL", location: "Los Angeles, CA", headline: "M&A Associate · Private Equity" },
  { id: "cravath-lit", title: "Litigation Associate", company: "Cravath", country: "US", category: "legal", avatarText: "Cr", description: "Complex commercial litigation matters + motion practice.", resumeLayout: "editorial", letterLayout: "editorial", styleKey: "legal", personKey: "usL", location: "New York, NY", headline: "Litigation Associate · Commercial" },
  { id: "clifford-chance", title: "Finance Associate", company: "Clifford Chance", country: "UK", category: "legal", avatarText: "CC", description: "Magic Circle banking finance: facilities, intercreditor, security.", resumeLayout: "classic", letterLayout: "classic", styleKey: "legal", personKey: "ukL", location: "London, UK", headline: "Finance Associate · Banking" },
  { id: "ao-shearman", title: "Corporate Associate", company: "A&O Shearman", country: "UK", category: "legal", avatarText: "AO", description: "UK ECM: prospectuses, listings, market regulation awareness.", resumeLayout: "elegant", letterLayout: "elegant", styleKey: "legal", personKey: "ukL", location: "London, UK", headline: "Corporate Associate · ECM" },
  { id: "kwm-au", title: "Corporate Associate", company: "King & Wood Mallesons", country: "AU", category: "legal", avatarText: "KW", description: "AU public M&A: schemes, takeovers, ASX process.", resumeLayout: "modern", letterLayout: "modern", styleKey: "legal", personKey: "auL", location: "Sydney, NSW", headline: "Corporate Associate · Public M&A" },
]

// Validate count at module load in dev
if (ROLE_DIRECTORY.length !== 50) {
  console.warn(`[role-directory] expected 50 roles, got ${ROLE_DIRECTORY.length}`)
}
