import type { ReadinessArea, NextUpItem, SessionHistoryRow } from "./types"

export const OVERALL_SCORE = 72
export const OVERALL_LABEL_KEY = "readiness.overallLabel"
export const SCORE_DELTA_KEY = "readiness.scoreDelta"

export const READINESS_AREAS: readonly ReadinessArea[] = [
  { id: "resume",   labelKey: "readiness.areas.resume",   score: 84, color: "bg-blue-500" },
  { id: "behavioral", labelKey: "readiness.areas.behavioral", score: 70, color: "bg-teal-500" },
  { id: "coding",   labelKey: "readiness.areas.coding",   score: 58, color: "bg-slate-700" },
  { id: "caseStudy",labelKey: "readiness.areas.caseStudy",score: 76, color: "bg-amber-500" },
  { id: "systemDesign", labelKey: "readiness.areas.systemDesign", score: 64, color: "bg-purple-500" },
]

export const NEXT_UP_ITEMS: readonly NextUpItem[] = [
  { id: "n1", title: "Coding: Two-pointer drills",  subtitle: "readiness.nextUp.n1Sub", iconName: "Code2" },
  { id: "n2", title: "Behavioral mock: Leadership", subtitle: "readiness.nextUp.n2Sub", iconName: "Mic2" },
  { id: "n3", title: "Fix 2 ATS keywords",          subtitle: "readiness.nextUp.n3Sub", iconName: "FileText" },
]

export const MOCK_SESSION_HISTORY: readonly SessionHistoryRow[] = [
  { id: "h1", date: "Jun 14", role: "Senior Product Designer", track: "Behavioral",    score: 82, delta: 4  },
  { id: "h2", date: "Jun 12", role: "Backend Engineer",        track: "Coding",        score: 76, delta: 9  },
  { id: "h3", date: "Jun 9",  role: "PM, Growth",              track: "Product sense", score: 73, delta: -3 },
  { id: "h4", date: "Jun 5",  role: "Strategy Consultant",     track: "Case study",    score: 88, delta: 6  },
  { id: "h5", date: "Jun 1",  role: "Senior Product Designer", track: "System design", score: 64, delta: -2 },
]
