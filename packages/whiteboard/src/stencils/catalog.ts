/**
 * Stencil library catalog (draw.io-derived SVGs).
 * Index is static; per-category SVG payloads load on demand.
 */

import indexJson from "./generated/index.json"

export type StencilIndexShape = {
  readonly id: string
  readonly name: string
  readonly categoryId: string
  readonly w: number
  readonly h: number
}

export type StencilCategoryMeta = {
  readonly id: string
  readonly title: string
  readonly source: string
  readonly count: number
}

export type StencilDef = StencilIndexShape & {
  readonly svg: string
  readonly aspect?: string
}

export type StencilCategoryFile = {
  readonly id: string
  readonly title: string
  readonly shapes: readonly {
    readonly id: string
    readonly name: string
    readonly w: number
    readonly h: number
    readonly aspect?: string
    readonly svg: string
  }[]
}

type StencilIndexFile = {
  readonly version: number
  readonly shapeCount: number
  readonly categoryCount: number
  readonly categories: readonly StencilCategoryMeta[]
  readonly shapes: readonly StencilIndexShape[]
}

const index = indexJson as StencilIndexFile

export const STENCIL_CATEGORIES: readonly StencilCategoryMeta[] =
  index.categories

export const STENCIL_INDEX: readonly StencilIndexShape[] = index.shapes

export const STENCIL_SHAPE_COUNT = index.shapeCount

/** Vite lazy loaders: one JSON module per library. */
const categoryLoaders = import.meta.glob<{ default: StencilCategoryFile }>(
  "./generated/categories/*.json"
)

const categoryCache = new Map<string, StencilCategoryFile>()
const shapeCache = new Map<string, StencilDef>()

function loaderKeyForCategory(categoryId: string): string | null {
  const suffix = `/generated/categories/${categoryId}.json`
  for (const key of Object.keys(categoryLoaders)) {
    if (key.replace(/\\/g, "/").endsWith(suffix) || key.includes(`${categoryId}.json`)) {
      return key
    }
  }
  // exact relative form used by vite
  const direct = `./generated/categories/${categoryId}.json`
  return categoryLoaders[direct] ? direct : null
}

export async function loadStencilCategory(
  categoryId: string
): Promise<StencilCategoryFile | null> {
  const cached = categoryCache.get(categoryId)
  if (cached) return cached

  const key = loaderKeyForCategory(categoryId)
  const loader = key ? categoryLoaders[key] : undefined
  if (!loader) return null

  const mod = await loader()
  const file =
    "default" in mod && mod.default
      ? mod.default
      : (mod as unknown as StencilCategoryFile)
  categoryCache.set(categoryId, file)
  for (const s of file.shapes) {
    shapeCache.set(s.id, {
      id: s.id,
      name: s.name,
      categoryId: file.id,
      w: s.w,
      h: s.h,
      aspect: s.aspect,
      svg: s.svg,
    })
  }
  return file
}

export async function loadStencilDef(
  stencilId: string
): Promise<StencilDef | null> {
  const hit = shapeCache.get(stencilId)
  if (hit) return hit

  const meta = STENCIL_INDEX.find((s) => s.id === stencilId)
  if (!meta) return null
  const file = await loadStencilCategory(meta.categoryId)
  if (!file) return null
  return shapeCache.get(stencilId) ?? null
}

export function searchStencilIndex(
  query: string,
  options?: {
    /** @deprecated Prefer libraryPackId / categoryIds */
    readonly categoryId?: string | null
    /** Restrict to these generated category file ids */
    readonly categoryIds?: readonly string[] | null
    readonly limit?: number
  }
): StencilIndexShape[] {
  const q = query.trim().toLowerCase()
  const limit = options?.limit ?? 80
  const catSet =
    options?.categoryIds && options.categoryIds.length > 0
      ? new Set(options.categoryIds)
      : options?.categoryId
        ? new Set([options.categoryId])
        : null
  const out: StencilIndexShape[] = []
  for (const s of STENCIL_INDEX) {
    if (catSet && !catSet.has(s.categoryId)) continue
    if (q && !s.name.toLowerCase().includes(q) && !s.id.includes(q)) continue
    out.push(s)
    if (out.length >= limit) break
  }
  return out
}

export function getStencilCategory(
  categoryId: string
): StencilCategoryMeta | undefined {
  return STENCIL_CATEGORIES.find((c) => c.id === categoryId)
}
