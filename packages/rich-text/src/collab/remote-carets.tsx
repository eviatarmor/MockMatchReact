import type { RichTextRemoteCaret } from "../types"

const SELECTION_OPACITY = 0.28

/**
 * Paints remote collab carets + selection rects in editor-root space.
 * Must sit as a positioned child of the editor wrapper (`relative`).
 */
export function RemoteCaretsOverlay({
  peers,
}: {
  readonly peers: readonly RichTextRemoteCaret[]
}) {
  if (peers.length === 0) return null

  return (
    <div
      className="pointer-events-none absolute inset-0 z-20 overflow-visible"
      aria-hidden
      data-rich-text-remote-carets
    >
      {peers.map((p) => (
        <div key={p.userId} className="absolute inset-0">
          {p.rects?.map((r, i) => (
            <div
              key={i}
              className="absolute rounded-[2px]"
              style={{
                left: r.x,
                top: r.y,
                width: r.w,
                height: r.h,
                backgroundColor: p.color,
                opacity: SELECTION_OPACITY,
              }}
            />
          ))}
          <div
            className="absolute"
            style={{
              left: p.x,
              top: p.y,
              transform: "translate(-1px, 0)",
            }}
          >
            <div
              className="absolute bottom-full mb-0.5 max-w-[7rem] truncate rounded px-1 py-px text-[9px] font-medium leading-tight text-white shadow-sm"
              style={{ backgroundColor: p.color }}
            >
              {p.name}
            </div>
            <div
              className="w-0.5 rounded-full"
              style={{
                height: p.height,
                backgroundColor: p.color,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
