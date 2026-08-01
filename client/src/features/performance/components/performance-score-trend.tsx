import { useTranslation } from "react-i18next"
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import type { ScoreTrendPoint } from "../types"

/** Prep Ultramarine — matches `--primary` light (DESIGN.md). */
const CHART_PRIMARY = "oklch(0.52 0.21 262)"
const CHART_MUTED = "oklch(0.556 0 0 / 0.55)"
const CHART_GRID = "oklch(0.556 0 0 / 0.2)"

interface PerformanceScoreTrendProps {
  readonly data: readonly ScoreTrendPoint[]
  readonly currentScore: number
  readonly delta: number
}

export function PerformanceScoreTrend({ data, currentScore, delta }: PerformanceScoreTrendProps) {
  const { t } = useTranslation("common")

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border/60 bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <h2 className="font-heading text-base font-semibold text-foreground">{t("performance.scoreTrend.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("performance.scoreTrend.description")}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 text-sm font-semibold tabular-nums">
          <span className="text-foreground">{currentScore}</span>
          <span className="text-xs text-emerald-600 dark:text-emerald-400">↗ +{delta}</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data as ScoreTrendPoint[]} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_PRIMARY} stopOpacity={0.35} />
              <stop offset="100%" stopColor={CHART_PRIMARY} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
          <XAxis
            dataKey="week"
            tick={{ fontSize: 10, fill: CHART_MUTED }}
            axisLine={false}
            tickLine={false}
            interval={2}
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tick={{ fontSize: 10, fill: CHART_MUTED }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "0.625rem",
              fontSize: 12,
              color: "var(--card-foreground)",
            }}
            cursor={{ stroke: CHART_PRIMARY, strokeWidth: 1, strokeDasharray: "4 2" }}
          />
          <Area
            type="monotone"
            dataKey="score"
            stroke={CHART_PRIMARY}
            strokeWidth={2.5}
            fill="url(#scoreGradient)"
            dot={{ fill: CHART_PRIMARY, r: 3.5, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: CHART_PRIMARY, strokeWidth: 2, stroke: "oklch(1 0 0)" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
