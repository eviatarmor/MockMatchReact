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

      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data as ScoreTrendPoint[]} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="week"
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
            interval={2}
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
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
            cursor={{ stroke: "hsl(var(--primary))", strokeWidth: 1 }}
          />
          <Area
            type="monotone"
            dataKey="score"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fill="url(#scoreGradient)"
            dot={{ fill: "hsl(var(--primary))", r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: "hsl(var(--primary))" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
