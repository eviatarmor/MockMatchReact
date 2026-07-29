# `@mockmatch/document-editor`

Product-agnostic block/rich-text document editor shell for resume and cover-letter surfaces (and future hosts).

- Block list + DnD reorder
- Lexical rich text + plain editable fields
- Grammar overlay (Harper)
- Style resolution helpers
- AI assist context hooks (host supplies handlers)

Host owns: document DTOs, save/transport, i18n labels, templates, collab wiring.

## Tailwind

```css
@source "../../packages/document-editor/src/**/*.{ts,tsx}";
```
