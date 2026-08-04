import { Navigate, useParams, useSearchParams } from "react-router-dom"
import { practicePathForQuestionId } from "../lib/practice-path"

/**
 * Redirects legacy nested practice URLs:
 * `/simulations/practice|mcq|whiteboard|conversation/:id` → `/simulations/:id`
 * Preserves query string (`id`, `share`, `boardId`, …).
 */
export function LegacyPracticeRedirect() {
  const { questionId, trackId } = useParams<{
    questionId?: string
    trackId?: string
  }>()
  const [searchParams] = useSearchParams()
  const id = questionId ?? trackId
  if (!id) {
    return <Navigate to="/simulations" replace />
  }
  const qs = searchParams.toString()
  const base = practicePathForQuestionId(id)
  return <Navigate to={qs ? `${base}?${qs}` : base} replace />
}
