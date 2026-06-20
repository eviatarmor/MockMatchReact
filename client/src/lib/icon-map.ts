import {
  Activity,
  AlignJustify,
  BarChart2,
  Briefcase,
  CheckCircle2,
  Clock,
  Code2,
  FileText,
  Flame,
  Lightbulb,
  MessageSquare,
  Mic2,
  Monitor,
  Network,
  Scan,
  Send,
  Sparkles,
  Target,
  Timer,
  TrendingDown,
  TrendingUp,
  Trophy,
  Users,
  Video,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

// Single source for string -> lucide icon lookup. Features store an `iconName`
// string in their constants/data and resolve it here at render time, instead of
// each component re-declaring its own map.
const ICON_REGISTRY: Record<string, LucideIcon> = {
  Activity,
  AlignJustify,
  BarChart2,
  Briefcase,
  CheckCircle2,
  Clock,
  Code2,
  FileText,
  Flame,
  Lightbulb,
  MessageSquare,
  Mic2,
  Monitor,
  Network,
  Scan,
  Send,
  Sparkles,
  Target,
  Timer,
  TrendingDown,
  TrendingUp,
  Trophy,
  Users,
  Video,
}

export function resolveIcon(name: string, fallback: LucideIcon = AlignJustify): LucideIcon {
  return ICON_REGISTRY[name] ?? fallback
}
