import { DocumentScoreBadge } from "@/components/data/document-score-badge"

interface ApplicationMatchBadgeProps {
  readonly score: number | null
  readonly className?: string
}

/** Job match score chip — same visual as Resume Lab / Discover score badges. */
export function ApplicationMatchBadge({ score, className }: ApplicationMatchBadgeProps) {
  return <DocumentScoreBadge score={score} className={className} />
}
