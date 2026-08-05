import { describe, expect, it } from "vitest"
import {
  buildShareUrl,
  parseWorkspaceQuestionId,
} from "@/modules/collab/share-url.js"

const APP = "http://localhost:5173"
const DOC = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
const Q = "11111111-2222-3333-4444-555555555555"
const TOKEN = "share-token-raw"

describe("parseWorkspaceQuestionId", () => {
  it("parses bank track template", () => {
    expect(parseWorkspaceQuestionId(`q:${Q}`)).toBe(Q)
  })

  it("rejects catalog slugs", () => {
    expect(parseWorkspaceQuestionId("js-sum")).toBeNull()
    expect(parseWorkspaceQuestionId("workspace")).toBeNull()
    expect(parseWorkspaceQuestionId(null)).toBeNull()
  })
})

describe("buildShareUrl", () => {
  it("whiteboard bank → /simulations/:questionId?share= only", () => {
    const url = buildShareUrl(APP, "whiteboard", DOC, TOKEN, {
      questionId: Q,
    })
    expect(url).toBe(`${APP}/simulations/${Q}?share=${TOKEN}`)
    expect(url).not.toContain("boardId")
    expect(url).not.toContain(DOC)
  })

  it("spreadsheet bank → /simulations/:questionId?share= only", () => {
    const url = buildShareUrl(APP, "spreadsheet", DOC, TOKEN, {
      questionId: Q,
    })
    expect(url).toBe(`${APP}/simulations/${Q}?share=${TOKEN}`)
    expect(url).not.toContain(DOC)
  })

  it("spreadsheet freeform → /simulations/spreadsheet?share= only", () => {
    const url = buildShareUrl(APP, "spreadsheet", DOC, TOKEN)
    expect(url).toBe(`${APP}/simulations/spreadsheet?share=${TOKEN}`)
    expect(url).not.toContain(DOC)
  })

  it("workspace bank (q: template) → /simulations/:questionId?share=", () => {
    const url = buildShareUrl(APP, "workspace", DOC, TOKEN, {
      workspaceFormat: `q:${Q}`,
    })
    expect(url).toBe(`${APP}/simulations/${Q}?share=${TOKEN}`)
    expect(url).not.toContain(DOC)
  })

  it("workspace bank with explicit questionId", () => {
    const url = buildShareUrl(APP, "workspace", DOC, TOKEN, {
      workspaceFormat: "js-sum",
      questionId: Q,
    })
    expect(url).toBe(`${APP}/simulations/${Q}?share=${TOKEN}`)
  })

  it("workspace catalog slug → code-run path + share only", () => {
    const url = buildShareUrl(APP, "workspace", DOC, TOKEN, {
      workspaceFormat: "js-sum",
    })
    expect(url).toBe(`${APP}/simulations/code-run/js-sum?share=${TOKEN}`)
  })

  it("workspace freeform → /simulations/workspace?share=", () => {
    const url = buildShareUrl(APP, "workspace", DOC, TOKEN, {
      workspaceFormat: "workspace",
    })
    expect(url).toBe(`${APP}/simulations/workspace?share=${TOKEN}`)
  })

  it("shell → terminal-lab?share=", () => {
    const url = buildShareUrl(APP, "workspace", DOC, TOKEN, {
      workspaceFormat: "shell",
    })
    expect(url).toBe(`${APP}/simulations/terminal-lab?share=${TOKEN}`)
  })

  it("page bank → /simulations/:questionId?share=", () => {
    const url = buildShareUrl(APP, "page", DOC, TOKEN, { questionId: Q })
    expect(url).toBe(`${APP}/simulations/${Q}?share=${TOKEN}`)
  })

  it("resume keeps document path", () => {
    const url = buildShareUrl(APP, "resume", DOC, TOKEN)
    expect(url).toBe(`${APP}/resumes/${DOC}?share=${TOKEN}`)
  })
})
