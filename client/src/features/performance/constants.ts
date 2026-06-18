import type { PerformanceStat, ScoreTrendPoint, DomainScore, StrengthItem, FocusAreaItem } from "./types"

export const PERFORMANCE_STATS: readonly PerformanceStat[] = [
  { id: "avgScore",   labelKey: "performance.stats.avgScore",   value: "80",   subValue: "/ 100",        delta: "+6 vs last quarter",  deltaPositive: true,  iconName: "Target" },
  { id: "sessions",  labelKey: "performance.stats.sessions",   value: "42",   subValue: "this quarter", delta: "+11 vs last quarter", deltaPositive: true,  iconName: "Mic2" },
  { id: "time",      labelKey: "performance.stats.time",       value: "11h",  subValue: "21h all-time", delta: "+9 vs last quarter",  deltaPositive: true,  iconName: "Timer" },
  { id: "percentile",labelKey: "performance.stats.percentile", value: "88th", subValue: "vs all users", delta: "+4 vs last quarter",  deltaPositive: true,  iconName: "Trophy" },
]

export const SCORE_TREND: readonly ScoreTrendPoint[] = [
  { week: "Mar 31", score: 62 },
  { week: "Apr 7",  score: 61 },
  { week: "Apr 14", score: 63 },
  { week: "Apr 21", score: 65 },
  { week: "Apr 28", score: 64 },
  { week: "May 5",  score: 67 },
  { week: "May 12", score: 69 },
  { week: "May 19", score: 70 },
  { week: "May 26", score: 72 },
  { week: "Jun 2",  score: 74 },
  { week: "Jun 9",  score: 76 },
  { week: "Jun 16", score: 80 },
]

export const DOMAIN_SCORES: readonly DomainScore[] = [
  { id: "behavioral",  labelKey: "performance.domains.behavioral",  score: 88, delta: 7,  color: "bg-blue-500" },
  { id: "caseStudy",   labelKey: "performance.domains.caseStudy",   score: 81, delta: 4,  color: "bg-teal-500" },
  { id: "productSense",labelKey: "performance.domains.productSense",score: 77, delta: 5,  color: "bg-amber-500" },
  { id: "systemDesign",labelKey: "performance.domains.systemDesign",score: 64, delta: -2, color: "bg-slate-800" },
  { id: "coding",      labelKey: "performance.domains.coding",      score: 71, delta: 9,  color: "bg-purple-500" },
  { id: "financeQuant",labelKey: "performance.domains.financeQuant",score: 58, delta: 1,  color: "bg-emerald-500" },
]

export const STRENGTHS: readonly StrengthItem[] = [
  { id: "s1", title: "STAR structure",        subtitle: "Consistently clear setup → result" },
  { id: "s2", title: "Communication clarity", subtitle: "Top 12% on pacing and filler words" },
]

export const FOCUS_AREAS: readonly FocusAreaItem[] = [
  { id: "f1", title: "System design depth", subtitle: "Scope tradeoffs before diagramming" },
  { id: "f2", title: "Quant speed",         subtitle: "Mental-math drills, aim < 30s" },
]

export const TIME_RANGE_OPTIONS = ["last30", "last90", "last180", "allTime"] as const
export type TimeRange = typeof TIME_RANGE_OPTIONS[number]
