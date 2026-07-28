# `@mockmatch/ui`

Shared shadcn UI primitives for MockMatch web and future browser extensions.

## Usage

```ts
import { Button } from "@mockmatch/ui/button"
import { cn } from "@mockmatch/ui/utils"
```

Deep imports preferred (tree-shaking). Host must provide Tailwind v4 + CSS variables (`client/src/index.css`).

```css
@source "../../../packages/ui/src/**/*.{ts,tsx}";
```

## Adding components

Install into this package (not `client/src/components/ui`):

```bash
# from packages/ui or with components.json paths pointed here
npx shadcn@latest add button
```

Fix internal imports to relative paths (`./lib/utils`, `./button`) after CLI adds.

## Exports

| Import | Path |
|--------|------|
| `@mockmatch/ui` | barrel (`cn`, hooks, theme transition) |
| `@mockmatch/ui/button` | component |
| `@mockmatch/ui/utils` | `cn()` |
| `@mockmatch/ui/hooks/*` | shared hooks |
| `@mockmatch/ui/lib/*` | compose-refs, theme-view-transition |
| `@mockmatch/ui/shadcn-space/...` | shadcnspace blocks (number-ticker, scroll-spy-tabs, …) |
