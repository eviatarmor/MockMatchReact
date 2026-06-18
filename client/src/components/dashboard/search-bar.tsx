import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface SearchBarProps {
  readonly placeholder?: string
  readonly value?: string
  readonly onChange?: (val: string) => void
  readonly className?: string
}

export function SearchBar({ placeholder = "Search...", value, onChange, className }: SearchBarProps) {
  return (
    <div className={cn("relative w-full max-w-[140px] sm:max-w-[160px] md:max-w-[200px] lg:max-w-[220px]", className)}>
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
