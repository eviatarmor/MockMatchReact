import {
  connectorPolyline,
  elementBounds,
  listElementsSorted,
} from "./document"
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
    const b = elementBounds(el, doc)
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
        const plain = el.label.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
        if (plain) {
          ctx.fillStyle = "#171717"
          ctx.font = "14px system-ui, sans-serif"
          ctx.textAlign = "center"
          ctx.fillText(
            plain,
            el.x + ox + el.w / 2,
            el.y + oy + el.h / 2 + 5
          )
          ctx.textAlign = "start"
        }
      }
    } else if (el.type === "stencil") {
      try {
        const img = await loadSvgImage(el.svg)
        ctx.drawImage(img, el.x + ox, el.y + oy, el.w, el.h)
      } catch {
        // Fallback outline if SVG raster fails
        ctx.strokeStyle = "#a3a3a3"
        ctx.strokeRect(el.x + ox, el.y + oy, el.w, el.h)
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
      const pts = connectorPolyline(el, doc)
      if (pts.length < 2) continue
      ctx.strokeStyle = el.stroke
      ctx.lineWidth = el.strokeWidth
      ctx.lineCap = "round"
      ctx.lineJoin = "round"
      ctx.beginPath()
      ctx.moveTo(pts[0]!.x + ox, pts[0]!.y + oy)
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i]!.x + ox, pts[i]!.y + oy)
      }
      // Arrow heads (match canvas approximation)
      if (el.endArrow) {
        const prev = pts[pts.length - 2]!
        const tip = pts[pts.length - 1]!
        strokeArrowHead(ctx, prev, tip, ox, oy)
      }
      if (el.startArrow) {
        const next = pts[1]!
        const tip = pts[0]!
        strokeArrowHead(ctx, next, tip, ox, oy)
      }
      ctx.stroke()
    }
  }

  return new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/png")
  )
}

function strokeArrowHead(
  ctx: CanvasRenderingContext2D,
  from: { x: number; y: number },
  to: { x: number; y: number },
  ox: number,
  oy: number,
  size = 10
) {
  const angle = Math.atan2(to.y - from.y, to.x - from.x)
  const a1 = angle + Math.PI * 0.85
  const a2 = angle - Math.PI * 0.85
  const p1x = to.x + size * Math.cos(a1)
  const p1y = to.y + size * Math.sin(a1)
  const p2x = to.x + size * Math.cos(a2)
  const p2y = to.y + size * Math.sin(a2)
  ctx.moveTo(to.x + ox, to.y + oy)
  ctx.lineTo(p1x + ox, p1y + oy)
  ctx.moveTo(to.x + ox, to.y + oy)
  ctx.lineTo(p2x + ox, p2y + oy)
}

function loadSvgImage(svg: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("svg raster failed"))
    }
    img.src = url
  })
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
