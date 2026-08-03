import type { RoleSeed } from "../types"

/** 12 tech role templates — unique achievements per employer/role. */
export const TECH_SEEDS: Record<string, RoleSeed> = {
  "google-swe": {
    person: {
      name: "Jordan Lee",
      email: "jordan.lee@email.com",
      phone: "+1 (650) 555-0142",
      linkedin: "in/jordanlee",
      website: "jordanlee.dev",
    },
    summary:
      "Software engineer focused on distributed systems and large-scale reliability. Shipped multi-region services, cut p99 latency with careful profiling, and partnered with product and SRE on capacity and incident response.",
    experience: [
      {
        title: "Software Engineer",
        org: "Stripe",
        location: "San Francisco, CA",
        startDate: "2022",
        endDate: "Present",
        bullets: [
          "Key responsibilities: owned idempotent payment-orchestration services (Java/Go); on-call for critical path; wrote design docs for multi-region failover.",
          "Cut p99 latency on a high-QPS ledger path 38% by eliminating hot keys and introducing request coalescing.",
          "Reduced Sev-2 pages ~45% via better SLOs, runbooks, and circuit-breaking on dependency timeouts.",
          "Mentored 3 engineers on design reviews; raised bar on load testing before GA.",
        ],
      },
      {
        title: "Software Engineer",
        org: "Dropbox",
        location: "San Francisco, CA",
        startDate: "2019",
        endDate: "2022",
        bullets: [
          "Built metadata indexing pipeline handling 2B+ objects; improved search freshness from hours to minutes.",
          "Led migration of a monolith module to gRPC microservices with zero customer-visible downtime.",
          "Partnered with security on authz checks for shared-link edge cases.",
        ],
      },
      {
        title: "Software Engineering Intern",
        org: "Microsoft",
        location: "Redmond, WA",
        startDate: "2018",
        endDate: "2018",
        bullets: [
          "Shipped Azure monitor dashboard widgets used by 50+ internal teams during intern season.",
        ],
      },
    ],
    education: [
      {
        title: "B.S. Computer Science",
        org: "Stanford University",
        location: "Stanford, CA",
        startDate: "2015",
        endDate: "2019",
        bullets: ["Coursework: distributed systems, algorithms, databases", "Teaching assistant: CS110"],
      },
    ],
    skills: [
      "Go",
      "Java",
      "C++",
      "Python",
      "gRPC",
      "Kubernetes",
      "Spanner / Bigtable-style stores",
      "System design",
      "SLOs & on-call",
      "Load testing",
    ],
    projects: [
      {
        title: "Open-source rate limiter library",
        org: "Personal",
        location: "Remote",
        startDate: "2023",
        endDate: "2024",
        bullets: [
          "Token-bucket + sliding-window library with 1.2k GitHub stars; used in two production services at prior employer.",
        ],
      },
    ],
    letter: {
      greeting: "Dear Google Engineering Hiring Team,",
      paragraphs: [
        "I am applying for the Software Engineer role at Google. I build distributed backend systems where correctness, latency, and operability matter as much as feature velocity—and I want to bring that craft to Google-scale products.",
        "At Stripe I own services on the payment orchestration path: multi-region failover design, idempotency guarantees, and incident response. I reduced p99 latency 38% on a hot ledger path and cut Sev-2 noise roughly in half through clearer SLOs and dependency isolation. Earlier at Dropbox I moved a monolith slice to gRPC services and built an indexing pipeline over billions of objects.",
        "I am energized by Google's bar for system design, code quality, and long-term maintainability. I would welcome the chance to discuss how my experience with large-scale services and cross-functional delivery could contribute to your team.",
      ],
      closing: "Sincerely,",
    },
  },

  "amazon-sde": {
    person: {
      name: "Taylor Brooks",
      email: "taylor.brooks@email.com",
      phone: "+1 (206) 555-0133",
      linkedin: "in/taylorbrooks",
    },
    summary:
      "Backend SDE who writes customer-obsessed services with hard metrics. Comfortable with ownership end-to-end: design, implementation, operational excellence, and bias for action under ambiguous requirements.",
    experience: [
      {
        title: "Software Development Engineer",
        org: "Expedia Group",
        location: "Seattle, WA",
        startDate: "2021",
        endDate: "Present",
        bullets: [
          "Key responsibilities: owned booking-availability APIs (Java, AWS); defined SLAs; drove postmortems with customer impact framing.",
          "Improved cache hit rate from 71% to 94% on inventory reads → 22% lower p95 latency and ~$180k/year compute savings.",
          "Delivered self-service tooling that cut partner onboarding time from 3 weeks to 4 days (Dive Deep + Deliver Results).",
          "Led design review for multi-tenant rate limits after a noisy-neighbor incident; zero repeats in 9 months.",
        ],
      },
      {
        title: "Software Engineer",
        org: "Zillow",
        location: "Seattle, WA",
        startDate: "2019",
        endDate: "2021",
        bullets: [
          "Built event-driven pricing pipeline (Kafka + Spark) processing 50M events/day with exactly-once sinks.",
          "Owned on-call rotation improvements: runbooks, synthetic canaries, and reduced MTTR 30%.",
        ],
      },
    ],
    education: [
      {
        title: "B.S. Computer Science",
        org: "University of Washington",
        location: "Seattle, WA",
        startDate: "2015",
        endDate: "2019",
        bullets: ["ACM ICPC regional finalist", "Capstone: real-time recommendation service"],
      },
    ],
    skills: [
      "Java",
      "Kotlin",
      "AWS (ECS, DynamoDB, SQS, S3)",
      "Kafka",
      "SQL",
      "Distributed systems",
      "Operational excellence",
      "Unit & integration testing",
    ],
    letter: {
      greeting: "Dear Amazon Recruiting Team,",
      paragraphs: [
        "I am writing to apply for the Software Development Engineer role at Amazon. I build backend services with customer outcomes and operational excellence front and center—the same bar I see in Amazon's Leadership Principles.",
        "At Expedia Group I own booking-availability APIs: I improved cache hit rate to 94%, cut p95 latency 22%, and shipped partner onboarding tooling that compressed a three-week process to four days. I frame trade-offs in customer impact, write clear design docs, and treat on-call as a product: better canaries and runbooks reduced MTTR 30% in a prior role at Zillow.",
        "Amazon's ownership culture and scale are a strong fit for how I work. I would be excited to dive deep on your team's hardest reliability and customer problems.",
      ],
      closing: "Best regards,",
    },
  },

  "microsoft-swe": {
    person: {
      name: "Priya Nair",
      email: "priya.nair@email.com",
      phone: "+1 (425) 555-0198",
      linkedin: "in/priyanair",
    },
    summary:
      "Cloud platform engineer specializing in multi-tenant services, developer tooling, and collaboration features. Track record of shipping Azure-scale reliability improvements and partnering across product, design, and support.",
    experience: [
      {
        title: "Software Engineer",
        org: "Adobe",
        location: "Seattle, WA",
        startDate: "2021",
        endDate: "Present",
        bullets: [
          "Key responsibilities: owned Creative Cloud collaboration APIs; multi-tenant isolation; feature flags and gradual rollouts.",
          "Shipped real-time co-editing presence service (TypeScript/Node + Redis) used by 4M monthly active creators.",
          "Reduced cold-start latency for serverless workers 55% via snapshot warm pools and connection reuse.",
          "Partnered with support on diagnostics; cut P1 escalation volume 28% with better structured logs and tenant drill-downs.",
        ],
      },
      {
        title: "Software Engineer",
        org: "Salesforce",
        location: "Bellevue, WA",
        startDate: "2018",
        endDate: "2021",
        bullets: [
          "Built internal platform for feature experimentation serving 200+ product teams.",
          "Led migration from custom auth middleware to OAuth2/OIDC with zero production auth outages.",
        ],
      },
    ],
    education: [
      {
        title: "B.S. Computer Science",
        org: "University of Illinois Urbana-Champaign",
        location: "Urbana, IL",
        startDate: "2014",
        endDate: "2018",
        bullets: ["James Scholar", "Research assistant: distributed databases lab"],
      },
    ],
    skills: [
      "C#",
      "TypeScript",
      "Azure / cloud services",
      ".NET",
      "Node.js",
      "Redis",
      "Kubernetes",
      "Observability",
      "Feature flags",
      "API design",
    ],
    letter: {
      greeting: "Dear Microsoft Hiring Manager,",
      paragraphs: [
        "I am applying for the Software Engineer role at Microsoft. I build multi-tenant cloud services that millions of people rely on daily, with a strong bias toward developer experience, gradual delivery, and measurable reliability.",
        "At Adobe I own collaboration APIs for Creative Cloud: I shipped a real-time presence service for 4M monthly users and cut serverless cold starts 55%. Earlier at Salesforce I built experimentation platform primitives used across hundreds of teams and led an auth migration without customer-facing outages.",
        "Microsoft's Azure and productivity platforms sit at the intersection of scale and collaboration that I care about most. I would love to help your team ship dependable cloud features with clear customer impact.",
      ],
      closing: "Sincerely,",
    },
  },

  "meta-frontend": {
    person: {
      name: "Chris Alvarez",
      email: "chris.alvarez@email.com",
      phone: "+1 (650) 555-0177",
      linkedin: "in/chrisalvarez",
      website: "chrisalvarez.dev",
    },
    summary:
      "Frontend engineer specializing in React performance, design systems, and product metrics. Ships polished UI at scale with Web Vitals discipline and strong product partnership.",
    experience: [
      {
        title: "Frontend Engineer",
        org: "Airbnb",
        location: "San Francisco, CA",
        startDate: "2021",
        endDate: "Present",
        bullets: [
          "Key responsibilities: owned booking-flow web surfaces (React/TypeScript); design-system contributions; A/B experiment instrumentation.",
          "Improved LCP on mobile booking funnel 1.4s → 0.9s via route-based code splitting, image priority, and critical CSS.",
          "Built accessible date-picker redesign used across 12 product surfaces; +6% conversion on experiment holdout.",
          "Led Web Vitals dashboard for product org; unblocked 8 teams with shared perf budgets and lint rules.",
        ],
      },
      {
        title: "Frontend Engineer",
        org: "Pinterest",
        location: "San Francisco, CA",
        startDate: "2019",
        endDate: "2021",
        bullets: [
          "Shipped infinite-scroll home feed optimizations reducing JS main-thread blocking 35%.",
          "Contributed to design system components with full keyboard and screen-reader coverage.",
        ],
      },
    ],
    education: [
      {
        title: "B.S. Computer Science",
        org: "UC Berkeley",
        location: "Berkeley, CA",
        startDate: "2015",
        endDate: "2019",
        bullets: ["HCI electives; leader of web-dev student org"],
      },
    ],
    skills: [
      "React",
      "TypeScript",
      "JavaScript",
      "CSS / Tailwind",
      "Web Vitals",
      "GraphQL",
      "Jest / Playwright",
      "Accessibility (WCAG)",
      "Design systems",
      "A/B testing",
    ],
    projects: [
      {
        title: "Open-source React virtualization helpers",
        org: "Personal",
        location: "Remote",
        startDate: "2022",
        endDate: "2024",
        bullets: ["Utilities for large lists; weekly npm downloads ~8k."],
      },
    ],
    letter: {
      greeting: "Dear Meta Recruiting,",
      paragraphs: [
        "I am applying for the Frontend Engineer role at Meta. I build product UIs where milliseconds and accessibility both matter—and I measure impact with Web Vitals and experiment results, not just screenshots.",
        "At Airbnb I own booking-flow web: I improved mobile LCP from 1.4s to 0.9s, shipped an accessible date-picker that lifted conversion 6% in experiment, and scaled perf budgets across eight product teams. At Pinterest I optimized feed scrolling and contributed fully keyboard-accessible design-system components.",
        "Meta's product craft and scale are exactly where I want to apply this skill set. I would welcome a conversation about how I can help ship fast, inclusive frontend experiences.",
      ],
      closing: "Best,",
    },
  },

  "apple-ios": {
    person: {
      name: "Morgan Blake",
      email: "morgan.blake@email.com",
      phone: "+1 (408) 555-0112",
      linkedin: "in/morganblake",
    },
    summary:
      "iOS engineer focused on SwiftUI/UIKit craft, privacy-preserving product features, and accessibility. Ships consumer-quality apps with attention to performance, battery, and inclusive design.",
    experience: [
      {
        title: "iOS Engineer",
        org: "Square (Block)",
        location: "San Francisco, CA",
        startDate: "2021",
        endDate: "Present",
        bullets: [
          "Key responsibilities: owned consumer Cash App iOS modules (Swift); offline-first sync; App Store release ownership.",
          "Rebuilt onboarding with SwiftUI + accessibility audit → VoiceOver path coverage 100%; +9% completion rate.",
          "Reduced main-thread hangs 40% on home feed via Instruments profiling and list diffing improvements.",
          "Implemented privacy-preserving analytics consent flows aligned with App Tracking Transparency guidelines.",
        ],
      },
      {
        title: "iOS Engineer",
        org: "Lyft",
        location: "San Francisco, CA",
        startDate: "2018",
        endDate: "2021",
        bullets: [
          "Shipped map and trip modules with battery-conscious location usage; cut background energy impact ~25%.",
          "Drove modularization of a 1.2M-line app into feature frameworks for faster CI.",
        ],
      },
    ],
    education: [
      {
        title: "B.S. Computer Science",
        org: "Carnegie Mellon University",
        location: "Pittsburgh, PA",
        startDate: "2014",
        endDate: "2018",
        bullets: ["Mobile app studio; independent study in HCI"],
      },
    ],
    skills: [
      "Swift",
      "SwiftUI",
      "UIKit",
      "Combine",
      "Core Data",
      "Instruments",
      "Accessibility",
      "App Store releases",
      "XCTest",
      "Privacy & ATT",
    ],
    certifications: [
      {
        name: "Apple Developer Program",
        issuer: "Apple",
        date: "2019",
      },
    ],
    letter: {
      greeting: "Dear Apple Recruiting Team,",
      paragraphs: [
        "I am applying for the iOS Engineer role at Apple. I build consumer iOS experiences with the same priorities I associate with Apple products: craft, privacy, accessibility, and performance under real-device constraints.",
        "At Block (Cash App) I own major iOS modules: I rebuilt onboarding with full VoiceOver coverage and a 9% completion lift, cut main-thread hangs 40% on a critical feed, and implemented ATT-aligned consent flows. Previously at Lyft I optimized location battery impact and modularized a large codebase for faster delivery.",
        "I would be proud to contribute to Apple's product bar—shipping software people trust with their daily lives.",
      ],
      closing: "Sincerely,",
    },
  },

  "netflix-backend": {
    person: {
      name: "Devon Park",
      email: "devon.park@email.com",
      phone: "+1 (310) 555-0164",
      linkedin: "in/devonpark",
    },
    summary:
      "Senior backend engineer specializing in multi-region platform services, chaos readiness, and cost-aware architecture. Leads designs for high-availability systems with clear operational ownership.",
    experience: [
      {
        title: "Senior Software Engineer",
        org: "Uber",
        location: "San Francisco, CA",
        startDate: "2020",
        endDate: "Present",
        bullets: [
          "Key responsibilities: tech lead for marketplace platform APIs; multi-region active-active; capacity planning and cost reviews.",
          "Designed failover for a critical dispatch dependency; survived regional AZ loss with <0.01% error budget burn.",
          "Drove chaos experiments quarterly; uncovered 4 latent failure modes before production incidents.",
          "Reduced cloud spend ~$1.2M/year on a hot path via smarter caching, batching, and right-sizing.",
        ],
      },
      {
        title: "Software Engineer",
        org: "LinkedIn",
        location: "Sunnyvale, CA",
        startDate: "2016",
        endDate: "2020",
        bullets: [
          "Built feed ranking serving layer handling 100k+ QPS with strict p99 budgets.",
          "Mentored junior engineers; ran design-review guild for backend org.",
        ],
      },
    ],
    education: [
      {
        title: "M.S. Computer Science",
        org: "Georgia Institute of Technology",
        location: "Atlanta, GA",
        startDate: "2014",
        endDate: "2016",
        bullets: ["Specialization: computing systems"],
      },
      {
        title: "B.S. Computer Science",
        org: "University of Texas at Austin",
        location: "Austin, TX",
        startDate: "2010",
        endDate: "2014",
      },
    ],
    skills: [
      "Java",
      "Go",
      "Cassandra / EVCache-style caches",
      "Kafka",
      "Multi-region design",
      "Chaos engineering",
      "Cost optimization",
      "Tech leadership",
      "SLOs",
    ],
    letter: {
      greeting: "Dear Netflix Engineering Team,",
      paragraphs: [
        "I am applying for the Senior Backend Engineer role at Netflix. I lead multi-region platform work where availability, chaos readiness, and cost discipline are first-class product requirements—not afterthoughts.",
        "As a tech lead at Uber I own marketplace platform APIs: active-active regional design, capacity planning, and quarterly chaos experiments that found latent failures before customers did. I also drove ~$1.2M annual cloud savings on a hot path without sacrificing p99 latency. Earlier at LinkedIn I built high-QPS serving layers under strict latency budgets.",
        "Netflix's reputation for freedom and responsibility, and for platform excellence at global scale, is a strong match for how I work. I would welcome discussing how I can strengthen reliability and velocity on your team.",
      ],
      closing: "Regards,",
    },
  },

  "nvidia-cuda": {
    person: {
      name: "Riley Quinn",
      email: "riley.quinn@email.com",
      phone: "+1 (408) 555-0188",
      linkedin: "in/rileyquinn",
    },
    summary:
      "Systems engineer specializing in GPU compute, CUDA kernel optimization, and high-performance profiling. Delivers measurable throughput and memory-efficiency gains on ML and HPC workloads.",
    experience: [
      {
        title: "GPU Software Engineer",
        org: "AMD",
        location: "Santa Clara, CA",
        startDate: "2021",
        endDate: "Present",
        bullets: [
          "Key responsibilities: optimized GPU kernels for ML training libraries; profiling with Nsight/rocprof; customer performance escalations.",
          "Rewrote attention kernel paths achieving 1.8× throughput on target workloads vs. prior baseline.",
          "Reduced HBM pressure 30% via better tiling and shared-memory staging for large GEMMs.",
          "Published internal playbooks for occupancy analysis used by 20+ engineers across teams.",
        ],
      },
      {
        title: "HPC Software Engineer",
        org: "Intel",
        location: "Hillsboro, OR",
        startDate: "2018",
        endDate: "2021",
        bullets: [
          "Ported scientific simulation kernels to GPU; 4× speedup over CPU baseline on production meshes.",
          "Built automated regression suite catching performance cliffs >5% on CI.",
        ],
      },
    ],
    education: [
      {
        title: "M.S. Electrical Engineering",
        org: "University of Illinois Urbana-Champaign",
        location: "Urbana, IL",
        startDate: "2016",
        endDate: "2018",
        bullets: ["Thesis: parallel sparse solvers on accelerators"],
      },
      {
        title: "B.S. Computer Engineering",
        org: "Purdue University",
        location: "West Lafayette, IN",
        startDate: "2012",
        endDate: "2016",
      },
    ],
    skills: [
      "CUDA",
      "C/C++",
      "GPU architecture",
      "Nsight Systems / Compute",
      "Python",
      "PyTorch extensions",
      "Performance modeling",
      "HPC",
      "Linux",
    ],
    letter: {
      greeting: "Dear NVIDIA Hiring Team,",
      paragraphs: [
        "I am applying for the CUDA Systems Engineer role at NVIDIA. I optimize GPU kernels and libraries for real throughput and memory efficiency—and I care as much about profiling methodology as about peak FLOPS claims.",
        "At AMD I rewrote attention-related kernel paths for a 1.8× throughput win and cut HBM pressure 30% on large GEMMs. I also scaled performance know-how via internal occupancy playbooks. Previously at Intel I accelerated scientific kernels 4× and built CI that catches performance regressions early.",
        "NVIDIA sits at the center of the compute stack I want to deepen. I would be excited to contribute to CUDA performance and developer-facing systems that define the industry bar.",
      ],
      closing: "Sincerely,",
    },
  },

  "stripe-backend": {
    person: {
      name: "Avery Kim",
      email: "avery.kim@email.com",
      phone: "+1 (415) 555-0144",
      linkedin: "in/averykim",
    },
    summary:
      "Backend engineer focused on payments correctness, idempotency, and auditability. Builds financial systems with strong testing culture and clear operational controls.",
    experience: [
      {
        title: "Backend Engineer",
        org: "Plaid",
        location: "San Francisco, CA",
        startDate: "2021",
        endDate: "Present",
        bullets: [
          "Key responsibilities: owned money-movement ledger services; reconciliation jobs; partner API correctness reviews.",
          "Designed idempotent transfer APIs eliminating double-post incidents after retries (zero repeats post-fix).",
          "Built reconciliation pipeline detecting $ mismatches within 5 minutes; reduced manual ops load 60%.",
          "Introduced property-based tests for ledger invariants; caught 3 production-risk bugs pre-launch.",
        ],
      },
      {
        title: "Software Engineer",
        org: "Coinbase",
        location: "San Francisco, CA",
        startDate: "2019",
        endDate: "2021",
        bullets: [
          "Shipped withdrawal risk controls reducing false positives 25% while holding fraud loss flat.",
          "Owned SOC2 evidence automation for critical payment paths.",
        ],
      },
    ],
    education: [
      {
        title: "B.S. Computer Science",
        org: "Cornell University",
        location: "Ithaca, NY",
        startDate: "2015",
        endDate: "2019",
        bullets: ["Systems & security focus; fintech club"],
      },
    ],
    skills: [
      "Ruby",
      "Go",
      "PostgreSQL",
      "Redis",
      "Idempotency patterns",
      "Distributed transactions",
      "Reconciliation",
      "API design",
      "Testing culture",
      "Audit logging",
    ],
    letter: {
      greeting: "Dear Stripe Hiring Team,",
      paragraphs: [
        "I am applying for the Backend Engineer role at Stripe. I build payment and money-movement systems where correctness, idempotency, and audit trails are non-negotiable—exactly the culture Stripe is known for.",
        "At Plaid I own ledger-adjacent services: I designed idempotent transfer APIs that eliminated double-post bugs under retries, and built reconciliation that surfaces mismatches in minutes rather than hours. Property-based testing for ledger invariants caught serious bugs before launch. At Coinbase I shipped risk controls and audit automation for regulated money paths.",
        "I would love to help Stripe raise the bar on financial infrastructure that developers and businesses trust worldwide.",
      ],
      closing: "Sincerely,",
    },
  },

  "bloomberg-swe": {
    person: {
      name: "Alex Morgan",
      email: "alex.morgan@email.com",
      phone: "+1 (212) 555-0190",
      linkedin: "in/alexmorgan",
    },
    summary:
      "Software engineer specializing in low-latency market data and high-reliability financial infrastructure. Strong in C++/Java systems programming, performance measurement, and trading-adjacent correctness.",
    experience: [
      {
        title: "Software Engineer",
        org: "Two Sigma",
        location: "New York, NY",
        startDate: "2021",
        endDate: "Present",
        bullets: [
          "Key responsibilities: market-data ingestion and normalization (C++); tick-to-book latency budgets; feed handler ownership.",
          "Cut end-to-end tick processing latency p99 from 180µs to 95µs via lock-free queues and NUMA-aware allocation.",
          "Built gap-detection for exchange feeds reducing silent data loss incidents to zero over 12 months.",
          "Partnered with quants on schema evolution without breaking historical research pipelines.",
        ],
      },
      {
        title: "Software Engineer",
        org: "Jane Street (contract/project)",
        location: "New York, NY",
        startDate: "2019",
        endDate: "2021",
        bullets: [
          "Implemented high-throughput order-book simulators for strategy backtests in OCaml/C++ hybrid stack.",
          "Automated performance regression gates on CI for critical paths.",
        ],
      },
    ],
    education: [
      {
        title: "B.S. Computer Science",
        org: "Columbia University",
        location: "New York, NY",
        startDate: "2015",
        endDate: "2019",
        bullets: ["Systems track; quant finance club"],
      },
    ],
    skills: [
      "C++",
      "Java",
      "Linux performance",
      "Market data protocols",
      "Low-latency design",
      "Multithreading",
      "SQL",
      "Python",
      "Profiling",
    ],
    letter: {
      greeting: "Dear Bloomberg Engineering Recruiting,",
      paragraphs: [
        "I am applying for the Software Engineer role at Bloomberg. I build low-latency market-data systems where microseconds and data integrity decide whether research and trading workflows can trust the feed.",
        "At Two Sigma I own feed handling and normalization: I reduced p99 tick processing from 180µs to 95µs and eliminated silent data-loss incidents with robust gap detection. I work closely with consumers of market data so schema and performance changes do not break research pipelines.",
        "Bloomberg Terminal and market-data products sit at the heart of the industry I care about. I would be excited to contribute engineering depth to your platforms.",
      ],
      closing: "Sincerely,",
    },
  },

  "atlassian-fullstack": {
    person: {
      name: "Harper Walsh",
      email: "harper.walsh@email.com",
      phone: "+61 2 5550 2211",
      linkedin: "in/harperwalsh",
    },
    summary:
      "Full-stack engineer building B2B SaaS product features end-to-end. Strong in React frontends, Node/Java backends, and shipping reliable cloud features with product and design partners.",
    experience: [
      {
        title: "Full-Stack Engineer",
        org: "Canva",
        location: "Sydney, NSW",
        startDate: "2021",
        endDate: "Present",
        bullets: [
          "Key responsibilities: owned team-collaboration features (React + Node); feature flags; customer feedback loops with PMs.",
          "Shipped shared-folder permissions model used by 2M+ teams; zero critical authz bugs in first 6 months post-GA.",
          "Cut page TTI 25% on project list via GraphQL query batching and selective hydration.",
          "Led RFCs for multi-product identity linking; unblocked 3 roadmap bets across orgs.",
        ],
      },
      {
        title: "Software Engineer",
        org: "Afterpay",
        location: "Melbourne, VIC",
        startDate: "2019",
        endDate: "2021",
        bullets: [
          "Built merchant dashboard modules (React/TypeScript) and payment status APIs.",
          "Improved CI reliability from 82% to 97% green on main via flaky-test quarantine program.",
        ],
      },
    ],
    education: [
      {
        title: "B.S. Computer Science",
        org: "University of New South Wales",
        location: "Sydney, NSW",
        startDate: "2015",
        endDate: "2018",
        bullets: ["First Class Honours; software engineering studio"],
      },
    ],
    skills: [
      "TypeScript",
      "React",
      "Node.js",
      "Java",
      "GraphQL",
      "PostgreSQL",
      "AWS",
      "Feature flags",
      "Product engineering",
      "CI/CD",
    ],
    letter: {
      greeting: "Dear Atlassian Hiring Team,",
      paragraphs: [
        "I am applying for the Full-Stack Engineer role at Atlassian. I ship B2B product features end-to-end—UI, API, permissions, and operational readiness—with a strong product partnership mindset.",
        "At Canva I owned collaboration surfaces used by millions of teams: a shared-folder permissions model that stayed clean of critical authz issues post-launch, and performance work that cut project-list TTI 25%. Earlier at Afterpay I built merchant dashboards and raised CI reliability dramatically through disciplined test hygiene.",
        "Atlassian's tools sit at the center of how teams build software. I would love to help make Jira, Confluence, or adjacent products faster and more delightful for customers worldwide—from our Sydney backyard and beyond.",
      ],
      closing: "Kind regards,",
    },
  },

  "canva-frontend": {
    person: {
      name: "Mia Tran",
      email: "mia.tran@email.com",
      phone: "+61 2 5550 3344",
      linkedin: "in/miatran",
    },
    summary:
      "Frontend engineer specializing in canvas performance, design systems, and internationalization. Builds creative tools that feel instant and inclusive across devices and locales.",
    experience: [
      {
        title: "Frontend Engineer",
        org: "Figma (remote AU)",
        location: "Sydney, NSW",
        startDate: "2022",
        endDate: "Present",
        bullets: [
          "Key responsibilities: editor chrome and canvas interactions (TypeScript); design-system primitives; i18n for major locales.",
          "Optimized multi-select transform path reducing jank on large boards; 60fps sustained on mid-tier laptops.",
          "Shipped design-token system adopted by 15 product surfaces; cut visual inconsistency bugs ~40%.",
          "Led RTL and CJK typography fixes improving layout quality for Arabic and Japanese markets.",
        ],
      },
      {
        title: "Frontend Engineer",
        org: "SafetyCulture",
        location: "Sydney, NSW",
        startDate: "2019",
        endDate: "2022",
        bullets: [
          "Built inspection editor UI with offline-first sync for field workers.",
          "Introduced Storybook + visual regression testing reducing UI regressions 50%.",
        ],
      },
    ],
    education: [
      {
        title: "B.IT Software Engineering",
        org: "University of Sydney",
        location: "Sydney, NSW",
        startDate: "2015",
        endDate: "2018",
        bullets: ["Distinction average; HCI elective stream"],
      },
    ],
    skills: [
      "TypeScript",
      "React",
      "Canvas / WebGL basics",
      "Design systems",
      "i18n / l10n",
      "Performance profiling",
      "Accessibility",
      "Storybook",
      "CSS architecture",
    ],
    letter: {
      greeting: "Dear Canva Hiring Team,",
      paragraphs: [
        "I am applying for the Frontend Engineer role at Canva. I build creative-tool UIs where canvas performance, design-system consistency, and global localization decide whether millions of people can create without friction.",
        "In my current role working on design-editor surfaces I kept multi-select transforms at 60fps on large boards, shipped a design-token system across 15 surfaces, and fixed RTL/CJK layout issues that mattered for international growth. At SafetyCulture I built offline-capable editor UI and instituted visual regression testing that halved UI regressions.",
        "Canva's mission—empowering the world to design—aligns with the product craft I love. I would be excited to contribute from Sydney to that ambition.",
      ],
      closing: "Kind regards,",
    },
  },

  "deepmind-research-eng": {
    person: {
      name: "Amelia Croft",
      email: "amelia.croft@email.com",
      phone: "+44 20 7946 0958",
      linkedin: "in/ameliacroft",
    },
    summary:
      "Research engineer bridging ML research and production systems. Builds evaluation harnesses, scalable training infrastructure, and reproducible experiment pipelines for large models.",
    experience: [
      {
        title: "Research Engineer",
        org: "DeepL",
        location: "London, UK",
        startDate: "2021",
        endDate: "Present",
        bullets: [
          "Key responsibilities: training infrastructure for multilingual models; evaluation suites; research–product handoff.",
          "Built distributed training stack (PyTorch + custom data loaders) improving GPU util from 62% to 88%.",
          "Designed human+auto eval framework for translation quality; reduced offline-online metric gap 35%.",
          "Co-authored internal tech report on efficient fine-tuning; adopted by 3 research pods.",
        ],
      },
      {
        title: "Machine Learning Engineer",
        org: "Graphcore",
        location: "Bristol, UK",
        startDate: "2018",
        endDate: "2021",
        bullets: [
          "Optimized model graph compilation paths cutting iteration time 2× for research customers.",
          "Open-sourced example training scripts used in external workshops.",
        ],
      },
    ],
    education: [
      {
        title: "M.Sc. Machine Learning",
        org: "University College London",
        location: "London, UK",
        startDate: "2016",
        endDate: "2017",
        bullets: ["Distinction; thesis on sequence models"],
      },
      {
        title: "M.Eng. Computer Science",
        org: "University of Cambridge",
        location: "Cambridge, UK",
        startDate: "2012",
        endDate: "2016",
      },
    ],
    skills: [
      "Python",
      "PyTorch",
      "JAX (working knowledge)",
      "Distributed training",
      "Evaluation design",
      "CUDA basics",
      "Experiment tracking",
      "Scientific writing",
      "Linux / HPC clusters",
    ],
    languages: [
      { name: "English", proficiency: "Native" },
      { name: "French", proficiency: "Professional" },
    ],
    letter: {
      greeting: "Dear Google DeepMind Hiring Team,",
      paragraphs: [
        "I am applying for the Research Engineer role at Google DeepMind. I sit at the interface of research ambition and production-grade ML systems: training infrastructure, rigorous evaluation, and reproducible experiments that let ideas become reliable models.",
        "At DeepL I improved GPU utilisation from 62% to 88% on multilingual training jobs and built evaluation frameworks that tightened the offline-to-online quality gap. At Graphcore I accelerated researcher iteration with better compilation and tooling. I am comfortable reading papers, implementing baselines carefully, and hardening systems so results hold under scale.",
        "DeepMind's research culture and impact on science and products are a compelling fit. I would welcome the opportunity to contribute engineering excellence to your teams in London.",
      ],
      closing: "Yours sincerely,",
    },
  },
}
