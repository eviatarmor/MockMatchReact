import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"
import { LetterDocument } from "./letter-document"
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
 * navbar z-20) so the page visually slides underneath them.
 */
export function EditorCanvas({ document, template, viewport }: EditorCanvasProps) {
  const { scale, offset, isPanning, containerRef, containerProps } = viewport

  return createPortal(
    <div
      ref={containerRef}
      {...containerProps}
      className={cn(
        "fixed inset-0 z-0 overflow-hidden bg-neutral-100 dark:bg-neutral-950",
        isPanning ? "cursor-grabbing" : "cursor-grab"
      )}
      style={{
        backgroundImage: "radial-gradient(circle, var(--color-neutral-300) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
    >
      <div
        className="pointer-events-none absolute left-1/2 top-24 origin-top"
        style={{
          transform: `translate(-50%, 0) translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
        }}
      >
        <div className="pointer-events-auto">
          <LetterDocument document={document} template={template} />
        </div>
      </div>
    </div>,
    window.document.body
  )
}
