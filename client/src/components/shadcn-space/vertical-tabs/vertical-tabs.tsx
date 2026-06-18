import { useState, type ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import { cn } from "@/lib/utils"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export interface VerticalTabItem {
  readonly id: string
  readonly label: string
  readonly icon: LucideIcon
  readonly content: ReactNode
}

interface VerticalTabsProps {
  readonly tabs: readonly VerticalTabItem[]
  readonly defaultTabId?: string
  readonly layoutId?: string
  readonly className?: string
}

const variants = {
  enter: (dir: number) => ({ y: dir > 0 ? -48 : 48, opacity: 0 }),
  center: { y: 0, opacity: 1 },
  exit: (dir: number) => ({ y: dir > 0 ? 48 : -48, opacity: 0 }),
}

const transition = { type: "spring" as const, stiffness: 320, damping: 30 }

export function VerticalTabs({
  tabs,
  defaultTabId,
  layoutId = "vertical-tabs-active-indicator",
  className,
}: VerticalTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTabId ?? tabs[0]?.id)
  const [direction, setDirection] = useState(1)

  const handleTabChange = (newId: string) => {
    const prevIdx = tabs.findIndex((tab) => tab.id === activeTab)
    const nextIdx = tabs.findIndex((tab) => tab.id === newId)
    setDirection(nextIdx > prevIdx ? 1 : -1)
    setActiveTab(newId)
  }

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => handleTabChange(value as string)}
      orientation="vertical"
      className={cn("flex flex-col gap-8 md:flex-row md:gap-12 items-start", className)}
    >
      <div className="w-full shrink-0 md:w-56">
        <TabsList className="flex h-auto w-full flex-col justify-start gap-1.5 rounded-none border-none bg-transparent p-0">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className={cn(
                  "relative flex w-full cursor-pointer items-center justify-start gap-3 rounded-lg px-3.5 py-3 text-sm font-medium whitespace-nowrap transition-all outline-none select-none",
                  "after:hidden hover:bg-muted/60 hover:text-foreground",
                  isActive ? "border-none text-foreground" : "border border-border/50 text-muted-foreground"
                )}
              >
                <Icon className="z-10 size-4 shrink-0" />
                <span className="z-10 text-left">{tab.label}</span>
                {isActive && (
                  <motion.div
                    layoutId={layoutId}
                    className="pointer-events-none absolute inset-0 rounded-lg bg-muted"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  />
                )}
              </TabsTrigger>
            )
          })}
        </TabsList>
      </div>

      <div className="relative w-full flex-1 overflow-hidden p-1 max-w-2xl">
        <AnimatePresence mode="wait" custom={direction}>
          {tabs.map((tab) => {
            if (tab.id !== activeTab) return null
            return (
              <motion.div
                key={tab.id}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={transition}
                className="w-full"
              >
                {tab.content}
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </Tabs>
  )
}
