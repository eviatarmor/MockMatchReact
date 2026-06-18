import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Video } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PLATFORMS, RETENTION_OPTIONS } from "../constants"

export function RecorderSettings() {
  const { t } = useTranslation("common")
  const [platforms, setPlatforms] = useState<Record<string, boolean>>({
    Zoom: true,
    "Google Meet": true,
    "Microsoft Teams": true,
  })
  const [autoJoin, setAutoJoin] = useState(true)
  const [liveTranscription, setLiveTranscription] = useState(true)
  const [generateInsights, setGenerateInsights] = useState(true)
  const [retention, setRetention] = useState("30days")

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm">
        <h2 className="text-base font-semibold">{t("recorder.settings.platforms.title")}</h2>
        <div className="flex flex-col divide-y divide-border/50">
          {PLATFORMS.map((p) => (
            <div key={p} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
              <div className="flex items-center gap-2.5">
                <Video className="size-4 text-muted-foreground" />
                <span className="text-sm font-medium">{p}</span>
              </div>
              <Switch
                checked={platforms[p] ?? false}
                onCheckedChange={(v) => setPlatforms((prev) => ({ ...prev, [p]: v }))}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm">
        <h2 className="text-base font-semibold">{t("recorder.settings.capture.title")}</h2>
        <div className="flex flex-col divide-y divide-border/50">
          {[
            { key: "autoJoin",         value: autoJoin,         setter: setAutoJoin,         titleKey: "recorder.settings.capture.autoJoin",    descKey: "recorder.settings.capture.autoJoinDesc" },
            { key: "liveTranscription",value: liveTranscription,setter: setLiveTranscription,titleKey: "recorder.settings.capture.transcription", descKey: "recorder.settings.capture.transcriptionDesc" },
            { key: "insights",         value: generateInsights, setter: setGenerateInsights, titleKey: "recorder.settings.capture.insights",     descKey: "recorder.settings.capture.insightsDesc" },
          ].map((s) => (
            <div key={s.key} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">{t(s.titleKey)}</span>
                <span className="text-xs text-muted-foreground">{t(s.descKey)}</span>
              </div>
              <Switch checked={s.value} onCheckedChange={s.setter} />
            </div>
          ))}

          <div className="flex items-center justify-between gap-3 pt-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">{t("recorder.settings.capture.retention")}</span>
              <span className="text-xs text-muted-foreground">{t("recorder.settings.capture.retentionDesc")}</span>
            </div>
            <Select value={retention} onValueChange={setRetention}>
              <SelectTrigger className="h-8 w-28 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RETENTION_OPTIONS.map((r) => (
                  <SelectItem key={r} value={r}>{t(`recorder.settings.retention.${r}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  )
}
