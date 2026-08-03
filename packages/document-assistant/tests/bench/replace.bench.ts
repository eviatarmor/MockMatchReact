import { bench, describe } from "vitest"
import { applyDocumentTextReplacement } from "@/lib/apply-text-replacement"
import { stripHtml } from "@/lib/strip-html"
import type { ResumeDocumentDto } from "@mockmatch/schemas"

const resume = {
  header: {
    name: "Ada Lovelace",
    headline: "Engineer who ships systems",
    contacts: [
      { id: "c1", iconKey: "mail" as const, value: "ada@example.com" },
    ],
  },
  sections: Array.from({ length: 12 }, (_, i) => ({
    id: `s${i}`,
    type: "summary" as const,
    text: "Engineer who builds reliable systems. ".repeat(30),
  })),
} satisfies ResumeDocumentDto

const html = `<div><p>${"Hello <b>world</b> ".repeat(200)}</p><ul>${Array.from(
  { length: 50 },
  () => "<li>item</li>"
).join("")}</ul></div>`

describe("document-assistant text ops", () => {
  bench("applyDocumentTextReplacement resume", () => {
    applyDocumentTextReplacement("resume", resume, {
      find: "Engineer",
      replacement: "Builder",
    })
  })

  bench("stripHtml medium page", () => {
    stripHtml(html)
  })
})
