import { DocumentScoreBadge } from "@/components/data/document-score-badge"

interface CoverLetterScoreBadgeProps {
  readonly score: number | null
}

/** Job-agnostic general analysis score (same as cover letter editor panel). */
export function CoverLetterScoreBadge({ score }: CoverLetterScoreBadgeProps) {
  return <DocumentScoreBadge score={score} />
}
