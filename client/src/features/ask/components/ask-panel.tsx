import { useTranslation } from "react-i18next"
import { motion, AnimatePresence } from "motion/react"
import { cn } from "@/lib/utils"
import { SidePanelResizeHandle } from "@mockmatch/ui/side-panel-resize-handle"
import { useSidePanelWidth } from "@/hooks/use-side-panel-width"
import { useAskPanel } from "../ask-context"
import { AskChatSurface } from "./ask-chat-surface"

const ASK_DEFAULT_PX = 384
const ASK_MIN_PX = 320
const ASK_MAX_PX = 560

const PANEL_SPRING = { type: "spring" as const, stiffness: 320, damping: 34 }

/**
 * Right chrome column on the dark dashboard shell (mirrors left SectionNav).
 * Springs open/closed; left-edge drag resize after open (grip on hover).
 */
export function AskPanel() {
  const { t } = useTranslation("ask")
  const { open, closePanel } = useAskPanel()

  const { width, startResize, isDragging } = useSidePanelWidth({
    defaultWidth: ASK_DEFAULT_PX,
    min: ASK_MIN_PX,
    max: ASK_MAX_PX,
  })

  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.aside
          key="ask-panel"
          aria-label={t("title")}
          initial={{ width: 0, opacity: 0 }}
          animate={{ width, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={isDragging ? { duration: 0 } : PANEL_SPRING}
          className={cn(
            "relative h-full min-h-0 shrink-0 overflow-hidden",
            "bg-sidebar text-sidebar-foreground"
          )}
        >
          <div
            className="relative flex h-full min-h-0 flex-col"
            style={{ width }}
          >
            <SidePanelResizeHandle
              onPointerDown={startResize}
              label={t("resize")}
            />
            <AskChatSurface onClose={closePanel} />
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
