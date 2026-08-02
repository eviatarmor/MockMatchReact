import { PhoneOff, Volume2, VolumeX } from "lucide-react"
import { Button } from "@mockmatch/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@mockmatch/ui/tooltip"
import { cn } from "@mockmatch/ui/utils"
import type { AgentControlsLabels, SessionPhase } from "./types"

export type AgentControlsProps = {
  readonly phase: SessionPhase
  readonly muted: boolean
  readonly onMuteToggle: () => void
  readonly onEnd: () => void
  readonly labels: AgentControlsLabels
  readonly className?: string
}

/** Mute / End — agent stage and chrome trailing slot. */
export function AgentControls({
  phase,
  muted,
  onMuteToggle,
  onEnd,
  labels,
  className,
}: AgentControlsProps) {
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
                aria-label={muted ? labels.unmute : labels.mute}
                onClick={onMuteToggle}
              />
            }
          >
            {muted ? (
              <VolumeX className="size-3.5" />
            ) : (
              <Volume2 className="size-3.5" />
            )}
            <span>{muted ? labels.unmute : labels.mute}</span>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {muted ? labels.unmute : labels.mute}
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
                aria-label={labels.endSession}
                onClick={onEnd}
              />
            }
          >
            <PhoneOff className="size-3.5" />
            <span>{labels.endSession}</span>
          </TooltipTrigger>
          <TooltipContent side="bottom">{labels.endSession}</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}
