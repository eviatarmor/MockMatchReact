# `@mockmatch/history`

Generic **snapshot undo/redo** for product surfaces (spreadsheet, whiteboard, …).

```ts
import { createHistoryStack } from "@mockmatch/history"

const history = createHistoryStack(initialDoc, {
  clone: cloneDocument,
  limit: 100,
})

history.commit(nextDoc) // push undo step
history.undo()
history.redo()
```

- **Solo / local edits** — use this stack.
- **Live Yjs rooms** — prefer `Y.UndoManager`; keep this disabled or empty via `replace` / remote `setPresent`.
