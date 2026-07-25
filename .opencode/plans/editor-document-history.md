# Editor document undo/redo

## Locked decisions

- **Track:** document content + style + template + title (breadcrumb)
- **Do not track:** zoom/pan (viewport already has +/- / reset)
- **Collab:** local stack only; remote ops call `skipNext()` (no stack push)
- **Lexical:** keep per-field `HistoryPlugin` (Ctrl+Z inside focused RTE)
- Toolbar icons = content undo, not browser back

## Snapshot shape

```ts
type EditorHistorySnapshot<TDoc, TTemplateId> = {
  document: TDoc
  style: DocumentStyle
  templateId: TTemplateId
  title: string
}
```

## 1. New hook — `client/src/hooks/use-document-history.ts`

API:

```ts
useDocumentHistory<T>({ maxDepth?: 50, coalesceMs?: 400 })
// → { commit, skipNext, markDiscrete, undo, redo, canUndo, canRedo }

export type DocumentHistoryControls = {
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
}
```

Behavior:

- Stacks: `past[]` / `present` / `future[]` (refs + flag state for canUndo/canRedo)
- `commit(next)` — after local state settles
  - first call seeds `present`
  - `skipNext` → replace present only
  - equal snapshot (JSON) → no-op
  - coalesce window (~400ms) without `markDiscrete` → update present only
  - else push present → past, clear future, cap depth 50
- `skipNext()` — before remote/collab apply **and** before undo/redo apply (avoid re-record)
- `markDiscrete()` — structural ops + style + template (force end coalesce)
- `undo(apply)` / `redo(apply)` — pop stack, `skipNext`, call `apply(snapshot)`
- Clone with `structuredClone` so later mutations never mutate history entries

## 2. Sessions

### `use-resume-editor-session.ts`

- Import `useDocumentHistory`
- Snapshot: `{ document, style, templateId, title: resumeName }`
- `useEffect` → `history.commit(snapshot)` when snapshot deps change
- `applyHistorySnapshot(s)`:
  - `replaceDocument(s.document)` (document effect broadcasts if collab live)
  - `setStyle` / `setTemplateId` / `setResumeName`
  - if collab live: `sendOp` style, templateId, title
  - do **not** set `skipBroadcast` (undo is local → peers see it)
  - history already `skipNext` inside undo/redo
- Remote paths (`onRemoteOp`, `onSnapshot`, `applyRemoteDocument`): call `history.skipNext()` before state writes (in addition to existing `skipBroadcast`)
- `markDiscrete()` before: `selectTemplate`, `updateStyle`, structural handlers (`addBlock`, `duplicateBlock`, `removeBlock`, `moveBlock`, `reorderBlocks`)
- Title typing: coalesce OK (no markDiscrete)
- Field text via handlers: coalesce OK
- Return:

```ts
history: {
  undo: () => history.undo(applyHistorySnapshot),
  redo: () => history.redo(applyHistorySnapshot),
  canUndo: history.canUndo,
  canRedo: history.canRedo,
}
```

### `use-cover-letter-editor-session.ts`

Same pattern (`letterName` instead of `resumeName`).

## 3. UI

### Both `EditorBottomBar` (`resume-editor` + `cover-letter-editor` toolbars)

```ts
interface EditorBottomBarProps {
  viewport: ReturnType<typeof useCanvasViewport>
  history: DocumentHistoryControls
}
```

- Undo/Redo `onClick` → `history.undo` / `history.redo`
- `disabled={!canUndo}` / `disabled={!canRedo}`

### Pages

```tsx
<EditorBottomBar viewport={viewport} history={session.history} />
```

- `resume-editor-page.tsx`
- `cover-letter-editor-page.tsx`

## 4. Out of scope

- Viewport history
- Server version history
- OT/CRDT collab undo
- Global Ctrl+Z bridge (optional later; Lexical keeps field-level)

## 5. File list

| File | Action |
|------|--------|
| `client/src/hooks/use-document-history.ts` | create |
| `client/src/features/resume-editor/hooks/use-resume-editor-session.ts` | integrate |
| `client/src/features/cover-letter-editor/hooks/use-cover-letter-editor-session.ts` | integrate |
| `client/src/features/resume-editor/top-bar/editor-toolbar.tsx` | wire buttons |
| `client/src/features/cover-letter-editor/top-bar/editor-toolbar.tsx` | wire buttons |
| `client/src/features/resume-editor/resume-editor-page.tsx` | pass history |
| `client/src/features/cover-letter-editor/cover-letter-editor-page.tsx` | pass history |

No locale changes (keys exist).

## 6. Verify (user)

1. Type → wait 500ms → type more → Undo undoes last burst
2. Add section → Undo removes it
3. Template/style change → Undo restores
4. Zoom/pan → Undo does not move camera
5. Peer collab edit → does not enable your Undo
6. Your Undo still local snapshot (LWW may overwrite peer — known)
7. Focused rich-text Ctrl+Z still works inside field

## Status

**Approved by user.** Plan mode blocks non-plan file edits.

**Next:** exit plan mode / switch to agent → implement this file.
