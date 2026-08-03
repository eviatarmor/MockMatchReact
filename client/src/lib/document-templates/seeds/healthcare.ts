import type { RoleSeed } from "../types"

/** 7 healthcare role templates — clinical/ops achievements unique per employer. */
export const HEALTHCARE_SEEDS: Record<string, RoleSeed> = {
  "mayo-rn": {
    person: {
      name: "Sam Patel",
      email: "sam.patel@email.com",
      phone: "+1 (507) 555-0128",
      linkedin: "in/sampatel-rn",
    },
    summary:
      "Registered nurse with acute-care experience, strong clinical judgment, and a track record of improving unit outcomes through protocol adherence, patient education, and interdisciplinary collaboration.",
    experience: [
      {
        title: "Registered Nurse — Medical/Surgical ICU Step-Down",
        org: "Cleveland Clinic",
        location: "Cleveland, OH",
        startDate: "2021",
        endDate: "Present",
        bullets: [
          "Key responsibilities: care for high-acuity step-down patients (1:3–1:4 ratios); titratable drips; rapid response participation; precepting new graduates.",
          "Championed early-mobility protocol on unit; reduced average length of stay 0.6 days over 9 months.",
          "Zero CLABSI on assigned patients for 18 consecutive months through bundle compliance leadership.",
          "Precepted 6 new nurses; all completed orientation on schedule with positive competency sign-offs.",
        ],
      },
      {
        title: "Registered Nurse — Telemetry",
        org: "University Hospitals",
        location: "Cleveland, OH",
        startDate: "2019",
        endDate: "2021",
        bullets: [
          "Managed telemetry patients post-cardiac procedures; coordinated discharge teaching reducing 30-day readmissions in pilot cohort.",
          "Earned charge nurse designation; balanced staffing and escalations on nights.",
        ],
      },
    ],
    education: [
      {
        title: "B.S.N.",
        org: "Case Western Reserve University",
        location: "Cleveland, OH",
        startDate: "2015",
        endDate: "2019",
        bullets: ["Sigma Theta Tau; clinical honors"],
      },
    ],
    skills: [
      "Acute care nursing",
      "Hemodynamic monitoring",
      "Patient education",
      "Rapid response",
      "EPIC documentation",
      "Precepting",
      "Quality improvement",
      "Interdisciplinary rounds",
    ],
    certifications: [
      { name: "RN License (OH compact)", issuer: "State Board of Nursing", date: "2019" },
      { name: "BLS / ACLS", issuer: "AHA", date: "2025" },
      { name: "CCRN (in progress)", issuer: "AACN", date: "2026" },
    ],
    letter: {
      greeting: "Dear Mayo Clinic Nursing Recruitment,",
      paragraphs: [
        "I am applying for the Registered Nurse role at Mayo Clinic. I provide high-acuity acute care with a focus on safety bundles, early mobility, and teaching that helps patients leave stronger—not just sooner.",
        "At Cleveland Clinic step-down I championed early-mobility work that cut average LOS 0.6 days, maintained zero CLABSI on my patients for 18 months, and precepted six new nurses to full competency. Telemetry experience earlier built my cardiac and charge-nurse foundation.",
        "Mayo's model of integrated, patient-centered excellence is where I want to practice. I would be honored to contribute to your nursing team in Rochester.",
      ],
      closing: "Sincerely,",
    },
  },

  "cleveland-pa": {
    person: {
      name: "Jordan Kim",
      email: "jordan.kim.pa@email.com",
      phone: "+1 (216) 555-0150",
      linkedin: "in/jordankimpa",
    },
    summary:
      "Physician assistant specializing in cardiology collaborative practice. High procedural volume comfort, thorough documentation, and strong partnership with physicians, nursing, and ancillary teams.",
    experience: [
      {
        title: "Physician Assistant — Cardiology",
        org: "Mass General Brigham",
        location: "Boston, MA",
        startDate: "2021",
        endDate: "Present",
        bullets: [
          "Key responsibilities: inpatient cardiology service; consults; pre/post cath management; patient education; collaborative practice agreement with 8 attendings.",
          "Managed average 12–14 patients/day; independent note completion with attending co-signature within shift targets.",
          "Assisted in 200+ cardiac catheterizations annually (sheath management, closure devices under supervision).",
          "Led heart-failure education pathway reducing 30-day HF readmissions 11% on service pilot units.",
        ],
      },
      {
        title: "Physician Assistant — Internal Medicine",
        org: "Beth Israel Deaconess",
        location: "Boston, MA",
        startDate: "2019",
        endDate: "2021",
        bullets: [
          "Hospitalist PA covering nights and weekends; cross-cover for complex medical patients.",
        ],
      },
    ],
    education: [
      {
        title: "M.S. Physician Assistant Studies",
        org: "Northeastern University",
        location: "Boston, MA",
        startDate: "2017",
        endDate: "2019",
      },
      {
        title: "B.S. Biology",
        org: "Boston University",
        location: "Boston, MA",
        startDate: "2013",
        endDate: "2017",
      },
    ],
    skills: [
      "Cardiology APP practice",
      "Inpatient management",
      "Procedural assistance",
      "Epic EHR",
      "Patient counseling",
      "Collaborative practice",
      "Evidence-based care",
      "Care transitions",
    ],
    certifications: [
      { name: "NCCPA Certified PA-C", issuer: "NCCPA", date: "2019" },
      { name: "ACLS / BLS", issuer: "AHA", date: "2025" },
    ],
    letter: {
      greeting: "Dear Cleveland Clinic Advanced Practice Recruitment,",
      paragraphs: [
        "I am applying for the Physician Assistant role at Cleveland Clinic. I practice cardiology as an APP with high inpatient volume, procedural partnership, and a focus on education that improves heart-failure outcomes.",
        "At Mass General Brigham I manage full cardiology service panels, assist in 200+ caths yearly, and helped cut HF readmissions 11% through a structured education pathway. Prior hospitalist PA work built my comfort with nights, cross-cover, and complex medical patients.",
        "Cleveland Clinic's academic cardiology environment is an ideal place to grow. I would welcome the opportunity to join your collaborative practice model.",
      ],
      closing: "Sincerely,",
    },
  },

  "kaiser-pm": {
    person: {
      name: "Riley Chen",
      email: "riley.chen.pm@email.com",
      phone: "+1 (510) 555-0186",
      linkedin: "in/rileychenpm",
    },
    summary:
      "Digital health product manager focused on member outcomes, clinical workflow fit, and compliance-aware delivery. Ships products that clinicians adopt and members trust.",
    experience: [
      {
        title: "Product Manager — Digital Health",
        org: "Teladoc Health",
        location: "San Francisco, CA",
        startDate: "2021",
        endDate: "Present",
        bullets: [
          "Key responsibilities: roadmap for chronic-care mobile experiences; HIPAA-compliant feature delivery; clinician and member research; OKRs.",
          "Shipped remote monitoring onboarding flow increasing 30-day activation from 41% to 67%.",
          "Partnered with clinical informatics on alert thresholds reducing false-positive nurse escalations 35%.",
          "Led accessibility and language expansion (ES/ZH) covering 1.1M additional eligible members.",
        ],
      },
      {
        title: "Associate Product Manager",
        org: "Oscar Health",
        location: "New York, NY",
        startDate: "2019",
        endDate: "2021",
        bullets: [
          "Owned claims-status member UX; cut related support tickets 22%.",
          "Ran quarterly discovery with care guides and PCPs to prioritize roadmap bets.",
        ],
      },
    ],
    education: [
      {
        title: "B.S. Human Biology; Product certificate",
        org: "Stanford University",
        location: "Stanford, CA",
        startDate: "2015",
        endDate: "2019",
        bullets: ["Healthcare design studio; product management fellowship"],
      },
    ],
    skills: [
      "Product management",
      "Digital health",
      "HIPAA / compliance awareness",
      "User research",
      "OKRs & metrics",
      "Clinical stakeholder management",
      "A/B testing",
      "Roadmapping",
    ],
    letter: {
      greeting: "Dear Kaiser Permanente Product Hiring Team,",
      paragraphs: [
        "I am applying for the Digital Health Product Manager role at Kaiser Permanente. I build member- and clinician-facing products where outcomes, workflow fit, and compliance are inseparable from the roadmap.",
        "At Teladoc I raised remote-monitoring activation from 41% to 67%, reduced false-positive nurse alerts 35% with informatics partners, and expanded language access for over a million members. Oscar experience taught me how claims and care-navigation UX reduces support burden while improving trust.",
        "Kaiser's integrated model is uniquely positioned to close the loop between digital and care delivery. I would love to help advance that mission.",
      ],
      closing: "Sincerely,",
    },
  },

  "pfizer-cra": {
    person: {
      name: "Ava Morales",
      email: "ava.morales@email.com",
      phone: "+1 (212) 555-0139",
      linkedin: "in/avamoralescra",
    },
    summary:
      "Clinical research associate experienced in oncology trial monitoring, GCP compliance, and site relationship management. Strong at issue escalation, SDV quality, and inspection readiness.",
    experience: [
      {
        title: "Clinical Research Associate — Oncology",
        org: "IQVIA",
        location: "New York, NY",
        startDate: "2021",
        endDate: "Present",
        bullets: [
          "Key responsibilities: site initiation/monitoring/close-out for Phase II–III oncology studies; SDV; CAPA follow-up; TMF completeness.",
          "Monitored 14 active sites across 3 protocols; 100% of visits completed within window for last 4 quarters.",
          "Identified protocol deviation trend at 2 sites; led CAPA that cleared before sponsor audit with no major findings.",
          "Trained 5 new CRAs on oncology monitoring best practices and EDC query management.",
        ],
      },
      {
        title: "Clinical Trial Assistant",
        org: "Memorial Sloan Kettering (contractor)",
        location: "New York, NY",
        startDate: "2019",
        endDate: "2021",
        bullets: [
          "Supported investigator-initiated trials; regulatory binder maintenance and visit coordination.",
        ],
      },
    ],
    education: [
      {
        title: "B.S. Biological Sciences",
        org: "Rutgers University",
        location: "New Brunswick, NJ",
        startDate: "2015",
        endDate: "2019",
        bullets: ["Clinical research certificate coursework"],
      },
    ],
    skills: [
      "GCP / ICH",
      "Oncology trials",
      "Site monitoring",
      "SDV",
      "EDC (Medidata/Rave)",
      "CAPA",
      "TMF",
      "Site relationship management",
    ],
    certifications: [
      { name: "GCP Certification", issuer: "TransCelerate-recognized", date: "2023" },
      { name: "ACRP-CP (candidate)", issuer: "ACRP", date: "2026" },
    ],
    letter: {
      greeting: "Dear Pfizer Clinical Operations Recruiting,",
      paragraphs: [
        "I am applying for the Clinical Research Associate role at Pfizer. I monitor oncology trials with rigorous GCP practice, proactive CAPA, and respectful site partnerships that keep studies inspection-ready.",
        "At IQVIA I cover 14 oncology sites across three protocols with on-time visit completion, and I led CAPA that cleared a deviation trend before sponsor audit without major findings. Earlier work at MSK grounded me in investigator-site realities.",
        "Pfizer's oncology research portfolio is where I want to deepen my impact. Thank you for considering my application.",
      ],
      closing: "Sincerely,",
    },
  },

  "jnj-qa": {
    person: {
      name: "Chris Novak",
      email: "chris.novak@email.com",
      phone: "+1 (732) 555-0174",
      linkedin: "in/chrisnovakqa",
    },
    summary:
      "Quality assurance specialist in medical devices. Experienced in CAPA, ISO 13485 systems, internal audits, and partnering with manufacturing and design for compliant, practical solutions.",
    experience: [
      {
        title: "QA Specialist — Medical Devices",
        org: "Medtronic",
        location: "Minneapolis, MN",
        startDate: "2021",
        endDate: "Present",
        bullets: [
          "Key responsibilities: CAPA ownership; nonconformance investigations; internal audit program support; change-control quality review.",
          "Closed 28 CAPAs on time over 24 months with effective verification of effectiveness (VOE) first-pass rate 93%.",
          "Led internal audit of design controls; findings remediated pre-notified body inspection with zero major NCs.",
          "Partnered with manufacturing on process validation updates reducing scrap-related NCs 19% YoY.",
        ],
      },
      {
        title: "Quality Engineer I",
        org: "Stryker",
        location: "Mahwah, NJ",
        startDate: "2019",
        endDate: "2021",
        bullets: [
          "Supported complaint investigations and risk file updates for orthopedic devices.",
        ],
      },
    ],
    education: [
      {
        title: "B.S. Biomedical Engineering",
        org: "Rutgers University",
        location: "New Brunswick, NJ",
        startDate: "2015",
        endDate: "2019",
        bullets: ["ASQ student chapter"],
      },
    ],
    skills: [
      "ISO 13485",
      "CAPA",
      "Nonconformance investigation",
      "Internal auditing",
      "Design controls awareness",
      "Change control",
      "Risk management (ISO 14971)",
      "Cross-functional partnership",
    ],
    certifications: [
      { name: "ASQ CQA", issuer: "ASQ", date: "2023" },
      { name: "ISO 13485 Internal Auditor", issuer: "Exemplar Global training", date: "2022" },
    ],
    letter: {
      greeting: "Dear Johnson & Johnson Quality Hiring Team,",
      paragraphs: [
        "I am applying for the Quality Assurance Specialist role at Johnson & Johnson. I run medical-device quality systems work—CAPA, audits, change control—that is both compliant and practical for manufacturing and design partners.",
        "At Medtronic I closed 28 CAPAs on time with strong VOE first-pass rates, remediating design-control audit findings ahead of notified-body inspection with no major nonconformances. At Stryker I learned complaint and risk-file discipline on orthopedic products.",
        "J&J's quality culture and device portfolio are a strong fit for my career. I would welcome the opportunity to contribute in New Brunswick.",
      ],
      closing: "Sincerely,",
    },
  },

  "az-medical": {
    person: {
      name: "Emily Ward",
      email: "emily.ward@email.com",
      phone: "+44 20 7946 0789",
      linkedin: "in/emilyward-medaffairs",
    },
    summary:
      "Medical affairs associate with oncology scientific exchange and evidence-generation experience. Translates clinical data for HCPs while maintaining strict compliance with UK/EU medical standards.",
    experience: [
      {
        title: "Medical Affairs Associate — Oncology",
        org: "Novartis UK",
        location: "London, UK",
        startDate: "2022",
        endDate: "Present",
        bullets: [
          "Key responsibilities: scientific exchange with KOLs; advisory board logistics; medical information review; insight collection for medical strategy.",
          "Supported 12 advisory boards; synthesised insights into quarterly medical strategy updates adopted by brand team.",
          "Co-developed evidence-gap map leading to 2 IIS concepts advanced to internal review.",
          "Reviewed 80+ promotional and medical materials for scientific accuracy under ABPI framework.",
        ],
      },
      {
        title: "Medical Science Liaison Trainee",
        org: "GSK",
        location: "Brentford, UK",
        startDate: "2020",
        endDate: "2022",
        bullets: [
          "Field medical training rotation; delivered compliant scientific presentations in respiratory TA.",
        ],
      },
    ],
    education: [
      {
        title: "M.Sc. Oncology",
        org: "University of Cambridge",
        location: "Cambridge, UK",
        startDate: "2018",
        endDate: "2019",
        bullets: ["Distinction"],
      },
      {
        title: "B.Sc. Biomedical Science",
        org: "King's College London",
        location: "London, UK",
        startDate: "2015",
        endDate: "2018",
      },
    ],
    skills: [
      "Medical affairs",
      "Scientific exchange",
      "KOL engagement",
      "Evidence generation",
      "ABPI / compliance awareness",
      "Medical review",
      "Insight synthesis",
      "Cross-functional partnership",
    ],
    languages: [
      { name: "English", proficiency: "Native" },
      { name: "Spanish", proficiency: "Conversational" },
    ],
    letter: {
      greeting: "Dear AstraZeneca Medical Affairs Hiring Team,",
      paragraphs: [
        "I am applying for the Medical Affairs Associate role at AstraZeneca. I support oncology medical strategy through compliant scientific exchange, insight synthesis, and careful medical review.",
        "At Novartis UK I have run advisory boards whose insights shaped brand medical plans, advanced IIS concepts from evidence-gap mapping, and reviewed dozens of materials under ABPI standards. GSK field training built my confidence in HCP scientific dialogue.",
        "AstraZeneca's Cambridge oncology presence and science-led culture are where I want to grow. I would be pleased to discuss how I can contribute.",
      ],
      closing: "Yours sincerely,",
    },
  },

  "nhs-cns": {
    person: {
      name: "Hannah Okoro",
      email: "hannah.okoro@email.com",
      phone: "+44 20 7946 0822",
      linkedin: "in/hannahokoro-cns",
    },
    summary:
      "Clinical nurse specialist in diabetes with experience improving MDT pathways, patient education, and service metrics within NHS frameworks. Combines advanced clinical practice with service improvement.",
    experience: [
      {
        title: "Clinical Nurse Specialist — Diabetes",
        org: "Guy's and St Thomas' NHS Foundation Trust",
        location: "London, UK",
        startDate: "2021",
        endDate: "Present",
        bullets: [
          "Key responsibilities: complex diabetes clinics; insulin pump starts; MDT coordination; pathway redesign; junior staff education.",
          "Redesigned Type 1 transition pathway with paediatrics; reduced failed first-adult-clinic attendance from 28% to 11%.",
          "Led DKA prevention education programme; DKA admissions in target cohort down 17% YoY.",
          "Supervised Band 5/6 nurses; contributed to CQC evidence pack for diabetes services.",
        ],
      },
      {
        title: "Senior Staff Nurse — Endocrinology",
        org: "King's College Hospital NHS Foundation Trust",
        location: "London, UK",
        startDate: "2018",
        endDate: "2021",
        bullets: [
          "Ward and clinic hybrid role; insulin safety champion reducing insulin-related incidents on ward.",
        ],
      },
    ],
    education: [
      {
        title: "M.Sc. Advanced Clinical Practice",
        org: "King's College London",
        location: "London, UK",
        startDate: "2019",
        endDate: "2021",
      },
      {
        title: "B.Sc. Nursing",
        org: "University of Southampton",
        location: "Southampton, UK",
        startDate: "2014",
        endDate: "2017",
      },
    ],
    skills: [
      "Diabetes specialist nursing",
      "MDT pathway design",
      "Patient education",
      "Service improvement",
      "NHS quality frameworks",
      "Clinical supervision",
      "Insulin pump therapy",
      "Audit & outcomes",
    ],
    certifications: [
      { name: "NMC Registered Nurse", issuer: "NMC", date: "2017" },
      { name: "Non-medical prescribing (V300)", issuer: "NMC annotation", date: "2022" },
    ],
    letter: {
      greeting: "Dear NHS Recruitment Panel,",
      paragraphs: [
        "I am applying for the Clinical Nurse Specialist (Diabetes) role. I combine advanced diabetes practice with service improvement—pathways, education, and measurable reductions in avoidable harm.",
        "At Guy's and St Thomas' I redesigned the Type 1 transition pathway cutting failed first-adult-clinic attendance from 28% to 11%, and led DKA prevention education linked to a 17% drop in admissions in our target cohort. I supervise junior nurses and contribute confidently to quality evidence for regulators.",
        "I am committed to NHS values and to specialist nursing that improves population outcomes. I would welcome the opportunity to discuss how I can support your diabetes service.",
      ],
      closing: "Yours sincerely,",
    },
  },
}
