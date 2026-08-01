import type { PerformanceStat, ScoreTrendPoint, DomainScore, StrengthItem, FocusAreaItem } from "./types"

export const PERFORMANCE_STATS: readonly PerformanceStat[] = [
  { id: "avgScore",   labelKey: "performance.stats.avgScore",   value: "80",   subValueKey: "performance.stats.avgScoreSub",   deltaKey: "performance.stats.avgScoreDelta",   deltaPositive: true,  iconName: "Target" },
  { id: "sessions",  labelKey: "performance.stats.sessions",   value: "42",   subValueKey: "performance.stats.sessionsSub",   deltaKey: "performance.stats.sessionsDelta",   deltaPositive: true,  iconName: "Mic2" },
  { id: "time",      labelKey: "performance.stats.time",       value: "11h",  subValueKey: "performance.stats.timeSub",       deltaKey: "performance.stats.timeDelta",       deltaPositive: true,  iconName: "Timer" },
  { id: "percentile",labelKey: "performance.stats.percentile", value: "88th", subValueKey: "performance.stats.percentileSub", deltaKey: "performance.stats.percentileDelta", deltaPositive: true,  iconName: "Trophy" },
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
  { id: "behavioral",  labelKey: "performance.domains.behavioral",  score: 88, delta: 7,  color: "bg-primary" },
  { id: "caseStudy",   labelKey: "performance.domains.caseStudy",   score: 81, delta: 4,  color: "bg-primary/80" },
  { id: "productSense",labelKey: "performance.domains.productSense",score: 77, delta: 5,  color: "bg-amber-500" },
  { id: "systemDesign",labelKey: "performance.domains.systemDesign",score: 64, delta: -2, color: "bg-muted-foreground" },
  { id: "coding",      labelKey: "performance.domains.coding",      score: 71, delta: 9,  color: "bg-foreground/55" },
  { id: "financeQuant",labelKey: "performance.domains.financeQuant",score: 58, delta: 1,  color: "bg-emerald-500" },
]

export const STRENGTHS: readonly StrengthItem[] = [
  { id: "s1", titleKey: "performance.strengths.s1Title", subtitleKey: "performance.strengths.s1Sub" },
  { id: "s2", titleKey: "performance.strengths.s2Title", subtitleKey: "performance.strengths.s2Sub" },
]

export const FOCUS_AREAS: readonly FocusAreaItem[] = [
  { id: "f1", titleKey: "performance.focusAreas.f1Title", subtitleKey: "performance.focusAreas.f1Sub" },
  { id: "f2", titleKey: "performance.focusAreas.f2Title", subtitleKey: "performance.focusAreas.f2Sub" },
]

export const TIME_RANGE_OPTIONS = ["last30", "last90", "last180", "allTime"] as const
export type TimeRange = typeof TIME_RANGE_OPTIONS[number]
