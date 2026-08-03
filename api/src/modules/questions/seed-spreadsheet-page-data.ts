/**
 * Dev seed bank rows for spreadsheet + page practice surfaces.
 * Idempotent via content_hash.
 */

import type {
  PageQuestionPayload,
  SpreadsheetQuestionPayload,
} from "../../db/schema/questions.js"

export type SeedBankQuestion = {
  title: string
  body: string
  domain:
    | "coding"
    | "systemDesign"
    | "caseStudy"
    | "product"
    | "behavioral"
    | "finance"
    | "clinical"
    | "dataScience"
    | "ml"
    | "security"
    | "devops"
    | "design"
    | "consulting"
    | "marketing"
    | "sales"
  difficulty: "easy" | "medium" | "hard"
  format: "spreadsheet" | "page"
  company?: string
  tags: string[]
  roleFamilies: string[]
  payload: SpreadsheetQuestionPayload | PageQuestionPayload
}

function cell(raw: string): { raw: string } {
  return { raw }
}

/** row:col → value helper for sparse grids */
function grid(
  rows: Array<Array<string | number | null | undefined>>
): Record<string, { raw: string }> {
  const cells: Record<string, { raw: string }> = {}
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r] ?? []
    for (let c = 0; c < row.length; c++) {
      const v = row[c]
      if (v === null || v === undefined || v === "") continue
      cells[`${r}:${c}`] = cell(String(v))
    }
  }
  return cells
}

export const SPREADSHEET_PAGE_SEED_QUESTIONS: SeedBankQuestion[] = [
  // ── Excel / spreadsheet ──────────────────────────────────────────
  {
    title: "Regional sales rollup",
    body: "Complete the sales table: add region totals, overall total, and average order value.",
    domain: "dataScience",
    difficulty: "easy",
    format: "spreadsheet",
    company: "MockMatch Labs",
    tags: ["excel", "sumif", "averages", "seed"],
    roleFamilies: ["data-analyst", "business-analyst"],
    payload: {
      prompt: `You are given a small sales extract for Q1.

**Tasks**
1. In column E, compute **Line total** = Units × Unit price for each order row.
2. Below the data, build a **Region totals** block for North, South, East, West (SUM of line totals).
3. Compute **Grand total** of all line totals.
4. Compute **Average order value** (mean of line totals).

Prefer formulas over hard-coded numbers. Leave the source columns A–D as-is.`,
      durationMin: 20,
      rubric:
        "Correct line totals; region sums match filter; grand total equals sum of regions; AOV uses count of order rows only.",
      starterWorkbook: {
        version: 1,
        activeSheetId: "sales",
        sheets: [
          {
            id: "sales",
            name: "Sales",
            rowCount: 30,
            colCount: 8,
            cells: grid([
              ["Order ID", "Region", "Units", "Unit price", "Line total"],
              ["A-1001", "North", 12, 24.5, ""],
              ["A-1002", "South", 8, 31, ""],
              ["A-1003", "East", 15, 18.75, ""],
              ["A-1004", "West", 5, 42, ""],
              ["A-1005", "North", 20, 15, ""],
              ["A-1006", "South", 11, 27.5, ""],
              ["A-1007", "East", 9, 33, ""],
              ["A-1008", "West", 14, 22, ""],
              [],
              ["Region totals", "Region", "Total"],
              ["", "North", ""],
              ["", "South", ""],
              ["", "East", ""],
              ["", "West", ""],
              [],
              ["Grand total", ""],
              ["Avg order value", ""],
            ]),
          },
        ],
      },
    },
  },
  {
    title: "SaaS cohort retention table",
    body: "Fill month-0 through month-3 retention rates and chart-ready summary metrics.",
    domain: "product",
    difficulty: "medium",
    format: "spreadsheet",
    company: "Northstar SaaS",
    tags: ["retention", "cohort", "saas", "seed"],
    roleFamilies: ["product", "growth"],
    payload: {
      prompt: `Product wants a clean cohort retention sheet for the last three signup months.

**Given**
- Sheet "Cohorts": monthly new users (M0) and active users still present in M1–M3.

**Tasks**
1. On sheet **Rates**, compute retention % for each cohort × month: active / M0, formatted as decimals (e.g. 0.72).
2. Compute **blended M1 retention** = total M1 actives / total M0 across cohorts.
3. Compute **best M3 cohort** label (the cohort name with highest M3 rate). Put the name in Rates!B10.
4. Flag any M1 rate below 0.60 with the text "watch" in column F of Rates for that row.

Use formulas referencing Cohorts. Do not invent new cohort rows.`,
      durationMin: 30,
      rubric:
        "Rates = actives/M0; blended M1 correct; best M3 cohort name correct; watch flags only when M1 < 0.60.",
      starterWorkbook: {
        version: 1,
        activeSheetId: "cohorts",
        sheets: [
          {
            id: "cohorts",
            name: "Cohorts",
            rowCount: 20,
            colCount: 8,
            cells: grid([
              ["Cohort", "M0 new", "M1 active", "M2 active", "M3 active"],
              ["2025-11", 1200, 840, 720, 660],
              ["2025-12", 1500, 975, 825, 720],
              ["2026-01", 1800, 990, 810, 720],
            ]),
          },
          {
            id: "rates",
            name: "Rates",
            rowCount: 20,
            colCount: 8,
            cells: grid([
              [
                "Cohort",
                "M0 rate",
                "M1 rate",
                "M2 rate",
                "M3 rate",
                "M1 flag",
              ],
              ["2025-11", "", "", "", "", ""],
              ["2025-12", "", "", "", "", ""],
              ["2026-01", "", "", "", "", ""],
              [],
              ["Blended M1", ""],
              [],
              ["Best M3 cohort", ""],
            ]),
          },
        ],
      },
    },
  },
  {
    title: "Gross margin bridge",
    body: "Build a simple price–volume–mix bridge from last year to this year.",
    domain: "finance",
    difficulty: "hard",
    format: "spreadsheet",
    company: "Apex Industrial",
    tags: ["bridge", "margin", "finance", "seed"],
    roleFamilies: ["finance", "strategy"],
    payload: {
      prompt: `Finance needs a **gross margin bridge** from FY24 → FY25 for two products.

**Inputs** (sheet Inputs): units, ASP, COGS/unit for each product and year.

**On sheet Bridge, compute:**
1. FY24 and FY25 revenue, COGS, and gross margin $ and % for each product and total.
2. Bridge walk (total company only):
   - Start: FY24 GM $
   - Price effect (hold FY24 volume, change ASP)
   - Volume effect (hold FY25 ASP, change units)
   - Cost effect (COGS/unit change × FY25 units)
   - End: FY25 GM $
3. Check that Start + effects ≈ End (tolerance $1). Put "OK" or "MISMATCH" in Bridge!B20.

State any simplifying assumptions in a cell comment or a Notes row.`,
      durationMin: 45,
      rubric:
        "Revenue/COGS/GM correct; bridge components signed correctly; reconciliation OK; clear layout.",
      starterWorkbook: {
        version: 1,
        activeSheetId: "inputs",
        sheets: [
          {
            id: "inputs",
            name: "Inputs",
            rowCount: 20,
            colCount: 10,
            cells: grid([
              ["Product", "Year", "Units", "ASP", "COGS/unit"],
              ["Alpha", "FY24", 10000, 50, 30],
              ["Alpha", "FY25", 12000, 52, 31],
              ["Beta", "FY24", 8000, 80, 48],
              ["Beta", "FY25", 7000, 78, 45],
            ]),
          },
          {
            id: "bridge",
            name: "Bridge",
            rowCount: 40,
            colCount: 10,
            cells: grid([
              ["Metric", "Alpha FY24", "Alpha FY25", "Beta FY24", "Beta FY25", "Total FY24", "Total FY25"],
              ["Revenue", "", "", "", "", "", ""],
              ["COGS", "", "", "", "", "", ""],
              ["GM $", "", "", "", "", "", ""],
              ["GM %", "", "", "", "", "", ""],
              [],
              ["Bridge (total)", "Amount"],
              ["FY24 GM $", ""],
              ["Price effect", ""],
              ["Volume effect", ""],
              ["Cost effect", ""],
              ["FY25 GM $", ""],
              [],
              ["Reconciliation", ""],
            ]),
          },
        ],
      },
    },
  },
  {
    title: "Hiring plan headcount model",
    body: "Project monthly headcount and fully loaded cost from a hiring plan.",
    domain: "consulting",
    difficulty: "medium",
    format: "spreadsheet",
    company: "BrightPath Consulting",
    tags: ["headcount", "planning", "ops", "seed"],
    roleFamilies: ["ops", "people", "consulting"],
    payload: {
      prompt: `Ops shared a Q2 hiring plan. Model **ending headcount** and **monthly fully loaded cost**.

**Assumptions**
- Starting headcount (Apr 1): 42
- Fully loaded cost per FTE: $12,500 / month
- New hires join on the 1st of the month listed (full month cost)
- Attrition leaves on the last day (still cost that month)

**Tasks on Model sheet**
1. For Apr, May, Jun: ending HC = prior ending + hires − attrition.
2. Monthly cost = ending HC × cost per FTE (simple model; document if you choose mid-month proration instead).
3. Q2 total cost and average ending HC.
4. If any month ending HC > 55, set Capacity flag to "over".`,
      durationMin: 25,
      rubric:
        "HC rollforward correct; costs consistent with chosen policy; Q2 totals right; over-flag only when HC>55.",
      starterWorkbook: {
        version: 1,
        activeSheetId: "plan",
        sheets: [
          {
            id: "plan",
            name: "Plan",
            rowCount: 20,
            colCount: 6,
            cells: grid([
              ["Month", "Hires", "Attrition"],
              ["Apr", 4, 1],
              ["May", 6, 2],
              ["Jun", 3, 1],
              [],
              ["Starting HC (Apr 1)", 42],
              ["Fully loaded $/FTE/mo", 12500],
              ["HC soft cap", 55],
            ]),
          },
          {
            id: "model",
            name: "Model",
            rowCount: 25,
            colCount: 8,
            cells: grid([
              ["Month", "Ending HC", "Monthly cost", "Capacity flag"],
              ["Apr", "", "", ""],
              ["May", "", "", ""],
              ["Jun", "", "", ""],
              [],
              ["Q2 total cost", ""],
              ["Avg ending HC", ""],
            ]),
          },
        ],
      },
    },
  },

  // ── Document / page analysis ─────────────────────────────────────
  {
    title: "PRD risk review: offline mode",
    body: "Read the PRD excerpt and write a structured risk + open-questions memo.",
    domain: "product",
    difficulty: "easy",
    format: "page",
    company: "MockMatch Labs",
    tags: ["prd", "risks", "product", "seed"],
    roleFamilies: ["product", "eng-manager"],
    payload: {
      prompt: `Analyze the starter PRD excerpt in the document.

**Deliverable (replace the outline)**
1. **Summary** — 3–5 sentences on what ships and for whom.
2. **Top risks** — at least 4, each with likelihood/impact (H/M/L) and a mitigation.
3. **Open questions** — at least 5 for eng/design/data.
4. **Go / no-go recommendation** for an MVP behind a flag, with conditions.

Stay concrete; cite lines or section titles from the PRD when you claim a gap.`,
      durationMin: 25,
      rubric:
        "Risks specific to offline sync; questions unblocking; recommendation conditions testable.",
      starterHtml: `<h1>PRD: Offline mode for mobile field app (draft)</h1>
<p><strong>Owner:</strong> P. Chen · <strong>Target:</strong> Q3 pilot · <strong>Status:</strong> Review</p>
<h2>Problem</h2>
<p>Field techs lose connectivity in basements and rural sites. Today the app errors and forces re-entry of inspection forms. Support tickets: ~180/week tagged "offline".</p>
<h2>Goals</h2>
<ul>
<li>Allow create/edit of inspection forms without network for up to 8 hours.</li>
<li>Sync when online with conflict resolution "last writer wins" for v1.</li>
<li>Reduce offline-related tickets by 50% in pilot regions.</li>
</ul>
<h2>Non-goals (v1)</h2>
<ul>
<li>Multi-device realtime collab while offline.</li>
<li>Binary photo sync larger than 10MB/job.</li>
<li>Admin analytics for offline duration.</li>
</ul>
<h2>Users</h2>
<p>Primary: field technicians on iOS/Android. Secondary: dispatchers who reassign jobs (online only).</p>
<h2>Requirements</h2>
<ol>
<li>Local encrypted store of open jobs assigned to the user.</li>
<li>Queue of mutations with retry + exponential backoff.</li>
<li>Banner when offline; last-synced timestamp on home.</li>
<li>On conflict, keep latest <code>updatedAt</code>; log loser payload for 7 days.</li>
</ol>
<h2>Open issues (from eng)</h2>
<ul>
<li>Schema migrations while offline not designed.</li>
<li>Auth token refresh if offline &gt; token TTL (currently 1h).</li>
<li>No QA plan for dual-write during gradual rollout.</li>
</ul>
<h2>Success metrics</h2>
<p>Pilot NPS +5; ticket cut 50%; crash-free sessions ≥ 99.5%.</p>`,
    },
  },
  {
    title: "Competitive brief: scheduling tools",
    body: "Turn the research notes into a decision memo for VP Product.",
    domain: "product",
    difficulty: "medium",
    format: "page",
    company: "Calendarly Co",
    tags: ["competitive", "memo", "strategy", "seed"],
    roleFamilies: ["product", "strategy"],
    payload: {
      prompt: `You have raw competitive notes in the document.

**Write a 1-page decision memo** for VP Product with:
1. **Context** (2–3 sentences)
2. **Comparison table** (features that matter for mid-market B2B)
3. **Where we win / lose**
4. **Recommended bets** for next two quarters (max 3), each with effort (S/M/L) and impact
5. **What we should ignore** (and why)

Do not invent vendors beyond those listed. If data is missing, mark assumptions clearly.`,
      durationMin: 30,
      rubric:
        "Memo scannable; table fair; bets tied to gaps; explicit assumptions.",
      starterHtml: `<h1>Research dump — scheduling competitors (unstructured)</h1>
<p><em>Paste cleaned memo above this section or replace it.</em></p>
<h2>Us (OrbitBook)</h2>
<ul>
<li>Strength: deep Salesforce sync, custom availability rules, SOC2.</li>
<li>Weak: mobile UX dated; no round-robin by skill; AI suggestions beta only.</li>
<li>Pricing: $18/seat/mo (annual), 50-seat average deal.</li>
</ul>
<h2>Competitor A — MeetFlow</h2>
<ul>
<li>Beautiful mobile; round-robin + load balancing; weak CRM depth (HubSpot only).</li>
<li>Pricing $12–25/seat; heavy PLG.</li>
<li>Rumored Series C focus on AI note-taking bundle.</li>
</ul>
<h2>Competitor B — SlotGrid</h2>
<ul>
<li>Enterprise SSO + SCIM; multi-brand portals; slow UI.</li>
<li>Wins RFPs on security questionnaire completeness.</li>
<li>Avg deal size ~$40k ACV.</li>
</ul>
<h2>Competitor C — QuickHold</h2>
<ul>
<li>SMB only; free tier viral; no audit logs.</li>
<li>Not a threat above 20 seats, but trains buyer expectations on simplicity.</li>
</ul>
<h2>Customer quotes (win/loss)</h2>
<ul>
<li>Loss to MeetFlow: "Reps live on phones; your app feels like 2019."</li>
<li>Win vs SlotGrid: "We live in Salesforce; they wanted us to change process."</li>
<li>Churn risk: "Round-robin by language is manual via spreadsheets."</li>
</ul>`,
    },
  },
  {
    title: "Incident postmortem synthesis",
    body: "Turn a messy incident timeline into a clear postmortem with action items.",
    domain: "devops",
    difficulty: "medium",
    format: "page",
    company: "PayLedger",
    tags: ["postmortem", "sre", "incident", "seed"],
    roleFamilies: ["sre", "eng-manager"],
    payload: {
      prompt: `Using only the incident notes provided, produce a **blameless postmortem**:

Required sections:
- Title + severity + duration
- Impact (users, $ if inferable, SLOs)
- Timeline (UTC, concise)
- Root cause (technical + contributing process factors)
- What went well / poorly
- Action items table: owner role (not person names), priority, due window (e.g. 7d / 30d)
- Detection & prevention ideas

Flag any claims that are **not supported** by the notes.`,
      durationMin: 30,
      rubric:
        "Blameless tone; timeline consistent; RC mechanistic; actions specific and time-bound.",
      starterHtml: `<h1>Incident raw notes — payment webhooks (2026-03-12)</h1>
<p><strong>Pager:</strong> SEV-2 opened 14:02 UTC by oncall (payments). Mitigated 16:40 UTC. Resolved 17:15 UTC.</p>
<h2>Symptons</h2>
<ul>
<li>Customers report "paid but order stuck in pending".</li>
<li>Dashboard: webhook success rate drop 99.9% → 71% starting ~13:50 UTC.</li>
<li>Error spike: <code>SignatureInvalid</code> from provider SDK after deploy <code>pay-api@2.14.0</code>.</li>
</ul>
<h2>Timeline scraps</h2>
<ul>
<li>13:12 — deploy pay-api 2.14.0 (config: rotated webhook secret in vault, but only staging updated?).</li>
<li>13:50 — first SignatureInvalid in prod logs.</li>
<li>14:02 — page; oncall checks runbook (outdated; points to old secret path).</li>
<li>14:35 — wrong secret fixed in app config; deploy 2.14.1.</li>
<li>15:10 — backlog of webhooks replayed; 12% still fail (idempotency keys missing on retry path).</li>
<li>16:40 — manual replay script with idempotent upsert; queue drain.</li>
<li>17:15 — SEV closed; ~2.1k orders reconciled; ~40 still manual review.</li>
</ul>
<h2>Impact guesses</h2>
<ul>
<li>~2.1k delayed order confirmations; support load +3x for 3h.</li>
<li>No confirmed double charges.</li>
<li>SLO: webhook processing latency burn alert did NOT fire (threshold too loose).</li>
</ul>
<h2>People notes (tone down in final)</h2>
<p>"Deploy checklist skipped vault prod update." "Oncall new this week." "Replay tool was a one-off script in someone's laptop."</p>`,
    },
  },
  {
    title: "Policy excerpt: data retention recommendation",
    body: "Interpret a draft retention policy and recommend a practical implementation plan.",
    domain: "security",
    difficulty: "hard",
    format: "page",
    company: "HealthNest",
    tags: ["privacy", "retention", "compliance", "seed"],
    roleFamilies: ["security", "legal-adjacent", "eng-manager"],
    payload: {
      prompt: `You are advising Engineering + Privacy on the draft policy text in the document.

**Write**
1. Plain-language summary of obligations for product eng.
2. Data inventory table: system → data class → proposed retention → deletion mechanism (guess only if labeled assumption).
3. Gaps / ambiguities in the draft (numbered).
4. 30/60/90 day implementation plan with dependencies.
5. Risks if we ship analytics warehouse before policy enforcement.

Do not invent legal conclusions; phrase uncertain legal calls as questions for counsel.`,
      durationMin: 40,
      rubric:
        "Faithful to draft; gaps explicit; plan sequenced; warehouse risk concrete.",
      starterHtml: `<h1>Draft — Customer data retention policy (internal)</h1>
<p><strong>Version:</strong> 0.3 · <strong>Not legal advice</strong></p>
<h2>Purpose</h2>
<p>Define how long HealthNest keeps personal data and when it must be deleted or anonymized.</p>
<h2>Scope</h2>
<p>Applies to production systems processing end-user PHI-ish and account data in US + EU. Employee HRIS out of scope.</p>
<h2>Definitions (abbrev.)</h2>
<ul>
<li><strong>Account data:</strong> email, name, auth identifiers.</li>
<li><strong>Health content:</strong> user-entered symptoms, attachments, coach notes.</li>
<li><strong>Telemetry:</strong> product analytics events, device metadata.</li>
</ul>
<h2>Retention defaults</h2>
<ul>
<li>Account data: life of account + 30 days after deletion request.</li>
<li>Health content: life of account; on deletion request, purge within 45 days unless legal hold.</li>
<li>Telemetry: 24 months, then aggregate or delete.</li>
<li>Backups: rolling 35 days; deleted user data may linger until backup expiry.</li>
<li>Security logs: 12 months.</li>
</ul>
<h2>User rights</h2>
<p>Deletion and export requests via in-app flow. Support may open tickets; SLA 30 days to complete. EU users: additional contact channel TBD.</p>
<h2>Exceptions</h2>
<ul>
<li>Legal holds freeze deletion.</li>
<li>Fraud cases may retain limited account data up to 2 years.</li>
<li>Anonymized research datasets may be retained indefinitely if re-identification risk is "low" (process undefined).</li>
</ul>
<h2>Open comments from counsel</h2>
<ul>
<li>Confirm whether coach notes are PHI under our threat model.</li>
<li>Warehouse replicas in third region not listed.</li>
<li>"Low" re-id standard needs a written test.</li>
</ul>`,
    },
  },
]
