import { createPortal } from "react-dom"
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch"
import { LetterDocument } from "./letter-document"
import { ZOOM } from "../constants"
import type { useCanvasViewport } from "../hooks/use-canvas-viewport"
import type { CoverLetterDocument, EditorTemplate } from "../types"

interface EditorCanvasProps {
  readonly document: CoverLetterDocument
  readonly template: EditorTemplate
  readonly viewport: ReturnType<typeof useCanvasViewport>
}

/**
 * Full-viewport, pan-and-zoomable document background.
 *
 * Rendered into a fixed z-0 layer behind the app chrome (sidebars z-10,
 * navbar z-20) so the page visually slides underneath them. Pan/zoom is handled
 * by react-zoom-pan-pinch; the dotted grid is synced to the live transform.
 */
export function EditorCanvas({ document, template, viewport }: EditorCanvasProps) {
  const { ref, scale, offset, onTransform } = viewport

  return createPortal(
    <TransformWrapper
      ref={ref}
      initialScale={ZOOM.default}
      minScale={ZOOM.min}
      maxScale={ZOOM.max}
      centerOnInit
      limitToBounds={false}
      doubleClick={{ disabled: true }}
      wheel={{ step: 0.06 }}
      onTransform={onTransform}
    >
      <TransformComponent
        wrapperClass="!fixed !inset-0 !z-0 !h-svh !w-screen cursor-grab bg-neutral-100 active:cursor-grabbing dark:bg-neutral-950 [--dot:var(--color-neutral-300)] dark:[--dot:var(--color-neutral-600)]"
        wrapperStyle={{
          backgroundImage: "radial-gradient(circle, var(--dot) 1px, transparent 1px)",
          backgroundSize: `${24 * scale}px ${24 * scale}px`,
          backgroundPosition: `${offset.x}px ${offset.y}px`,
        }}
      >
        <div className="pt-24">
          <LetterDocument document={document} template={template} />
        </div>
      </TransformComponent>
    </TransformWrapper>,
    window.document.body
  )
}
