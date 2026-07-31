# `@mockmatch/ide`

Product-agnostic IDE shell for web apps and extensions:

- **Optional file tree** — Kibo UI tree; spring open/close (resume-editor style); drag resize
- **Monaco** — `monaco-editor@0.55.1` flush to the split edge
- **Tabs** — `@mockmatch/ui/tabs` (file-tab chrome)
- **Menubar** — File / View (editor, split, AI, fullscreen, …)
- **Optional AI panel** — right-side slot next to full screen; host injects chat UI
- **Theme-aware** — always **auto** (Monaco follows app light/dark; no theme picker)

> **Status:** private monorepo package. Editor chrome only — host owns run/judge/terminal/session/AI transport.

### Run / Run tests

Optional host-owned actions. Package only renders chrome when callbacks are set:

```tsx
<IdeShell
  tabs={tabs}
  onRun={() => { /* host judge / runner */ }}
  onRunTests={() => { /* host test runner */ }}
  runBusy={runStatus === "running"}
  runActionsPlacement="none" // host centers buttons in page header
  terminalFeed={outputFeed} // optional push into xterm
/>
```

| Prop | Meaning |
|------|---------|
| `onRun` / `onRunTests` | Handlers (+ shortcuts); optional tab-bar buttons |
| `runActionsPlacement` | `"tabs"` (default) or `"none"` when host owns chrome |
| `runBusy` / `runTestsBusy` | Spinner + disable while job in flight |
| `terminalFeed` | `{ seq, chunk }` push into active terminal |

Shortcuts: **F5** / **Ctrl+Enter** → Run; **Ctrl+Shift+Enter** → Run tests.

MockMatch does **not** ship a remote code sandbox (no Firecracker / gVisor containers). Host can wire a future judge without changing this package.

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

### AI assistant panel

Pass `aiPanel` to enable the sparkles toggle (tab bar, next to full screen) and View → AI Assistant (`Ctrl+L`):

```tsx
<IdeShell
  tabs={tabs}
  aiPanel={({ close }) => (
    <YourChatSurface onClose={close} />
  )}
  defaultShowAi={false}
/>
```

| Prop | Meaning |
|------|---------|
| `aiPanel` | `ReactNode` or `({ close }) => ReactNode` |
| `showAi` + `onShowAiChange` | Controlled open state |
| `defaultShowAi` | Uncontrolled initial |
| `aiDefaultWidth` / `aiMinWidth` / `aiMaxWidth` | Resize bounds |

Host owns transport, system prompt, and i18n (e.g. wire `@mockmatch/ai-chat`).

The panel scopes light/dark CSS variables from the same scheme as Monaco/terminal (always app auto + `colorScheme`). Prefer **surface** chrome for injected chat (not always-dark dashboard sidebar tokens) so text + code fences match the IDE theme.

### Monaco workers

Basic editing works without workers. For richer language features in Vite, configure `MonacoEnvironment.getWorker` or a Monaco Vite plugin in the host app.

### Collaboration (optional)

Multiplayer is package-level only — **host owns** `@mockmatch/collab` room + Y.Doc + share UI.

```tsx
import {
  IdeShell,
  materializeIdeWorkspace,
  ensureIdeFileYText,
} from "@mockmatch/ide"
import { useCollabRoom, useCollabYDoc } from "@mockmatch/collab"

// After useCollabRoom({ kind: "workspace", documentId, ... }) + useCollabYDoc:
<IdeShell
  tabs={tabs}
  collab={{
    peers: collab.peers,
    sendCursor: collab.sendCursor,
    clearCursor: collab.clearCursor,
    selfUserId: collab.self?.userId,
    enabled: collab.live,
    readOnly: !collab.permissions.canEditContent,
    getYText: (path) => ensureIdeFileYText(ydoc, path),
  }}
/>
```

| Piece | Role |
|-------|------|
| Monaco `createDecorationsCollection` | Remote carets / selections |
| kibo `Cursor` overlay | Mouse pointer (resume-editor style) |
| `presence.cursor` `path` + `sel` | Which file + Monaco 1-based range |
| Y.Text bind | Char-level multi-file buffers under `document.files` |
| Backend | `DocumentKind` `"workspace"` + `ideWorkspaces` tRPC |

## MockMatch host

Practice formats use this package at:

- `/simulations/code-run/react` — multi-file exercise + collab
- `/simulations/code-run/cpp-sort` — single-file code run (tabs not closable)
- `/simulations/terminal-lab` — multi-tab shell lab + collab presence
- `/simulations/workspace` — freeform multi-file collab IDE
