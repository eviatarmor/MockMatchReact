import { useTranslation } from "react-i18next"
import { useRef } from "react"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import type { PrepStep } from "../types"

interface PrepStepNavProps {
  readonly steps: PrepStep[]
  readonly activeStepId: string | null
  readonly onSelectStep: (id: string) => void
}

export function PrepStepNav({ steps, activeStepId, onSelectStep }: PrepStepNavProps) {
  const { t } = useTranslation("common")
  const scrollRef = useRef<HTMLDivElement>(null)
  const activeIndex = steps.findIndex((step) => step.id === activeStepId)

  return (
    <div className="flex items-center gap-2 rounded-xl border bg-card p-2">
      <ScrollArea className="flex-1">
        <div ref={scrollRef} className="flex items-center gap-2 px-1 py-1">
          {steps.map((step, index) => {
            const isActive = index === activeIndex
            const isCompleted = index < activeIndex

            return (
              <div key={step.id} className="flex items-center gap-2">
                {index > 0 && <span className="text-muted-foreground">—</span>}
                <button
                  type="button"
                  onClick={() => onSelectStep(step.id)}
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors cursor-pointer",
                    isActive && "bg-primary text-primary-foreground",
                    isCompleted && !isActive && "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
                    !isActive && !isCompleted && "bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                      isActive ? "bg-primary-foreground text-primary" : "bg-background"
                    )}
                  >
                    {index + 1}
                  </span>
                  {t(step.titleKey)}
                </button>
              </div>
            )
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0 cursor-pointer"
        onClick={() => scrollRef.current?.scrollBy({ left: 200, behavior: "smooth" })}
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  )
}
