# MockMatch Docs (`docs.mockmatch.ai`)

React docs site: **Vite + React Router (SPA) + Fumadocs**.

## Local

From monorepo root:

```bash
npm install
npm run dev:docs
```

Open [http://localhost:5174](http://localhost:5174).

| Surface | Port |
|---------|------|
| App (`client`) | **5173** |
| Docs (`docs`) | **5174** |
| API | **3000** |

Optional env (Vite): `VITE_APP_URL=http://localhost:5173` for “Open app” links.

## Theme

Shared tokens: `@mockmatch/ui/theme.css` (same as client). Fumadocs shadcn preset maps Prep Ultramarine / light·dark.

## Content

MDX under `content/docs/`. v1 = stubs along the product loop + reserved Guides.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Vite + React Router dev on **5174** |
| `npm run build` | SPA production build |
| `npm run start` | Static serve of `build/client` on 5174 |
| `npm run typecheck` | typegen + `tsc` |
