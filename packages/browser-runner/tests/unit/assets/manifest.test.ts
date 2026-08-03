import { describe, expect, it } from "vitest"
import {
  ESBUILD_WASM_URL,
  ESBUILD_WASM_VERSION,
  PYODIDE_INDEX_URL,
  PYODIDE_MODULE_URL,
  PYODIDE_VERSION,
} from "@/assets/manifest"

describe("runtime asset manifest", () => {
  it("pins esbuild wasm version + jsdelivr url", () => {
    expect(ESBUILD_WASM_VERSION).toMatch(/^\d+\.\d+\.\d+$/)
    expect(ESBUILD_WASM_URL).toContain(ESBUILD_WASM_VERSION)
    expect(ESBUILD_WASM_URL).toContain("esbuild-wasm")
    expect(ESBUILD_WASM_URL).toMatch(/^https:\/\//)
  })

  it("pins pyodide version + index/module urls", () => {
    expect(PYODIDE_VERSION).toMatch(/^\d+\.\d+\.\d+$/)
    expect(PYODIDE_INDEX_URL).toContain(PYODIDE_VERSION)
    expect(PYODIDE_INDEX_URL.endsWith("/")).toBe(true)
    expect(PYODIDE_MODULE_URL).toBe(`${PYODIDE_INDEX_URL}pyodide.mjs`)
  })
})
