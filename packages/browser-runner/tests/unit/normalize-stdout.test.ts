import { describe, expect, it } from "vitest"
import {
  createBrowserRunner,
  formatRunEventLine,
  normalizeStdout,
} from "@/create-browser-runner"
import { createUnsupportedAdapter } from "@/adapters/unsupported"

describe("normalizeStdout", () => {
  it("unifies newlines and trims end", () => {
    expect(normalizeStdout("hello\r\nworld\r\n")).toBe("hello\nworld")
    expect(normalizeStdout("a\rb\n  ")).toBe("a\nb")
  })

  it("leaves leading whitespace", () => {
    expect(normalizeStdout("  hi\n")).toBe("  hi")
  })
})

describe("formatRunEventLine", () => {
  it("formats stdout/stderr/exit/test-result", () => {
    expect(formatRunEventLine({ type: "stdout", chunk: "hi\n" })).toContain(
      "hi"
    )
    expect(
      formatRunEventLine({ type: "stderr", chunk: "err\n" })
    ).toContain("err")
    expect(
      formatRunEventLine({ type: "exit", code: 0, durationMs: 12 })
    ).toContain("exit 0")
    expect(
      formatRunEventLine({
        type: "test-result",
        name: "t1",
        pass: true,
      })
    ).toContain("t1")
    expect(
      formatRunEventLine({
        type: "test-result",
        name: "t2",
        pass: false,
        expected: "a",
        actual: "b",
      })
    ).toContain("t2")
  })

  it("status without message → null", () => {
    expect(
      formatRunEventLine({ type: "status", phase: "running" })
    ).toBeNull()
    expect(
      formatRunEventLine({
        type: "status",
        phase: "running",
        message: "go",
      })
    ).toContain("go")
  })
})

describe("createBrowserRunner", () => {
  it("lists supported languages", () => {
    const runner = createBrowserRunner()
    expect(runner.supportedLanguages()).toEqual([
      "javascript",
      "typescript",
      "python",
      "c",
      "cpp",
    ])
    expect(runner.isSupported("javascript")).toBe(true)
    expect(runner.isSupported("go")).toBe(false)
    runner.dispose()
  })

  it("throws on ensureReady after dispose", async () => {
    const runner = createBrowserRunner({
      adapters: [createUnsupportedAdapter(["go"])],
    })
    runner.dispose()
    await expect(runner.ensureReady("go")).rejects.toThrow(/disposed/)
  })
})

describe("createUnsupportedAdapter", () => {
  it("emits status + stderr + exit 1", async () => {
    const adapter = createUnsupportedAdapter(["go", "rust"])
    expect(adapter.languages).toEqual(["go", "rust"])
    const events: { type: string; code?: number; chunk?: string }[] = []
    await adapter.run(
      {
        language: "go",
        files: { "main.go": "package main" },
        entryPath: "main.go",
      },
      (e) => events.push(e as { type: string; code?: number; chunk?: string })
    )
    expect(events.some((e) => e.type === "status")).toBe(true)
    expect(events.some((e) => e.type === "stderr")).toBe(true)
    expect(events.find((e) => e.type === "exit")?.code).toBe(1)
    const stderr = events.find((e) => e.type === "stderr")?.chunk ?? ""
    expect(stderr.toLowerCase()).toContain("go")
  })

  it("emits java message", async () => {
    const adapter = createUnsupportedAdapter(["java"])
    let stderr = ""
    await adapter.run(
      {
        language: "java",
        files: { "Main.java": "class Main {}" },
        entryPath: "Main.java",
      },
      (e) => {
        if (e.type === "stderr") stderr += e.chunk
      }
    )
    expect(stderr.toLowerCase()).toContain("java")
  })
})
