# `@mockmatch/page`

Product-agnostic freeform page editor (Notion / Docs–like):

- **Lexical** canvas — headings, lists, quote, code, links, divider
- **Slash menu** + fixed format toolbar
- **Page shell** — chrome slot + readable max-width column
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
