# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: mid-career tech job seekers actively applying (software/product-leaning), who need one place to improve materials, find and track roles, practice interviews, and know what to do next.

Docs site (`docs.mockmatch.ai`) audience: the same candidates (signed-in or pre-signup) looking for **product help** — how MockMatch works and which surface to use for their next prep step. Public career guides (resume/cover letter craft) ship under the same site (`docs/content/docs/guides/`).

Secondary audiences appear in product copy (consulting, healthcare) but are not the optimization target for workflows, simulations, or density of practice formats.

## Product Purpose

MockMatch is an interview-prep workspace. It helps candidates sharpen resumes and cover letters, discover and track jobs, practice in interview-like environments, and read readiness/performance signals so prep stays organized from application toward offer.

Success: the candidate always knows the next high-leverage action (document fix, job fit, practice session, or application stage move) without juggling separate tools.

Docs success: a visitor can find the product area they need, understand what it does, and complete common how-tos — without inventing marketing claims or unfinished feature depth.

## Positioning

One end-to-end prep loop competitors cannot honestly claim as a single product: **documents → jobs → practice → readiness**. ATS/general health scoring, job-specific fit documents, application tracking, multi-format simulations (code-run, workspace, terminal, conversation tracks), and a readiness signal that points to next steps live in one calm workspace—not a resume-only tool, not practice-only, not a bare ATS checker.

Docs positioning: product documentation of that loop, not a generic career blog and not an API reference (unless later expanded).

## Operating Context

- Signed-in dashboard with icon-rail areas: Applications, Practice, Insights, Automation, Help & support.
- Document work: Resume Lab and Cover Letters (list → templates/import → canvas editor → history, collab share, PDF export, in-editor AI rail).
- Jobs: Discover (search/browse, summaries, fit scores, fit resume/cover letter generation) and Applications (table/kanban stages, import job description).
- Practice: Simulations (sessions + interview tracks; code-run, terminal lab, dev workspace, conversation formats rolling out) and Question Bank.
- Insights: Readiness and Performance.
- Automation: Autofill profiles; Interview Recorder surface in nav.
- Account: settings (profile photo), billing/credits, privacy; Help & support tickets; anonymous navbar Feedback.
- Auth: email OTP; social providers (LinkedIn may be stubbed by env); short-lived access JWT, Redis-backed refresh.
- Dev/local: monorepo `client` + Hono/tRPC `api` + collab WS + BullMQ worker; Postgres + Redis (+ S3-compatible storage).
- **Docs:** separate web app at `docs.mockmatch.ai` (workspace `docs/`), Fumadocs-based, public, no auth required for reading. Complements in-app Help and Ask chat; does not replace them.

## Capabilities and Constraints

Confirmed product surfaces (see also `api/src/modules/ask/product-guide.ts` for in-app Ask):

- Resume/cover letter lifecycle: create, import PDF, templates, editor, autosave, versions, collab share (active while owner is in doc), PDF export via print route + Chromium.
- Discover + Applications workflow including job-specific fit scoring/generation (credit-gated when configured).
- Practice exercises catalog (Postgres + object storage files); live collab on IDE/code-run/terminal paths.
- Credits model: free tier / grants; AI and some collab actions may consume credits; Stripe top-up when keys set.
- i18n: en-US, en-GB, en-AU only (no other locales committed).
- Theme: light/dark/system; design tokens live in shared UI package for multi-app use.
- In-app Ask product guide chat (navbar).

Docs constraints:

- Stack: Fumadocs on **Vite + React Router SPA** (+ MDX) in monorepo workspace `docs/` — React app, not Next.js.
- Visual world: inherit MockMatch client identity (Prep Ultramarine, Geist, calm soft SaaS) via shared tokens in `@mockmatch/ui` — no separate docs brand.
- Content: product-loop how-tos + career guides under `docs/content/docs/`; keep in sync with `api/src/modules/ask/product-guide.ts` on every user-facing feature change (see `.claude/rules/docs-product-help.md`).
- No invented customers, benchmarks, pricing tiers, or testimonials.
- Production hosting for docs TBD (same as product hosting overall).

Constraints / not assumed shipped:

- Production hosting/IaC TBD.
- Full LinkedIn OAuth and Google OAuth may be incomplete depending on env.
- Some simulation formats and interview-recorder depth still rolling out; Run/judge for some languages may be partial.

Undecided / open: production domain/hosting provider for app and docs; final commercial packaging beyond free + credits; formal accessibility standard beyond good product practice; docs locale strategy (default en-US stubs for now).

## Brand Commitments

- **Name:** MockMatch.
- **Mascot:** robot character (e.g. `RobotLoader`, 404 lost-robot treatment)—brand presence, not optional chrome decoration.
- **Voice:** calm, focused prep workspace—not hustle-bro, not chaotic gamification. Copy should stay clear, concise, and action-oriented (matches existing login/signup and Ask guide tone).
- Assets in tree: `client/public/icons/app-logo.svg`, favicons, company mark SVGs under `public/icons/companies/` for trust/context (not claims of partnership unless separately proven).
- **Docs domain:** `docs.mockmatch.ai` (committed naming).

## Evidence on Hand

- Product UI and feature map in client features + `api/src/modules/ask/product-guide.ts`.
- Marketing-adjacent copy in `client/src/locales/en-US/` (common, login, signup): end-to-end prep, readiness next-step language, multi-industry trust line.
- Brand/logo and company icon SVGs under `client/public/icons/`.
- Client design system: `client/DESIGN.md` + tokens in `client/src/index.css` (to be extracted to `@mockmatch/ui` for shared use).
- No verified third-party testimonials, press, or hard user metrics in-repo—future work must not fabricate them.
- Docs content lives in `docs/content/docs/`; maintain with Ask guide on feature ships.

## Product Principles

1. **Close the loop** — Prefer flows that connect documents, jobs, practice, and readiness over isolated feature showcases.
2. **Next action over vanity metrics** — Surfaces should make the next prep step obvious; scores exist to guide, not decorate.
3. **Calm focus** — Dense tools, quiet chrome; reduce noise so mid-career candidates can work under real job-search pressure.
4. **Honest AI cost** — Credit-gated actions stay clear; never imply unlimited free AI when the product charges credits.
5. **Job-real practice** — Simulations and documents should feel closer to real interviews and real applications than generic quizzes or blank templates.
6. **Docs as product map** — Documentation follows the product loop and honest capability boundaries; accurate how-tos beat speculative feature essays. Update docs + Ask guide whenever product surfaces change.
