# `@mockmatch/page`

Product-agnostic freeform page editor (Lexical playground–style interaction):

- **Lexical** canvas — headings, lists, quote, code, links, divider, alignment
- **Sticky toolbar** — block-type `Select`, format toggles, undo/redo, align (shadcn `Button` / `Select` / `Tooltip` / `Separator`)
- **Link dialog** — shadcn `Dialog` + `Input` + `Label` (no `window.prompt`)
- **Slash menu** — block insert via `/`
- **Paper chrome** — muted desk + centered bordered surface
- **Page shell** — chrome slot + optional right rail
- **Collab** — optional `LexicalYjsPlugin` from `@mockmatch/document-editor`

Host supplies i18n labels, save/transport, practice chrome, and collab room.

> **Status:** private monorepo package. Not the sectioned resume/cover-letter editor.

## Tailwind

```css
@source "../../packages/page/src/**/*.{ts,tsx}";
```

## Quick start

```tsx
import { PageShell, PageEditor } from "@mockmatch/page"

function DocPractice() {
  return (
    <PageShell chrome={chrome} labels={labels}>
      <PageEditor
        value={html}
        onChange={setHtml}
        labels={editorLabels}
        placeholder="Type / for blocks…"
      />
    </PageShell>
  )
}
```

## MockMatch host

`/simulations/page` — freeform document analysis / writeup practice.
