import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { AudioLines, Mic, ScanFace, UserRound } from "lucide-react"
import { Button } from "@mockmatch/ui/button"
import { Label } from "@mockmatch/ui/label"
import { Switch } from "@mockmatch/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@mockmatch/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@mockmatch/ui/select"
import {
  MicSelector,
  MicSelectorContent,
  MicSelectorEmpty,
  MicSelectorInput,
  MicSelectorItem,
  MicSelectorLabel,
  MicSelectorList,
  MicSelectorTrigger,
  MicSelectorValue,
} from "@mockmatch/ai-chat/ai-elements/mic-selector"
import {
  DEFAULT_AGENT_VOICE,
  SESSION_KINDS,
  VOICE_CATALOG,
} from "../constants"
import type {
  AgentVoiceId,
  ConversationSessionConfig,
  SessionKind,
} from "../types"

interface SessionSetupDialogProps {
  readonly open: boolean
  readonly trackTitle: string
  readonly onCancel: () => void
  readonly onStart: (config: ConversationSessionConfig) => void
}

export function SessionSetupDialog({
  open,
  trackTitle,
  onCancel,
  onStart,
}: SessionSetupDialogProps) {
  const { t } = useTranslation(["simulation-conversation", "account-settings"])
  const [sessionKind, setSessionKind] = useState<SessionKind>("practice")
  const [analyzeFace, setAnalyzeFace] = useState(true)
  const [analyzePosture, setAnalyzePosture] = useState(true)
  const [voice, setVoice] = useState<AgentVoiceId>(DEFAULT_AGENT_VOICE)
  const [microphoneId, setMicrophoneId] = useState<string | undefined>(
    undefined
  )

  const kindItems = useMemo(
    () =>
      SESSION_KINDS.map((id) => ({
        value: id,
        label: t(`simulation-conversation:setup.kinds.${id}.label`),
        description: t(`simulation-conversation:setup.kinds.${id}.description`),
      })),
    [t]
  )

  const voiceItems = useMemo(
    () =>
      VOICE_CATALOG.map((entry) => ({
        value: entry.id,
        label: t(`account-settings:voice.voices.${entry.id}.name`),
        description: t(
          `account-settings:voice.voices.${entry.id}.description`
        ),
      })),
    [t]
  )

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel()
      }}
    >
      <DialogContent
        className="sm:max-w-lg"
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle>{t("simulation-conversation:setup.title")}</DialogTitle>
          <DialogDescription>
            {t("simulation-conversation:setup.description", {
              track: trackTitle,
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5 py-1">
          {/* Session kind */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="session-kind">
              {t("simulation-conversation:setup.sessionKind")}
            </Label>
            <Select
              value={sessionKind}
              onValueChange={(v) => {
                if (v) setSessionKind(v as SessionKind)
              }}
              items={kindItems.map((k) => ({
                value: k.value,
                label: k.label,
              }))}
            >
              <SelectTrigger id="session-kind" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {kindItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    <div className="flex flex-col gap-0.5 text-left">
                      <span>{item.label}</span>
                      <span className="text-2xs text-muted-foreground">
                        {item.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Analysis */}
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium">
              {t("simulation-conversation:setup.analyzeHeading")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("simulation-conversation:setup.analyzeHint")}
            </p>

            <div className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2.5">
              <div className="flex min-w-0 items-start gap-2.5">
                <ScanFace className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <Label htmlFor="analyze-face" className="cursor-pointer">
                    {t("simulation-conversation:setup.analyzeFace")}
                  </Label>
                  <p className="text-2xs text-muted-foreground">
                    {t("simulation-conversation:setup.analyzeFaceHint")}
                  </p>
                </div>
              </div>
              <Switch
                id="analyze-face"
                checked={analyzeFace}
                onCheckedChange={setAnalyzeFace}
              />
            </div>

            <div className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2.5">
              <div className="flex min-w-0 items-start gap-2.5">
                <UserRound className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <Label htmlFor="analyze-posture" className="cursor-pointer">
                    {t("simulation-conversation:setup.analyzePosture")}
                  </Label>
                  <p className="text-2xs text-muted-foreground">
                    {t("simulation-conversation:setup.analyzePostureHint")}
                  </p>
                </div>
              </div>
              <Switch
                id="analyze-posture"
                checked={analyzePosture}
                onCheckedChange={setAnalyzePosture}
              />
            </div>
          </div>

          {/* Voice — dropdown (same pattern as session type) */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="agent-voice">
              {t("simulation-conversation:setup.voice")}
            </Label>
            <Select
              value={voice}
              onValueChange={(v) => {
                if (v && VOICE_CATALOG.some((entry) => entry.id === v)) {
                  setVoice(v as AgentVoiceId)
                }
              }}
              items={voiceItems.map((item) => ({
                value: item.value,
                label: item.label,
              }))}
            >
              <SelectTrigger id="agent-voice" className="w-full">
                <span className="flex min-w-0 items-center gap-2">
                  <AudioLines className="size-3.5 shrink-0 text-muted-foreground" />
                  <SelectValue />
                </span>
              </SelectTrigger>
              <SelectContent>
                {voiceItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    <div className="flex flex-col gap-0.5 text-left">
                      <span>{item.label}</span>
                      <span className="text-2xs text-muted-foreground">
                        {item.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Microphone — ai-elements MicSelector */}
          <div className="flex flex-col gap-2">
            <Label>{t("simulation-conversation:setup.microphone")}</Label>
            <MicSelector
              value={microphoneId}
              onValueChange={setMicrophoneId}
            >
              <MicSelectorTrigger className="h-9 w-full cursor-pointer">
                <span className="flex min-w-0 items-center gap-2">
                  <Mic className="size-3.5 shrink-0 text-muted-foreground" />
                  <MicSelectorValue />
                </span>
              </MicSelectorTrigger>
              <MicSelectorContent>
                <MicSelectorInput
                  placeholder={t(
                    "simulation-conversation:setup.micSearchPlaceholder"
                  )}
                />
                <MicSelectorList>
                  {(devices) => (
                    <>
                      <MicSelectorEmpty>
                        {t("simulation-conversation:setup.micEmpty")}
                      </MicSelectorEmpty>
                      {devices.map((device) => (
                        <MicSelectorItem
                          key={device.deviceId}
                          value={device.deviceId}
                          className="cursor-pointer"
                        >
                          <MicSelectorLabel device={device} />
                        </MicSelectorItem>
                      ))}
                    </>
                  )}
                </MicSelectorList>
              </MicSelectorContent>
            </MicSelector>
            <p className="text-2xs text-muted-foreground">
              {t("simulation-conversation:setup.micHint")}
            </p>
          </div>
        </div>

        <DialogFooter className="sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer"
            onClick={onCancel}
          >
            {t("simulation-conversation:setup.cancel")}
          </Button>
          <Button
            type="button"
            className="cursor-pointer"
            onClick={() =>
              onStart({
                sessionKind,
                analyzeFace,
                analyzePosture,
                voice,
                microphoneId,
              })
            }
          >
            {t("simulation-conversation:setup.start")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
