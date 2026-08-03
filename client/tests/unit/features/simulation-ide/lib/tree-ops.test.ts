import { describe, expect, it } from "vitest"
import type { IdeTreeNode } from "@mockmatch/ide"
import {
  addFileToTree,
  addFolderToTree,
  collectNodeIds,
  compareTreeNodes,
  findTreeNode,
  isFileNode,
  isFolderNode,
  removeNodeFromTree,
  renameNodeInTree,
  sortSiblings,
} from "@/features/simulation-ide/lib/tree-ops"

const sample: IdeTreeNode[] = [
  {
    id: "src",
    name: "src",
    children: [
      { id: "src/a.ts", name: "a.ts" },
      { id: "src/b.ts", name: "b.ts" },
    ],
  },
  { id: "README.md", name: "README.md" },
]

describe("tree node predicates & sort", () => {
  it("detects folder vs file", () => {
    expect(isFolderNode({ id: "f", name: "f", children: [] })).toBe(true)
    expect(isFolderNode({ id: "f.ts", name: "f.ts" })).toBe(false)
    expect(isFileNode({ id: "f.ts", name: "f.ts" })).toBe(true)
  })

  it("sorts folders first then alpha", () => {
    const nodes: IdeTreeNode[] = [
      { id: "z.ts", name: "z.ts" },
      { id: "a", name: "a", children: [] },
      { id: "b.ts", name: "b.ts" },
    ]
    expect(sortSiblings(nodes).map((n) => n.name)).toEqual(["a", "b.ts", "z.ts"])
    expect(compareTreeNodes(nodes[0]!, nodes[1]!)).toBeGreaterThan(0)
  })
})

describe("find / collect / remove", () => {
  it("finds nested nodes", () => {
    expect(findTreeNode(sample, "src/a.ts")?.name).toBe("a.ts")
    expect(findTreeNode(sample, "missing")).toBeNull()
  })

  it("collects node + descendants", () => {
    expect(collectNodeIds(sample, "src").sort()).toEqual([
      "src",
      "src/a.ts",
      "src/b.ts",
    ])
    expect(collectNodeIds(sample, "nope")).toEqual([])
  })

  it("removes a node", () => {
    const next = removeNodeFromTree(sample, "src/a.ts")
    expect(next).not.toBeNull()
    expect(findTreeNode(next!, "src/a.ts")).toBeNull()
    expect(findTreeNode(next!, "src/b.ts")).not.toBeNull()
    expect(removeNodeFromTree(sample, "ghost")).toBeNull()
  })
})

describe("add / rename", () => {
  it("adds file under folder with language tab", () => {
    const result = addFileToTree(sample, "src", "main.py")
    expect(result).not.toBeNull()
    expect(result!.nodeId).toBe("src/main.py")
    expect(result!.tab.language).toBe("python")
    expect(findTreeNode(result!.tree, "src/main.py")).not.toBeNull()
  })

  it("rejects bad names and duplicates", () => {
    expect(addFileToTree(sample, null, "..")).toBeNull()
    expect(addFileToTree(sample, null, ".")).toBeNull()
    expect(addFileToTree(sample, null, "  ")).toBeNull()
    expect(addFileToTree(sample, null, "README.md")).toBeNull()
    expect(addFolderToTree(sample, null, "src")).toBeNull()
  })

  it("adds folder at root", () => {
    const result = addFolderToTree(sample, null, "docs")
    expect(result?.nodeId).toBe("docs")
    expect(isFolderNode(findTreeNode(result!.tree, "docs")!)).toBe(true)
  })

  it("renames a file and reassigns id", () => {
    const result = renameNodeInTree(sample, "src/a.ts", "alpha.ts")
    expect(result).not.toBeNull()
    expect(result!.newId).toBe("src/alpha.ts")
    expect(findTreeNode(result!.tree, "src/a.ts")).toBeNull()
    expect(findTreeNode(result!.tree, "src/alpha.ts")?.name).toBe("alpha.ts")
  })
})
