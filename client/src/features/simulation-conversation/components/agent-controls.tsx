import { useTranslation } from "react-i18next"
import {
  AgentControls as VoiceAgentControls,
  type AgentControlsProps as BaseProps,
} from "@mockmatch/voice-agent"
import type { SessionPhase } from "../types"

type AgentControlsProps = Omit<BaseProps, "labels"> & {
  readonly phase: SessionPhase
}

/** Host wrapper — injects i18n labels into package controls. */
export function AgentControls({
  phase,
  muted,
  onMuteToggle,
  onEnd,
  className,
}: AgentControlsProps) {
  const { t } = useTranslation("simulation-conversation")
  return (
    <VoiceAgentControls
      phase={phase}
      muted={muted}
      onMuteToggle={onMuteToggle}
      onEnd={onEnd}
      className={className}
      labels={{
        mute: t("controls.mute"),
        unmute: t("controls.unmute"),
        endSession: t("controls.endSession"),
      }}
    />
  )
}
