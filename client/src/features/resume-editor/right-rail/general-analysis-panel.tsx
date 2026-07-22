import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { CheckCircle2, ClipboardCheck, Loader2 } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { useGeneralAnalysis } from "../hooks/use-general-analysis"
import {
  focusAnalysisTarget,
  scoreBand,
  SEVERITY_ORDER,
  type AnalysisFinding,
  type AnalysisSeverity,
} from "../lib/general-analysis"
import type { ResumeDocument } from "../types"

interface GeneralAnalysisPanelProps {
  readonly document: ResumeDocument
}

/** Light surface tints for severity cards (matches muted section-card chrome). */
const SEVERITY_CARD: Record<AnalysisSeverity, string> = {
  critical:
    "border-rose-200/80 bg-rose-50/80 dark:border-rose-900/50 dark:bg-rose-950/35",
  high:
    "border-orange-200/80 bg-orange-50/80 dark:border-orange-900/50 dark:bg-orange-950/35",
  medium:
    "border-amber-200/80 bg-amber-50/80 dark:border-amber-900/45 dark:bg-amber-950/30",
  low:
    "border-sky-200/80 bg-sky-50/80 dark:border-sky-900/45 dark:bg-sky-950/30",
}

const SEVERITY_DOT: Record<AnalysisSeverity, string> = {
  critical: "bg-rose-500",
  high: "bg-orange-500",
  medium: "bg-amber-500",
  low: "bg-sky-500",
}

const SEVERITY_LABEL: Record<AnalysisSeverity, string> = {
  critical: "text-rose-700 dark:text-rose-300",
  high: "text-orange-700 dark:text-orange-300",
  medium: "text-amber-800 dark:text-amber-300",
  low: "text-sky-700 dark:text-sky-300",
}

function scoreTone(score: number): string {
  if (score >= 85) return "text-emerald-600 dark:text-emerald-400"
  if (score >= 70) return "text-amber-600 dark:text-amber-400"
  return "text-rose-600 dark:text-rose-400"
}

/** Color the single Progress indicator (Progress always owns its own track). */
function progressIndicatorTone(score: number): string {
  if (score >= 85) return "[&_[data-slot=progress-indicator]]:bg-emerald-500"
  if (score >= 70) return "[&_[data-slot=progress-indicator]]:bg-amber-500"
  return "[&_[data-slot=progress-indicator]]:bg-rose-500"
}

function FindingRow({ finding }: { readonly finding: AnalysisFinding }) {
  const { t } = useTranslation("resume-editor")
  const message =
    finding.message ??
    (finding.messageKey
      ? t(`analysis.findings.${finding.messageKey}`, finding.messageParams ?? {})
      : finding.ruleId)
  const location = finding.locationKey
    ? t(`analysis.locations.${finding.locationKey}`)
    : null
  const canFocus = Boolean(finding.focusTarget)

  return (
    <li>
      <button
        type="button"
        disabled={!canFocus}
        onClick={() => focusAnalysisTarget(finding.focusTarget)}
        className={cn(
          "flex w-full items-start gap-2 rounded-lg border px-2.5 py-2 text-left transition-colors",
          SEVERITY_CARD[finding.severity],
          canFocus
            ? "cursor-pointer hover:brightness-[0.98] active:brightness-[0.96] dark:hover:brightness-110"
            : "cursor-default opacity-90"
        )}
      >
        <span
          className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", SEVERITY_DOT[finding.severity])}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-snug text-foreground">{message}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
            <span className={cn("font-medium", SEVERITY_LABEL[finding.severity])}>
              {t(`analysis.severity.${finding.severity}`)}
            </span>
            {location && (
              <>
                <span aria-hidden>·</span>
                <span>{location}</span>
              </>
            )}
            {canFocus && (
              <>
                <span aria-hidden>·</span>
                <span>{t("analysis.clickToFocus")}</span>
              </>
            )}
          </p>
        </div>
      </button>
    </li>
  )
}

export function GeneralAnalysisPanel({ document }: GeneralAnalysisPanelProps) {
  const { t } = useTranslation("resume-editor")
  const { score, findings, countsBySeverity, isLinting } = useGeneralAnalysis(document)
  const band = scoreBand(score)

  const grouped = useMemo(() => {
    const map = new Map<AnalysisSeverity, AnalysisFinding[]>()
    for (const sev of SEVERITY_ORDER) map.set(sev, [])
    for (const f of findings) map.get(f.severity)?.push(f)
    return map
  }, [findings])

  const totalIssues =
    countsBySeverity.critical +
    countsBySeverity.high +
    countsBySeverity.medium +
    countsBySeverity.low

  const healthPreview = [
    t(`analysis.status.${band}`),
    t("analysis.issueCount", { count: totalIssues }),
  ].join(" · ")

  return (
    <div className="flex flex-col gap-5">
      {/* Same chrome as Sections panel rows: rounded-lg + border/60 + muted/30 */}
      <div className="flex flex-col gap-2 rounded-lg border border-border/60 bg-muted/30 px-2.5 py-2.5">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="size-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">{t("analysis.scoreLabel")}</p>
            <p className="truncate text-xs text-muted-foreground">{healthPreview}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {isLinting && (
              <Loader2 className="size-3.5 animate-spin text-muted-foreground" aria-label={t("analysis.linting")} />
            )}
            <span className={cn("text-base font-semibold tabular-nums", scoreTone(score))}>
              {score}
            </span>
          </div>
        </div>

        {/* One track only — Progress always renders its own track; don't nest another. */}
        <div className={cn("w-full", progressIndicatorTone(score))}>
          <Progress value={score} className="w-full gap-0" />
        </div>

        {totalIssues > 0 && (
          <div className="flex flex-wrap gap-1">
            {SEVERITY_ORDER.map((sev) => {
              const n = countsBySeverity[sev]
              if (n === 0) return null
              return (
                <span
                  key={sev}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium",
                    SEVERITY_CARD[sev],
                    SEVERITY_LABEL[sev]
                  )}
                >
                  <span className={cn("size-1 rounded-full", SEVERITY_DOT[sev])} aria-hidden />
                  {n} {t(`analysis.severity.${sev}`)}
                </span>
              )
            })}
          </div>
        )}
      </div>

      {totalIssues === 0 && !isLinting ? (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200/80 bg-emerald-50/80 px-2.5 py-2 dark:border-emerald-900/50 dark:bg-emerald-950/35">
          <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <p className="text-sm font-medium text-foreground">{t("analysis.empty")}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {SEVERITY_ORDER.map((sev) => {
            const rows = grouped.get(sev) ?? []
            if (rows.length === 0) return null
            return (
              <section key={sev} className="flex flex-col gap-1.5">
                <p className={cn("text-xs font-semibold", SEVERITY_LABEL[sev])}>
                  {t(`analysis.severity.${sev}`)}
                  <span className="ml-1.5 font-normal text-muted-foreground">({rows.length})</span>
                </p>
                <ul className="flex flex-col gap-1.5">
                  {rows.map((f) => (
                    <FindingRow key={f.id} finding={f} />
                  ))}
                </ul>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
