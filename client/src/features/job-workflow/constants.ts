import type { RecorderStat, KeyMoment, RecordedInterview } from "./types"

export const RECORDER_STATS: readonly RecorderStat[] = [
  { id: "captured", value: "14",   subValue: "all-time",      labelKey: "recorder.stats.captured", iconName: "Video" },
  { id: "hours",    value: "9.2",  subValue: "this quarter",  labelKey: "recorder.stats.hours",    iconName: "Clock" },
  { id: "talkRatio",value: "48%",  subValue: "you vs them",   labelKey: "recorder.stats.talkRatio",iconName: "MessageSquare" },
  { id: "filler",   value: "2.1",  subValue: "down from 3.4", labelKey: "recorder.stats.filler",   iconName: "Activity" },
]

export const LATEST_INTERVIEW = {
  company: "Linear",
  role: "Senior Product Designer",
  date: "Jun 16",
  durationMin: 32,
  tone: "Positive tone",
  youRatio: 46,
  interviewerRatio: 54,
  paceWpm: 138,
  fillerCount: 9,
  fillerPerMin: 0.3,
  longestAnswerSec: 160,
  topics: ["Behavioral", "Past projects", "Design process", "Salary expectations", "Team fit", "Q&A"],
} as const

export const KEY_MOMENTS: readonly KeyMoment[] = [
  { id: "m1", timestamp: "04:12", text: "Strong STAR answer on resolving a cross-team conflict.", sentiment: "positive" },
  { id: "m2", timestamp: "11:48", text: "Clear, metric-backed story about the billing redesign.", sentiment: "positive" },
  { id: "m3", timestamp: "19:30", text: "Hesitation and filler when asked about salary expectations.", sentiment: "caution" },
  { id: "m4", timestamp: "27:05", text: "Long monologue (2m40s) — interviewer tried to interject twice.", sentiment: "caution" },
]

export const RECORDED_INTERVIEWS: readonly RecordedInterview[] = [
  { id: "r1", date: "Jun 16", company: "Linear",    role: "Senior Product Designer", platform: "Zoom",        durationMin: 32, talkRatio: 46, insightCount: 7,  status: "analyzed"   },
  { id: "r2", date: "Jun 13", company: "Ramp",      role: "Product Designer",        platform: "Google Meet", durationMin: 45, talkRatio: 58, insightCount: 9,  status: "analyzed"   },
  { id: "r3", date: "Jun 9",  company: "Vercel",    role: "Staff Designer",          platform: "Zoom",        durationMin: 28, talkRatio: 41, insightCount: 6,  status: "analyzed"   },
  { id: "r4", date: "Jun 5",  company: "Notion",    role: "Design Lead",             platform: "Google Meet", durationMin: 55, talkRatio: 52, insightCount: 11, status: "analyzed"   },
  { id: "r5", date: "Jun 2",  company: "Figma",     role: "Product Designer",        platform: "Zoom",        durationMin: 38, talkRatio: 44, insightCount: 0,  status: "processing" },
]

export const PLATFORMS = ["Zoom", "Google Meet", "Microsoft Teams"] as const
export const RETENTION_OPTIONS = ["7days", "30days", "90days", "forever"] as const
