import { describe, expect, it } from "vitest"
import { splitMarkdownBlocks } from "@/shadcn/markdown"

describe("splitMarkdownBlocks", () => {
  it("splits on blank lines", () => {
    expect(splitMarkdownBlocks("Hello\n\nWorld")).toEqual(["Hello", "World"])
  })

  it("keeps fenced code intact", () => {
    const src = "Intro\n\n```ts\nconst a = 1\n\nconst b = 2\n```\n\nOutro"
    const blocks = splitMarkdownBlocks(src)
    expect(blocks).toHaveLength(3)
    expect(blocks[1]).toContain("```ts")
    expect(blocks[1]).toContain("const b = 2")
  })

  it("returns empty for blank input", () => {
    expect(splitMarkdownBlocks("  \n\n  ")).toEqual([])
  })
})
