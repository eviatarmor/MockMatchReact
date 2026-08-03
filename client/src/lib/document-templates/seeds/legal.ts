import type { RoleSeed } from "../types"

/** 6 legal role templates — unique matter lists and firm-style achievements. */
export const LEGAL_SEEDS: Record<string, RoleSeed> = {
  "skadden-associate": {
    person: {
      name: "Jamie Chen",
      email: "jamie.chen@email.com",
      phone: "+1 (212) 555-0182",
      linkedin: "in/jamiechen-esq",
    },
    summary:
      "Corporate associate with M&A diligence and transaction management experience. Precise drafter, reliable checklist owner, and calm coordinator across multi-party deals.",
    experience: [
      {
        title: "Corporate Associate",
        org: "Simpson Thacher & Bartlett",
        location: "New York, NY",
        startDate: "2022",
        endDate: "Present",
        bullets: [
          "Key responsibilities: M&A diligence; SPA/ancillary drafting under partner supervision; closing checklists; third-party counsel coordination.",
          "Managed diligence workstreams on 6 signed deals (aggregate EV ~$4.2B); owned issue lists and disclosure schedule processes.",
          "Drafted and negotiated ancillary agreements (TSAs, IP assignments) on a carve-out sale that closed on a 7-week timeline.",
          "Built closing checklist automation reducing last-week status chaos; used firm-wide on two subsequent deals.",
        ],
      },
      {
        title: "Summer Associate",
        org: "Cravath, Swaine & Moore",
        location: "New York, NY",
        startDate: "2021",
        endDate: "2021",
        bullets: [
          "Research memos on fiduciary duty issues; diligence support on a live strategic acquisition.",
        ],
      },
    ],
    education: [
      {
        title: "J.D.",
        org: "Columbia Law School",
        location: "New York, NY",
        startDate: "2019",
        endDate: "2022",
        bullets: ["Harlan Fiske Stone Scholar; M&A clinic"],
      },
      {
        title: "B.A. Political Science",
        org: "Yale University",
        location: "New Haven, CT",
        startDate: "2015",
        endDate: "2019",
      },
    ],
    skills: [
      "M&A diligence",
      "Transaction documents",
      "Closing management",
      "Disclosure schedules",
      "Legal research",
      "Client service",
      "Multi-party coordination",
      "Carve-out transactions",
    ],
    certifications: [
      { name: "Admitted to NY Bar", issuer: "New York", date: "2022" },
    ],
    letter: {
      greeting: "Dear Skadden Corporate Recruiting,",
      paragraphs: [
        "I am applying for the Corporate Associate role at Skadden. I manage M&A diligence and closing workstreams with precision—issue lists that partners trust, drafting that holds up, and checklists that get deals across the line.",
        "At Simpson Thacher I have run diligence on six signed transactions totaling roughly $4.2B EV, drafted carve-out ancillaries on a seven-week close, and built checklist tools later reused firm-wide. A Cravath summer confirmed my interest in complex, high-stakes corporate work.",
        "Skadden's elite corporate practice is where I want to develop. Thank you for your consideration.",
      ],
      closing: "Sincerely,",
    },
  },

  "latham-ma": {
    person: {
      name: "Morgan Ellis",
      email: "morgan.ellis.esq@email.com",
      phone: "+1 (213) 555-0166",
      linkedin: "in/morganellis-law",
    },
    summary:
      "M&A associate focused on private equity acquisitions and financing coordination. Strong at SPA processes, financing conditionality, and keeping multi-track workstreams aligned.",
    experience: [
      {
        title: "M&A Associate",
        org: "Kirkland & Ellis",
        location: "Los Angeles, CA",
        startDate: "2022",
        endDate: "Present",
        bullets: [
          "Key responsibilities: PE buy-side and sell-side M&A; SPA negotiation support; financing coordination with debt counsel; portfolio add-ons.",
          "Staffed lead associate role on $1.1B PE platform acquisition; coordinated 5 workstreams and dual financing tracks.",
          "Negotiated R&W insurance process and policy overlays on 3 deals reducing holdback friction.",
          "Managed disclosure schedules for a 40-entity target group without closing day surprises.",
        ],
      },
      {
        title: "Corporate Associate",
        org: "Gibson, Dunn & Crutcher",
        location: "Los Angeles, CA",
        startDate: "2021",
        endDate: "2022",
        bullets: [
          "Supported public company M&A diligence and board materials under senior associate supervision.",
        ],
      },
    ],
    education: [
      {
        title: "J.D.",
        org: "UCLA School of Law",
        location: "Los Angeles, CA",
        startDate: "2018",
        endDate: "2021",
        bullets: ["Order of the Coif; Business Law Review"],
      },
      {
        title: "B.A. Economics",
        org: "University of Southern California",
        location: "Los Angeles, CA",
        startDate: "2014",
        endDate: "2018",
      },
    ],
    skills: [
      "Private equity M&A",
      "SPA negotiation support",
      "Financing coordination",
      "R&W insurance",
      "Disclosure schedules",
      "Deal management",
      "Client communication",
      "Legal research",
    ],
    certifications: [
      { name: "Admitted to CA Bar", issuer: "California", date: "2021" },
    ],
    letter: {
      greeting: "Dear Latham & Watkins Recruiting,",
      paragraphs: [
        "I am applying for the M&A Associate role at Latham & Watkins. I execute PE M&A with financing awareness—keeping SPA, diligence, and debt workstreams synchronized under intense timelines.",
        "At Kirkland I acted as lead associate on a $1.1B platform deal across five workstreams and dual financings, ran R&W insurance processes on multiple transactions, and managed disclosure for a 40-entity target. Gibson Dunn experience added public-company M&A exposure.",
        "Latham's PE M&A intensity and training are a strong fit. I would welcome the opportunity to contribute in Los Angeles.",
      ],
      closing: "Sincerely,",
    },
  },

  "cravath-lit": {
    person: {
      name: "Sam Torres",
      email: "sam.torres.esq@email.com",
      phone: "+1 (212) 555-0124",
      linkedin: "in/samtorres-lit",
    },
    summary:
      "Litigation associate with complex commercial dispute experience. Strong researcher and writer; comfortable with motion practice, discovery management, and trial preparation support.",
    experience: [
      {
        title: "Litigation Associate",
        org: "Sullivan & Cromwell",
        location: "New York, NY",
        startDate: "2022",
        endDate: "Present",
        bullets: [
          "Key responsibilities: commercial litigation and investigations; briefs and motions; discovery strategy; deposition prep support.",
          "Primary draft on successful motion to dismiss in a $200M+ commercial dispute (SDNY).",
          "Managed ESI protocol negotiations and review workflows across 2.1M documents with outside vendor.",
          "Prepared witness kits and outlines for 8 depositions in a multi-defendant antitrust matter.",
        ],
      },
      {
        title: "Judicial Clerk",
        org: "U.S. District Court, S.D.N.Y.",
        location: "New York, NY",
        startDate: "2021",
        endDate: "2022",
        bullets: [
          "Drafted bench memos and orders in civil and criminal matters; refined federal practice judgment.",
        ],
      },
    ],
    education: [
      {
        title: "J.D.",
        org: "New York University School of Law",
        location: "New York, NY",
        startDate: "2018",
        endDate: "2021",
        bullets: ["NYU Law Review; moot court championship"],
      },
      {
        title: "B.A. History",
        org: "Princeton University",
        location: "Princeton, NJ",
        startDate: "2014",
        endDate: "2018",
      },
    ],
    skills: [
      "Motion practice",
      "Legal writing & research",
      "Discovery / ESI",
      "Deposition preparation",
      "Commercial litigation",
      "Investigations support",
      "Federal practice",
      "Team coordination",
    ],
    certifications: [
      { name: "Admitted to NY Bar", issuer: "New York", date: "2021" },
      { name: "S.D.N.Y. / E.D.N.Y. admitted", issuer: "Federal courts", date: "2022" },
    ],
    letter: {
      greeting: "Dear Cravath Litigation Recruiting,",
      paragraphs: [
        "I am applying for the Litigation Associate role at Cravath. I litigate complex commercial matters with careful writing, disciplined discovery, and thorough trial preparation support.",
        "At Sullivan & Cromwell I was primary drafter on a successful SDNY motion to dismiss in a $200M+ dispute, managed multi-million-document ESI workflows, and prepared extensive deposition kits on an antitrust matter. A year clerking in S.D.N.Y. sharpened my federal practice instincts.",
        "Cravath's litigation tradition and training model are where I want to build my career. Thank you for your consideration.",
      ],
      closing: "Sincerely,",
    },
  },

  "clifford-chance": {
    person: {
      name: "Hannah Price",
      email: "hannah.price@email.com",
      phone: "+44 20 7946 0333",
      linkedin: "in/hannahprice-law",
    },
    summary:
      "Finance associate with banking and leveraged finance experience. Drafts facilities and security documents carefully; coordinates multi-lender processes and intercreditor issues.",
    experience: [
      {
        title: "Finance Associate",
        org: "Linklaters",
        location: "London, UK",
        startDate: "2022",
        endDate: "Present",
        bullets: [
          "Key responsibilities: leveraged and investment-grade facilities; security packages; intercreditor arrangements; CP checklists; lender coordination.",
          "Staffed on £1.5B TLB refinancing; owned conditions precedent tracker and security confirmation process.",
          "Drafted security documents and local counsel instructions across 6 jurisdictions on a cross-border financing.",
          "Supported restructuring-related facility amendments under compressed timelines with clear issue lists for partners.",
        ],
      },
      {
        title: "Trainee Solicitor",
        org: "Allen & Overy",
        location: "London, UK",
        startDate: "2020",
        endDate: "2022",
        bullets: [
          "Seats in banking, corporate, litigation, and derivatives; qualified into banking practice.",
        ],
      },
    ],
    education: [
      {
        title: "LPC / LLB",
        org: "University of Law / University of Bristol",
        location: "United Kingdom",
        startDate: "2016",
        endDate: "2020",
        bullets: ["Commendation on LPC; first-class LLB modules in commercial law"],
      },
    ],
    skills: [
      "Leveraged finance",
      "Facility agreements",
      "Security & intercreditor",
      "Conditions precedent",
      "Multi-lender coordination",
      "Cross-border counsel management",
      "Legal research",
      "Client service",
    ],
    certifications: [
      { name: "Solicitor of England & Wales", issuer: "SRA", date: "2022" },
    ],
    letter: {
      greeting: "Dear Clifford Chance Banking Recruiting,",
      paragraphs: [
        "I am applying for the Finance Associate role at Clifford Chance. I execute banking and leveraged finance transactions with careful drafting and tight multi-party process control.",
        "At Linklaters I staffed a £1.5B TLB refinancing (CP and security confirmations), drafted multi-jurisdiction security packages, and supported amendment processes under restructuring pressure. Trainee seats at A&O built a broad foundation before I qualified into banking.",
        "Clifford Chance's Magic Circle finance practice is where I want to deepen this expertise. I would welcome the opportunity to contribute in London.",
      ],
      closing: "Yours sincerely,",
    },
  },

  "ao-shearman": {
    person: {
      name: "Oliver Bennett",
      email: "oliver.bennett.esq@email.com",
      phone: "+44 20 7946 0444",
      linkedin: "in/oliverbennett-corp",
    },
    summary:
      "Corporate associate focused on UK equity capital markets. Experienced with prospectuses, listings process, and market-regulation-aware drafting under UK listing and prospectus regimes.",
    experience: [
      {
        title: "Corporate Associate — ECM",
        org: "Freshfields",
        location: "London, UK",
        startDate: "2022",
        endDate: "Present",
        bullets: [
          "Key responsibilities: IPO and follow-on ECM; prospectus drafting sections; verification notes; working group coordination; sponsor/underwriter liaison.",
          "Staffed on Main Market IPO raising £600M; owned business description verification and risk factor updates through multiple drafts.",
          "Supported secondary placing for FTSE 250 issuer under accelerated bookbuild timeline (48 hours).",
          "Prepared board and due diligence committee materials used for listing approvals.",
        ],
      },
      {
        title: "Trainee Solicitor",
        org: "Slaughter and May",
        location: "London, UK",
        startDate: "2020",
        endDate: "2022",
        bullets: [
          "Corporate and financing seats; exposure to public M&A and ECM support work.",
        ],
      },
    ],
    education: [
      {
        title: "GDL / LPC",
        org: "City Law School",
        location: "London, UK",
        startDate: "2018",
        endDate: "2020",
      },
      {
        title: "B.A. History",
        org: "University of Durham",
        location: "Durham, UK",
        startDate: "2015",
        endDate: "2018",
        bullets: ["First Class Honours"],
      },
    ],
    skills: [
      "UK ECM / IPOs",
      "Prospectus drafting",
      "Verification",
      "Listing process",
      "Working group management",
      "Market regulation awareness",
      "Board materials",
      "Legal research",
    ],
    certifications: [
      { name: "Solicitor of England & Wales", issuer: "SRA", date: "2022" },
    ],
    letter: {
      greeting: "Dear A&O Shearman Corporate Recruiting,",
      paragraphs: [
        "I am applying for the Corporate Associate role at A&O Shearman. I focus on UK ECM—prospectus quality, verification discipline, and working-group management that keeps listings on track.",
        "At Freshfields I staffed a £600M Main Market IPO through multi-draft verification of business description and risk factors, supported an accelerated secondary placing, and prepared diligence committee packs for listing approvals. Slaughter and May training provided a rigorous corporate foundation.",
        "A&O Shearman's ECM franchise is an excellent place to continue this work. Thank you for considering my application.",
      ],
      closing: "Yours sincerely,",
    },
  },

  "kwm-au": {
    person: {
      name: "Isla Bennett",
      email: "isla.bennett@email.com",
      phone: "+61 2 5550 8800",
      linkedin: "in/islabennett-law",
    },
    summary:
      "Corporate associate with Australian public M&A experience—schemes, takeovers, and ASX process. Strong at bidder/target process management, continuous disclosure awareness, and clean transaction documents.",
    experience: [
      {
        title: "Corporate Associate — Public M&A",
        org: "Allens",
        location: "Sydney, NSW",
        startDate: "2022",
        endDate: "Present",
        bullets: [
          "Key responsibilities: public M&A (schemes and takeover bids); ASX announcements support; due diligence; implementation agreements; FIRB process coordination.",
          "Staffed target-side scheme valued at A$1.8B; managed due diligence workstreams and draft scheme booklet inputs.",
          "Supported bidder on off-market takeover; coordinated conditions, defeating conditions analysis, and bidder's statement process.",
          "Prepared continuous disclosure decision trees used by company secretaries during live deals.",
        ],
      },
      {
        title: "Graduate Lawyer",
        org: "Herbert Smith Freehills",
        location: "Sydney, NSW",
        startDate: "2020",
        endDate: "2022",
        bullets: [
          "Rotations in corporate, disputes, and employment; seconded to public M&A matters in final rotation.",
        ],
      },
    ],
    education: [
      {
        title: "J.D. / B.Com",
        org: "University of Sydney",
        location: "Sydney, NSW",
        startDate: "2015",
        endDate: "2020",
        bullets: ["Honours in law; corporate law elective stream"],
      },
    ],
    skills: [
      "Public M&A (schemes / takeovers)",
      "ASX process awareness",
      "Due diligence",
      "Transaction documents",
      "FIRB coordination",
      "Continuous disclosure",
      "Client service",
      "Matter management",
    ],
    certifications: [
      { name: "Admitted as lawyer (NSW)", issuer: "Supreme Court of NSW", date: "2020" },
    ],
    letter: {
      greeting: "Dear King & Wood Mallesons Recruiting,",
      paragraphs: [
        "I am applying for the Corporate Associate role at King & Wood Mallesons. I execute Australian public M&A—schemes, takeovers, ASX process, and diligence—with careful project management and disclosure judgment.",
        "At Allens I staffed a A$1.8B target-side scheme, supported a bidder's off-market takeover through bidder's statement processes, and built continuous disclosure decision tools used during live deals. HSF graduate rotations gave me a broad commercial foundation before specializing.",
        "KWM's public M&A practice is where I want to grow. I would welcome the opportunity to contribute from Sydney.",
      ],
      closing: "Kind regards,",
    },
  },
}
