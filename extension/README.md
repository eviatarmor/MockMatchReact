# MockMatch Auto Apply (browser extension)

UI shell for the MockMatch job-application autofill extension (Chrome, Edge, Brave, Firefox). **Fill + review only — never auto-submit.**

## Dev (panel UI)

From monorepo root:

```bash
npm install
npm run dev:extension
```

- Side panel UI: http://localhost:5180/
- On-page chip preview: http://localhost:5180/chip.html

Use the **Dev scenarios** strip to walk signed-out, form/no-form, empty docs, fill, auth error, settings.

## Build

```bash
npm run build --workspace=@mockmatch/extension
```

Output: `extension/dist/` (+ `public/manifest.json` and icons copied by Vite).

Load unpacked (Chromium): `chrome://extensions` → Developer mode → Load unpacked → select `extension/dist` after aligning paths (see note below).

## Architecture (UI phase)

| Surface | Role |
|---------|------|
| Side panel (`index.html`) | Sign-in, Apply, Docs, Settings, Account |
| On-page chip (`chip.html` / content script) | Ready / filling / review affordance on ATS pages |
| `background.ts` | Open side panel on action click (stub) |
| `content.ts` | Minimal chip host stub (not full React yet) |

Auth: “Sign in with MockMatch” opens the product site; session bridge is **not** implemented yet (demo signs in after a short delay).

Design inherits MockMatch Prep Studio (`client/DESIGN.md`): Geist, Prep Ultramarine, soft cards, `@mockmatch/ui`.

## Manifest note

Vite multi-entry build emits `background.js` / `content.js` and hashed panel assets. For a production load path you may need a small post-build step so `manifest.json` `side_panel.default_path` points at the built panel HTML. Dev uses the Vite server; logic wiring comes later.
