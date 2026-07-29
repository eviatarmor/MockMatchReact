import { Cursor } from "@mockmatch/ui/kibo-ui/cursor"
import { collabSolidColor, type CollabPeer } from "@mockmatch/collab"

export type MonacoRemotePointersProps = {
  readonly peers: readonly CollabPeer[]
  readonly path: string
  readonly selfUserId?: string
  /** Layout size of the editor surface (CSS px). */
  readonly surfaceWidth: number
  readonly surfaceHeight: number
}

/**
 * Mouse-pointer presence for peers on this file path (resume-editor style).
 * Carets/selections use decorations — only kind "pointer" here.
 */
export function MonacoRemotePointers({
  peers,
  path,
  selfUserId,
  surfaceWidth,
  surfaceHeight,
}: MonacoRemotePointersProps) {
  if (surfaceWidth <= 0 || surfaceHeight <= 0) return null

  return (
    <div className="pointer-events-none absolute inset-0 z-40 overflow-visible">
      {peers.map((p) => {
        if (selfUserId && p.userId === selfUserId) return null
        const c = p.cursor
        if (!c || c.path !== path) return null
        if ((c.kind ?? "pointer") !== "pointer") return null
        const left = c.x * surfaceWidth
        const top = c.y * surfaceHeight
        return (
          <Cursor
            key={p.userId}
            color={collabSolidColor(p.color)}
            name={p.name}
            style={{ left, top }}
          />
        )
      })}
    </div>
  )
}
