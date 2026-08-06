import { describe, expect, it } from "vitest"
import * as Y from "yjs"
import {
  applyRemoteYUpdate,
  createCollabDocumentUndoManager,
  createCollabYDoc,
  encodeFullYState,
  materializeCollabYDoc,
  seedCollabYDoc,
  setCollabDocument,
  Y_ORIGIN_LOCAL,
  Y_ORIGIN_REMOTE,
} from "../../../src/yjs/collab-ydoc"

function boardDoc(elements: Record<string, unknown>) {
  return { version: 1, elements }
}

describe("createCollabDocumentUndoManager", () => {
  it("undoes local document edits and restores prior state", () => {
    const ydoc = createCollabYDoc()
    seedCollabYDoc(
      ydoc,
      {
        title: "Board",
        templateId: "blank",
        style: {},
        document: boardDoc({}),
      },
      Y_ORIGIN_REMOTE
    )
    const um = createCollabDocumentUndoManager(ydoc, { captureTimeout: 0 })

    setCollabDocument(
      ydoc,
      boardDoc({ a: { type: "sticky", id: "a", x: 0, y: 0 } }),
      Y_ORIGIN_LOCAL
    )
    um.stopCapturing()
    expect(
      (materializeCollabYDoc(ydoc).document as { elements: Record<string, unknown> })
        .elements.a
    ).toBeTruthy()
    expect(um.undoStack.length).toBeGreaterThan(0)

    um.undo()
    expect(
      (materializeCollabYDoc(ydoc).document as { elements: Record<string, unknown> })
        .elements.a
    ).toBeUndefined()

    um.redo()
    expect(
      (materializeCollabYDoc(ydoc).document as { elements: Record<string, unknown> })
        .elements.a
    ).toBeTruthy()

    um.destroy()
    ydoc.destroy()
  })

  it("keeps local undo after remote peer update (untracked origin)", () => {
    const local = createCollabYDoc()
    const peer = createCollabYDoc()
    seedCollabYDoc(
      local,
      {
        title: "Board",
        templateId: "blank",
        style: {},
        document: boardDoc({}),
      },
      Y_ORIGIN_REMOTE
    )
    // Sync seed to peer (common empty board), then diverge concurrently
    Y.applyUpdate(peer, encodeFullYState(local), Y_ORIGIN_REMOTE)

    const um = createCollabDocumentUndoManager(local, { captureTimeout: 0 })
    const stackBeforeRemote = (() => {
      setCollabDocument(
        local,
        boardDoc({ local1: { type: "sticky", id: "local1", x: 1, y: 1 } }),
        Y_ORIGIN_LOCAL
      )
      um.stopCapturing()
      return um.undoStack.length
    })()
    expect(stackBeforeRemote).toBeGreaterThan(0)

    // Peer only adds its own sticky (concurrent branch from shared seed)
    setCollabDocument(
      peer,
      boardDoc({ peer1: { type: "sticky", id: "peer1", x: 9, y: 9 } }),
      Y_ORIGIN_LOCAL
    )
    const peerUpdate = Y.encodeStateAsUpdate(peer, Y.encodeStateVector(local))
    applyRemoteYUpdate(local, peerUpdate)

    const mid = materializeCollabYDoc(local).document as {
      elements: Record<string, unknown>
    }
    expect(mid.elements.local1).toBeTruthy()
    expect(mid.elements.peer1).toBeTruthy()
    // Remote merge must not clear local undo stack
    expect(um.undoStack.length).toBe(stackBeforeRemote)

    um.undo()
    const after = materializeCollabYDoc(local).document as {
      elements: Record<string, unknown>
    }
    // Local op undone; peer content remains
    expect(after.elements.local1).toBeUndefined()
    expect(after.elements.peer1).toBeTruthy()

    um.destroy()
    local.destroy()
    peer.destroy()
  })

  it("does not track remote-origin setCollabDocument writes", () => {
    const ydoc = createCollabYDoc()
    seedCollabYDoc(
      ydoc,
      {
        title: "Board",
        templateId: "blank",
        style: {},
        document: boardDoc({}),
      },
      Y_ORIGIN_REMOTE
    )
    const um = createCollabDocumentUndoManager(ydoc, { captureTimeout: 0 })

    setCollabDocument(
      ydoc,
      boardDoc({ r: { type: "sticky", id: "r", x: 0, y: 0 } }),
      Y_ORIGIN_REMOTE
    )
    um.stopCapturing()
    expect(um.undoStack.length).toBe(0)

    um.destroy()
    ydoc.destroy()
  })
})
