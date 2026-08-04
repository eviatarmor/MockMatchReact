import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { Input } from "@mockmatch/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@mockmatch/ui/select"
import { cn } from "@mockmatch/ui/utils"
import {
  STENCIL_CATEGORIES,
  loadStencilCategory,
  searchStencilIndex,
  type StencilDef,
  type StencilIndexShape,
} from "./catalog"
import {
  STENCIL_LIBRARY_GROUPS,
  allLibraryPacks,
  categoryIdsForPack,
  findLibraryPack,
} from "./library-groups"

/** Sentinel for “all libraries” (Select values must be strings). */
const ALL_LIBRARIES_VALUE = "__all__"

export type WhiteboardStencilsPanelLabels = {
  readonly title?: string
  readonly searchPlaceholder: string
  readonly allCategories: string
  readonly empty: string
  readonly loading: string
  /** @deprecated Shape count line removed from panel */
  readonly countLabel?: (n: number) => string
}

export type WhiteboardStencilsPanelProps = {
  readonly onPlace: (stencil: StencilDef) => void
  readonly labels: WhiteboardStencilsPanelLabels
  readonly className?: string
  /** Optional footer (attribution link). */
  readonly footer?: ReactNode
}

function Thumb({
  svg,
  name,
}: {
  readonly svg: string | null
  readonly name: string
}) {
  if (!svg) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-md border border-dashed border-border bg-muted/40 text-[9px] text-muted-foreground">
        …
      </div>
    )
  }
  const src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  return (
    <div
      className="flex aspect-square items-center justify-center overflow-hidden rounded-md border border-border bg-white p-1.5 dark:bg-neutral-900"
      title={name}
    >
      <img
        src={src}
        alt=""
        className="max-h-full max-w-full object-contain"
        draggable={false}
      />
    </div>
  )
}

export function WhiteboardStencilsPanel({
  onPlace,
  labels,
  className,
  footer,
}: WhiteboardStencilsPanelProps) {
  const [query, setQuery] = useState("")
  /** Library pack id (e.g. aws4), not raw category file id */
  const [libraryId, setLibraryId] = useState<string | null>(null)
  const [svgById, setSvgById] = useState<Record<string, string>>({})
  const [loadingCat, setLoadingCat] = useState(false)

  const allCategoryIds = useMemo(
    () => STENCIL_CATEGORIES.map((c) => c.id),
    []
  )

  const activeCategoryIds = useMemo(() => {
    if (!libraryId) return null
    return categoryIdsForPack(libraryId, allCategoryIds)
  }, [libraryId, allCategoryIds])

  const results = useMemo(
    () =>
      searchStencilIndex(query, {
        categoryIds: activeCategoryIds,
        limit: query.trim() || libraryId ? 120 : 48,
      }),
    [query, activeCategoryIds, libraryId]
  )

  const selectItems = useMemo(
    () => [
      { value: ALL_LIBRARIES_VALUE, label: labels.allCategories },
      ...allLibraryPacks().map((pack) => ({
        value: pack.id,
        label: pack.title,
      })),
    ],
    [labels.allCategories]
  )

  // Prefetch SVGs for visible rows (and active library categories).
  useEffect(() => {
    let cancelled = false
    const cats = new Set(results.map((r) => r.categoryId))
    if (activeCategoryIds) {
      for (const id of activeCategoryIds) cats.add(id)
    }
    if (cats.size === 0) return

    setLoadingCat(true)
    void (async () => {
      const next: Record<string, string> = {}
      for (const id of cats) {
        const file = await loadStencilCategory(id)
        if (!file || cancelled) continue
        for (const s of file.shapes) next[s.id] = s.svg
      }
      if (cancelled) return
      setSvgById((prev) => ({ ...prev, ...next }))
      setLoadingCat(false)
    })()

    return () => {
      cancelled = true
    }
  }, [results, activeCategoryIds])

  const place = useCallback(
    async (item: StencilIndexShape) => {
      let svg: string | undefined = svgById[item.id]
      if (!svg) {
        const file = await loadStencilCategory(item.categoryId)
        const found = file?.shapes.find((s) => s.id === item.id)
        svg = found?.svg
        if (svg) {
          const resolved = svg
          setSvgById((prev) => ({ ...prev, [item.id]: resolved }))
        }
      }
      if (!svg) return
      onPlace({
        id: item.id,
        name: item.name,
        categoryId: item.categoryId,
        w: item.w,
        h: item.h,
        svg,
      })
    },
    [onPlace, svgById]
  )

  return (
    <div className={cn("flex min-h-0 flex-col gap-3", className)}>
      <div className="flex flex-col gap-2">
        {labels.title ? (
          <h3 className="text-sm font-medium text-foreground">{labels.title}</h3>
        ) : null}
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={labels.searchPlaceholder}
          className="text-xs"
          aria-label={labels.searchPlaceholder}
          autoComplete="off"
          spellCheck={false}
        />
        <Select
          value={libraryId ?? ALL_LIBRARIES_VALUE}
          onValueChange={(next) => {
            if (typeof next !== "string") return
            setLibraryId(next === ALL_LIBRARIES_VALUE ? null : next)
          }}
          items={selectItems}
        >
          <SelectTrigger
            size="sm"
            className="w-full min-w-0 text-xs"
            aria-label={labels.allCategories}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent
            align="start"
            alignItemWithTrigger
            className="max-h-80"
          >
            <SelectItem value={ALL_LIBRARIES_VALUE}>
              {labels.allCategories}
            </SelectItem>
            {STENCIL_LIBRARY_GROUPS.map((group) => (
              <SelectGroup key={group.id}>
                <SelectLabel className="px-1.5 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {group.title}
                </SelectLabel>
                {group.libraries.map((pack) => (
                  <SelectItem key={pack.id} value={pack.id}>
                    {pack.title}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loadingCat && results.length > 0 && Object.keys(svgById).length === 0 ? (
        <p className="text-xs text-muted-foreground">{labels.loading}</p>
      ) : null}

      {results.length === 0 ? (
        <p className="text-xs text-muted-foreground">{labels.empty}</p>
      ) : (
        <ul className="grid grid-cols-3 gap-2">
          {results.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => void place(item)}
                className={cn(
                  "group w-full rounded-lg border border-transparent p-1 text-left transition-colors",
                  "hover:border-blue-300 hover:bg-blue-50/50 dark:hover:border-blue-700 dark:hover:bg-blue-950/30"
                )}
              >
                <Thumb svg={svgById[item.id] ?? null} name={item.name} />
                <p className="mt-1 line-clamp-2 text-[10px] leading-tight text-foreground">
                  {item.name}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}

      {footer ? (
        <div className="border-t border-border pt-2 text-[10px] leading-snug text-muted-foreground">
          {footer}
        </div>
      ) : null}
    </div>
  )
}

// re-export helper for tests / host tooling
export { findLibraryPack }
