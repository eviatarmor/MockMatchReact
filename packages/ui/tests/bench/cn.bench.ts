import { bench, describe } from "vitest"
import { cn } from "@/lib/utils"

describe("ui cn (class merge every render)", () => {
  bench("cn 2 static", () => {
    cn("px-2 py-1", "text-sm font-medium")
  })

  bench("cn conflict tailwind", () => {
    cn("px-2 py-1 text-red-500", "px-4 text-blue-500", false && "hidden", "rounded-md")
  })

  bench("cn many conditionals", () => {
    const active = true
    const dense = false
    cn(
      "flex items-center gap-2",
      active && "bg-primary text-primary-foreground",
      dense ? "h-7 text-xs" : "h-8 text-sm",
      "hover:bg-muted data-[state=open]:bg-accent"
    )
  })
})
