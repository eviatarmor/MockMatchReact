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

interface PerformanceScoreTrendProps {
  readonly data: readonly ScoreTrendPoint[]
  readonly currentScore: number
  readonly delta: number
}

export function PerformanceScoreTrend({ data, currentScore, delta }: PerformanceScoreTrendProps) {
  const { t } = useTranslation("common")

  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-base font-semibold">{t("performance.scoreTrend.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("performance.scoreTrend.description")}</p>
        </div>
        <div className="flex items-center gap-1.5 text-sm font-semibold shrink-0">
          <span>{currentScore}</span>
          <span className="text-emerald-600 dark:text-emerald-400 text-xs">↗ +{delta}</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data as ScoreTrendPoint[]} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.2)" vertical={false} />
          <XAxis
            dataKey="week"
            tick={{ fontSize: 11, fill: "rgba(128,128,128,0.8)" }}
            axisLine={false}
            tickLine={false}
            interval={2}
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tick={{ fontSize: 11, fill: "rgba(128,128,128,0.8)" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: 12,
            }}
            cursor={{ stroke: "#3b82f6", strokeWidth: 1, strokeDasharray: "4 2" }}
          />
          <Area
            type="monotone"
            dataKey="score"
            stroke="#3b82f6"
            strokeWidth={2.5}
            fill="url(#scoreGradient)"
            dot={{ fill: "#3b82f6", r: 3.5, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: "#3b82f6", strokeWidth: 2, stroke: "#fff" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
