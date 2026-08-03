import { bench, describe } from "vitest"
import { getByPath, setByPath } from "@/lib/path-op.js"

function buildNestedDoc(depth: number): Record<string, unknown> {
  let cur: Record<string, unknown> = { leaf: "x" }
  for (let i = depth - 1; i >= 0; i--) {
    cur = { [`k${i}`]: cur, items: [{ id: i, text: `row-${i}` }] }
  }
  return cur
}

const deep = buildNestedDoc(12)
const wide: Record<string, unknown> = {
  header: { name: "Ada", contacts: Array.from({ length: 20 }, (_, i) => ({ id: `c${i}`, value: `v${i}` })) },
  sections: Array.from({ length: 40 }, (_, i) => ({
    id: `s${i}`,
    type: "summary",
    text: "x".repeat(200),
    entries: Array.from({ length: 8 }, (_, j) => ({
      id: `e${i}-${j}`,
      title: `T${j}`,
      bullets: "• a\n• b\n• c",
    })),
  })),
}

describe("api path-op (collab LWW hot path)", () => {
  bench("getByPath deep 12", () => {
    getByPath(deep, "k0.k1.k2.k3.k4.k5.k6.k7.k8.k9.k10.k11.leaf")
  })

  bench("getByPath wide resume-like", () => {
    getByPath(wide, "sections.20.entries.3.title")
  })

  bench("setByPath deep (clone + walk)", () => {
    setByPath(deep, "k0.k1.k2.k3.k4.k5.k6.k7.k8.k9.k10.k11.leaf", "y")
  })

  bench("setByPath array index in wide doc", () => {
    setByPath(wide, "sections.5.entries.2.title", "Updated")
  })
})
