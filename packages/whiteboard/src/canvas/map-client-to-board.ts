/**
 * Map a client (screen) point to board layout coords using the board plane's
 * visual rect and layout size. Pure helper — unit-tested; canvas remeasures
 * getBoundingClientRect each call so pan/zoom after template apply stays aligned.
 */
export function mapClientToBoard(
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; width: number; height: number },
  layoutW: number,
  layoutH: number
): { x: number; y: number } {
  if (rect.width <= 0 || rect.height <= 0) return { x: 0, y: 0 }
  return {
    x: ((clientX - rect.left) * layoutW) / rect.width,
    y: ((clientY - rect.top) * layoutH) / rect.height,
  }
}
