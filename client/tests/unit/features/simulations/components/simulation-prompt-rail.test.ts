import { describe, expect, it, vi } from "vitest"
import { FileText, LayoutTemplate } from "lucide-react"
import {
  buildPromptRailItems,
  resolvePromptRailLabels,
} from "@/features/simulations/components/simulation-prompt-rail-utils"

describe("resolvePromptRailLabels", () => {
  it("uses common.simulations.promptRail keys when overrides omitted", () => {
    const t = vi.fn((key: string) => `t:${key}`)
    const labels = resolvePromptRailLabels(undefined, t)
    expect(labels).toEqual({
      prompt: "t:simulations.promptRail.prompt",
      promptTitle: "t:simulations.promptRail.promptPanel.title",
      promptDescription: "t:simulations.promptRail.promptPanel.description",
      collapse: "t:simulations.promptRail.collapse",
      resize: "t:simulations.promptRail.resize",
    })
    expect(t).toHaveBeenCalled()
  })

  it("prefers host label overrides over translations", () => {
    const t = vi.fn((key: string) => `t:${key}`)
    const labels = resolvePromptRailLabels(
      {
        prompt: "Q",
        promptTitle: "Question",
        promptDescription: "Read carefully",
        collapse: "Hide",
        resize: "Drag",
      },
      t
    )
    expect(labels).toEqual({
      prompt: "Q",
      promptTitle: "Question",
      promptDescription: "Read carefully",
      collapse: "Hide",
      resize: "Drag",
    })
    expect(t).not.toHaveBeenCalled()
  })
})

describe("buildPromptRailItems", () => {
  const baseLabels = {
    prompt: "Prompt",
    promptTitle: "Prompt",
    promptDescription: "What to do",
    collapse: "Collapse",
    resize: "Resize",
  }

  it("returns a single prompt item when no extras", () => {
    const items = buildPromptRailItems(baseLabels)
    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({
      id: "prompt",
      label: "Prompt",
      title: "Prompt",
      description: "What to do",
      icon: FileText,
    })
  })

  it("appends extra panels after prompt", () => {
    const items = buildPromptRailItems(baseLabels, [
      {
        id: "templates",
        icon: LayoutTemplate,
        label: "Templates",
        title: "Templates",
        description: "Layouts",
        render: () => null,
      },
    ])
    expect(items.map((i) => i.id)).toEqual(["prompt", "templates"])
    expect(items[1]).toMatchObject({
      id: "templates",
      label: "Templates",
      icon: LayoutTemplate,
    })
  })
})
