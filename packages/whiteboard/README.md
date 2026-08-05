# `@mockmatch/whiteboard`

Product-agnostic infinite whiteboard.

## Architecture

**One plugin model.** Select, draw, connector, clipboard, element renderers — all the same type: `WhiteboardPlugin`.

There is no separate “tools vs features” split. Everything lives under `src/plugins/<name>/`.

```
┌──────────────────────────────────────────────────┐
│ WhiteboardCanvas (host)                            │
│  document · selection · viewport · gesture session │
│  registries: tools / elements                      │
│  overlays (board) + chrome (screen)                │
└────────────────────┬─────────────────────────────┘
                     │ plugins[]
     ┌───────────────┼───────────────┬──────────────┐
     ▼               ▼               ▼              ▼
  select          draw           connector       elements
  tools+rail      tools+rail     tools+rail      renderers
     ▼               ▼               ▼
  clipboard      shape-label      text-edit
  onKeyDown      onDoubleClick    onDoubleClick
```

### `WhiteboardPlugin`

```ts
{
  id: string
  order?: number
  tools?: ToolDefinition[]           // pointer interaction
  rail?: { order, primary?, secondary? }  // left bar
  elements?: { type, render }[]      // element type views
  onKeyDown? / onDoubleClick? / onSelectDoubleActivate?
  renderOverlay?                     // board-space
  renderChrome?                      // screen-space chrome
  setup?
}
```

### Default set

`createDefaultPlugins()`:

| Plugin | Contributes |
|--------|-------------|
| `elements` | sticky / text / shape / path / connector renderers |
| `select` | select tool + rail |
| `pan` | pan tool + rail |
| `draw` | pen…lasso tools + secondary rail |
| `shape` | shape tool + kinds/colors rail |
| `sticky` / `text` / `connector` | tools + rail |
| `clipboard` | Ctrl/Cmd+C/X/V |
| `shape-label` / `text-edit` | double-click edit |

### Usage

```tsx
const plugins = useMemo(() => createDefaultPlugins(), [])

<WhiteboardToolRail plugins={plugins} ... />
<WhiteboardCanvas plugins={plugins} ... />

// Bare core
plugins={[]}
```

### Layout

```
src/
  core/              # interaction types
  plugin-system/     # unified types + runners
  plugins/           # ALL plugins
    select/
    pan/
    draw/
    shape/
    sticky/
    text/
    connector/
    clipboard/
    shape-label/
    text-edit/
    elements/
    defaults.ts
    rail-ui.tsx
  stencils/          # draw.io-derived SVG library + panel
  canvas/            # thin host
```

### Stencil library

~9k shapes converted from draw.io mxGraph stencil XML → SVG.

- Attributions: `THIRD_PARTY_STENCILS.md`
- Re-convert: `npm run stencils:convert -- --src <path-to-drawio/stencils>`
- UI: `WhiteboardStencilsPanel` (search + categories)
- Board element: `type: "stencil"` with embedded `svg` (self-contained docs)

### Adding a plugin

1. `src/plugins/my-thing/plugin.ts(x)` → `createMyThingPlugin(): WhiteboardPlugin`
2. Register in `createDefaultPlugins()` or pass from host
3. Contribute any combination of `tools` / `rail` / `elements` / hooks / chrome

### Tests

```bash
cd packages/whiteboard && npm run test:unit
```
