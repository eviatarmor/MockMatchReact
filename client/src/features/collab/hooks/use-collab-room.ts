import { useCallback, useRef } from "react"
import type { DocumentKind } from "@mockmatch/schemas"
import {
  useCollabRoom as useCollabRoomCore,
  type CollabEffectiveRole,
  type FetchCollabTicket,
} from "@mockmatch/collab"
import { trpc } from "@/lib/trpc"

type SnapshotPayload = {
  rev: number
  title: string
  templateId: string
  style: Record<string, unknown>
  document: unknown
}

interface UseCollabRoomArgs {
  readonly kind: DocumentKind
  readonly documentId: string
  readonly enabled?: boolean
  readonly shareToken?: string | null
  readonly onRemoteOp?: (path: string, value: unknown, userId: string) => void
  readonly onSnapshot?: (
    snap: SnapshotPayload,
    role: CollabEffectiveRole
  ) => void
  readonly onYjsSync?: (updateB64: string, rev: number) => void
  readonly onYjsUpdate?: (
    updateB64: string,
    userId: string,
    rev: number
  ) => void
}

/**
 * Host adapter: injects tRPC `collab.wsTicket` into package room hook.
 */
export function useCollabRoom({
  kind,
  documentId,
  enabled = true,
  shareToken,
  onRemoteOp,
  onSnapshot,
  onYjsSync,
  onYjsUpdate,
}: UseCollabRoomArgs) {
  const ticketMut = trpc.collab.wsTicket.useMutation()
  const ticketMutRef = useRef(ticketMut)
  ticketMutRef.current = ticketMut

  const fetchTicket: FetchCollabTicket = useCallback(
    async ({ kind: k, documentId: id, shareToken: token }) => {
      const data = await ticketMutRef.current.mutateAsync({
        kind: k,
        id,
        shareToken: token || undefined,
      })
      return {
        ticket: data.ticket,
        wsUrl: data.wsUrl,
        role: data.role,
      }
    },
    []
  )

  return useCollabRoomCore({
    kind,
    documentId,
    fetchTicket,
    enabled,
    shareToken,
    onRemoteOp,
    onSnapshot,
    onYjsSync,
    onYjsUpdate,
  })
}
