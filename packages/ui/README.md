# `@mockmatch/ui`

Shared UI kits for MockMatch web and future browser extensions.

## Layout

```
src/
  shadcn/          # shadcn/ui + magic-ui primitives
  shadcn-space/    # @shadcn-space registry blocks
  kibo-ui/         # @kibo-ui registry blocks
  lib/             # cn, compose-refs, theme VT
  hooks/           # use-mobile, etc. (used by primitives)
```

## Usage

```ts
import { Button } from "@mockmatch/ui/button"           // shadcn (short alias)
import { Button } from "@mockmatch/ui/shadcn/button"    // same, explicit
import { NumberTicker } from "@mockmatch/ui/shadcn-space/number-ticker/number-ticker-01"
import { Cursor } from "@mockmatch/ui/kibo-ui/cursor"
import { cn } from "@mockmatch/ui/utils"
```

Deep imports preferred (tree-shaking). Host must provide Tailwind v4 + CSS variables (`client/src/index.css`).

```css
@source "../../packages/ui/src/**/*.{ts,tsx}";
```

## Adding components

Install into the matching folder under `packages/ui/src/` (never `client/src/components/`):

| Registry | Target |
|----------|--------|
| shadcn / magic-ui | `src/shadcn/` |
| @shadcn-space | `src/shadcn-space/<category>/` |
| @kibo-ui | `src/kibo-ui/` |

```bash
npx shadcn@latest add button
```

After CLI: fix imports to relative (`../lib/utils`, `./button`).

## Exports

| Import | Path |
|--------|------|
| `@mockmatch/ui` | barrel (`cn`, hooks, theme transition) |
| `@mockmatch/ui/button` | `src/shadcn/button.tsx` (short alias) |
| `@mockmatch/ui/shadcn/*` | same primitives, explicit |
| `@mockmatch/ui/utils` | `cn()` |
| `@mockmatch/ui/hooks/*` | shared hooks |
| `@mockmatch/ui/lib/*` | compose-refs, theme-view-transition |
| `@mockmatch/ui/shadcn-space/...` | shadcnspace blocks |
| `@mockmatch/ui/kibo-ui/...` | kibo-ui blocks |
