import { FileText, Mic, Compass } from "lucide-react"
import type { FeatureHighlight } from "@/lib/auth/types"

const FEATURE_ICONS: Record<FeatureHighlight["icon"], typeof FileText> = {
  resume: FileText,
  interview: Mic,
  readiness: Compass,
}

interface FeatureHighlightListProps {
  readonly features: readonly FeatureHighlight[]
}

export function FeatureHighlightList({ features }: FeatureHighlightListProps) {
  return (
    <ul className="flex flex-col gap-3">
      {features.map((feature) => {
        const FeatureIcon = FEATURE_ICONS[feature.icon]

        return (
          <li key={feature.id} className="flex items-center gap-3 text-sm text-white">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-white/15">
              <FeatureIcon className="size-3.5" />
            </span>
            {feature.label}
          </li>
        )
      })}
    </ul>
  )
}
