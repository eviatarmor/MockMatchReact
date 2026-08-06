type Translate = (key: string) => string

/** Empty-state title/description for search or filter active vs true empty. */
export function listEmptyCopy(
  hasActiveQuery: boolean,
  t: Translate,
  keys: {
    readonly emptyTitle: string
    readonly emptyDescription: string
    readonly emptySearchTitle: string
    readonly emptySearchDescription: string
  }
): { readonly title: string; readonly description: string } {
  if (hasActiveQuery) {
    return {
      title: t(keys.emptySearchTitle),
      description: t(keys.emptySearchDescription),
    }
  }
  return {
    title: t(keys.emptyTitle),
    description: t(keys.emptyDescription),
  }
}
