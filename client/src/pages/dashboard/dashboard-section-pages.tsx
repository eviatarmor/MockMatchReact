import type { ComponentType } from "react"
import { DashboardRoutePage } from "@/pages/dashboard/dashboard-placeholder-page"
import { ResumeLabPage } from "@/pages/dashboard/resume-lab-page"
import { CoverLettersPage } from "@/pages/dashboard/cover-letters-page"
import { DiscoverPage } from "@/pages/dashboard/discover-page"
import { ApplicationsPage } from "@/pages/dashboard/applications-page"
import { AccountSettingsPage } from "@/pages/dashboard/account-settings-page"
import { BillingPage } from "@/pages/dashboard/billing-page"
import { PrivacyPage } from "@/pages/dashboard/privacy-page"
import { HelpPage } from "@/pages/dashboard/help-page"
import { SimulationsPage } from "@/pages/dashboard/simulations-page"
import { QuestionBankPage } from "@/pages/dashboard/question-bank-page"
import { ReadinessPage } from "@/pages/dashboard/readiness-page"
import { PerformancePage } from "@/pages/dashboard/performance-page"
import { AutofillPage } from "@/pages/dashboard/autofill-page"
import { JobWorkflowPage } from "@/pages/dashboard/job-workflow-page"
import { InterviewRecorderPage } from "@/pages/dashboard/interview-recorder-page"

/** Section index pages keyed by path segment under DashboardLayout. */
export const DASHBOARD_SECTION_PAGES: Record<string, ComponentType> = {
  "resume-lab": ResumeLabPage,
  "cover-letters": CoverLettersPage,
  discover: DiscoverPage,
  applications: ApplicationsPage,
  "account-settings": AccountSettingsPage,
  billing: BillingPage,
  simulations: SimulationsPage,
  "question-bank": QuestionBankPage,
  readiness: ReadinessPage,
  performance: PerformancePage,
  autofill: AutofillPage,
  "job-workflow": JobWorkflowPage,
  "interview-recorder": InterviewRecorderPage,
  privacy: PrivacyPage,
  help: HelpPage,
}

/** Resolve a section route element; unknown paths fall back to placeholder. */
export function sectionRouteElement(path: string, titleKey: string) {
  const Page = DASHBOARD_SECTION_PAGES[path]
  if (Page) return <Page />
  return <DashboardRoutePage path={path} titleKey={titleKey} />
}
