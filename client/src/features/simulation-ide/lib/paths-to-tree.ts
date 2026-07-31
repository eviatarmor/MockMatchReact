import type { IdeTreeNode } from "@mockmatch/ide"

/**
 * Build a file-tree from a flat list of file paths.
 * Folder ids are path prefixes; file ids equal full paths.
 */
export function pathsToTree(paths: readonly string[]): IdeTreeNode[] {
  type Mutable = {
    id: string
    name: string
    children?: Mutable[]
  }

  const root: Mutable[] = []

  const ensureFolder = (
    nodes: Mutable[],
    id: string,
    name: string
  ): Mutable => {
    let folder = nodes.find((n) => n.id === id)
    if (!folder) {
      folder = { id, name, children: [] }
      nodes.push(folder)
      nodes.sort((a, b) => {
        const af = a.children ? 0 : 1
        const bf = b.children ? 0 : 1
        if (af !== bf) return af - bf
        return a.name.localeCompare(b.name)
      })
    }
    if (!folder.children) folder.children = []
    return folder
  }

  for (const raw of [...paths].sort()) {
    const path = raw.replace(/\\/g, "/").replace(/^\/+/, "")
    if (!path || path.includes("..")) continue
    const parts = path.split("/").filter(Boolean)
    if (parts.length === 0) continue

    let nodes = root
    let prefix = ""
    for (let i = 0; i < parts.length; i++) {
      const name = parts[i]!
      const id = prefix ? `${prefix}/${name}` : name
      const isFile = i === parts.length - 1
      if (isFile) {
        if (!nodes.some((n) => n.id === id)) {
          nodes.push({ id, name })
          nodes.sort((a, b) => {
            const af = a.children ? 0 : 1
            const bf = b.children ? 0 : 1
            if (af !== bf) return af - bf
            return a.name.localeCompare(b.name)
          })
        }
      } else {
        const folder = ensureFolder(nodes, id, name)
        nodes = folder.children!
        prefix = id
      }
    }
  }

  return root as IdeTreeNode[]
}
