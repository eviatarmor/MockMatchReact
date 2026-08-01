import type {
  DifficultyLevel,
  DurationBucket,
  InterviewTrack,
  RecentSession,
  TrackFormat,
  TrackRoleFamily,
} from "./types"

/**
 * Live practice surfaces.
 * IDE ids match IdeFormatSlug / exercise catalog slug.
 * Conversation ids route to `/simulations/conversation/:trackId`.
 */
export const INTERVIEW_TRACKS: readonly InterviewTrack[] = [
  {
    id: "behavioral-core",
    iconName: "MessageSquare",
    difficulty: "medium",
    taskCount: 5,
    format: "conversation",
    durationMin: 20,
    roleFamilies: ["general", "product", "engineering", "design", "consulting"],
    titleKey: "simulations.tracks.behavioralCore.title",
    descriptionKey: "simulations.tracks.behavioralCore.description",
  },
  {
    id: "product-sense",
    iconName: "Lightbulb",
    difficulty: "medium",
    taskCount: 5,
    format: "conversation",
    durationMin: 25,
    roleFamilies: ["product", "general"],
    titleKey: "simulations.tracks.productSense.title",
    descriptionKey: "simulations.tracks.productSense.description",
  },
  {
    id: "system-design-talk",
    iconName: "Network",
    difficulty: "hard",
    taskCount: 5,
    format: "conversation",
    durationMin: 30,
    roleFamilies: ["engineering"],
    titleKey: "simulations.tracks.systemDesignTalk.title",
    descriptionKey: "simulations.tracks.systemDesignTalk.description",
  },

  {
    id: "js-sum",
    iconName: "Code2",
    difficulty: "easy",
    taskCount: 3,
    format: "codeRun",
    durationMin: 15,
    roleFamilies: ["engineering"],
    titleKey: "simulations.tracks.jsSum.title",
    descriptionKey: "simulations.tracks.jsSum.description",
  },
  {
    id: "ts-sum",
    iconName: "FileText",
    difficulty: "easy",
    taskCount: 3,
    format: "codeRun",
    durationMin: 15,
    roleFamilies: ["engineering"],
    titleKey: "simulations.tracks.tsSum.title",
    descriptionKey: "simulations.tracks.tsSum.description",
  },
  {
    id: "py-hello",
    iconName: "Code2",
    difficulty: "easy",
    taskCount: 3,
    format: "codeRun",
    durationMin: 15,
    roleFamilies: ["engineering"],
    titleKey: "simulations.tracks.pyHello.title",
    descriptionKey: "simulations.tracks.pyHello.description",
  },
  {
    id: "js-fizzbuzz",
    iconName: "Hash",
    difficulty: "easy",
    taskCount: 2,
    format: "codeRun",
    durationMin: 20,
    roleFamilies: ["engineering"],
    titleKey: "simulations.tracks.jsFizzbuzz.title",
    descriptionKey: "simulations.tracks.jsFizzbuzz.description",
  },
  {
    id: "js-reverse",
    iconName: "Scan",
    difficulty: "easy",
    taskCount: 3,
    format: "codeRun",
    durationMin: 10,
    roleFamilies: ["engineering"],
    titleKey: "simulations.tracks.jsReverse.title",
    descriptionKey: "simulations.tracks.jsReverse.description",
  },
  {
    id: "py-factorial",
    iconName: "Activity",
    difficulty: "easy",
    taskCount: 3,
    format: "codeRun",
    durationMin: 12,
    roleFamilies: ["engineering"],
    titleKey: "simulations.tracks.pyFactorial.title",
    descriptionKey: "simulations.tracks.pyFactorial.description",
  },
  {
    id: "ts-palindrome",
    iconName: "FileText",
    difficulty: "medium",
    taskCount: 3,
    format: "codeRun",
    durationMin: 15,
    roleFamilies: ["engineering"],
    titleKey: "simulations.tracks.tsPalindrome.title",
    descriptionKey: "simulations.tracks.tsPalindrome.description",
  },
  {
    id: "py-vowels",
    iconName: "Mic2",
    difficulty: "easy",
    taskCount: 3,
    format: "codeRun",
    durationMin: 10,
    roleFamilies: ["engineering"],
    titleKey: "simulations.tracks.pyVowels.title",
    descriptionKey: "simulations.tracks.pyVowels.description",
  },
  {
    id: "cpp-sort",
    iconName: "Code2",
    difficulty: "medium",
    taskCount: 1,
    format: "codeRun",
    durationMin: 30,
    roleFamilies: ["engineering"],
    titleKey: "simulations.tracks.cppSort.title",
    descriptionKey: "simulations.tracks.cppSort.description",
  },
  {
    id: "react",
    iconName: "Monitor",
    difficulty: "medium",
    taskCount: 1,
    format: "workspace",
    durationMin: 25,
    roleFamilies: ["engineering"],
    titleKey: "simulations.tracks.react.title",
    descriptionKey: "simulations.tracks.react.description",
  },
  {
    id: "shell",
    iconName: "Terminal",
    difficulty: "medium",
    taskCount: 1,
    format: "terminal",
    durationMin: 20,
    roleFamilies: ["engineering"],
    titleKey: "simulations.tracks.shell.title",
    descriptionKey: "simulations.tracks.shell.description",
  },
  {
    id: "workspace",
    iconName: "Server",
    difficulty: "medium",
    taskCount: 1,
    format: "workspace",
    durationMin: 30,
    roleFamilies: ["engineering"],
    titleKey: "simulations.tracks.workspace.title",
    descriptionKey: "simulations.tracks.workspace.description",
  },
] as const

export const TRACK_DIFFICULTIES: readonly DifficultyLevel[] = [
  "adaptive",
  "easy",
  "medium",
  "hard",
] as const

/** Practice environment formats currently available. */
export const TRACK_FORMATS: readonly TrackFormat[] = [
  "conversation",
  "codeRun",
  "workspace",
  "terminal",
] as const

export const TRACK_ROLE_FAMILIES: readonly TrackRoleFamily[] = [
  "engineering",
  "product",
  "design",
  "finance",
  "consulting",
  "clinical",
  "general",
] as const

export const TRACK_DURATION_BUCKETS: readonly DurationBucket[] = [
  "short",
  "medium",
  "long",
] as const

/** Mock history until sessions API lands. */
function daysAgoIso(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(14, 30, 0, 0)
  return d.toISOString()
}

export const MOCK_RECENT_SESSIONS: readonly RecentSession[] = [
  {
    id: "s0",
    title: "Behavioral · Core stories",
    track: "Conversation",
    trackId: "behavioral-core",
    updatedAt: daysAgoIso(0),
    durationMin: 12,
    score: null,
    status: "in_progress",
  },
  {
    id: "s1",
    title: "JavaScript · Sum lines",
    track: "Code run",
    trackId: "js-sum",
    updatedAt: daysAgoIso(1),
    durationMin: 8,
    score: 91,
    status: "completed",
  },

  {
    id: "s2",
    title: "Python · Sum lines",
    track: "Code run",
    trackId: "py-hello",
    updatedAt: daysAgoIso(2),
    durationMin: 12,
    score: 88,
    status: "completed",
  },
  {
    id: "s3",
    title: "TypeScript · Sum lines",
    track: "Code run",
    trackId: "ts-sum",
    updatedAt: daysAgoIso(3),
    durationMin: 10,
    score: null,
    status: "in_progress",
  },
  {
    id: "s4",
    title: "Ops · Shell lab",
    track: "Terminal lab",
    trackId: "shell",
    updatedAt: daysAgoIso(5),
    durationMin: 15,
    score: null,
    status: "abandoned",
  },
  {
    id: "s5",
    title: "React · Counter lab",
    track: "Dev workspace",
    trackId: "react",
    updatedAt: daysAgoIso(6),
    durationMin: 20,
    score: 72,
    status: "completed",
  },
] as const
