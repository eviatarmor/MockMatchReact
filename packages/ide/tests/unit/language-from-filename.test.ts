import { describe, expect, it } from "vitest"
import {
  languageFromFileName,
  resolveTabLanguage,
} from "@/language-from-filename"

describe("languageFromFileName", () => {
  it("maps common code extensions", () => {
    expect(languageFromFileName("main.py")).toBe("python")
    expect(languageFromFileName("src/app.ts")).toBe("typescript")
    expect(languageFromFileName("a.js")).toBe("javascript")
    expect(languageFromFileName("x.cpp")).toBe("cpp")
    expect(languageFromFileName("Main.java")).toBe("java")
    expect(languageFromFileName("lib.rs")).toBe("rust")
    expect(languageFromFileName("main.go")).toBe("go")
  })

  it("maps web / config", () => {
    expect(languageFromFileName("a.json")).toBe("json")
    expect(languageFromFileName("a.md")).toBe("markdown")
    expect(languageFromFileName("a.yml")).toBe("yaml")
    expect(languageFromFileName("a.css")).toBe("css")
    expect(languageFromFileName("a.html")).toBe("html")
    expect(languageFromFileName("a.sh")).toBe("shell")
    expect(languageFromFileName("a.sql")).toBe("sql")
  })

  it("bare filenames", () => {
    expect(languageFromFileName("Dockerfile")).toBe("dockerfile")
    expect(languageFromFileName("Makefile")).toBe("plaintext")
    expect(languageFromFileName("Gemfile")).toBe("ruby")
  })

  it("special cases .d.ts and multi-dot", () => {
    expect(languageFromFileName("index.d.ts")).toBe("typescript")
    expect(languageFromFileName("foo.test.ts")).toBe("typescript")
  })

  it("unknown → plaintext", () => {
    expect(languageFromFileName("noext")).toBe("plaintext")
    expect(languageFromFileName("file.zzz")).toBe("plaintext")
    expect(languageFromFileName("ends.")).toBe("plaintext")
  })

  it("normalizes windows separators", () => {
    expect(languageFromFileName("src\\lib\\util.ts")).toBe("typescript")
  })
})

describe("resolveTabLanguage", () => {
  it("prefers id path over title", () => {
    expect(
      resolveTabLanguage({ id: "src/main.py", title: "main.py" })
    ).toBe("python")
  })

  it("falls back to title when id has no extension", () => {
    expect(
      resolveTabLanguage({ id: "untitled-1", title: "script.ts" })
    ).toBe("typescript")
  })

  it("uses explicit language last", () => {
    expect(
      resolveTabLanguage({
        id: "untitled",
        title: "Untitled",
        language: "python",
      })
    ).toBe("python")
  })

  it("defaults plaintext", () => {
    expect(resolveTabLanguage({ id: "x", title: "y" })).toBe("plaintext")
  })
})
