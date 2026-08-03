import { describe, expect, it, vi } from "vitest"
import { createRef } from "react"
import { composeRefs } from "@/lib/compose-refs"

describe("composeRefs", () => {
  it("assigns node to object refs", () => {
    const a = createRef<HTMLDivElement>()
    const b = createRef<HTMLDivElement>()
    const node = document.createElement("div")
    const composed = composeRefs(a, b)
    composed(node)
    expect(a.current).toBe(node)
    expect(b.current).toBe(node)
  })

  it("calls callback refs", () => {
    const cb = vi.fn()
    const node = document.createElement("span")
    composeRefs(cb)(node)
    expect(cb).toHaveBeenCalledWith(node)
  })

  it("ignores null/undefined refs", () => {
    const a = createRef<HTMLDivElement>()
    const node = document.createElement("div")
    expect(() => composeRefs(null, undefined, a)(node)).not.toThrow()
    expect(a.current).toBe(node)
  })

  it("returns cleanup when any callback ref returns a cleanup", () => {
    const cleanup = vi.fn()
    const cb = vi.fn(() => cleanup)
    const composed = composeRefs(cb)
    const node = document.createElement("div")
    const dispose = composed(node)
    expect(typeof dispose).toBe("function")
    dispose?.()
    expect(cleanup).toHaveBeenCalled()
  })
})
