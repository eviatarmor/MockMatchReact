import type { FeatureHighlight, ReadinessSummary } from "@/features/login/types"

export const FEATURE_HIGHLIGHTS: readonly FeatureHighlight[] = [
  { id: "resume", labelKey: "featureHighlights.resume", icon: "resume" },
  { id: "interview", labelKey: "featureHighlights.interview", icon: "interview" },
  { id: "readiness", labelKey: "featureHighlights.readiness", icon: "readiness" },
]

export const READINESS_SUMMARY: ReadinessSummary = {
  maxScore: 100,
  updates: [
    { id: "addKeywords", score: 82, messageKey: "readinessUpdates.addKeywords" },
    { id: "tailorSummary", score: 88, messageKey: "readinessUpdates.tailorSummary" },
    { id: "runMockInterview", score: 95, messageKey: "readinessUpdates.runMockInterview" },
  ],
}
