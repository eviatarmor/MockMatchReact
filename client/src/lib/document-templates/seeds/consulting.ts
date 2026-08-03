import type { RoleSeed } from "../types"

/** 8 consulting role templates — unique case/engagement achievements. */
export const CONSULTING_SEEDS: Record<string, RoleSeed> = {
  "mckinsey-ba": {
    person: {
      name: "Casey Rivera",
      email: "casey.rivera@email.com",
      phone: "+1 (312) 555-0175",
      linkedin: "in/caseyrivera",
    },
    summary:
      "Business analyst skilled at structuring ambiguous problems, building MECE analyses, and turning findings into executive-ready recommendations with quantified impact.",
    experience: [
      {
        title: "Business Analyst",
        org: "LEK Consulting",
        location: "New York, NY",
        startDate: "2023",
        endDate: "Present",
        bullets: [
          "Key responsibilities: workstream ownership on strategy cases; primary research; financial models; client workshop facilitation support.",
          "Led pricing workstream for a healthcare services client; recommendations implemented → +$28M annualized revenue.",
          "Built market-entry model for a PE portfolio company evaluating 3 geographies; shaped final go/no-go decision.",
          "Synthesized 40+ expert interviews into a clear competitive dynamics narrative for the steering committee.",
        ],
      },
      {
        title: "Associate Consultant Intern",
        org: "Bain & Company",
        location: "Chicago, IL",
        startDate: "2022",
        endDate: "2022",
        bullets: [
          "Supported due diligence cost benchmarking; identified $12M synergy opportunity later validated post-close.",
        ],
      },
    ],
    education: [
      {
        title: "B.A. Economics, magna cum laude",
        org: "Harvard University",
        location: "Cambridge, MA",
        startDate: "2019",
        endDate: "2023",
        bullets: ["Consulting group case captain; undergraduate research assistant"],
      },
    ],
    skills: [
      "Problem structuring",
      "MECE analysis",
      "Excel modeling",
      "PowerPoint storylining",
      "Primary research",
      "Client workshops",
      "Market sizing",
      "Team leadership",
    ],
    letter: {
      greeting: "Dear McKinsey & Company Recruiting,",
      paragraphs: [
        "I am applying for the Business Analyst role at McKinsey & Company. I structure ambiguous problems into MECE workstreams, pressure-test insights with data and experts, and communicate recommendations that clients implement.",
        "At LEK I led a pricing workstream that delivered $28M annualized impact and built a multi-geography market-entry model that shaped a PE portfolio company's investment decision. A Bain summer taught me the pace and standards of top-tier staffing.",
        "McKinsey's problem-solving culture and apprenticeship model are where I want to grow. I would be honored to contribute to your teams and clients.",
      ],
      closing: "Sincerely,",
    },
  },

  "bcg-associate": {
    person: {
      name: "Jordan Ellis",
      email: "jordan.ellis@email.com",
      phone: "+1 (617) 555-0140",
      linkedin: "in/jordanellis",
    },
    summary:
      "Associate consultant focused on digital and operations transformations. Hypothesis-driven, comfortable with data-heavy analyses and change-management realities on the ground.",
    experience: [
      {
        title: "Senior Associate",
        org: "Oliver Wyman",
        location: "Boston, MA",
        startDate: "2022",
        endDate: "Present",
        bullets: [
          "Key responsibilities: digital ops workstreams; process mining analyses; implementation roadmaps; junior mentoring.",
          "Led warehouse automation business case for a retailer: NPV-positive roadmap adopted; pilot sites cut pick time 22%.",
          "Used process mining on order-to-cash; identified $9M leakage from exception paths and redesigned controls.",
          "Facilitated client working sessions with frontline supervisors to ensure solutions stuck beyond the deck.",
        ],
      },
      {
        title: "Business Analyst",
        org: "Deloitte Consulting",
        location: "New York, NY",
        startDate: "2020",
        endDate: "2022",
        bullets: [
          "Supported ERP-enabled ops redesign for a manufacturing client; tracked benefits realization post go-live.",
        ],
      },
    ],
    education: [
      {
        title: "B.S. Industrial Engineering",
        org: "Northwestern University",
        location: "Evanston, IL",
        startDate: "2016",
        endDate: "2020",
        bullets: ["Tau Beta Pi; operations research projects with industry sponsors"],
      },
    ],
    skills: [
      "Operations strategy",
      "Digital transformation",
      "Process mining",
      "Business cases",
      "Change management",
      "Excel / SQL",
      "Workshop facilitation",
      "Storylining",
    ],
    letter: {
      greeting: "Dear BCG Recruiting,",
      paragraphs: [
        "I am applying for the Associate role at Boston Consulting Group. I thrive on hypothesis-driven digital and operations work—pairing rigorous analysis with the change management that makes recommendations real.",
        "At Oliver Wyman I led an automation business case whose pilots cut pick time 22%, and used process mining to uncover $9M of order-to-cash leakage. I insist on time with frontline operators so solutions survive contact with reality—not only the steering committee.",
        "BCG's impact ambition and collaborative culture are a strong fit. I would welcome the chance to discuss how I can contribute.",
      ],
      closing: "Best regards,",
    },
  },

  "bain-ac": {
    person: {
      name: "Taylor Brooks",
      email: "t.brooks.consulting@email.com",
      phone: "+1 (312) 555-0193",
      linkedin: "in/tbrooks-strategy",
    },
    summary:
      "Associate consultant with private equity diligence and results-delivery experience. Fast at building clean models, stress-testing theses, and communicating investment implications clearly.",
    experience: [
      {
        title: "Associate Consultant",
        org: "Alvarez & Marsal",
        location: "Chicago, IL",
        startDate: "2022",
        endDate: "Present",
        bullets: [
          "Key responsibilities: commercial due diligence workstreams; unit economics; customer/cohort analyses; IC-ready output for PE sponsors.",
          "Led customer diligence for a $900M software buyout; quantified net revenue retention risks that adjusted bid by ~0.8× ARR.",
          "Built bottoms-up TAM model later reused across 5 consecutive deals in the same vertical.",
          "Supported 100-day value creation plan post-close; tracked KPI baseline and early initiatives.",
        ],
      },
      {
        title: "Analyst",
        org: "GTCR (portfolio ops support)",
        location: "Chicago, IL",
        startDate: "2020",
        endDate: "2022",
        bullets: [
          "Supported portfolio company pricing project; +4 pts gross margin in pilot segment within two quarters.",
        ],
      },
    ],
    education: [
      {
        title: "B.B.A. Finance",
        org: "University of Michigan (Ross)",
        location: "Ann Arbor, MI",
        startDate: "2016",
        endDate: "2020",
        bullets: ["Private equity club; case competition winner"],
      },
    ],
    skills: [
      "Commercial due diligence",
      "Unit economics",
      "PE value creation",
      "Excel modeling",
      "PowerPoint",
      "Customer research",
      "TAM / market sizing",
      "Results orientation",
    ],
    letter: {
      greeting: "Dear Bain & Company Recruiting,",
      paragraphs: [
        "I am applying for the Associate Consultant role at Bain & Company. I move quickly on PE diligence and results delivery—clean analysis, honest risk flags, and recommendations sponsors can underwrite.",
        "At Alvarez & Marsal I led customer diligence on a $900M software deal that adjusted valuation for NRR risk, and built a TAM approach reused across a vertical. Portfolio work with GTCR showed me how pricing and ops initiatives convert diligence insights into margin.",
        "Bain's results orientation and PE franchise are an excellent fit for my trajectory. Thank you for your consideration.",
      ],
      closing: "Sincerely,",
    },
  },

  "deloitte-so": {
    person: {
      name: "Morgan Diaz",
      email: "morgan.diaz@email.com",
      phone: "+1 (212) 555-0167",
      linkedin: "in/morgandiaz",
    },
    summary:
      "Strategy & operations consultant delivering large-scale program design, change management, and measurable operating improvements for enterprise clients.",
    experience: [
      {
        title: "Consultant — Strategy & Operations",
        org: "Accenture Strategy",
        location: "New York, NY",
        startDate: "2021",
        endDate: "Present",
        bullets: [
          "Key responsibilities: operating model design; program PMO for multi-workstream transformations; benefits tracking; stakeholder management.",
          "Led shared-services redesign for a Fortune 100 client consolidating 7 regional hubs → $41M run-rate savings.",
          "Stood up benefits realization office; verified 92% of claimed savings within first year.",
          "Coached client managers through RACI and process ownership changes; reduced decision latency on critical path.",
        ],
      },
      {
        title: "Analyst",
        org: "Capgemini Invent",
        location: "Chicago, IL",
        startDate: "2019",
        endDate: "2021",
        bullets: [
          "Supported supply chain network redesign; modeled service-level vs. cost trade-offs for executive decision.",
        ],
      },
    ],
    education: [
      {
        title: "B.S. Business Administration",
        org: "Indiana University (Kelley)",
        location: "Bloomington, IN",
        startDate: "2015",
        endDate: "2019",
        bullets: ["Supply chain major; consulting workshop"],
      },
    ],
    skills: [
      "Operating model design",
      "Program management",
      "Change management",
      "Benefits realization",
      "Process redesign",
      "Stakeholder management",
      "Excel",
      "PowerPoint",
    ],
    letter: {
      greeting: "Dear Deloitte Strategy & Operations Recruiting,",
      paragraphs: [
        "I am applying for the Strategy Consultant role at Deloitte. I deliver large-scale operating model and transformation programs—designing the future state and making sure benefits show up in the P&L.",
        "At Accenture Strategy I led a shared-services consolidation worth $41M run-rate and built a benefits office that verified 92% of claimed savings. I partner closely with client managers so RACI and process changes stick after the consultants leave.",
        "Deloitte's S&O scale and industry depth are where I want to grow. I would welcome a conversation about contributing to your teams.",
      ],
      closing: "Sincerely,",
    },
  },

  "accenture-strategy": {
    person: {
      name: "Aisha Rahman",
      email: "aisha.rahman@email.com",
      phone: "+1 (415) 555-0121",
      linkedin: "in/aisharahman",
    },
    summary:
      "Technology strategy analyst who builds business cases, roadmaps, and architecture-aware recommendations that connect tech investment to measurable business outcomes.",
    experience: [
      {
        title: "Strategy Analyst — Technology",
        org: "Slalom",
        location: "San Francisco, CA",
        startDate: "2022",
        endDate: "Present",
        bullets: [
          "Key responsibilities: tech strategy roadmaps; cloud migration business cases; vendor evaluations; executive storytelling.",
          "Built 5-year cloud TCO model for a fintech client; approved $60M migration investment with staged risk gates.",
          "Led API platform strategy that cut integration lead time estimates 40% for partner onboarding.",
          "Facilitated architecture decision records with engineering leaders to align strategy with delivery reality.",
        ],
      },
      {
        title: "Technology Consultant",
        org: "IBM Consulting",
        location: "San Jose, CA",
        startDate: "2020",
        endDate: "2022",
        bullets: [
          "Supported data platform modernization roadmap; prioritized use cases by value and feasibility.",
        ],
      },
    ],
    education: [
      {
        title: "B.S. Computer Science + Business minor",
        org: "University of California, Berkeley",
        location: "Berkeley, CA",
        startDate: "2016",
        endDate: "2020",
        bullets: ["Management of technology coursework"],
      },
    ],
    skills: [
      "Technology strategy",
      "Business cases / TCO",
      "Cloud migration planning",
      "Roadmapping",
      "Vendor evaluation",
      "Architecture awareness",
      "Workshop facilitation",
      "Executive communication",
    ],
    letter: {
      greeting: "Dear Accenture Strategy Recruiting,",
      paragraphs: [
        "I am applying for the Strategy Analyst role at Accenture. I connect technology choices to business cases and roadmaps that executives can fund—and engineers can deliver.",
        "At Slalom I built a staged $60M cloud TCO case for a fintech client and led API platform strategy that improved partner integration timelines. I facilitate decision records so strategy does not float free of architecture constraints.",
        "Accenture's technology strategy work at enterprise scale is the environment I want. Thank you for considering my application.",
      ],
      closing: "Best regards,",
    },
  },

  "pwc-strategy": {
    person: {
      name: "Sophie Hale",
      email: "sophie.hale@email.com",
      phone: "+44 20 7946 0456",
      linkedin: "in/sophiehale",
    },
    summary:
      "UK strategy consultant with experience in regulated industries. Builds clear storylines, robust analyses, and recommendations that stand up to governance and risk scrutiny.",
    experience: [
      {
        title: "Senior Associate — Strategy",
        org: "PA Consulting",
        location: "London, UK",
        startDate: "2021",
        endDate: "Present",
        bullets: [
          "Key responsibilities: strategy projects for FS and public sector; regulatory impact assessments; board-level storylines.",
          "Led open-banking product strategy for a mid-tier bank; roadmap approved by board risk committee.",
          "Quantified operational resilience investment needs under UK regulatory expectations; prioritised £35M portfolio.",
          "Mentored 2 analysts on storylining and quality control for client deliverables.",
        ],
      },
      {
        title: "Analyst",
        org: "Oliver Wyman",
        location: "London, UK",
        startDate: "2019",
        endDate: "2021",
        bullets: [
          "Supported insurance strategy cases; built claims cost benchmarks used in pricing reviews.",
        ],
      },
    ],
    education: [
      {
        title: "B.A. Philosophy, Politics and Economics",
        org: "University of Oxford",
        location: "Oxford, UK",
        startDate: "2016",
        endDate: "2019",
        bullets: ["First Class Honours"],
      },
    ],
    skills: [
      "Strategy development",
      "Regulated industries (FS)",
      "Storylining",
      "Financial analysis",
      "Stakeholder management",
      "Risk & resilience awareness",
      "Workshop design",
      "PowerPoint / Excel",
    ],
    letter: {
      greeting: "Dear PwC Strategy& Recruiting,",
      paragraphs: [
        "I am applying for the Senior Associate role in Strategy& at PwC. I deliver strategy in regulated UK environments—where recommendations must be commercially sharp and governable.",
        "At PA Consulting I led an open-banking product strategy through board risk approval and prioritised a £35M operational resilience portfolio under regulatory expectations. Earlier at Oliver Wyman I built insurance benchmarks that informed pricing decisions.",
        "Strategy&'s combination of strategy craft and PwC's regulated-industry depth is a compelling fit. I would welcome the opportunity to contribute in London.",
      ],
      closing: "Yours sincerely,",
    },
  },

  "ey-parthenon": {
    person: {
      name: "James Whitfield",
      email: "james.whitfield@email.com",
      phone: "+44 20 7946 0710",
      linkedin: "in/jameswhitfield",
    },
    summary:
      "Transaction strategy consultant focused on commercial diligence and carve-out readiness. Delivers sponsor-ready insights on markets, customers, and standalone cost structures.",
    experience: [
      {
        title: "Consultant — Transaction Strategy",
        org: "FTI Consulting",
        location: "London, UK",
        startDate: "2021",
        endDate: "Present",
        bullets: [
          "Key responsibilities: commercial DD; carve-out TSAs; standalone cost models; vendor discussions for mid-market deals.",
          "Led commercial diligence on a £400M industrial services deal; identified customer concentration risk that re-cut earnout structure.",
          "Built carve-out cost model and TSA term sheet used in SPA negotiations within 3-week sprint.",
          "Supported sell-side equity story for a software carve-out; contributed to successful auction with 6 final-round bidders.",
        ],
      },
      {
        title: "Associate",
        org: "Duff & Phelps (Kroll)",
        location: "London, UK",
        startDate: "2019",
        endDate: "2021",
        bullets: [
          "Supported valuations and commercial analyses for dispute and transaction contexts.",
        ],
      },
    ],
    education: [
      {
        title: "B.Sc. Economics",
        org: "University of Manchester",
        location: "Manchester, UK",
        startDate: "2016",
        endDate: "2019",
        bullets: ["First Class; investment society president"],
      },
    ],
    skills: [
      "Commercial due diligence",
      "Carve-outs / TSAs",
      "Standalone costing",
      "Market analysis",
      "Excel modeling",
      "Deal process",
      "Equity story support",
      "Client communication",
    ],
    letter: {
      greeting: "Dear EY-Parthenon Recruiting,",
      paragraphs: [
        "I am applying for the Consultant role at EY-Parthenon. I focus on transaction strategy—commercial diligence, carve-out readiness, and analyses that change how deals are structured.",
        "At FTI I led commercial DD that reshaped earnout terms on a £400M industrial deal and delivered carve-out cost/TSA materials in a three-week sprint. Sell-side equity story support helped drive a competitive auction process.",
        "EY-Parthenon's transaction strategy franchise is where I want to deepen this craft. Thank you for your consideration.",
      ],
      closing: "Yours sincerely,",
    },
  },

  "kpmg-advisory": {
    person: {
      name: "Zoe Mitchell",
      email: "zoe.mitchell@email.com",
      phone: "+61 3 5550 1100",
      linkedin: "in/zoemitchell",
    },
    summary:
      "Deal advisory professional with Australian mid-market QoE, carve-out, and diligence experience. Clear written work, strong Excel, and calm coordination under tight bid timelines.",
    experience: [
      {
        title: "Advisor — Deal Advisory",
        org: "Deloitte Australia",
        location: "Melbourne, VIC",
        startDate: "2021",
        endDate: "Present",
        bullets: [
          "Key responsibilities: quality of earnings analyses; net working capital; carve-out financials; vendor assistance.",
          "Led QoE on A$280M industrial services buy-side; adjusted EBITDA bridges accepted by both sponsor and lenders.",
          "Built carve-out P&L and NWC pegs for a division sale; closed with no post-close working-capital dispute.",
          "Managed junior team of 2 on concurrent live deals without missed deliverable deadlines.",
        ],
      },
      {
        title: "Graduate — Audit / Deal secondment",
        org: "PwC Australia",
        location: "Melbourne, VIC",
        startDate: "2019",
        endDate: "2021",
        bullets: [
          "Audit rotations in industrials; seconded to deals team for two QoE engagements.",
        ],
      },
    ],
    education: [
      {
        title: "B.Com Accounting / Finance",
        org: "Monash University",
        location: "Melbourne, VIC",
        startDate: "2016",
        endDate: "2018",
        bullets: ["First Class Honours pathway; CA candidate"],
      },
    ],
    skills: [
      "Quality of earnings",
      "Net working capital",
      "Carve-out financials",
      "Excel",
      "Financial analysis",
      "Deal process",
      "Vendor assistance",
      "Team leadership",
    ],
    certifications: [
      {
        name: "CA ANZ Candidate",
        issuer: "Chartered Accountants Australia and New Zealand",
        date: "2024",
      },
    ],
    letter: {
      greeting: "Dear KPMG Deal Advisory Hiring Team,",
      paragraphs: [
        "I am applying for the Advisor role in Deal Advisory at KPMG. I deliver QoE, NWC, and carve-out analyses that sponsors and lenders can rely on under Australian mid-market timelines.",
        "At Deloitte I led a A$280M QoE with EBITDA bridges accepted by both sides of the table, and carved out financials for a division sale that closed without working-capital dispute. I manage juniors carefully so concurrent deals still hit every deadline.",
        "KPMG's deal advisory platform in Australia is a strong next step. I would welcome the chance to contribute from Melbourne.",
      ],
      closing: "Kind regards,",
    },
  },
}
