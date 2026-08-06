/** Bounding-box center of rectangular template elements (skip paths/connectors). */
export function templateContentCenter(
  elements: ReadonlyArray<{
    type: string
    x: number
    y: number
    w: number
    h: number
  }>
): { x: number; y: number } | null {
  const boxes = elements.filter(
    (el) => el.type !== "path" && el.type !== "connector"
  )
  if (boxes.length === 0) return null

  const minX = Math.min(...boxes.map((el) => el.x))
  const minY = Math.min(...boxes.map((el) => el.y))
  const maxX = Math.max(...boxes.map((el) => el.x + el.w))
  const maxY = Math.max(...boxes.map((el) => el.y + el.h))
  return { x: (minX + maxX) / 2, y: (minY + maxY) / 2 }
}

/** Double rAF so layout/transform settle after setDocument before pan. */
export function scheduleTemplateCameraPan(
  elements: ReadonlyArray<{
    type: string
    x: number
    y: number
    w: number
    h: number
  }>,
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
