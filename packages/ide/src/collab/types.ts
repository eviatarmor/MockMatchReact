import type {
  CollabPeer,
  SendCursor,
} from "@mockmatch/collab"
import type * as Y from "yjs"

import type { IdeTreeNode } from "../types"

export type IdeWorkspaceFileEntry = {
  language?: string
  content: string
}

/** Durable + collab document blob for IDE workspaces. */
export type IdeWorkspaceDocument = {
  tree: IdeTreeNode[]
  files: Record<string, IdeWorkspaceFileEntry>
}

/**
 * Optional collab bag for Monaco / IdeShell.
 * Host owns room connection (`useCollabRoom`) and Y.Doc.
 */
export type IdeCollabProps = {
  readonly peers: readonly CollabPeer[]
  readonly sendCursor: SendCursor
  readonly clearCursor?: () => void
  readonly selfUserId?: string
  /** When false, presence + y-bind still idle. */
  readonly enabled?: boolean
  /** Resolve live Y.Text for a file path (model id). */
  readonly getYText?: (path: string) => Y.Text | null | undefined
  /** Force Monaco read-only (e.g. view role). */
  readonly readOnly?: boolean
}

export type MonacoEditorCollabProps = {
  readonly peers: readonly CollabPeer[]
  readonly sendCursor: SendCursor
  readonly clearCursor?: () => void
  /** modelId / file path for this editor instance. */
  readonly path: string
  readonly selfUserId?: string
  readonly enabled?: boolean
  readonly yText?: Y.Text | null
  readonly readOnly?: boolean
}
