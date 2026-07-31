import { useTranslation } from "react-i18next"
import { CollapsibleSidePanel } from "@mockmatch/ui/collapsible-side-panel"
import { SidePanelResizeHandle } from "@mockmatch/ui/side-panel-resize-handle"
import { useSidePanelWidth } from "@/hooks/use-side-panel-width"
import { useAskPanel } from "../ask-context"
import { AskChatSurface } from "./ask-chat-surface"

const ASK_DEFAULT_PX = 384
const ASK_MIN_PX = 320
const ASK_MAX_PX = 560

/** Match former Motion spring settle time (~stiffness 320 / damping 34). */
const ASK_OPEN_MS = 360

/**
 * Right chrome column on the dark dashboard shell (mirrors left SectionNav).
 * **Push** mode: CSS `width` transition (not Motion) so main content shrinks open.
 */
export function AskPanel() {
  const { t } = useTranslation("ask")
  const { open, closePanel } = useAskPanel()

  const { width, startResize } = useSidePanelWidth({
    defaultWidth: ASK_DEFAULT_PX,
    min: ASK_MIN_PX,
    max: ASK_MAX_PX,
  })

  return (
    <CollapsibleSidePanel
      open={open}
      width={width}
      side="right"
      mode="push"
      durationMs={ASK_OPEN_MS}
      slot="ask-panel"
      className="bg-sidebar text-sidebar-foreground"
    >
      <div
        className="relative flex h-full min-h-0 flex-col"
        aria-label={t("title")}
      >
        <SidePanelResizeHandle
          onPointerDown={startResize}
          label={t("resize")}
        />
        <AskChatSurface onClose={closePanel} />
      </div>
    </CollapsibleSidePanel>
  )
}
