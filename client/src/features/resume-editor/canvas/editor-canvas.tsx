import { useEffect, useRef } from "react"
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch"
import { ResumeDocumentView } from "./resume-document"
import { ZOOM, useCanvasViewport } from "@/hooks/use-canvas-viewport"
import type { ResolvedStyle } from "@/components/document-editor"
import { RemoteCursors } from "@/features/collab/components/remote-cursors"
import {
  useCollabSurface,
  type SendCursor,
} from "@/features/collab/hooks/use-collab-surface"
import type { CollabPeer } from "@/features/collab/types"
import type { ResumeHandlers } from "../hooks/use-resume-document"
import type { ResumeDocument, EditorTemplate } from "../types"

/** Initial grid size before first onTransform (scale 1). */
const GRID_DOT_FALLBACK = 24

interface EditorCanvasProps {
  readonly document: ResumeDocument
  readonly template: EditorTemplate
  readonly style: ResolvedStyle
  readonly viewport: ReturnType<typeof useCanvasViewport>
  readonly handlers: ResumeHandlers
  readonly onAiBlock?: (id: string) => void
  readonly peers?: readonly CollabPeer[]
  readonly sendCursor?: SendCursor
  readonly clearCursor?: () => void
}

/**
 * Pan-and-zoomable document canvas.
 * Remote cursors are paper-relative (may sit outside the page on the grid).
 * Pointer tracking binds to the full transform wrapper so the grid counts.
 *
 * Dot grid background is updated via DOM in `onTransform` (not React state)
 * so panning does not re-render the résumé tree every pointer frame.
 */
export function EditorCanvas({
  document,
  template,
  style,
  viewport,
  handlers,
  onAiBlock,
  peers = [],
  sendCursor,
  clearCursor,
}: EditorCanvasProps) {
  const { ref, scale, onTransform, bindGridLayer } = viewport
  const noop = () => {}
  const { surfaceRef, surfaceSize, bindViewport } = useCollabSurface(
    sendCursor ?? noop,
    clearCursor
  )
  const wrapperProbeRef = useRef<HTMLDivElement | null>(null)

  // Bind pointer tracking once wrapper exists — not on every pan frame
  useEffect(() => {
    if (!sendCursor) return
    let raf = 0
    let cleanup: (() => void) | undefined

    const tryBind = () => {
      const wrapper = ref.current?.instance?.wrapperComponent ?? null
      if (wrapper) {
        bindGridLayer(wrapper)
        cleanup = bindViewport(wrapper)
        return
      }
      raf = requestAnimationFrame(tryBind)
    }
    tryBind()

    return () => {
      cancelAnimationFrame(raf)
      cleanup?.()
    }
  }, [sendCursor, bindViewport, bindGridLayer, ref])

  // Fallback: if wrapper not ready via API, probe from content DOM
  useEffect(() => {
    if (!sendCursor || !wrapperProbeRef.current) return
    const wrapper = wrapperProbeRef.current.closest(
      ".react-transform-wrapper"
    ) as HTMLElement | null
    if (!wrapper) return
    bindGridLayer(wrapper)
    return bindViewport(wrapper)
  }, [sendCursor, bindViewport, bindGridLayer])

  const clearEditing = () => {
    const active = window.document.activeElement
    if (active instanceof HTMLElement) active.blur()
    window.getSelection()?.removeAllRanges()
  }

  return (
    <TransformWrapper
      ref={ref}
      initialScale={ZOOM.default}
      minScale={ZOOM.min}
      maxScale={ZOOM.max}
      centerOnInit={false}
      initialPositionX={0}
      initialPositionY={48}
      limitToBounds={false}
      onInit={(api) => {
        requestAnimationFrame(() => {
          const wrapper = api.instance.wrapperComponent
          const content = api.instance.contentComponent
          if (wrapper) bindGridLayer(wrapper)
          if (!wrapper || !content) return
          const nextScale = ZOOM.default
          const x = (wrapper.clientWidth - content.offsetWidth * nextScale) / 2
          api.setTransform(x, 48, nextScale, 0)
        })
      }}
      doubleClick={{ disabled: true }}
      wheel={{ disabled: true }}
      panning={{ excluded: ["pan-ignore"] }}
      onPanningStart={clearEditing}
      onTransform={onTransform}
    >
      <TransformComponent
        wrapperClass="!absolute !inset-0 !z-0 !h-full !w-full cursor-grab bg-neutral-100 active:cursor-grabbing dark:bg-neutral-950 [--dot:var(--color-neutral-300)] dark:[--dot:var(--color-neutral-600)]"
        wrapperStyle={{
          // Size/position updated imperatively in onTransform — avoid React pan thrash
          backgroundImage:
            "radial-gradient(circle, var(--dot) 1px, transparent 1px)",
          backgroundSize: `${GRID_DOT_FALLBACK}px ${GRID_DOT_FALLBACK}px`,
          backgroundPosition: "0px 0px",
        }}
      >
        <div ref={wrapperProbeRef} className="relative pt-12">
          <div ref={surfaceRef} className="relative inline-block">
            <ResumeDocumentView
              document={document}
              template={template}
              style={style}
              handlers={handlers}
              onAiBlock={onAiBlock}
              scale={scale}
            />
            {sendCursor && (
              <RemoteCursors
                peers={peers}
                surfaceWidth={surfaceSize.w}
                surfaceHeight={surfaceSize.h}
              />
            )}
          </div>
        </div>
      </TransformComponent>
    </TransformWrapper>
  )
}
