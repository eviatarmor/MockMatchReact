# `@mockmatch/rich-text`

Lightweight **Lexical** rich-text input for resume fields, cover letters, spreadsheet cells, and other hosts that need shared formatting without the full document shell.

```ts
import { RichTextInput, type RichTextLabels } from "@mockmatch/rich-text"

const labels: RichTextLabels = {
  bold: "Bold",
  italic: "Italic",
  underline: "Underline",
  strikethrough: "Strikethrough",
  textColor: "Text color",
  highlight: "Highlight",
  link: "Link",
  linkApply: "Apply",
  linkPlaceholder: "https://…",
  linkRemove: "Remove link",
  heading: "Heading",
  paragraph: "Text",
  heading1: "Heading 1",
  heading2: "Heading 2",
  heading3: "Heading 3",
  bulletList: "Bullet list",
  orderedList: "Numbered list",
  clear: "Clear formatting",
  colorNone: "Default",
}

<RichTextInput
  value={html}
  onChange={setHtml}
  labels={labels}
  placeholder="Type…"
/>
```

## Features

| Feature | Notes |
|---------|--------|
| Bold / italic / underline / strikethrough | `FORMAT_TEXT_COMMAND` |
| Text color | `$patchStyleText` + swatch menu |
| Highlight | background-color swatches |
| Link | **animated slide input** in toolbar (no `window.prompt`) |
| Headings | paragraph, H1, H2, H3 |
| Lists | bullet + ordered |
| Collab carets | overlay + local caret callback (host transport) |

## Variants

- **`default`** — floating toolbar with heading panel (document fields).
- **`compact`** — denser chrome, headings hidden (spreadsheet cells). Mount **one live editor per active cell** so a sheet stays cheap.

## Tailwind

```css
@source "../../packages/rich-text/src/**/*.{ts,tsx}";
```

## Collaboration carets

This package **does not** own multiplayer transport. It exposes:

1. **`collab.onLocalCaretChange`** — root-relative caret/selection geometry when the user moves the caret.
2. **`collab.peers`** — remote carets painted by `RemoteCaretsOverlay`.
3. **`measureCaretInRoot`** — pure helper for hosts that compute geometry themselves.

### Next integration step (host)

1. Publish local snapshots on the existing collab presence channel (or Yjs **Awareness** when the field is bound via `@lexical/yjs`, as in `@mockmatch/document-editor` `LexicalYjsPlugin`).
2. Filter peers by `fieldId` and map into `RichTextRemoteCaret[]`.
3. For CRDT text sync (not just carets), reuse `LexicalYjsPlugin` / Binding V2 on a shared `Y.Doc` — keep that binding in the document host, not this lightweight package.

Stub path: pass empty `peers` and a no-op `onLocalCaretChange` until presence is wired.

## Out of scope

- Full multiplayer backend / room lifecycle
- Grammar, block DnD, AI assist (those stay in `@mockmatch/document-editor`)
- Replacing every consumer editor in one PR

## Related packages

| Package | Role |
|---------|------|
| `@mockmatch/document-editor` | Resume/cover shell (blocks, grammar, Yjs binding) |
| `@mockmatch/page` | Freeform page editor |
| `@mockmatch/collab` | Room presence + remote cursors for paper surfaces |
