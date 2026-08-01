import { useTranslation } from "react-i18next"
import { ArrowLeft } from "lucide-react"
import { IdeChromeBar } from "@mockmatch/ide"
import { Badge } from "@mockmatch/ui/badge"
import { Button } from "@mockmatch/ui/button"
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarTrigger,
} from "@mockmatch/ui/menubar"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@mockmatch/ui/tooltip"
import { AGENT_VOICE_IDS } from "../constants"
import type { AgentVoiceId, SessionPhase } from "../types"
import { AgentControls } from "./agent-controls"

interface ConversationSessionBarProps {
  readonly title: string
  readonly phase: SessionPhase
  readonly muted: boolean
  readonly voice: AgentVoiceId
  readonly onMuteToggle: () => void
  readonly onVoiceChange: (voice: AgentVoiceId) => void
  readonly onEnd: () => void
  readonly onRestart: () => void
  readonly onBack: () => void
  readonly className?: string
}

/**
 * Conversation host bar — composes shared {@link IdeChromeBar} with session menus.
 * Mute / End also on the right of the bar (and on the agent stage).
 */
export function ConversationSessionBar({
  title,
  phase,
  muted,
  voice,
  onMuteToggle,
  onVoiceChange,
  onEnd,
  onRestart,
  onBack,
  className,
}: ConversationSessionBarProps) {
  const { t } = useTranslation(["simulation-conversation", "common", "account-settings"])
  const ended = phase === "ended"

  return (
    <IdeChromeBar
      className={className}
      leading={
        <TooltipProvider delay={300}>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="size-8 shrink-0 cursor-pointer"
                  aria-label={t("simulation-conversation:controls.backToSimulations")}
                  onClick={onBack}
                />
              }
            >
              <ArrowLeft className="size-4" />
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {t("simulation-conversation:controls.backToSimulations")}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      }
      title={title}
      badge={
        <Badge variant="secondary" className="shrink-0 text-xs font-normal">
          {t("common:simulations.format.conversation")}
        </Badge>
      }
      start={
        <Menubar className="h-8 min-w-0 shrink-0 border-0 bg-transparent p-0 shadow-none">
          <MenubarMenu>
            <MenubarTrigger className="h-7 px-2 text-xs font-medium">
              {t("simulation-conversation:menubar.session")}
            </MenubarTrigger>
            <MenubarContent>
              <MenubarItem disabled={ended} onClick={onRestart}>
                {t("simulation-conversation:controls.restart")}
              </MenubarItem>
              <MenubarItem disabled={ended} onClick={onEnd}>
                {t("simulation-conversation:controls.endSession")}
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem onClick={onBack}>
                {t("simulation-conversation:controls.backToSimulations")}
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          <MenubarMenu>
            <MenubarTrigger
              className="h-7 px-2 text-xs font-medium"
              disabled={ended || phase === "setup"}
            >
              {t("simulation-conversation:menubar.voice")}
            </MenubarTrigger>
            <MenubarContent className="min-w-48">
              <MenubarRadioGroup
                value={voice}
                onValueChange={(v) => {
                  if (v && AGENT_VOICE_IDS.includes(v as AgentVoiceId)) {
                    onVoiceChange(v as AgentVoiceId)
                  }
                }}
              >
                {AGENT_VOICE_IDS.map((id) => (
                  <MenubarRadioItem key={id} value={id} className="cursor-pointer">
                    {t(`account-settings:voice.voices.${id}.name`)}
                  </MenubarRadioItem>
                ))}
              </MenubarRadioGroup>
            </MenubarContent>
          </MenubarMenu>

          <MenubarMenu>
            <MenubarTrigger className="h-7 px-2 text-xs font-medium">
              {t("simulation-conversation:menubar.audio")}
            </MenubarTrigger>
            <MenubarContent>
              <MenubarCheckboxItem
                checked={muted}
                disabled={ended || phase === "setup"}
                onCheckedChange={() => onMuteToggle()}
              >
                {t("simulation-conversation:controls.mute")}
              </MenubarCheckboxItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      }
      end={
        <AgentControls
          phase={phase}
          muted={muted}
          onMuteToggle={onMuteToggle}
          onEnd={onEnd}
        />
      }
    />
  )
}
