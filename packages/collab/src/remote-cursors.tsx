import { Cursor } from "@mockmatch/ui/kibo-ui/cursor"
import type { CollabPeer } from "./types"

interface RemoteCursorsProps {
  readonly peers: readonly CollabPeer[]
  /** Layout size of the document surface (unscaled CSS px). */
  readonly surfaceWidth: number
  readonly surfaceHeight: number
}

/**
 * Renders remote pointers + text carets + selection highlights in **paper-
 * relative space** (origin = paper top-left). Coords may fall outside [0,1]
 * when peers move over the background grid — overflow is visible.
 * Must sit in the same transform layer as the paper.
 */
export function RemoteCursors({
  peers,
  surfaceWidth,
  surfaceHeight,
}: RemoteCursorsProps) {
  if (surfaceWidth <= 0 || surfaceHeight <= 0) return null

  return (
    <div className="pointer-events-none absolute inset-0 z-40 overflow-visible">
      {peers.map((p) => {
        if (!p.cursor) return null
        // Unclamped: negative / >1 place the cursor on the surrounding grid
        const left = p.cursor.x * surfaceWidth
        const top = p.cursor.y * surfaceHeight
        const kind = p.cursor.kind ?? "pointer"

        if (kind === "selection" && p.cursor.rects && p.cursor.rects.length > 0) {
          return (
            <div key={p.userId} className="absolute inset-0">
              {p.cursor.rects.map((r, i) => (
                <div
                  key={i}
                  className="absolute rounded-[2px]"
                  style={{
                    left: r.x * surfaceWidth,
                    top: r.y * surfaceHeight,
                    width: Math.max(2, r.w * surfaceWidth),
                    height: Math.max(2, r.h * surfaceHeight),
                    backgroundColor: p.color,
                    opacity: 0.28,
                  }}
                />
              ))}
              {/* Bar at insertion Y; name floats above so it does not shift the bar */}
              <div
                className="absolute"
                style={{ left, top, transform: "translate(-1px, 0)" }}
              >
                <div
                  className="absolute bottom-full mb-0.5 max-w-[8rem] truncate rounded px-1 py-px text-[9px] font-medium leading-tight text-white shadow-sm"
                  style={{ backgroundColor: p.color }}
                >
                  {p.name}
                </div>
                <div
                  className="w-0.5 rounded-full"
                  style={{
                    height: p.cursor.h ?? 16,
                    backgroundColor: p.color,
                  }}
                />
              </div>
            </div>
          )
        }

        if (kind === "caret" || kind === "selection") {
          return (
            <div
              key={p.userId}
              className="absolute"
              style={{ left, top, transform: "translate(-1px, 0)" }}
            >
              <div
                className="absolute bottom-full mb-0.5 max-w-[8rem] truncate rounded px-1 py-px text-[9px] font-medium leading-tight text-white shadow-sm"
                style={{ backgroundColor: p.color }}
              >
                {p.name}
              </div>
              <div
                className="w-0.5 animate-pulse rounded-full"
                style={{
                  height: p.cursor.h ?? 16,
                  backgroundColor: p.color,
                  boxShadow: `0 0 0 1px ${p.color}33`,
                }}
              />
            </div>
          )
        }

        return (
          <Cursor
            key={p.userId}
            color={p.color}
            name={p.name}
            style={{ left, top }}
          />
        )
      })}
    </div>
  )
}
