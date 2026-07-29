# `@mockmatch/ide`

Product-agnostic IDE shell for web apps and extensions:

- **Optional file tree** — Kibo UI tree; spring open/close (resume-editor style); drag resize
- **Monaco** — `monaco-editor@0.55.1` flush to the split edge
- **Tabs** — `@mockmatch/ui/tabs` (file-tab chrome)
- **Menubar** — File / View (theme, editor, split, fullscreen, …)
- **Theme-aware** — Monaco `vs` / `vs-dark` from app light/dark

> **Status:** private monorepo package. Editor chrome only — host owns run/judge/terminal/session logic.

## Install (monorepo)

```json
{
  "dependencies": {
    "@mockmatch/ide": "*",
    "@mockmatch/ui": "*"
  }
}
```

Tailwind must scan this package:

```css
@source "../../packages/ide/src/**/*.{ts,tsx}";
```

### Peers

| Peer | Role |
|------|------|
| `react` / `react-dom` | UI |
| `@mockmatch/ui` | Resizable, tabs, buttons, tree kit, etc. |
| Host CSS | Tailwind v4 + shadcn CSS variables |

## Quick start

```tsx
import { IdeShell, type IdeTab, type IdeTreeNode } from "@mockmatch/ide"

const tree: IdeTreeNode[] = [
  {
    id: "src",
    name: "src",
    children: [{ id: "src/main.ts", name: "main.ts" }],
  },
]

const tabs: IdeTab[] = [
  {
    id: "src/main.ts",
    title: "main.ts",
    language: "typescript",
    value: "export const n = 1\n",
  },
]

function Editor() {
  return (
    <IdeShell
      className="h-full min-h-0"
      tree={tree}
      defaultShowTree
      tabs={tabs}
      activeTabId="src/main.ts"
      colorScheme="auto"
      onCreateFile={(parentId) => { /* … */ }}
      onCreateFolder={(parentId) => { /* … */ }}
    />
  )
}
```

Place the menubar next to a page title with `hideMenubar` + exported `IdeMenubar` (see MockMatch simulation IDE page).

### Tree visibility

| Prop | Meaning |
|------|---------|
| omit `tree` | Editor-only (no panel) |
| `defaultShowTree` | Uncontrolled initial |
| `showTree` + `onShowTreeChange` | Controlled |
| View → File tree / `treeToggleable` | User toggle |

### Monaco workers

Basic editing works without workers. For richer language features in Vite, configure `MonacoEnvironment.getWorker` or a Monaco Vite plugin in the host app.

## MockMatch host

Practice formats use this package at:

- `/simulations/ide/code-run` — code run (tree off by default)
- `/simulations/ide/workspace` — dev workspace (tree on by default)
