import type { RoleTemplateCategory, SeedEducation, SeedExperience, TemplateCountry } from "./types"

/** Shared, research-informed content patterns by industry. */
export function industrySummary(category: RoleTemplateCategory, title: string): string {
  switch (category) {
    case "tech":
      return `${title} with a track record of shipping reliable software, collaborating across product and infrastructure, and measuring impact with clear metrics.`
    case "finance":
      return `${title} with strong analytical rigor, client-ready communication, and experience operating in high-stakes, deadline-driven environments.`
    case "consulting":
      return `${title} skilled at structuring ambiguous problems, driving workstreams, and translating analysis into executive-ready recommendations.`
    case "healthcare":
      return `${title} focused on patient outcomes, safety, and interdisciplinary collaboration in complex care or life-sciences settings.`
    case "engineering":
      return `${title} with hands-on technical ownership, safety-minded execution, and measurable improvements to cost, quality, or throughput.`
    case "legal":
      return `${title} with strong drafting and diligence skills, matter management experience, and a track record of client-focused execution.`
  }
}

export function industryExperience(
  category: RoleTemplateCategory,
  company: string,
  title: string,
  country: TemplateCountry
): SeedExperience[] {
  const loc =
    country === "US"
      ? "United States"
      : country === "UK"
        ? "United Kingdom"
        : "Australia"
  const prior = priorEmployer(category, country)

  switch (category) {
    case "tech":
      return [
        {
          title,
          org: prior,
          location: loc,
          startDate: "2021",
          endDate: "Present",
          bullets: [
            `Owned critical services supporting ${company}-scale reliability expectations; improved p99 latency and reduced Sev-2 noise.`,
            "Partnered with product on roadmap trade-offs; shipped 3 major features with measurable adoption.",
            "Raised engineering bar via design docs, code review standards, and mentoring.",
          ],
        },
        {
          title: "Software Engineer",
          org: prior.replace(/ .*/, "") + " Labs",
          location: loc,
          startDate: "2019",
          endDate: "2021",
          bullets: ["Built internal platforms that cut delivery lead time ~30%."],
        },
      ]
    case "finance":
      return [
        {
          title,
          org: prior,
          location: loc,
          startDate: "2022",
          endDate: "Present",
          bullets: [
            `Executed high-visibility workstreams aligned to ${company} coverage standards (models, memos, and client materials).`,
            "Built Excel/Python analyses used in live decisions; flagged risks early.",
            "Managed stakeholder timelines across product, risk, and senior coverage.",
          ],
        },
        {
          title: "Analyst",
          org: prior + " Internship",
          location: loc,
          startDate: "2021",
          endDate: "2021",
          bullets: ["Supported live processes and produced board-ready slides under tight deadlines."],
        },
      ]
    case "consulting":
      return [
        {
          title,
          org: prior,
          location: loc,
          startDate: "2022",
          endDate: "Present",
          bullets: [
            `Led analysis modules for strategy engagements comparable to ${company} staffing models.`,
            "Synthesized primary + secondary research into clear recommendations with quantified impact.",
            "Facilitated client workshops and coached junior teammates.",
          ],
        },
        {
          title: "Business Analyst",
          org: prior,
          location: loc,
          startDate: "2020",
          endDate: "2022",
          bullets: ["Owned slide storylines and model QA for multi-workstream cases."],
        },
      ]
    case "healthcare":
      return [
        {
          title,
          org: prior,
          location: loc,
          startDate: "2021",
          endDate: "Present",
          bullets: [
            `Delivered clinical/operational outcomes consistent with ${company}-caliber quality and safety standards.`,
            "Improved a pathway or protocol with measurable patient or quality impact.",
            "Collaborated across multidisciplinary teams and documentation systems.",
          ],
        },
        {
          title: juniorTitle(category),
          org: prior,
          location: loc,
          startDate: "2019",
          endDate: "2021",
          bullets: ["Built foundational expertise and earned advanced credentials/training."],
        },
      ]
    case "engineering":
      return [
        {
          title,
          org: prior,
          location: loc,
          startDate: "2021",
          endDate: "Present",
          bullets: [
            `Drove design/process improvements meeting ${company}-style safety, quality, and production expectations.`,
            "Owned root-cause investigations with cross-functional partners; closed corrective actions on time.",
            "Used CAD/analysis tools to de-risk launches and improve yield or cycle time.",
          ],
        },
        {
          title: "Engineer",
          org: prior,
          location: loc,
          startDate: "2019",
          endDate: "2021",
          bullets: ["Supported prototype builds, testing, and manufacturing handoff."],
        },
      ]
    case "legal":
      return [
        {
          title,
          org: prior,
          location: loc,
          startDate: "2022",
          endDate: "Present",
          bullets: [
            `Managed workstreams on matters comparable to ${company} associate staffing (diligence, drafting, coordination).`,
            "Drafted and revised core documents under partner supervision; owned closing checklists.",
            "Coordinated multi-party processes and external counsel/vendor timelines.",
          ],
        },
        {
          title: "Summer Associate / Trainee",
          org: prior,
          location: loc,
          startDate: "2021",
          endDate: "2021",
          bullets: ["Research memos and diligence support on live deals/matters."],
        },
      ]
  }
}

export function industryEducation(
  category: RoleTemplateCategory,
  country: TemplateCountry
): SeedEducation[] {
  const schools: Record<TemplateCountry, [string, string, string]> = {
    US: ["United States", "Top US university", "2015"],
    UK: ["United Kingdom", "Russell Group university", "2015"],
    AU: ["Australia", "Group of Eight university", "2015"],
  }
  const [location, school] = [schools[country][0], schools[country][1]]
  const degree =
    category === "legal"
      ? country === "US"
        ? "J.D."
        : country === "UK"
          ? "LLB / LPC"
          : "J.D."
      : category === "healthcare"
        ? "B.S. / clinical degree"
        : category === "finance" || category === "consulting"
          ? "B.S. Economics / Business"
          : category === "engineering"
            ? "B.S. Engineering"
            : "B.S. Computer Science"

  return [
    {
      title: degree,
      org: school,
      location,
      startDate: "2015",
      endDate: "2019",
      bullets: ["Relevant coursework and leadership activities"],
    },
  ]
}

export function industrySkills(category: RoleTemplateCategory): string[] {
  switch (category) {
    case "tech":
      return ["System design", "Python", "TypeScript", "Cloud", "SQL", "APIs", "Testing", "Agile"]
    case "finance":
      return ["Financial modeling", "Excel", "PowerPoint", "Valuation", "Risk analysis", "Client coverage"]
    case "consulting":
      return ["Problem solving", "Storylining", "Excel", "PowerPoint", "Stakeholder management", "Research"]
    case "healthcare":
      return ["Clinical excellence", "Patient safety", "Documentation", "Interdisciplinary care", "Quality improvement"]
    case "engineering":
      return ["CAD", "DFM", "Root cause", "Safety", "Testing", "Cross-functional delivery"]
    case "legal":
      return ["Drafting", "Due diligence", "Legal research", "Matter management", "Client service", "Negotiation support"]
  }
}

function juniorTitle(category: RoleTemplateCategory): string {
  if (category === "healthcare") return "Staff Clinician / Associate"
  if (category === "legal") return "Junior Associate"
  return "Associate"
}

function priorEmployer(category: RoleTemplateCategory, country: TemplateCountry): string {
  const map: Record<RoleTemplateCategory, Record<TemplateCountry, string>> = {
    tech: { US: "Northstar Cloud", UK: "Helix Systems", AU: "Workloop" },
    finance: { US: "Horizon Capital", UK: "Thames Markets", AU: "Southern Cross Advisory" },
    consulting: { US: "Summit Strategy Group", UK: "Albion Strategy", AU: "Southern Deal Advisory" },
    healthcare: { US: "Midwest Health System", UK: "London University Hospitals NHS Trust", AU: "Harbour Health" },
    engineering: { US: "VoltWorks Manufacturing", UK: "Meridian Aero", AU: "Outback Resources" },
    legal: { US: "Metro Corporate LLP", UK: "City Finance Solicitors", AU: "Harbour Corporate Law" },
  }
  return map[category][country]
}

export function letterParagraphs(
  category: RoleTemplateCategory,
  title: string,
  company: string
): { greeting: string; paragraphs: string[]; closing: string } {
  const openers: Record<RoleTemplateCategory, string> = {
    tech: `I'm writing to apply for the ${title} role at ${company}. I build reliable software and care deeply about measurable product and systems impact.`,
    finance: `I'm applying for the ${title} position at ${company}. I thrive in analytical, high-standards environments where precision and judgment matter.`,
    consulting: `I'm excited to apply for the ${title} role at ${company}. I enjoy structuring ambiguous problems and turning analysis into decisions clients can act on.`,
    healthcare: `I'm applying for the ${title} role at ${company}. I'm motivated by high-quality care, safety, and continuous improvement in complex health systems.`,
    engineering: `I'm writing to apply for the ${title} role at ${company}. I bring hands-on engineering ownership with a bias to safety, quality, and throughput.`,
    legal: `I'm applying for the ${title} position at ${company}. I am a careful drafter and organizer who thrives on complex, multi-party matters.`,
  }
  const middles: Record<RoleTemplateCategory, string> = {
    tech: "Recently I owned services end-to-end—improving latency and reliability while partnering closely with product. I write clear design docs, raise the quality bar in review, and mentor teammates.",
    finance: "In my current role I deliver client-ready models and materials under tight timelines, surface risks early, and communicate crisply with senior stakeholders.",
    consulting: "I have led analysis modules, synthesized primary research, and facilitated workshops that moved clients from insight to action with quantified impact.",
    healthcare: "I have improved pathways and protocols with measurable quality outcomes while collaborating across multidisciplinary teams and modern clinical systems.",
    engineering: "I have driven design and process improvements that reduced defects or cycle time, closed corrective actions, and partnered across manufacturing, quality, and design.",
    legal: "I have managed diligence and drafting workstreams, kept closing checklists tight, and coordinated internal and external parties without dropping details.",
  }
  const closes: Record<RoleTemplateCategory, string> = {
    tech: `${company}'s engineering culture and product ambition are a strong fit for how I work. I would welcome the chance to contribute to your team.`,
    finance: `${company}'s reputation for excellence and client impact is exactly the environment I want to grow in. Thank you for your consideration.`,
    consulting: `I admire ${company}'s problem-solving standards and client impact. I would be energized to bring that same rigor to your teams.`,
    healthcare: `${company}'s commitment to quality and patients aligns with my values. I would be proud to contribute on your team.`,
    engineering: `${company}'s technical bar and operational excellence are a compelling match. I hope to discuss how I can help.`,
    legal: `${company}'s matters and training model are a strong fit for my development goals. I appreciate your time and consideration.`,
  }
  return {
    greeting: "Dear Hiring Manager,",
    paragraphs: [openers[category], middles[category], closes[category]],
    closing: "Sincerely,",
  }
}
