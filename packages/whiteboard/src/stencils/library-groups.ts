/**
 * Draw.io-style library packs for the stencils panel dropdown.
 * Each pack maps to one or more generated category JSON files (prefix match).
 */

export type StencilLibraryPack = {
  /** Stable select value */
  readonly id: string
  /** Human label in the dropdown */
  readonly title: string
  /**
   * Category id prefixes to include.
   * A category matches if id === prefix, or starts with `prefix.` / `prefix_`.
   */
  readonly match: readonly string[]
}

export type StencilLibraryGroup = {
  readonly id: string
  /** Section header (shown uppercase in UI) */
  readonly title: string
  readonly libraries: readonly StencilLibraryPack[]
}

/**
 * High-level grouping inspired by draw.io “More shapes” sections.
 * Order matches typical architecture / diagramming usage.
 */
export const STENCIL_LIBRARY_GROUPS: readonly StencilLibraryGroup[] = [
  {
    id: "general",
    title: "General",
    libraries: [
      { id: "basic", title: "Basic", match: ["basic"] },
      { id: "arrows", title: "Arrows", match: ["arrows"] },
      { id: "flowchart", title: "Flowchart", match: ["flowchart"] },
      { id: "bpmn", title: "BPMN", match: ["bpmn"] },
      { id: "eip", title: "EIP", match: ["eip"] },
      { id: "sitemap", title: "Sitemap", match: ["sitemap"] },
      { id: "lean_mapping", title: "Lean mapping", match: ["lean_mapping"] },
      { id: "bootstrap", title: "Bootstrap", match: ["bootstrap"] },
    ],
  },
  {
    id: "networking",
    title: "Networking",
    libraries: [
      { id: "alibaba_cloud", title: "Alibaba Cloud", match: ["alibaba_cloud"] },
      { id: "aws", title: "AWS", match: ["aws"] },
      { id: "aws2", title: "AWS 2", match: ["aws2"] },
      { id: "aws3", title: "AWS 3", match: ["aws3"] },
      { id: "aws3d", title: "AWS 3D", match: ["aws3d"] },
      { id: "aws4", title: "AWS 4", match: ["aws4"] },
      { id: "azure", title: "Azure", match: ["azure"] },
      { id: "cisco", title: "Cisco", match: ["cisco"] },
      { id: "cisco19", title: "Cisco 19", match: ["cisco19"] },
      {
        id: "cisco_safe",
        title: "Cisco Safe",
        match: ["cisco_safe"],
      },
      { id: "citrix", title: "Citrix", match: ["citrix"] },
      { id: "citrix2", title: "Citrix 2", match: ["citrix2"] },
      { id: "gcp", title: "GCP", match: ["gcp"] },
      { id: "gcp2", title: "GCP 2", match: ["gcp2"] },
      { id: "gcp3", title: "GCP 3", match: ["gcp3"] },
      { id: "ibm", title: "IBM", match: ["ibm"] },
      { id: "ibm_cloud", title: "IBM Cloud", match: ["ibm_cloud"] },
      { id: "kubernetes", title: "Kubernetes", match: ["kubernetes"] },
      { id: "kubernetes2", title: "Kubernetes 2", match: ["kubernetes2"] },
      { id: "networks", title: "Networks", match: ["networks"] },
      { id: "networks2", title: "Networks 2", match: ["networks2"] },
      { id: "openstack", title: "OpenStack", match: ["openstack"] },
      { id: "rack", title: "Rack", match: ["rack"] },
      { id: "salesforce", title: "Salesforce", match: ["salesforce"] },
      { id: "veeam", title: "Veeam", match: ["veeam"] },
      { id: "vvd", title: "VVD", match: ["vvd"] },
    ],
  },
  {
    id: "microsoft",
    title: "Microsoft",
    libraries: [
      { id: "office", title: "Office", match: ["office"] },
      { id: "mscae", title: "Cloud & enterprise", match: ["mscae"] },
    ],
  },
  {
    id: "software",
    title: "Software",
    libraries: [
      { id: "atlassian", title: "Atlassian", match: ["atlassian"] },
      { id: "webicons", title: "Web icons", match: ["webicons"] },
      { id: "weblogos", title: "Web logos", match: ["weblogos"] },
      { id: "android", title: "Android", match: ["android"] },
      { id: "ios7", title: "iOS", match: ["ios7"] },
      { id: "gmdl", title: "Material design", match: ["gmdl"] },
      { id: "mockup", title: "Mockups", match: ["mockup"] },
    ],
  },
  {
    id: "engineering",
    title: "Engineering",
    libraries: [
      { id: "electrical", title: "Electrical", match: ["electrical"] },
      { id: "pid", title: "P&ID", match: ["pid"] },
      { id: "fluid_power", title: "Fluid power", match: ["fluid_power"] },
      { id: "floorplan", title: "Floorplan", match: ["floorplan"] },
      { id: "cabinets", title: "Cabinets", match: ["cabinets"] },
    ],
  },
  {
    id: "signs",
    title: "Signs",
    libraries: [
      { id: "signs", title: "Signs", match: ["signs"] },
    ],
  },
] as const

/** True if a generated category id belongs to a library pack. */
export function categoryMatchesPack(
  categoryId: string,
  pack: StencilLibraryPack
): boolean {
  const id = categoryId.toLowerCase()
  return pack.match.some((prefix) => {
    const p = prefix.toLowerCase()
    // Exact root (aws4) or dotted children (aws.compute). Avoid aws→aws2.
    return id === p || id.startsWith(`${p}.`)
  })
}

export function findLibraryPack(
  packId: string
): StencilLibraryPack | undefined {
  for (const group of STENCIL_LIBRARY_GROUPS) {
    const hit = group.libraries.find((l) => l.id === packId)
    if (hit) return hit
  }
  return undefined
}

/** All category file ids covered by a pack (from a known category list). */
export function categoryIdsForPack(
  packId: string,
  allCategoryIds: readonly string[]
): string[] {
  const pack = findLibraryPack(packId)
  if (!pack) return []
  return allCategoryIds.filter((id) => categoryMatchesPack(id, pack))
}

/** Flat list of packs for Select `items` labels. */
export function allLibraryPacks(): StencilLibraryPack[] {
  return STENCIL_LIBRARY_GROUPS.flatMap((g) => [...g.libraries])
}
