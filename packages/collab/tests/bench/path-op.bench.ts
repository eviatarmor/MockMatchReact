import { bench, describe } from "vitest"
import { getByPath, setByPath } from "@/apply-path-op"

const doc: Record<string, unknown> = {
  header: { name: "Ada", headline: "Engineer" },
  sections: Array.from({ length: 30 }, (_, i) => ({
    id: `s${i}`,
    type: "experience",
    entries: Array.from({ length: 6 }, (_, j) => ({
      id: `e${j}`,
      title: `Role ${j}`,
      bullets: "did things",
    })),
  })),
}

describe("collab apply-path-op", () => {
  bench("getByPath", () => {
    getByPath(doc, "sections.12.entries.2.title")
  })

  bench("setByPath immutable", () => {
    setByPath(doc, "sections.12.entries.2.title", "Staff Engineer")
  })
})
