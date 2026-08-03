import type { RoleSeed } from "../types"

/** 7 engineering (hardware/process) role templates. */
export const ENGINEERING_SEEDS: Record<string, RoleSeed> = {
  "tesla-me": {
    person: {
      name: "Riley Quinn",
      email: "riley.quinn.me@email.com",
      phone: "+1 (512) 555-0160",
      linkedin: "in/rileyquinn-me",
    },
    summary:
      "Mechanical engineer focused on manufacturing DFM, yield, and cycle-time improvement. Hands-on with CAD, line trials, and root-cause problem solving on high-volume production.",
    experience: [
      {
        title: "Mechanical Engineer — Manufacturing",
        org: "SpaceX",
        location: "Hawthorne, CA",
        startDate: "2021",
        endDate: "Present",
        bullets: [
          "Key responsibilities: DFM for structural assemblies; fixture design; production support; MRB disposition with quality and manufacturing.",
          "Redesigned fixture set cutting assembly cycle time 18% on a high-rate module without scrap increase.",
          "Led PFMEA update after field issue; implemented poka-yoke that eliminated recurrence across 12k units.",
          "Partnered with suppliers on GD&T clarifications reducing incoming nonconformances 27%.",
        ],
      },
      {
        title: "Mechanical Design Engineer",
        org: "Rivian",
        location: "Normal, IL",
        startDate: "2019",
        endDate: "2021",
        bullets: [
          "Designed brackets and thermal interfaces in CATIA; supported pilot build events and issue burn-down.",
        ],
      },
    ],
    education: [
      {
        title: "B.S. Mechanical Engineering",
        org: "Georgia Institute of Technology",
        location: "Atlanta, GA",
        startDate: "2015",
        endDate: "2019",
        bullets: ["Formula SAE; manufacturing concentration"],
      },
    ],
    skills: [
      "DFM / DFA",
      "CATIA / SolidWorks",
      "GD&T",
      "PFMEA",
      "Root cause (8D)",
      "Fixture design",
      "Production support",
      "Supplier quality partnership",
    ],
    letter: {
      greeting: "Dear Tesla Manufacturing Engineering Recruiting,",
      paragraphs: [
        "I am applying for the Mechanical Engineer role at Tesla. I improve manufacturing systems—fixtures, DFM, and robust process controls—so rate and quality move together.",
        "At SpaceX I cut assembly cycle time 18% with a fixture redesign, eliminated a field-issue recurrence via poka-yoke after PFMEA, and reduced supplier NCs through clearer GD&T. Rivian pilot-build experience taught me how design intent meets real factory constraints.",
        "Tesla's manufacturing ambition is the environment I want. I would welcome the chance to contribute in Austin.",
      ],
      closing: "Sincerely,",
    },
  },

  "boeing-systems": {
    person: {
      name: "Pat Okonkwo",
      email: "pat.okonkwo@email.com",
      phone: "+1 (206) 555-0145",
      linkedin: "in/patokonkwo",
    },
    summary:
      "Systems engineer specializing in avionics requirements, verification & validation, and safety-aware integration. Strong interface control and test-campaign discipline.",
    experience: [
      {
        title: "Systems Engineer — Avionics",
        org: "Honeywell Aerospace",
        location: "Phoenix, AZ",
        startDate: "2020",
        endDate: "Present",
        bullets: [
          "Key responsibilities: requirements authoring/traceability (DOORS); interface control documents; V&V planning; integration test support.",
          "Owned 400+ requirements for a flight-control interface; 98% on-time verification closure for CDR milestone.",
          "Led integration anomaly resolution across software, hardware, and supplier teams—cut average anomaly aging 35%.",
          "Authored safety-related verification procedures reviewed under ARP4754A/DO-178C-aware processes.",
        ],
      },
      {
        title: "Systems Engineer",
        org: "Raytheon Technologies",
        location: "Tucson, AZ",
        startDate: "2017",
        endDate: "2020",
        bullets: [
          "Supported requirements decomposition and hardware-in-the-loop test campaigns for mission systems.",
        ],
      },
    ],
    education: [
      {
        title: "M.S. Systems Engineering",
        org: "Johns Hopkins University (EP)",
        location: "Remote / Baltimore, MD",
        startDate: "2018",
        endDate: "2020",
      },
      {
        title: "B.S. Electrical Engineering",
        org: "University of Washington",
        location: "Seattle, WA",
        startDate: "2013",
        endDate: "2017",
      },
    ],
    skills: [
      "Requirements engineering",
      "DOORS / traceability",
      "V&V planning",
      "Interface control",
      "Integration testing",
      "ARP4754A awareness",
      "Safety processes",
      "Cross-functional leadership",
    ],
    letter: {
      greeting: "Dear Boeing Systems Engineering Hiring Team,",
      paragraphs: [
        "I am applying for the Systems Engineer role at Boeing. I own avionics requirements and V&V with the rigor aerospace integration demands—clear interfaces, closed verification, and disciplined anomaly resolution.",
        "At Honeywell I managed 400+ flight-control interface requirements with high on-time verification closure and reduced integration anomaly aging 35%. Raytheon experience earlier built my HIL test and mission-systems foundation.",
        "Boeing's commercial and defense systems work is where I want to apply this discipline. Thank you for your consideration.",
      ],
      closing: "Sincerely,",
    },
  },

  "ge-electrical": {
    person: {
      name: "Dana Singh",
      email: "dana.singh@email.com",
      phone: "+1 (518) 555-0118",
      linkedin: "in/danasingh-ee",
    },
    summary:
      "Electrical engineer specializing in power systems protection, standards compliance, and grid-equipment design support. Practical lab and field-test experience with clear technical documentation.",
    experience: [
      {
        title: "Electrical Engineer — Power Systems",
        org: "Siemens Energy",
        location: "Raleigh, NC",
        startDate: "2021",
        endDate: "Present",
        bullets: [
          "Key responsibilities: protection & control design packages; relay settings support; factory acceptance tests; IEEE/IEC standards alignment.",
          "Delivered P&C packages for 8 utility projects on schedule; zero major FATs failures attributable to design docs.",
          "Automated relay setting calculation checks reducing engineering rework hours ~30%.",
          "Supported root-cause of a field misoperation; corrective settings standard adopted across product line.",
        ],
      },
      {
        title: "Electrical Engineer",
        org: "Eaton",
        location: "Pittsburgh, PA",
        startDate: "2018",
        endDate: "2021",
        bullets: [
          "Designed low-voltage switchgear control circuits; led UL-related documentation updates.",
        ],
      },
    ],
    education: [
      {
        title: "B.S. Electrical Engineering",
        org: "Rensselaer Polytechnic Institute",
        location: "Troy, NY",
        startDate: "2014",
        endDate: "2018",
        bullets: ["Power systems concentration; IEEE student branch"],
      },
    ],
    skills: [
      "Power systems protection",
      "Relay settings",
      "P&C design packages",
      "IEEE / IEC standards",
      "FAT support",
      "AutoCAD Electrical",
      "Root cause analysis",
      "Utility project delivery",
    ],
    certifications: [
      { name: "EIT", issuer: "NCEES", date: "2018" },
      { name: "PE (Power) — exam passed", issuer: "NCEES", date: "2025" },
    ],
    letter: {
      greeting: "Dear GE Vernova Hiring Team,",
      paragraphs: [
        "I am applying for the Electrical Engineer role at GE Vernova. I deliver protection and control design for power equipment with standards discipline and field-aware problem solving.",
        "At Siemens Energy I shipped P&C packages for eight utility projects without major FAT design failures, automated settings checks that cut rework ~30%, and drove a corrective settings standard after a field misoperation analysis. Eaton experience built my LV switchgear and UL documentation foundation.",
        "GE Vernova's role in the energy transition is compelling. I would welcome contributing to power systems engineering on your team.",
      ],
      closing: "Sincerely,",
    },
  },

  "lockheed-se": {
    person: {
      name: "Alex Rivera",
      email: "alex.rivera.se@email.com",
      phone: "+1 (301) 555-0199",
      linkedin: "in/alexriverase",
    },
    summary:
      "Defense systems engineer experienced in mission systems integration, test, and requirements under controlled program environments. Clear communicator across government, primes, and suppliers.",
    experience: [
      {
        title: "Systems Engineer — Mission Systems",
        org: "Northrop Grumman",
        location: "Baltimore, MD",
        startDate: "2020",
        endDate: "Present",
        bullets: [
          "Key responsibilities: requirements allocation; interface management; test procedure development; program milestone support (PDR/CDR).",
          "Owned sensor-to-processor ICD; resolved 50+ interface issues before CDR without schedule slip.",
          "Developed system integration test procedures executed successfully in first full-up lab event.",
          "Supported customer technical interchange meetings with clear risk and trade matrices.",
        ],
      },
      {
        title: "Systems Engineer",
        org: "BAE Systems",
        location: "Nashua, NH",
        startDate: "2017",
        endDate: "2020",
        bullets: [
          "Requirements verification tracking for electronic warfare subsystems; earned program recognition for data package quality.",
        ],
      },
    ],
    education: [
      {
        title: "B.S. Aerospace Engineering",
        org: "University of Maryland",
        location: "College Park, MD",
        startDate: "2013",
        endDate: "2017",
        bullets: ["Security clearance eligible; systems electives"],
      },
    ],
    skills: [
      "Mission systems integration",
      "Requirements & ICDs",
      "Test procedures",
      "Risk & trade studies",
      "DOORS / MBSE basics",
      "Customer engagement",
      "Program milestones",
      "Configuration awareness",
    ],
    letter: {
      greeting: "Dear Lockheed Martin Systems Engineering Recruiting,",
      paragraphs: [
        "I am applying for the Systems Engineer role at Lockheed Martin. I integrate mission systems under disciplined program processes—interfaces closed early, tests that pass the first full-up event, and clear risk communication with customers.",
        "At Northrop Grumman I owned a sensor-to-processor ICD that resolved dozens of issues before CDR and wrote integration procedures that executed cleanly in lab. BAE experience strengthened my verification tracking on EW subsystems.",
        "Lockheed Martin's mission impact and engineering rigor are a strong fit. I would welcome the opportunity to contribute.",
      ],
      closing: "Sincerely,",
    },
  },

  "rolls-royce-aero": {
    person: {
      name: "James Okafor",
      email: "james.okafor@email.com",
      phone: "+44 121 555 0144",
      linkedin: "in/jamesokafor-aero",
    },
    summary:
      "Aerospace engineer specializing in turbomachinery reliability and in-service support. Combines analytical modeling, fleet data, and practical recommendations for operators and design teams.",
    experience: [
      {
        title: "Aerospace Engineer — Turbomachinery",
        org: "Safran",
        location: "Paris / UK liaison",
        startDate: "2021",
        endDate: "Present",
        bullets: [
          "Key responsibilities: in-service reliability analyses; module life assessments; operator technical support; design feedback loops.",
          "Led investigation of HPT blade distress trend; recommended inspection interval change reducing unplanned removals 24%.",
          "Built fleet KPI dashboards used in monthly reliability reviews with airline customers.",
          "Supported EASA/FAA query responses with clear technical justifications and data packs.",
        ],
      },
      {
        title: "Graduate Engineer — Engines",
        org: "GKN Aerospace",
        location: "Bristol, UK",
        startDate: "2018",
        endDate: "2021",
        bullets: [
          "Structural analysis support for engine components; fatigue life calculations under supervisory review.",
        ],
      },
    ],
    education: [
      {
        title: "M.Eng. Aeronautical Engineering",
        org: "Imperial College London",
        location: "London, UK",
        startDate: "2014",
        endDate: "2018",
        bullets: ["First Class Honours; gas turbine project"],
      },
    ],
    skills: [
      "Turbomachinery",
      "Reliability engineering",
      "Fleet data analysis",
      "Technical investigations",
      "Life assessment basics",
      "Customer technical support",
      "Regulatory query support",
      "MATLAB / Python",
    ],
    letter: {
      greeting: "Dear Rolls-Royce Aerospace Careers,",
      paragraphs: [
        "I am applying for the Aerospace Engineer role at Rolls-Royce. I improve turbomachinery reliability in service—turning fleet data and investigations into actions operators and design teams can use.",
        "At Safran I led an HPT distress investigation that cut unplanned removals 24% via inspection interval changes, built reliability dashboards for airline reviews, and supported regulator queries with clear data packs. GKN graduate work grounded me in structural life methods.",
        "Rolls-Royce Derby's engineering heritage and in-service excellence are where I want to grow. I would be pleased to discuss my application.",
      ],
      closing: "Yours sincerely,",
    },
  },

  "bhp-mining": {
    person: {
      name: "Noah Fraser",
      email: "noah.fraser@email.com",
      phone: "+61 8 5550 7700",
      linkedin: "in/noahfraser-mining",
    },
    summary:
      "Mining engineer with open-pit production and safety leadership experience. Focused on drill-and-blast, short-interval control, and cost-per-tonne improvements without compromising critical controls.",
    experience: [
      {
        title: "Mining Engineer — Open Pit",
        org: "Rio Tinto",
        location: "Pilbara, WA",
        startDate: "2021",
        endDate: "Present",
        bullets: [
          "Key responsibilities: short-term planning; drill-and-blast design; production reporting; critical control verification support.",
          "Optimised blast designs improving fragmentation and dig rates; +6% shovel productivity over two quarters.",
          "Led short-interval control cadence that reduced schedule variance 15% on key ore sources.",
          "Zero significant incidents on supervised blasts; championed pre-start critical control checks.",
        ],
      },
      {
        title: "Graduate Mining Engineer",
        org: "Fortescue",
        location: "Pilbara, WA",
        startDate: "2019",
        endDate: "2021",
        bullets: [
          "Rotations in planning, production, and drill-and-blast; completed statutory competencies for WA sites.",
        ],
      },
    ],
    education: [
      {
        title: "B.Eng. Mining Engineering (Hons)",
        org: "University of Western Australia",
        location: "Perth, WA",
        startDate: "2015",
        endDate: "2018",
        bullets: ["First Class Honours; AusIMM student member"],
      },
    ],
    skills: [
      "Open-pit mining",
      "Drill and blast",
      "Short-term planning",
      "MineSched / planning tools",
      "Production reporting",
      "Safety critical controls",
      "Cost awareness",
      "Cross-shift leadership",
    ],
    certifications: [
      { name: "WA quarry manager competencies (in progress)", issuer: "DMIRS pathway", date: "2026" },
    ],
    letter: {
      greeting: "Dear BHP Mining Recruitment,",
      paragraphs: [
        "I am applying for the Mining Engineer role at BHP. I deliver open-pit production improvements with non-negotiable safety critical controls—better fragmentation, tighter short-interval control, and disciplined pre-starts.",
        "At Rio Tinto I improved shovel productivity 6% through blast design work, reduced schedule variance 15% with SIC cadence, and maintained a clean significant-incident record on supervised blasts. Fortescue graduate rotations built my WA site foundations.",
        "BHP's scale and safety culture are where I want to continue developing as a mining engineer. Thank you for your consideration.",
      ],
      closing: "Kind regards,",
    },
  },

  "riotinto-process": {
    person: {
      name: "Ava Singh",
      email: "ava.singh.pe@email.com",
      phone: "+61 7 5550 6600",
      linkedin: "in/avasingh-process",
    },
    summary:
      "Process engineer specializing in mineral processing optimization—recovery, throughput, and stability. Strong at plant trials, metallurgical accounting, and operator engagement.",
    experience: [
      {
        title: "Process Engineer — Mineral Processing",
        org: "Newmont",
        location: "Boddington / Perth, WA",
        startDate: "2021",
        endDate: "Present",
        bullets: [
          "Key responsibilities: flotation/circuit optimization; plant trials; metallurgical accounting support; process control improvements.",
          "Led reagent optimization trial lifting gold recovery +0.7 pts without throughput loss—~$9M annualized value at then-prices.",
          "Reduced grind-size variability 20% via control loop tuning with automation partners.",
          "Authored SOP updates and trained operators; improved trial compliance and data quality.",
        ],
      },
      {
        title: "Graduate Process Engineer",
        org: "South32",
        location: "Queensland, Australia",
        startDate: "2019",
        endDate: "2021",
        bullets: [
          "Supported leach and precipitation circuits; mass-balance projects for monthly reconciliation.",
        ],
      },
    ],
    education: [
      {
        title: "B.Eng. Chemical Engineering (Hons)",
        org: "University of Queensland",
        location: "Brisbane, QLD",
        startDate: "2015",
        endDate: "2018",
        bullets: ["Minerals processing electives; first class honours"],
      },
    ],
    skills: [
      "Mineral processing",
      "Flotation optimization",
      "Plant trials",
      "Metallurgical accounting",
      "Process control basics",
      "Mass balances",
      "Operator training",
      "Data analysis (Python/Excel)",
    ],
    letter: {
      greeting: "Dear Rio Tinto Process Engineering Hiring Team,",
      paragraphs: [
        "I am applying for the Process Engineer role at Rio Tinto. I optimize mineral processing circuits for recovery and stability—running disciplined plant trials and bringing operators with me on the change.",
        "At Newmont a reagent trial delivered +0.7 pts recovery (~$9M annualized at the time) without sacrificing throughput, and control-loop work cut grind-size variability 20%. South32 graduate experience built my leach-circuit and mass-balance fundamentals.",
        "Rio Tinto's processing operations are an excellent place to deepen this craft. I would welcome the chance to contribute from Brisbane/operations.",
      ],
      closing: "Kind regards,",
    },
  },
}
