import { useTranslation } from "react-i18next"
import { FileText, Play, Sparkles } from "lucide-react"
import { Button } from "@mockmatch/ui/button"
import { Badge } from "@mockmatch/ui/badge"
import { LATEST_INTERVIEW, KEY_MOMENTS } from "../constants"

export function RecorderLatestInterview() {
  const { t } = useTranslation("common")
  const iv = LATEST_INTERVIEW

  const longestMin = Math.floor(iv.longestAnswerSec / 60)
  const longestSec = iv.longestAnswerSec % 60

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border/60 bg-card p-5 shadow-sm ring-1 ring-foreground/5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="font-heading text-base font-medium text-foreground">{t("recorder.latest.title")}</h2>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{iv.company}</span>
            {" · "}{iv.role}{" · "}{iv.date}{" · "}{iv.durationMin} min
          </p>
        </div>
        <Badge variant="secondary">
          {iv.tone}
        </Badge>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{t("recorder.latest.talkRatio")}</span>
          <span className="tabular-nums">
            {t("recorder.latest.you")} {iv.youRatio}% · {t("recorder.latest.interviewer")} {iv.interviewerRatio}%
          </span>
        </div>
        <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className="bg-primary transition-all" style={{ width: `${iv.youRatio}%` }} />
          <div className="flex-1 bg-primary/20" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { labelKey: "recorder.latest.pace",          value: `${iv.paceWpm} wpm`,                     subKey: "recorder.latest.idealRange" },
          { labelKey: "recorder.latest.fillerWords",   value: String(iv.fillerCount),                  subKey: "recorder.latest.fillerPerMin" },
          { labelKey: "recorder.latest.longestAnswer", value: `${longestMin}m ${longestSec}s`,         subKey: "recorder.latest.watchLength" },
        ].map((m) => (
          <div key={m.labelKey} className="flex flex-col gap-0.5 rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5">
            <span className="text-xs text-muted-foreground">{t(m.labelKey)}</span>
            <span className="text-lg font-semibold leading-tight tabular-nums text-foreground">{m.value}</span>
            <span className="text-xs text-muted-foreground">
              {m.labelKey === "recorder.latest.fillerWords"
                ? `${iv.fillerPerMin} / min`
                : t(m.subKey)}
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-foreground">{t("recorder.latest.topicsCovered")}</span>
        <div className="flex flex-wrap gap-1.5">
          {iv.topics.map((topic) => (
            <Badge key={topic} variant="outline">{topic}</Badge>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-foreground">{t("recorder.latest.keyMoments")}</span>
        <div className="flex flex-col gap-1.5">
          {KEY_MOMENTS.map((m) => (
            <div key={m.id} className="flex items-start gap-2 text-sm">
              <span className="shrink-0 pt-0.5 font-mono text-xs tabular-nums text-primary">{m.timestamp}</span>
              <span
                className={`mt-1.5 size-2 shrink-0 rounded-full ${
                  m.sentiment === "positive"
                    ? "bg-emerald-500/80"
                    : "bg-amber-500/80"
                }`}
              />
              <span className="text-muted-foreground">{m.text}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Button variant="outline" className="cursor-pointer">
          <FileText />
          {t("recorder.latest.transcript")}
        </Button>
        <Button variant="outline" className="cursor-pointer">
          <Play />
          {t("recorder.latest.replay")}
        </Button>
        <Button className="cursor-pointer">
          <Sparkles />
          {t("recorder.latest.drillWeakSpots")}
        </Button>
      </div>
    </div>
  )
}
