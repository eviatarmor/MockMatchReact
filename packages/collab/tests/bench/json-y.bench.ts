import { bench, describe } from "vitest"
import * as Y from "yjs"
import { jsonToY, yToJson } from "@/yjs/json-y"

const resumeLike = {
  header: { name: "Ada Lovelace", headline: "Mathematician", contacts: [] as unknown[] },
  sections: Array.from({ length: 15 }, (_, i) => ({
    id: `s${i}`,
    type: "summary",
    text: "Built analytical engines. ".repeat(20),
  })),
}

describe("collab yjs json bridge", () => {
  bench("jsonToY resume-sized", () => {
    jsonToY(resumeLike)
  })

  bench("jsonToY → yToJson round-trip", () => {
    const y = jsonToY(resumeLike)
    const doc = new Y.Doc()
    doc.getMap("root").set("v", y)
    yToJson(y)
  })
})
