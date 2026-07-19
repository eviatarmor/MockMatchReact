import { useEffect, useRef, useState, type ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export interface ScrollSpyTabItem {
  readonly id: string
  readonly label: string
  readonly icon: LucideIcon
  readonly content: ReactNode
}

interface ScrollSpyTabsProps {
  readonly tabs: readonly ScrollSpyTabItem[]
  readonly defaultTabId?: string
  readonly layoutId?: string
  readonly className?: string
}

// Nearest ancestor that actually scrolls (the dashboard ScrollArea viewport).
// Skips scroll containers that aren't currently overflowing so we don't latch
// onto a redundant, non-scrolling wrapper.
function getScrollRoot(el: HTMLElement | null): HTMLElement | null {
  let node = el?.parentElement ?? null
  let firstScrollable: HTMLElement | null = null
  while (node) {
    const overflowY = getComputedStyle(node).overflowY
    const isScrollContainer =
      node.matches("[data-slot=scroll-area-viewport]") ||
      overflowY === "auto" ||
      overflowY === "scroll"
    if (isScrollContainer) {
      if (node.scrollHeight > node.clientHeight + 1) return node
      firstScrollable ??= node
    }
    node = node.parentElement
  }
  return firstScrollable
}

export function ScrollSpyTabs({
  tabs,
  defaultTabId,
  layoutId = "scroll-spy-active-indicator",
  className,
}: ScrollSpyTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTabId ?? tabs[0]?.id)
  const containerRef = useRef<HTMLDivElement>(null)
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map())
  // Suppress scroll-spy while a click-triggered smooth scroll is in flight,
  // so the active tab doesn't flicker across intermediate sections.
  const clickScrollingRef = useRef(false)

  useEffect(() => {
    let root: HTMLElement | null = null
    let raf = 0

    // Active = last section whose top has crossed a line just below the
    // scroller's top edge.
    const OFFSET = 120
    const update = () => {
      if (clickScrollingRef.current || !root) return
      const line = root.getBoundingClientRect().top + OFFSET
      let current = tabs[0]?.id
      for (const tab of tabs) {
        const el = sectionRefs.current.get(tab.id)
        if (el && el.getBoundingClientRect().top <= line) current = tab.id
      }
      if (current) setActiveTab(current)
    }

    // Bind once a genuinely-scrollable root exists (nested ScrollAreas can
    // resolve their height a frame or two after mount).
    const bind = () => {
      const found = getScrollRoot(containerRef.current)
      if (found && found.scrollHeight > found.clientHeight + 1) {
        root = found
        root.addEventListener("scroll", update, { passive: true })
        update()
      } else {
        raf = requestAnimationFrame(bind)
      }
    }
    bind()
    window.addEventListener("resize", update)
    return () => {
      cancelAnimationFrame(raf)
      root?.removeEventListener("scroll", update)
      window.removeEventListener("resize", update)
    }
  }, [tabs])

  const handleTabChange = (id: string) => {
    setActiveTab(id)
    const el = sectionRefs.current.get(id)
    const root = getScrollRoot(containerRef.current)
    if (!el || !root) return

    clickScrollingRef.current = true
    // rect-delta so it works regardless of each section's offsetParent.
    const delta = el.getBoundingClientRect().top - root.getBoundingClientRect().top
    const top = root.scrollTop + delta - 24
    root.scrollTo({ top, behavior: "smooth" })
    window.setTimeout(() => {
      clickScrollingRef.current = false
    }, 600)
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "mx-auto flex w-full max-w-4xl flex-col gap-8 sm:flex-row sm:items-start sm:gap-12",
        className
      )}
    >
      <Tabs
        value={activeTab}
        onValueChange={(value) => handleTabChange(value as string)}
        orientation="vertical"
        className="sticky top-0 w-full shrink-0 self-start py-2 sm:w-52 lg:w-56"
      >
        <TabsList variant="line" className="w-full flex-col gap-1.5 p-0">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="relative w-full cursor-pointer justify-start gap-3 rounded-lg px-3.5 py-3 after:hidden data-active:bg-transparent"
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
      </Tabs>

      <div className="flex w-full max-w-2xl flex-1 flex-col gap-12">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            data-section-id={tab.id}
            ref={(el) => {
              if (el) sectionRefs.current.set(tab.id, el)
              else sectionRefs.current.delete(tab.id)
            }}
            className="scroll-mt-24"
          >
            {tab.content}
          </div>
        ))}
      </div>
    </div>
  )
}
