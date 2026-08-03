import { describe, expect, it } from "vitest"
import { createEmptySheet, setColWidth, setRowHeight } from "../../src/document"
import {
  buildColLayout,
  buildRowLayout,
  findIndexAtOffset,
  visibleRange,
} from "../../src/layout"

describe("layout", () => {
  it("builds cumulative col offsets with custom widths", () => {
    let sheet = createEmptySheet("S", { colCount: 3, rowCount: 2 })
    sheet = setColWidth(sheet, 0, 50)
    sheet = setColWidth(sheet, 1, 100)
    // col 2 default 100
    const layout = buildColLayout(sheet)
    expect(layout.offsets).toEqual([0, 50, 150, 250])
    expect(layout.total).toBe(250)
  })

  it("finds index at offset", () => {
    const offsets = [0, 50, 150, 250]
    expect(findIndexAtOffset(offsets, 0)).toBe(0)
    expect(findIndexAtOffset(offsets, 49)).toBe(0)
    expect(findIndexAtOffset(offsets, 50)).toBe(1)
    expect(findIndexAtOffset(offsets, 200)).toBe(2)
  })

  it("visibleRange covers viewport", () => {
    let sheet = createEmptySheet("S", { colCount: 10, rowCount: 1 })
    for (let c = 0; c < 10; c++) sheet = setColWidth(sheet, c, 100)
    const layout = buildColLayout(sheet)
    const { start, end } = visibleRange(layout, 250, 200, 0)
    expect(start).toBe(2)
    expect(end).toBeGreaterThanOrEqual(4)
  })

  it("row heights affect layout total", () => {
    let sheet = createEmptySheet("S", { colCount: 1, rowCount: 3 })
    sheet = setRowHeight(sheet, 0, 20)
    sheet = setRowHeight(sheet, 1, 40)
    const layout = buildRowLayout(sheet)
    expect(layout.offsets[0]).toBe(0)
    expect(layout.offsets[1]).toBe(20)
    expect(layout.offsets[2]).toBe(60)
  })
})
