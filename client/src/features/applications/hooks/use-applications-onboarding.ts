import { useFeatureOnboarding } from "@/hooks/use-feature-onboarding"

const WELCOME_SEEN_KEY = "mm.applicationsWelcomeSeen"

/** First-visit welcome + optional tour for Applications. */
export function useApplicationsOnboarding() {
  return useFeatureOnboarding(WELCOME_SEEN_KEY)
}
