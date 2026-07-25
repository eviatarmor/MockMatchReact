import { DocumentScoreBadge } from "@/components/data/document-score-badge"

interface ResumeScoreBadgeProps {
  readonly score: number | null
}

/** Job-agnostic general analysis score (same as resume editor panel). */
export function ResumeScoreBadge({ score }: ResumeScoreBadgeProps) {
  return <DocumentScoreBadge score={score} />
}
