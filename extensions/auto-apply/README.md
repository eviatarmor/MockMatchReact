# MockMatch Auto Apply (browser extension)

UI shell for the MockMatch job-application autofill extension (Chrome, Edge, Brave, Firefox). **Fill + review only — never auto-submit.**

Package path: `extensions/auto-apply` (`@mockmatch/extension-auto-apply`). Sibling extensions can live under `extensions/`.

## Dev (panel UI)

From monorepo root:

```bash
npm install
npm run dev:extension
```

- Side panel UI: http://localhost:5180/
- On-page chip preview: http://localhost:5180/chip.html

Styling matches the web client: Tailwind v4 + `tw-animate-css` + `shadcn/tailwind.css` + `@mockmatch/ui/theme.css`, with `@source` scanning `packages/ui`.

## Build

```bash
npm run build --workspace=@mockmatch/extension-auto-apply
```

Output: `extensions/auto-apply/dist/` (+ `public/manifest.json` and icons copied by Vite).

Load unpacked (Chromium): `chrome://extensions` → Developer mode → Load unpacked → select `extensions/auto-apply/dist` after aligning paths (see note below).

## Architecture (UI phase)

| Surface | Role |
|---------|------|
| Side panel (`index.html`) | Sign-in, Apply, Settings; account via avatar menu |
| On-page chip (`chip.html` / content script) | Ready / filling / review affordance on ATS pages |
| `background.ts` | Open side panel on action click + chip message |
| `content.ts` | Heuristic application detect → mount/unmount chip |
| `detect/application-page.ts` | URL + ATS host + DOM signals (excludes MockMatch) |

**Chip visibility:** content script scores the page (known ATS hosts, `/apply` paths, resume file inputs, apply-field names, apply copy, ATS iframes). Score ≥ threshold → chip; MockMatch / local product ports never match. Re-checks on SPA navigation + DOM mutations.

Auth: “Sign in with MockMatch” opens the product site; session bridge is **not** implemented yet (demo signs in after a short delay).

Fill identity (name, phone, etc.) comes from the **selected resume** at fill time — not shown as a profile card on the Apply main view. Session name/email appear only in the avatar dropdown (same pattern as web).

Design inherits MockMatch Prep Studio (`client/DESIGN.md`): Geist, Prep Ultramarine, soft cards, `@mockmatch/ui`.

## Icons

Brand robot mark: `public/icons/app-logo.svg` (toolbar UI). Manifest / store sizes: `icon-16.png`, `icon-32.png`, `icon-48.png`, `icon-128.png`.

## Manifest note

Vite multi-entry build emits `background.js` / `content.js` and hashed panel assets. For a production load path you may need a small post-build step so `manifest.json` `side_panel.default_path` points at the built panel HTML. Dev uses the Vite server; logic wiring comes later.
