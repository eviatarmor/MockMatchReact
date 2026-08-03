import { describe, expect, it } from "vitest"
import { pathsToTree } from "@/features/simulation-ide/lib/paths-to-tree"

describe("pathsToTree", () => {
  it("returns empty tree for empty input", () => {
    expect(pathsToTree([])).toEqual([])
  })

  it("builds nested folders and files", () => {
    const tree = pathsToTree([
      "src/main.ts",
      "src/lib/util.ts",
      "README.md",
    ])
    expect(tree.map((n) => n.name)).toEqual(["src", "README.md"])
    const src = tree.find((n) => n.name === "src")
    expect(src?.children).toBeDefined()
    const srcChildren = src!.children!
    expect(srcChildren.map((c) => c.name)).toEqual(["lib", "main.ts"])
    const lib = srcChildren.find((c) => c.name === "lib")
    expect(lib?.children).toBeDefined()
    const libChildren = lib!.children!
    expect(libChildren.map((c) => c.name)).toEqual(["util.ts"])
    expect(libChildren[0]?.id).toBe("src/lib/util.ts")
  })

  it("skips path traversal and empty paths", () => {
    expect(pathsToTree(["../secret", "", "ok.ts"])).toEqual([
      { id: "ok.ts", name: "ok.ts" },
    ])
  })

  it("normalizes backslashes and leading slashes", () => {
    const tree = pathsToTree(["\\src\\a.ts", "/src/b.ts"])
    const src = tree.find((n) => n.id === "src")
    expect(src?.children?.map((c) => c.id).sort()).toEqual([
      "src/a.ts",
      "src/b.ts",
    ])
  })

  it("dedupes identical paths", () => {
    const tree = pathsToTree(["a.ts", "a.ts"])
    expect(tree).toEqual([{ id: "a.ts", name: "a.ts" }])
  })
})
