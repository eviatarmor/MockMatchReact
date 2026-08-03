# Product help docs (Ask + public docs site)

Permanent project memory. Keep when shipping user-facing product changes.

## Two surfaces, one product truth

| Surface | Path | Audience |
|---------|------|----------|
| In-app **Ask** | `api/src/modules/ask/product-guide.ts` | Signed-in users via navbar chat |
| Public **Docs** | `docs/content/docs/**` (Fumadocs SPA in `docs/`) | Anyone at `docs.mockmatch.ai` |

Product capability truth also lives in `PRODUCT.md` and real UI (`client/src/features/`, locales). Docs and Ask must not invent unfinished depth.

## Mandatory update rule

When you **add or change** any of the following, update **both** Ask guide and docs MDX in the same change set (or immediately after):

- Routes or nav labels (`common.json` `navGroups` / `navItems`)
- User-visible workflows (create/import/export, track job, practice formats, billing)
- Credit-gated actions or plan messaging
- Collab / share rules
- New product areas (new folder under `docs/content/docs/` + root `meta.json` page entry)

Skip docs/Ask only for pure internal refactors with zero user-facing behavior change.

## What to edit

1. **Ask:** `api/src/modules/ask/product-guide.ts` — page map, how-tos, honest “not built yet”
2. **Docs:** matching files under `docs/content/docs/`
   - Section indexes use Fumadocs `<Cards>` / `<Card>`
   - New section: folder + `meta.json` + pages; register folder in `docs/content/docs/meta.json`
3. **Locales** if UI copy changed — docs should quote current button/nav labels

Local preview: `npm run dev:docs` → http://localhost:5174

## Writing voice (human product help)

Follow Vercel-style writing guidelines and Diátaxis task shape:

- **You** + active voice + imperative steps
- Open each page with a short TL;DR paragraph
- One job per page (how-to vs craft guide vs overview)
- Sentence-case headings; **bold** only for UI labels or critical facts
- No `easy` / `simple` / `quick`; no em dashes as punctuation; use ellipsis `…`
- No invented prices, plan tiers, testimonials, or unshipped features
- Honest rollouts: “still rolling out”, “may be stubbed by env”
- Calm MockMatch tone (prep workspace, not hustle marketing)

Guides under `docs/content/docs/guides/` are career craft; product how-tos live under product folders (documents, jobs, practice, …).

## IA map (v1)

| Folder | Product area |
|--------|----------------|
| `getting-started` | First session |
| `documents/` | Resume Lab, Cover Letters, shared import/export/collab |
| `jobs/` | Discover, Applications |
| `practice/` | Simulations, Question Bank |
| `insights/` | Readiness, Performance |
| `automation/` | Autofill, Interview Recorder |
| `account/` | Credits, settings, help |
| `guides/` | Perfect resume / cover letter craft |

## Do not

- Leave Ask updated and docs stubbed (or the reverse) after a feature ship
- Document internal API/DB details on the public site unless a public API product exists
- Hardcode commercial packaging that Billing UI owns
