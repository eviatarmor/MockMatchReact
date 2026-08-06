import { Route } from "react-router-dom"
import { RequireAuth } from "@/components/auth/require-auth"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { ResumeEditorPage } from "@/pages/dashboard/resume-editor-page"
import { ResumePrintPage } from "@/pages/dashboard/resume-print-page"
import { ResumeTemplatesPage } from "@/pages/dashboard/resume-templates-page"
import { CoverLetterEditorPage } from "@/pages/dashboard/cover-letter-editor-page"
import { CoverLetterPrintPage } from "@/pages/dashboard/cover-letter-print-page"
import { CoverLetterTemplatesPage } from "@/pages/dashboard/cover-letter-templates-page"
import { DiscoverJobPage } from "@/pages/dashboard/discover-job-page"
import { ApplicationDetailPage } from "@/pages/dashboard/application-detail-page"
import { SimulationTracksPage } from "@/pages/dashboard/simulation-tracks-page"
import { SimulationIdePage } from "@/pages/dashboard/simulation-ide-page"
import { SimulationConversationPage } from "@/pages/dashboard/simulation-conversation-page"
import { SimulationQuestionPage } from "@/pages/dashboard/simulation-question-page"
import { SimulationSpreadsheetPage } from "@/pages/dashboard/simulation-spreadsheet-page"
import { SimulationPagePage } from "@/pages/dashboard/simulation-page-page"
import { LegacyPracticeRedirect } from "@/features/simulations/components/legacy-practice-redirect"
import { NotificationsPage } from "@/pages/dashboard/notifications-page"
import { sectionRouteElement } from "@/pages/dashboard/dashboard-section-pages"

const DASHBOARD_ROUTES = [
  { path: "resume-lab", titleKey: "navItems.resumeLab" },
  { path: "cover-letters", titleKey: "navItems.coverLetters" },
  { path: "discover", titleKey: "navItems.discover" },
  { path: "applications", titleKey: "navItems.applications" },
  { path: "job-workflow", titleKey: "navItems.jobWorkflow" },
  { path: "simulations", titleKey: "navItems.simulations" },
  { path: "question-bank", titleKey: "navItems.questionBank" },
  { path: "readiness", titleKey: "navItems.readiness" },
  { path: "performance", titleKey: "navItems.performance" },
  { path: "autofill", titleKey: "navItems.autofill" },
  { path: "interview-recorder", titleKey: "navItems.interviewRecorder" },
  { path: "account-settings", titleKey: "userMenu.accountSettings" },
  { path: "billing", titleKey: "userMenu.billing" },
  { path: "privacy", titleKey: "userMenu.privacy" },
  { path: "help", titleKey: "userMenu.help" },
] as const

export function dashboardRoutes() {
  return (
    <Route element={<RequireAuth />}>
      {/* Bare print surfaces — no dashboard chrome (PDF export + human preview). */}
      <Route path="resumes/:resumeId/print" element={<ResumePrintPage />} />
      <Route path="cover-letters/:letterId/print" element={<CoverLetterPrintPage />} />

      <Route element={<DashboardLayout />}>
        <Route path="discover/jobs/:jobId" element={<DiscoverJobPage />} />
        <Route path="applications/:jobId" element={<ApplicationDetailPage />} />
        <Route path="cover-letters/templates" element={<CoverLetterTemplatesPage />} />
        <Route path="cover-letters/:letterId" element={<CoverLetterEditorPage />} />
        <Route path="resume-lab/templates" element={<ResumeTemplatesPage />} />
        <Route path="simulations/tracks" element={<SimulationTracksPage />} />
        <Route
          path="simulations/code-run/:format"
          element={<SimulationIdePage />}
        />
        <Route
          path="simulations/workspace"
          element={<SimulationIdePage />}
        />
        <Route
          path="simulations/terminal-lab"
          element={<SimulationIdePage />}
        />
        <Route
          path="simulations/spreadsheet"
          element={<SimulationSpreadsheetPage />}
        />
        <Route path="simulations/page" element={<SimulationPagePage />} />
        {/* Catalog conversation tracks (non-UUID). Bank UUIDs redirect → unified path. */}
        <Route
          path="simulations/conversation/:trackId"
          element={<SimulationConversationPage />}
        />
        {/* Legacy nested bank paths → /simulations/:questionId */}
        <Route
          path="simulations/practice/:questionId"
          element={<LegacyPracticeRedirect />}
        />
        <Route
          path="simulations/mcq/:questionId"
          element={<LegacyPracticeRedirect />}
        />
        <Route
          path="simulations/whiteboard/:questionId"
          element={<LegacyPracticeRedirect />}
        />
        {/* Bank practice (all formats) */}
        <Route
          path="simulations/:questionId"
          element={<SimulationQuestionPage />}
        />
        <Route path="resumes/:resumeId" element={<ResumeEditorPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        {DASHBOARD_ROUTES.map(({ path, titleKey }) => (
          <Route
            key={path}
            path={path}
            element={sectionRouteElement(path, titleKey)}
          />
        ))}
      </Route>
    </Route>
  )
}
