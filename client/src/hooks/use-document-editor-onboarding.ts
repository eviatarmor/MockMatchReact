import { useFeatureOnboarding } from "@/hooks/use-feature-onboarding"

/** Shared first-open tour for resume + cover letter editors. */
const WELCOME_SEEN_KEY = "mm.documentEditorWelcomeSeen"

export function useDocumentEditorOnboarding() {
  return useFeatureOnboarding(WELCOME_SEEN_KEY)
}
