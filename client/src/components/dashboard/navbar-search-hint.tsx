import { Search } from "lucide-react"

export function NavbarSearchHint() {
  return (
    <button
      type="button"
      className="hidden sm:flex items-center gap-1.5 rounded-lg border bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
    >
      <Search className="size-3.5" />
      <span>Search</span>
      <kbd className="ml-1 rounded border bg-background px-1 py-0.5 text-[10px] font-medium text-muted-foreground">⌘K</kbd>
    </button>
  )
}
