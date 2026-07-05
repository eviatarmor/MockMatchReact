import type { GetStartedStep } from "@/features/signup/types"

export const GET_STARTED_STEPS: readonly GetStartedStep[] = [
  { id: "buildResume", step: 1, titleKey: "getStartedSteps.buildResume.title", descriptionKey: "getStartedSteps.buildResume.description" },
  { id: "runMockInterview", step: 2, titleKey: "getStartedSteps.runMockInterview.title", descriptionKey: "getStartedSteps.runMockInterview.description" },
  { id: "trackApplications", step: 3, titleKey: "getStartedSteps.trackApplications.title", descriptionKey: "getStartedSteps.trackApplications.description" },
]
