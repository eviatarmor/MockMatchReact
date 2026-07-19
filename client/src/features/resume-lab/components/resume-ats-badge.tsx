import { Gauge } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface ResumeATSBadgeProps {
  readonly score: number | null
}

function scoreVariant(score: number | null): "default" | "secondary" | "destructive" | "outline" {
  if (score === null) return "outline"
  if (score >= 85) return "default"
  if (score >= 70) return "secondary"
  return "destructive"
}

export function ResumeATSBadge({ score }: ResumeATSBadgeProps) {
  return (
    <Badge variant={scoreVariant(score)}>
      <Gauge className="size-3.5" />
      ATS {score === null ? "-" : score}
    </Badge>
  )
}
