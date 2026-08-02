import { elementBounds, listElementsSorted } from "./document"
import type { WhiteboardDocument } from "./types"

/**
 * Rasterize board to PNG via offscreen canvas (simple rect/sticky approximation).
 * Paths/connectors drawn as polylines. Host may replace with SVG export later.
 */
export async function exportBoardPng(
  doc: WhiteboardDocument,
  options?: { readonly padding?: number; readonly scale?: number }
): Promise<Blob | null> {
  const padding = options?.padding ?? 40
  const scale = options?.scale ?? 2
  const elements = listElementsSorted(doc)
  if (elements.length === 0) {
    // Minimal blank export
    const c = document.createElement("canvas")
    c.width = 400
    c.height = 300
    const ctx = c.getContext("2d")
    if (!ctx) return null
    ctx.fillStyle = "#f5f5f5"
    ctx.fillRect(0, 0, c.width, c.height)
    return new Promise((resolve) => c.toBlob((b) => resolve(b), "image/png"))
  }

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const el of elements) {
    const b = elementBounds(el)
    minX = Math.min(minX, b.x)
    minY = Math.min(minY, b.y)
    maxX = Math.max(maxX, b.x + b.w)
    maxY = Math.max(maxY, b.y + b.h)
  }

  const w = Math.max(1, maxX - minX + padding * 2)
  const h = Math.max(1, maxY - minY + padding * 2)
  const canvas = document.createElement("canvas")
  canvas.width = Math.ceil(w * scale)
  canvas.height = Math.ceil(h * scale)
  const ctx = canvas.getContext("2d")
  if (!ctx) return null
  ctx.scale(scale, scale)
  ctx.fillStyle = "#fafafa"
  ctx.fillRect(0, 0, w, h)

  const ox = -minX + padding
  const oy = -minY + padding

  for (const el of elements) {
    if (el.type === "sticky") {
      ctx.fillStyle = el.color
      ctx.fillRect(el.x + ox, el.y + oy, el.w, el.h)
      ctx.strokeStyle = "rgba(0,0,0,0.12)"
      ctx.strokeRect(el.x + ox, el.y + oy, el.w, el.h)
      ctx.fillStyle = "#171717"
      ctx.font = "14px system-ui, sans-serif"
      wrapText(ctx, el.text, el.x + ox + 8, el.y + oy + 20, el.w - 16)
    } else if (el.type === "text") {
      ctx.fillStyle = "#171717"
      ctx.font = `${el.fontSize}px system-ui, sans-serif`
      wrapText(ctx, el.text, el.x + ox, el.y + oy + el.fontSize, el.w)
    } else if (el.type === "shape") {
      ctx.fillStyle = el.fill
      ctx.strokeStyle = el.stroke
      ctx.lineWidth = 2
      if (el.shape === "ellipse") {
        ctx.beginPath()
        ctx.ellipse(
          el.x + ox + el.w / 2,
          el.y + oy + el.h / 2,
          el.w / 2,
          el.h / 2,
          0,
          0,
          Math.PI * 2
        )
        ctx.fill()
        ctx.stroke()
      } else {
        ctx.fillRect(el.x + ox, el.y + oy, el.w, el.h)
        ctx.strokeRect(el.x + ox, el.y + oy, el.w, el.h)
      }
      if (el.label) {
        ctx.fillStyle = "#171717"
        ctx.font = "14px system-ui, sans-serif"
        ctx.textAlign = "center"
        ctx.fillText(
          el.label,
          el.x + ox + el.w / 2,
          el.y + oy + el.h / 2 + 5
        )
        ctx.textAlign = "start"
      }
    } else if (el.type === "path" && el.points.length > 1) {
      const isHighlighter = el.strokeKind === "highlighter"
      const opacity =
        el.opacity ?? (isHighlighter ? 0.35 : 1)
      ctx.save()
      ctx.globalAlpha = opacity
      if (isHighlighter) ctx.globalCompositeOperation = "multiply"
      ctx.strokeStyle = el.stroke
      ctx.lineWidth = el.strokeWidth
      ctx.lineCap = "round"
      ctx.lineJoin = "round"
      ctx.beginPath()
      ctx.moveTo(el.points[0]!.x + ox, el.points[0]!.y + oy)
      for (let i = 1; i < el.points.length; i++) {
        ctx.lineTo(el.points[i]!.x + ox, el.points[i]!.y + oy)
      }
      ctx.stroke()
      ctx.restore()
    } else if (el.type === "connector") {
      // Free points only in export approximation
      const a =
        el.from.kind === "point"
          ? el.from
          : { x: minX, y: minY }
      const b =
        el.to.kind === "point" ? el.to : { x: maxX, y: maxY }
      if (el.from.kind === "point" || el.to.kind === "point") {
        ctx.strokeStyle = el.stroke
        ctx.lineWidth = el.strokeWidth
        ctx.beginPath()
        if (el.from.kind === "point" && el.to.kind === "point") {
          ctx.moveTo(a.x + ox, a.y + oy)
          ctx.lineTo(b.x + ox, b.y + oy)
        }
        ctx.stroke()
      }
    }
  }

  return new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/png")
  )
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number
) {
  const lines = text.split("\n")
  let cy = y
  for (const line of lines) {
    const words = line.split(/\s+/)
    let current = ""
    for (const word of words) {
      const test = current ? `${current} ${word}` : word
      if (ctx.measureText(test).width > maxWidth && current) {
        ctx.fillText(current, x, cy)
        cy += 16
        current = word
      } else {
        current = test
      }
    }
    if (current) {
      ctx.fillText(current, x, cy)
      cy += 16
    }
  }
}
