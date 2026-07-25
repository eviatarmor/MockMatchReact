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
 * Pan-and-zoomable document canvas. Collab cursors live **inside** the
 * transformed paper so they pan/zoom with the document.
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
  const { ref, scale, offset, onTransform } = viewport
  const noop = () => {}
  const { surfaceRef, surfaceSize, onPointerMove, onPointerLeave } =
    useCollabSurface(sendCursor ?? noop, clearCursor)

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
        // Top-center at 100% after first layout (content width known)
        requestAnimationFrame(() => {
          const wrapper = api.instance.wrapperComponent
          const content = api.instance.contentComponent
          if (!wrapper || !content) return
          const scale = ZOOM.default
          const x = (wrapper.clientWidth - content.offsetWidth * scale) / 2
          api.setTransform(x, 48, scale, 0)
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
          backgroundImage: "radial-gradient(circle, var(--dot) 1px, transparent 1px)",
          backgroundSize: `${24 * scale}px ${24 * scale}px`,
          backgroundPosition: `${offset.x}px ${offset.y}px`,
        }}
      >
        <div className="pt-12">
          <div
            ref={surfaceRef}
            className="relative inline-block"
            onPointerMove={sendCursor ? onPointerMove : undefined}
            onPointerLeave={clearCursor ? onPointerLeave : undefined}
          >
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
