import type { WhiteboardElement } from "../types"

function isBoxElement(
  el: WhiteboardElement
): el is Extract<WhiteboardElement, { w: number; h: number }> {
  return el.type !== "path" && el.type !== "connector" && "w" in el && "h" in el
}

/** Bounding-box center of rectangular template elements (skip paths/connectors). */
export function templateContentCenter(
  elements: readonly WhiteboardElement[]
): { x: number; y: number } | null {
  const boxes = elements.filter(isBoxElement)
  if (boxes.length === 0) return null

  const minX = Math.min(...boxes.map((el) => el.x))
  const minY = Math.min(...boxes.map((el) => el.y))
  const maxX = Math.max(...boxes.map((el) => el.x + el.w))
  const maxY = Math.max(...boxes.map((el) => el.y + el.h))
  return { x: (minX + maxX) / 2, y: (minY + maxY) / 2 }
}

/** Double rAF so layout/transform settle after setDocument before pan. */
export function scheduleTemplateCameraPan(
  elements: readonly WhiteboardElement[],
  viewport: {
    resetView: () => void
    centerOnBoardPoint: (x: number, y: number) => void
  }
): void {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const center = templateContentCenter(elements)
      if (!center) {
        viewport.resetView()
        return
      }
      viewport.centerOnBoardPoint(center.x, center.y)
    })
  })
}
