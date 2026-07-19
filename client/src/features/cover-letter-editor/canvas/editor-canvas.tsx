import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch"
import { LetterDocument } from "./letter-document"
import { ZOOM, useCanvasViewport } from "@/hooks/use-canvas-viewport"
import type { ResolvedStyle } from "@/components/document-editor"
import type { CoverLetterHandlers } from "../hooks/use-cover-letter-document"
import type { CoverLetterDocument, EditorTemplate } from "../types"

interface EditorCanvasProps {
  readonly document: CoverLetterDocument
  readonly template: EditorTemplate
  readonly style: ResolvedStyle
  readonly viewport: ReturnType<typeof useCanvasViewport>
  readonly handlers: CoverLetterHandlers
  readonly onAiBlock?: (id: string) => void
}

/**
 * Pan-and-zoomable document canvas that fills its editor container.
 *
 * Rendered as an absolute inset-0 layer inside the editor's relative content
 * area (so it stays within the rounded content card, below the navbar and right
 * rail). Pan/zoom is handled by react-zoom-pan-pinch; the dotted grid is synced
 * to the live transform.
 */
export function EditorCanvas({ document, template, style, viewport, handlers, onAiBlock }: EditorCanvasProps) {
  const { ref, scale, offset, onTransform } = viewport

  // Clicking/dragging the canvas background starts a pan — drop focus + text
  // selection so editable fields don't stay focused/highlighted underneath.
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
      centerOnInit
      limitToBounds={false}
      doubleClick={{ disabled: true }}
      wheel={{ step: 0.06 }}
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
          <LetterDocument document={document} template={template} style={style} handlers={handlers} onAiBlock={onAiBlock} scale={scale} />
        </div>
      </TransformComponent>
    </TransformWrapper>
  )
}
