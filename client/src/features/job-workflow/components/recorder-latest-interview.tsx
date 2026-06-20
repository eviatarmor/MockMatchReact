import { useTranslation } from "react-i18next"
import { FileText, Play, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BADGE_TONES } from "@/components/data/badge-tones"
import { LATEST_INTERVIEW, KEY_MOMENTS } from "../constants"

export function RecorderLatestInterview() {
  const { t } = useTranslation("common")
  const iv = LATEST_INTERVIEW

  const longestMin = Math.floor(iv.longestAnswerSec / 60)
  const longestSec = iv.longestAnswerSec % 60

  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-base font-semibold">{t("recorder.latest.title")}</h2>
          <p className="text-sm text-primary">
            {iv.company} · {iv.role} · {iv.date} · {iv.durationMin} min
          </p>
        </div>
        <Badge variant="outline" className={`shrink-0 ${BADGE_TONES.emerald}`}>
          {iv.tone}
        </Badge>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{t("recorder.latest.talkRatio")}</span>
          <span>
            {t("recorder.latest.you")} {iv.youRatio}% · {t("recorder.latest.interviewer")} {iv.interviewerRatio}%
          </span>
        </div>
        <div className="flex h-2 w-full overflow-hidden rounded-full">
          <div className="bg-primary transition-all" style={{ width: `${iv.youRatio}%` }} />
          <div className="bg-primary/25 flex-1" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { labelKey: "recorder.latest.pace",          value: `${iv.paceWpm} wpm`,                     subKey: "recorder.latest.idealRange" },
          { labelKey: "recorder.latest.fillerWords",   value: String(iv.fillerCount),                  subKey: "recorder.latest.fillerPerMin" },
          { labelKey: "recorder.latest.longestAnswer", value: `${longestMin}m ${longestSec}s`,         subKey: "recorder.latest.watchLength" },
        ].map((m) => (
          <div key={m.labelKey} className="flex flex-col gap-0.5 rounded-lg border bg-muted/10 px-3 py-2.5">
            <span className="text-xs text-muted-foreground">{t(m.labelKey)}</span>
            <span className="text-lg font-bold leading-tight">{m.value}</span>
            <span className="text-xs text-muted-foreground">
              {m.labelKey === "recorder.latest.fillerWords"
                ? `${iv.fillerPerMin} / min`
                : t(m.subKey)}
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold">{t("recorder.latest.topicsCovered")}</span>
        <div className="flex flex-wrap gap-1.5">
          {iv.topics.map((topic) => (
            <Badge key={topic} variant="outline" className="font-normal text-muted-foreground">{topic}</Badge>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold">{t("recorder.latest.keyMoments")}</span>
        <div className="flex flex-col gap-1.5">
          {KEY_MOMENTS.map((m) => (
            <div key={m.id} className="flex items-start gap-2 text-sm">
              <span className="shrink-0 font-mono text-xs text-primary pt-0.5">{m.timestamp}</span>
              <span className={`size-2 shrink-0 rounded-full mt-1.5 ${m.sentiment === "positive" ? "bg-emerald-500" : "bg-amber-500"}`} />
              <span className="text-muted-foreground">{m.text}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <Button variant="outline" className="h-8 gap-1.5 cursor-pointer">
          <FileText className="size-3.5" />
          {t("recorder.latest.transcript")}
        </Button>
        <Button variant="outline" className="h-8 gap-1.5 cursor-pointer">
          <Play className="size-3.5" />
          {t("recorder.latest.replay")}
        </Button>
        <Button className="h-8 gap-1.5 cursor-pointer">
          <Sparkles className="size-3.5" />
          {t("recorder.latest.drillWeakSpots")}
        </Button>
      </div>
    </div>
  )
}
