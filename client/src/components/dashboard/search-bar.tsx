import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

interface SearchBarProps {
  readonly placeholder?: string
  readonly value?: string
  readonly onChange?: (val: string) => void
}

export function SearchBar({ placeholder = "Search...", value, onChange }: SearchBarProps) {
  return (
    <div className="relative w-full max-w-[180px] sm:max-w-[260px] md:max-w-[320px] lg:max-w-[400px]">
      <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
      <Input
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="h-8 w-full bg-muted/30 pl-9 pr-4 focus:bg-background transition-colors"
      />
    </div>
  )
}
