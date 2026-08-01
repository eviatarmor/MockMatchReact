import { PhoneOff, Volume2, VolumeX } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@mockmatch/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@mockmatch/ui/tooltip"
import { cn } from "@/lib/utils"
import type { SessionPhase } from "../types"

interface AgentControlsProps {
  readonly phase: SessionPhase
  readonly muted: boolean
  readonly onMuteToggle: () => void
  readonly onEnd: () => void
  readonly className?: string
}

/** Mute / End — used on the agent stage and the chrome bar trailing slot. */
export function AgentControls({
  phase,
  muted,
  onMuteToggle,
  onEnd,
  className,
}: AgentControlsProps) {
  const { t } = useTranslation("simulation-conversation")
  const ended = phase === "ended" || phase === "setup"

  return (
    <TooltipProvider delay={300}>
      <div
        className={cn("flex shrink-0 items-center justify-center gap-2", className)}
      >
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className={cn(
                  "h-8 cursor-pointer gap-1.5",
                  muted && "text-primary"
                )}
                disabled={ended}
                aria-pressed={muted}
                aria-label={
                  muted ? t("controls.unmute") : t("controls.mute")
                }
                onClick={onMuteToggle}
              />
            }
          >
            {muted ? (
              <VolumeX className="size-3.5" />
            ) : (
              <Volume2 className="size-3.5" />
            )}
            <span>
              {muted ? t("controls.unmute") : t("controls.mute")}
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {muted ? t("controls.unmute") : t("controls.mute")}
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="h-8 cursor-pointer gap-1.5 text-destructive hover:text-destructive"
                disabled={ended}
                aria-label={t("controls.endSession")}
                onClick={onEnd}
              />
            }
          >
            <PhoneOff className="size-3.5" />
            <span>{t("controls.endSession")}</span>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {t("controls.endSession")}
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}
