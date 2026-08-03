import type { RoleSeed } from "../types"

/** 10 finance role templates — unique deal/coverage achievements per firm. */
export const FINANCE_SEEDS: Record<string, RoleSeed> = {
  "goldman-ibd": {
    person: {
      name: "Nathan Cole",
      email: "nathan.cole@email.com",
      phone: "+1 (212) 555-0148",
      linkedin: "in/nathancole",
    },
    summary:
      "Investment banking analyst with live M&A and financing experience. Builds client-ready models and materials under tight timelines; comfortable with diligence coordination and senior stakeholder communication.",
    experience: [
      {
        title: "Investment Banking Analyst",
        org: "Jefferies",
        location: "New York, NY",
        startDate: "2023",
        endDate: "Present",
        bullets: [
          "Key responsibilities: financial modeling (LBO, DCF, accretion/dilution); CIM/management presentation drafting; diligence trackers; process management for sell-side and buy-side mandates.",
          "Executed sell-side M&A for a $1.2B enterprise software target: built full model suite, buyer list, and process calendar; deal closed at 14.2× EBITDA.",
          "Supported 2 live financing processes totaling $800M (HY + TLB); owned comps and sensitivity decks for lender meetings.",
          "Built automated comps workbook cutting weekly update time from 6 hours to 90 minutes.",
        ],
      },
      {
        title: "Investment Banking Summer Analyst",
        org: "Lazard",
        location: "New York, NY",
        startDate: "2022",
        endDate: "2022",
        bullets: [
          "Supported restructuring pitch materials and creditor recovery analysis for a multi-tranche capital structure.",
          "Prepared board-level slides used in a live strategic review engagement.",
        ],
      },
    ],
    education: [
      {
        title: "B.S. Economics, Finance concentration",
        org: "University of Pennsylvania (Wharton)",
        location: "Philadelphia, PA",
        startDate: "2019",
        endDate: "2023",
        bullets: ["GPA 3.7/4.0; Wharton Finance Club; M&A case competition finalist"],
      },
    ],
    skills: [
      "Financial modeling",
      "M&A process",
      "Valuation (DCF, comps, LBO)",
      "Excel",
      "PowerPoint",
      "Due diligence coordination",
      "Capital markets basics",
      "Client materials",
    ],
    letter: {
      greeting: "Dear Goldman Sachs IBD Recruiting,",
      paragraphs: [
        "I am applying for the Investment Banking Analyst role at Goldman Sachs. I deliver precise models and client-ready materials under live deal pressure, and I want to grow that craft at a firm known for the highest standards in M&A and financing.",
        "At Jefferies I have executed a closed $1.2B sell-side process and supported $800M of financings—owning model suites, process trackers, and lender materials. I also built tooling that compressed weekly comps updates from hours to minutes so seniors could spend time on judgment, not formatting.",
        "Goldman's franchise and training model are the environment I want. Thank you for considering my application; I would welcome the chance to discuss how I can contribute on day one.",
      ],
      closing: "Sincerely,",
    },
  },

  "jpm-markets": {
    person: {
      name: "Samira Haddad",
      email: "samira.haddad@email.com",
      phone: "+1 (212) 555-0172",
      linkedin: "in/samirahaddad",
    },
    summary:
      "Markets analyst with fixed-income product and coverage experience. Strong quantitative communication, risk awareness, and comfort with fast-moving client and desk workflows.",
    experience: [
      {
        title: "Markets Analyst — Fixed Income",
        org: "Barclays",
        location: "New York, NY",
        startDate: "2023",
        endDate: "Present",
        bullets: [
          "Key responsibilities: coverage support for institutional rates clients; daily market commentary; inventory and risk snapshot packs for desk heads.",
          "Built Python tool aggregating TRACE/pricing data into client color notes; used by 8 salespeople daily.",
          "Supported $4B+ notional client flows during volatile FOMC weeks with accurate P&L attribution packs.",
          "Partnered with risk on limit utilization dashboards reducing end-of-day manual checks 50%.",
        ],
      },
      {
        title: "Markets Summer Analyst",
        org: "Citigroup",
        location: "New York, NY",
        startDate: "2022",
        endDate: "2022",
        bullets: [
          "Rotated through credit trading and e-trading; delivered research note on IG supply calendar dynamics.",
        ],
      },
    ],
    education: [
      {
        title: "B.A. Mathematics & Economics",
        org: "Columbia University",
        location: "New York, NY",
        startDate: "2019",
        endDate: "2023",
        bullets: ["Quantitative finance coursework; Women in Markets society"],
      },
    ],
    skills: [
      "Fixed income products",
      "Python",
      "Excel / VBA",
      "Market data (Bloomberg)",
      "Risk metrics basics",
      "Client coverage",
      "Written market color",
      "PowerPoint",
    ],
    letter: {
      greeting: "Dear JPMorgan Markets Recruiting,",
      paragraphs: [
        "I am applying for the Markets Analyst role at JPMorgan Chase. I thrive in fast-moving fixed-income coverage: turning market data into client-ready color, supporting flow, and staying sharp on risk.",
        "At Barclays I support institutional rates coverage—building Python tools for daily client notes, delivering accurate P&L packs through volatile FOMC periods, and partnering with risk on clearer limit dashboards. My summer at Citi confirmed that markets is where my quantitative and communication strengths meet.",
        "JPMorgan's markets franchise is a premier place to develop. I would be excited to contribute to your team with urgency, accuracy, and client focus.",
      ],
      closing: "Best regards,",
    },
  },

  "ms-ib": {
    person: {
      name: "Evan Zhou",
      email: "evan.zhou@email.com",
      phone: "+1 (212) 555-0136",
      linkedin: "in/evanzhou",
    },
    summary:
      "IBD analyst with ECM and M&A hybrid experience. Strong at equity story development, valuation materials, and coordinating multi-workstream processes with equity capital markets partners.",
    experience: [
      {
        title: "Investment Banking Analyst",
        org: "UBS",
        location: "New York, NY",
        startDate: "2023",
        endDate: "Present",
        bullets: [
          "Key responsibilities: ECM pitch materials; IPO readiness workstreams; M&A sell-side modeling; syndicate process support.",
          "Supported $650M IPO: owned financial model bridge, S-1 data tables QA, and roadshow Q&A binders.",
          "Built peer valuation and sum-of-parts for a dual-track process that led to a strategic sale at premium to IPO range.",
          "Coordinated diligence virtual data room with 40+ workstreams and weekly status for senior bankers.",
        ],
      },
      {
        title: "Summer Analyst — IBD",
        org: "Deutsche Bank",
        location: "New York, NY",
        startDate: "2022",
        endDate: "2022",
        bullets: [
          "Prepared ECM case study materials and comparable IPO aftermarket analyses for coverage pitches.",
        ],
      },
    ],
    education: [
      {
        title: "B.S. Finance",
        org: "New York University (Stern)",
        location: "New York, NY",
        startDate: "2019",
        endDate: "2023",
        bullets: ["Stern Investment Analysis Group; Dean's List"],
      },
    ],
    skills: [
      "ECM process",
      "IPO readiness",
      "Valuation",
      "Financial modeling",
      "Excel",
      "PowerPoint",
      "VDR / diligence",
      "Equity story development",
    ],
    letter: {
      greeting: "Dear Morgan Stanley IBD Recruiting,",
      paragraphs: [
        "I am applying for the Investment Banking Analyst role at Morgan Stanley. I bring live ECM and dual-track M&A experience—building equity stories, rigorous models, and process discipline that senior bankers can trust.",
        "At UBS I supported a $650M IPO (model bridges, S-1 table QA, roadshow binders) and valuation work on a dual-track process that closed strategically above the IPO range. I am comfortable juggling diligence trackers, syndicate timelines, and last-minute client changes without losing accuracy.",
        "Morgan Stanley's ECM and M&A franchise is where I want to develop. Thank you for your consideration.",
      ],
      closing: "Sincerely,",
    },
  },

  "blackrock-am": {
    person: {
      name: "Grace Okonkwo",
      email: "grace.okonkwo@email.com",
      phone: "+1 (212) 555-0155",
      linkedin: "in/graceokonkwo",
    },
    summary:
      "Investment analyst with multi-asset research experience. Combines fundamental analysis, portfolio risk language, and clear investment memos for PMs and risk partners.",
    experience: [
      {
        title: "Investment Analyst",
        org: "T. Rowe Price",
        location: "Baltimore, MD",
        startDate: "2022",
        endDate: "Present",
        bullets: [
          "Key responsibilities: coverage of 12 global consumer names; earnings models; investment memos; risk factor commentary for PMs.",
          "Initiated coverage leading to a high-conviction add; position contributed +85 bps vs. benchmark over 9 months.",
          "Built factor exposure dashboard (Python) used in monthly risk reviews across the multi-asset sleeve.",
          "Presented quarterly thesis updates to investment committee; two ideas scaled into model portfolio.",
        ],
      },
      {
        title: "Research Associate",
        org: "Morningstar",
        location: "Chicago, IL",
        startDate: "2020",
        endDate: "2022",
        bullets: [
          "Authored equity research notes on mid-cap industrials; maintained valuation frameworks for 25 names.",
        ],
      },
    ],
    education: [
      {
        title: "B.S. Finance",
        org: "University of Michigan (Ross)",
        location: "Ann Arbor, MI",
        startDate: "2016",
        endDate: "2020",
        bullets: ["CFA Level II candidate; investment club portfolio manager"],
      },
    ],
    skills: [
      "Equity research",
      "Financial modeling",
      "Portfolio risk concepts",
      "Python",
      "Bloomberg",
      "Investment writing",
      "Factor analysis basics",
      "Excel",
    ],
    certifications: [
      {
        name: "CFA Level II Candidate",
        issuer: "CFA Institute",
        date: "2025",
      },
    ],
    letter: {
      greeting: "Dear BlackRock Recruiting,",
      paragraphs: [
        "I am applying for the Investment Analyst role at BlackRock. I combine fundamental research with portfolio-aware risk thinking—and I write memos that PMs can act on.",
        "At T. Rowe Price I cover global consumer equities: one high-conviction initiation added ~85 bps versus benchmark over nine months, and my factor dashboard became part of monthly multi-asset risk reviews. Earlier at Morningstar I built disciplined valuation frameworks across industrials coverage.",
        "BlackRock's scale, risk culture, and multi-asset platform are a strong fit for how I want to grow as an investor. I would welcome the opportunity to contribute.",
      ],
      closing: "Sincerely,",
    },
  },

  "bofa-credit": {
    person: {
      name: "Marcus Hale",
      email: "marcus.hale@email.com",
      phone: "+1 (704) 555-0129",
      linkedin: "in/marcushale",
    },
    summary:
      "Credit analyst experienced in commercial lending analysis, covenant monitoring, and clear risk ratings. Writes credit memos that balance relationship context with disciplined underwriting.",
    experience: [
      {
        title: "Credit Analyst",
        org: "Wells Fargo",
        location: "Charlotte, NC",
        startDate: "2022",
        endDate: "Present",
        bullets: [
          "Key responsibilities: underwriting middle-market credits ($25–150M); annual reviews; covenant monitoring; risk rating recommendations.",
          "Authored 40+ credit approval memos; 100% of recommended structures approved by credit committee with minor conditions.",
          "Identified early covenant stress on a manufacturing borrower; structured amendment that avoided default while protecting recovery.",
          "Built portfolio heat-map of industry risk concentrations used by regional coverage heads.",
        ],
      },
      {
        title: "Credit Analyst Intern",
        org: "PNC Financial Services",
        location: "Pittsburgh, PA",
        startDate: "2021",
        endDate: "2021",
        bullets: [
          "Supported commercial real estate underwriting packages and rent-roll diligence.",
        ],
      },
    ],
    education: [
      {
        title: "B.S. Finance",
        org: "University of North Carolina at Chapel Hill",
        location: "Chapel Hill, NC",
        startDate: "2018",
        endDate: "2022",
        bullets: ["Kenan-Flagler; commercial banking club"],
      },
    ],
    skills: [
      "Credit analysis",
      "Financial statement analysis",
      "Covenant monitoring",
      "Risk ratings",
      "Credit memos",
      "Excel",
      "Industry research",
      "Relationship banking support",
    ],
    letter: {
      greeting: "Dear Bank of America Credit Recruiting,",
      paragraphs: [
        "I am applying for the Credit Analyst role at Bank of America. I underwrite and monitor commercial credits with disciplined analysis—and I escalate early when risk changes, not after covenants break.",
        "At Wells Fargo I have written 40+ credit memos for middle-market facilities, secured committee approvals with clean recommendations, and structured a proactive amendment that protected recovery for a stressed manufacturer. I also built industry heat-maps that help coverage leaders see concentration risk clearly.",
        "Bank of America's commercial franchise and risk culture are where I want to deepen my credit craft. Thank you for your consideration.",
      ],
      closing: "Sincerely,",
    },
  },

  "citi-risk": {
    person: {
      name: "Elena Vasquez",
      email: "elena.vasquez@email.com",
      phone: "+1 (212) 555-0181",
      linkedin: "in/elenavasquez",
    },
    summary:
      "Market risk analyst with VaR, limits, and regulatory reporting experience. Partners with trading desks to explain risk, challenge assumptions, and deliver accurate daily metrics.",
    experience: [
      {
        title: "Market Risk Analyst",
        org: "Morgan Stanley",
        location: "New York, NY",
        startDate: "2022",
        endDate: "Present",
        bullets: [
          "Key responsibilities: daily VaR and stress for rates/FX books; limit monitoring; FRTB data quality checks; desk challenge discussions.",
          "Automated limit-breach notification workflow reducing average escalation lag from 45 minutes to under 5.",
          "Led data remediation for 12 risk factors improving historical VaR completeness from 91% to 99.4%.",
          "Prepared materials for monthly risk committee on emerging concentration risks post-volatility events.",
        ],
      },
      {
        title: "Risk Analyst",
        org: "State Street",
        location: "Boston, MA",
        startDate: "2020",
        endDate: "2022",
        bullets: [
          "Supported market risk reporting for asset-manager clients; validated NAV-linked stress scenarios.",
        ],
      },
    ],
    education: [
      {
        title: "M.S. Financial Engineering",
        org: "Columbia University",
        location: "New York, NY",
        startDate: "2018",
        endDate: "2020",
      },
      {
        title: "B.S. Applied Mathematics",
        org: "University of California, San Diego",
        location: "La Jolla, CA",
        startDate: "2014",
        endDate: "2018",
      },
    ],
    skills: [
      "Market risk (VaR, stress)",
      "Python",
      "SQL",
      "Limit frameworks",
      "FRTB awareness",
      "Desk partnership",
      "Regulatory reporting",
      "Excel",
    ],
    letter: {
      greeting: "Dear Citi Risk Recruiting,",
      paragraphs: [
        "I am applying for the Risk Analyst role at Citi. I deliver accurate market-risk metrics, fix data quality at the source, and partner with desks constructively when limits and stress results demand attention.",
        "At Morgan Stanley I automate breach escalations, remediated risk-factor histories to 99.4% completeness, and support risk committee materials after major market moves. I am comfortable translating quantitative output into clear actions for traders and managers.",
        "Citi's global markets risk platform is a place I want to grow. I would welcome the chance to contribute rigor and partnership to your team.",
      ],
      closing: "Sincerely,",
    },
  },

  "hsbc-cb": {
    person: {
      name: "Oliver Grant",
      email: "oliver.grant@email.com",
      phone: "+44 20 7946 0123",
      linkedin: "in/olivergrant",
    },
    summary:
      "Corporate banking analyst with UK coverage experience across cash management, trade, and lending support. Client-ready materials, credit awareness, and cross-border product coordination.",
    experience: [
      {
        title: "Corporate Banking Analyst",
        org: "Standard Chartered",
        location: "London, UK",
        startDate: "2022",
        endDate: "Present",
        bullets: [
          "Key responsibilities: coverage support for mid-to-large corporates; RFP responses for cash and trade; credit paper drafting support; KYC refresh coordination.",
          "Won 3 cash-management mandates totaling £2.1B annual flows via tailored product packs and pricing analysis.",
          "Built client profitability dashboard used by directors in quarterly portfolio reviews.",
          "Coordinated multi-country trade-finance onboarding cutting average time-to-live from 9 weeks to 5.",
        ],
      },
      {
        title: "Graduate Analyst",
        org: "Lloyds Banking Group",
        location: "London, UK",
        startDate: "2020",
        endDate: "2022",
        bullets: [
          "Supported SME lending renewals and early-warning monitoring for stressed sectors.",
        ],
      },
    ],
    education: [
      {
        title: "B.Sc. Economics",
        org: "London School of Economics",
        location: "London, UK",
        startDate: "2017",
        endDate: "2020",
        bullets: ["First Class Honours"],
      },
    ],
    skills: [
      "Corporate coverage",
      "Cash management",
      "Trade finance basics",
      "Credit paper support",
      "Client RFPs",
      "Excel",
      "PowerPoint",
      "KYC / onboarding coordination",
    ],
    letter: {
      greeting: "Dear HSBC Corporate Banking Hiring Team,",
      paragraphs: [
        "I am applying for the Corporate Banking Analyst role at HSBC. I support UK and cross-border corporate coverage—cash, trade, and credit processes—with a focus on client outcomes and clean internal coordination.",
        "At Standard Chartered I have helped win cash mandates covering £2.1B in annual flows, built profitability views for portfolio reviews, and shortened multi-country trade onboarding by weeks. I understand how global banks create value when product, credit, and coverage move together.",
        "HSBC's international network is uniquely suited to the work I want to do. I would be pleased to discuss how I can contribute to your London teams.",
      ],
      closing: "Yours sincerely,",
    },
  },

  "barclays-markets": {
    person: {
      name: "Chloe Bennett",
      email: "chloe.bennett@email.com",
      phone: "+44 20 7946 0661",
      linkedin: "in/chloebennett",
    },
    summary:
      "UK markets analyst with equities coverage and e-trading support experience. Strong awareness of best execution, MiFID-related process, and client service under live market conditions.",
    experience: [
      {
        title: "Markets Analyst — Equities",
        org: "Societe Generale",
        location: "London, UK",
        startDate: "2023",
        endDate: "Present",
        bullets: [
          "Key responsibilities: cash equities sales support; TCA packs; client meeting materials; coordination with research and trading.",
          "Delivered weekly TCA summaries improving client dialogue on execution quality; retained 2 at-risk accounts.",
          "Built Excel/Python tools for corporate action calendars used across the desk.",
          "Supported MiFID reporting completeness checks with compliance—zero late filings in coverage period.",
        ],
      },
      {
        title: "Markets Intern",
        org: "BNP Paribas",
        location: "London, UK",
        startDate: "2022",
        endDate: "2022",
        bullets: [
          "Assisted equity derivatives marketing with scenario packs for institutional clients.",
        ],
      },
    ],
    education: [
      {
        title: "B.Sc. Finance",
        org: "University of Warwick",
        location: "Coventry, UK",
        startDate: "2019",
        endDate: "2022",
        bullets: ["First Class; Warwick Finance Societies"],
      },
    ],
    skills: [
      "Cash equities",
      "TCA / best execution awareness",
      "MiFID process awareness",
      "Python",
      "Excel",
      "Client materials",
      "Bloomberg",
      "Research coordination",
    ],
    letter: {
      greeting: "Dear Barclays Markets Recruiting,",
      paragraphs: [
        "I am applying for the Markets Analyst role at Barclays. I support equities coverage with execution-quality insight, reliable client materials, and careful regulatory process hygiene.",
        "At Societe Generale I produce TCA packs that improved retention conversations, automate corporate-action calendars for the desk, and partner with compliance on MiFID reporting completeness. I work calmly under live market pressure and communicate clearly with clients and traders.",
        "Barclays' UK markets franchise is an excellent place to deepen product and client skills. Thank you for considering my application.",
      ],
      closing: "Yours sincerely,",
    },
  },

  "macquarie-ib": {
    person: {
      name: "Liam Nguyen",
      email: "liam.nguyen@email.com",
      phone: "+61 2 5550 4400",
      linkedin: "in/liamnguyen",
    },
    summary:
      "Investment banking analyst focused on infrastructure and energy transactions in Australia. Strong project finance concepts, valuation under contracted cash flows, and multi-party process management.",
    experience: [
      {
        title: "Investment Banking Analyst",
        org: "UBS Australia",
        location: "Sydney, NSW",
        startDate: "2022",
        endDate: "Present",
        bullets: [
          "Key responsibilities: infrastructure M&A modeling; project finance debt sizing support; CIM drafting; bidder process management.",
          "Executed sell-side advisory on a A$1.4B renewable generation portfolio; owned cash-flow model and bidder Q&A log.",
          "Supported acquisition financing for a contracted energy asset; stress-tested merchant/contracted mix for credit memos.",
          "Built tariff and volume sensitivity packs used in investment committee materials for a toll-road bid.",
        ],
      },
      {
        title: "Analyst Intern — Infrastructure",
        org: "IFM Investors",
        location: "Melbourne, VIC",
        startDate: "2021",
        endDate: "2021",
        bullets: [
          "Supported asset monitoring packs for transport and energy portfolio companies.",
        ],
      },
    ],
    education: [
      {
        title: "B.Com Finance / B.Eng (Hons)",
        org: "University of New South Wales",
        location: "Sydney, NSW",
        startDate: "2017",
        endDate: "2021",
        bullets: ["First Class Honours (Engineering); student investment fund"],
      },
    ],
    skills: [
      "Infrastructure M&A",
      "Project finance basics",
      "Cash-flow modeling",
      "Excel",
      "PowerPoint",
      "Energy markets awareness",
      "Process management",
      "Due diligence",
    ],
    letter: {
      greeting: "Dear Macquarie Capital Recruiting,",
      paragraphs: [
        "I am applying for the Investment Banking Analyst role at Macquarie. I focus on infrastructure and energy transactions—contracted cash-flow modeling, multi-bidder processes, and materials that stand up in investment committee and lender rooms.",
        "At UBS Australia I helped execute a A$1.4B renewable portfolio sell-side and supported financing work on contracted energy assets, including stress cases that credit teams could use. An IFM internship earlier grounded me in how owners think about operating assets over decades, not just close dates.",
        "Macquarie's global infrastructure franchise is the platform I want to grow on. I would welcome the opportunity to contribute from Sydney.",
      ],
      closing: "Kind regards,",
    },
  },

  "cba-risk": {
    person: {
      name: "Sophie Tan",
      email: "sophie.tan@email.com",
      phone: "+61 2 5550 5522",
      linkedin: "in/sophietan",
    },
    summary:
      "Credit risk analyst with retail and small-business portfolio monitoring experience at a major Australian bank. Strong policy exception analysis, early-warning indicators, and clear risk reporting.",
    experience: [
      {
        title: "Credit Risk Analyst",
        org: "Westpac",
        location: "Sydney, NSW",
        startDate: "2022",
        endDate: "Present",
        bullets: [
          "Key responsibilities: retail credit portfolio monitoring; policy exception reviews; early-warning dashboards; reporting to risk committees.",
          "Redesigned arrears early-warning model features improving 90-day delinquency prediction lift 18%.",
          "Reviewed 200+ policy exceptions annually with consistent rationales; reduced overturn rate at second-line review 25%.",
          "Automated monthly portfolio packs (SQL + Excel) saving ~12 analyst hours per cycle.",
        ],
      },
      {
        title: "Graduate — Risk",
        org: "ANZ",
        location: "Melbourne, VIC",
        startDate: "2020",
        endDate: "2022",
        bullets: [
          "Rotations in retail credit and operational risk; supported APRA-related data requests.",
        ],
      },
    ],
    education: [
      {
        title: "B.Com Actuarial Studies / Finance",
        org: "University of Melbourne",
        location: "Melbourne, VIC",
        startDate: "2017",
        endDate: "2020",
        bullets: ["Dean’s Honours List"],
      },
    ],
    skills: [
      "Credit risk",
      "Portfolio monitoring",
      "SQL",
      "Excel",
      "Policy exceptions",
      "Early-warning indicators",
      "Risk reporting",
      "Retail credit products",
    ],
    letter: {
      greeting: "Dear Commonwealth Bank Risk Hiring Team,",
      paragraphs: [
        "I am applying for the Credit Risk Analyst role at Commonwealth Bank. I monitor retail credit risk with a focus on early warning, consistent policy judgment, and reporting that risk committees can trust.",
        "At Westpac I improved delinquency early-warning lift 18%, brought consistency to hundreds of policy exception reviews, and automated monthly portfolio packs that freed analysts for deeper analysis. Graduate rotations at ANZ gave me a grounding in both credit and operational risk, including regulatory data work.",
        "CBA's scale and risk standards are a strong fit for the career I am building in Australian banking risk. Thank you for your consideration.",
      ],
      closing: "Kind regards,",
    },
  },
}
