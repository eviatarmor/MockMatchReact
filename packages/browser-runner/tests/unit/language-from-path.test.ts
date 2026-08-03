import { describe, expect, it } from "vitest"
import { languageFromPath, looksLikeWebAppEntry } from "@/language-from-path"

describe("languageFromPath", () => {
  it("maps common extensions", () => {
    expect(languageFromPath("main.py")).toBe("python")
    expect(languageFromPath("src/app.ts")).toBe("typescript")
    expect(languageFromPath("x.js")).toBe("javascript")
    expect(languageFromPath("a.cpp")).toBe("cpp")
    expect(languageFromPath("lib.rs")).toBe("rust")
    expect(languageFromPath("Main.java")).toBe("java")
    expect(languageFromPath("main.go")).toBe("go")
    expect(languageFromPath("Prog.cs")).toBe("csharp")
  })

  it("maps alt extensions", () => {
    expect(languageFromPath("m.mjs")).toBe("javascript")
    expect(languageFromPath("m.cjs")).toBe("javascript")
    expect(languageFromPath("m.mts")).toBe("typescript")
    expect(languageFromPath("m.cts")).toBe("typescript")
    expect(languageFromPath("a.cc")).toBe("cpp")
    expect(languageFromPath("a.cxx")).toBe("cpp")
    expect(languageFromPath("a.hpp")).toBe("cpp")
    expect(languageFromPath("a.h")).toBe("c")
    expect(languageFromPath("App.tsx")).toBe("typescript")
    expect(languageFromPath("App.jsx")).toBe("javascript")
  })

  it("uses last extension on basename; case-insensitive", () => {
    expect(languageFromPath("src/FOO.PY")).toBe("python")
    expect(languageFromPath("nested/path/file.TS")).toBe("typescript")
  })

  it("returns null for unknown / no extension", () => {
    expect(languageFromPath("noext")).toBeNull()
    expect(languageFromPath("file.unknown")).toBeNull()
    expect(languageFromPath(".gitignore")).toBeNull()
  })
})

describe("looksLikeWebAppEntry", () => {
  it("detects tsx/jsx", () => {
    expect(looksLikeWebAppEntry("App.tsx", {})).toBe(true)
    expect(looksLikeWebAppEntry("App.jsx", {})).toBe(true)
    expect(looksLikeWebAppEntry("main.js", {})).toBe(false)
  })

  it("detects react / vue / angular / next in package.json", () => {
    expect(
      looksLikeWebAppEntry("index.js", {
        "package.json": JSON.stringify({ dependencies: { react: "19" } }),
      })
    ).toBe(true)
    expect(
      looksLikeWebAppEntry("index.js", {
        "package.json": JSON.stringify({ devDependencies: { vue: "3" } }),
      })
    ).toBe(true)
    expect(
      looksLikeWebAppEntry("index.js", {
        "package.json": JSON.stringify({
          dependencies: { "@angular/core": "19" },
        }),
      })
    ).toBe(true)
    expect(
      looksLikeWebAppEntry("index.js", {
        "package.json": JSON.stringify({ dependencies: { next: "15" } }),
      })
    ).toBe(true)
  })

  it("ignores invalid package.json", () => {
    expect(
      looksLikeWebAppEntry("index.js", { "package.json": "{not json" })
    ).toBe(false)
  })

  it("false for pure algorithm package", () => {
    expect(
      looksLikeWebAppEntry("main.js", {
        "package.json": JSON.stringify({ dependencies: { lodash: "4" } }),
      })
    ).toBe(false)
  })
})
