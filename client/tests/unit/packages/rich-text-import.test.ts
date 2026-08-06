import { describe, expect, it } from "vitest"
import {
  DEFAULT_RICH_TEXT_LABELS,
  normalizeLinkUrl,
  isBlankHtml,
  RICH_TEXT_NODES,
} from "@mockmatch/rich-text"
// Relative import (not @/) so static analyzers resolve the demo panel as used
import { RichTextDemoPanel } from "../../../src/features/rich-text-demo/rich-text-demo-panel"

describe("@mockmatch/rich-text host import", () => {
  it("exports labels, nodes, and pure helpers", () => {
    expect(DEFAULT_RICH_TEXT_LABELS.bold).toBe("Bold")
    expect(DEFAULT_RICH_TEXT_LABELS.linkApply).toBe("Apply")
    expect(RICH_TEXT_NODES.length).toBeGreaterThan(0)
    expect(normalizeLinkUrl("example.com")).toBe("https://example.com")
    expect(isBlankHtml("<p></p>")).toBe(true)
    expect(isBlankHtml("<p>&nbsp;</p>")).toBe(true)
    expect(isBlankHtml("<p>hi</p>")).toBe(false)
  })

  it("exposes RichTextDemoPanel for host smoke mounts", () => {
    expect(typeof RichTextDemoPanel).toBe("function")
  })
})
