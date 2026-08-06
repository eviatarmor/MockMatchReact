import { Route } from "react-router-dom";
import { RequireAuth } from "@/components/auth/require-auth";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { DashboardRoutePage } from "@/pages/dashboard/dashboard-placeholder-page";
import { ResumeLabPage } from "@/pages/dashboard/resume-lab-page";
import { ResumeEditorPage } from "@/pages/dashboard/resume-editor-page";
import { ResumePrintPage } from "@/pages/dashboard/resume-print-page";
import { ResumeTemplatesPage } from "@/pages/dashboard/resume-templates-page";
import { CoverLettersPage } from "@/pages/dashboard/cover-letters-page";
import { CoverLetterEditorPage } from "@/pages/dashboard/cover-letter-editor-page";
import { CoverLetterPrintPage } from "@/pages/dashboard/cover-letter-print-page";
import { CoverLetterTemplatesPage } from "@/pages/dashboard/cover-letter-templates-page";
import { DiscoverPage } from "@/pages/dashboard/discover-page";
import { DiscoverJobPage } from "@/pages/dashboard/discover-job-page";
import { ApplicationsPage } from "@/pages/dashboard/applications-page";
import { ApplicationDetailPage } from "@/pages/dashboard/application-detail-page";
import { AccountSettingsPage } from "@/pages/dashboard/account-settings-page";
import { BillingPage } from "@/pages/dashboard/billing-page";
import { PrivacyPage } from "@/pages/dashboard/privacy-page"
import { HelpPage } from "@/pages/dashboard/help-page"
import { SimulationsPage } from "@/pages/dashboard/simulations-page"
import { SimulationTracksPage } from "@/pages/dashboard/simulation-tracks-page"
import { SimulationIdePage } from "@/pages/dashboard/simulation-ide-page"
import { SimulationConversationPage } from "@/pages/dashboard/simulation-conversation-page"
import { SimulationQuestionPage } from "@/pages/dashboard/simulation-question-page"
import { SimulationSpreadsheetPage } from "@/pages/dashboard/simulation-spreadsheet-page"
import { SimulationPagePage } from "@/pages/dashboard/simulation-page-page"
import { LegacyPracticeRedirect } from "@/features/simulations/components/legacy-practice-redirect"
import { QuestionBankPage } from "@/pages/dashboard/question-bank-page"
import { CustomQuestionsPage } from "@/pages/dashboard/custom-questions-page"
import { ReadinessPage } from "@/pages/dashboard/readiness-page"
import { PerformancePage } from "@/pages/dashboard/performance-page"
import { AutofillPage } from "@/pages/dashboard/autofill-page"
import { JobWorkflowPage } from "@/pages/dashboard/job-workflow-page";
import { InterviewRecorderPage } from "@/pages/dashboard/interview-recorder-page";
import { NotificationsPage } from "@/pages/dashboard/notifications-page";

const DASHBOARD_ROUTES = [
  { path: "resume-lab", titleKey: "navItems.resumeLab" },
  { path: "cover-letters", titleKey: "navItems.coverLetters" },
  { path: "discover", titleKey: "navItems.discover" },
  { path: "applications", titleKey: "navItems.applications" },
  { path: "job-workflow", titleKey: "navItems.jobWorkflow" },
  { path: "simulations", titleKey: "navItems.simulations" },
  { path: "question-bank", titleKey: "navItems.questionBank" },
  { path: "custom-questions", titleKey: "navItems.customQuestions" },
  { path: "readiness", titleKey: "navItems.readiness" },
  { path: "performance", titleKey: "navItems.performance" },
  { path: "autofill", titleKey: "navItems.autofill" },
  { path: "interview-recorder", titleKey: "navItems.interviewRecorder" },
  { path: "account-settings", titleKey: "userMenu.accountSettings" },
  { path: "billing", titleKey: "userMenu.billing" },
  { path: "privacy", titleKey: "userMenu.privacy" },
  { path: "help", titleKey: "userMenu.help" },
] as const;

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
        {DASHBOARD_ROUTES.map(({ path, titleKey }) => {
          if (path === "resume-lab") {
            return <Route key={path} path={path} element={<ResumeLabPage />} />;
          }
          if (path === "cover-letters") {
            return <Route key={path} path={path} element={<CoverLettersPage />} />;
          }
          if (path === "discover") {
            return <Route key={path} path={path} element={<DiscoverPage />} />;
          }
          if (path === "applications") {
            return <Route key={path} path={path} element={<ApplicationsPage />} />;
          }
          if (path === "account-settings") {
            return <Route key={path} path={path} element={<AccountSettingsPage />} />;
          }
          if (path === "billing") {
            return <Route key={path} path={path} element={<BillingPage />} />;
          }
          if (path === "simulations") {
            return <Route key={path} path={path} element={<SimulationsPage />} />;
          }
          if (path === "question-bank") {
            return <Route key={path} path={path} element={<QuestionBankPage />} />;
          }
          if (path === "custom-questions") {
            return (
              <Route key={path} path={path} element={<CustomQuestionsPage />} />
            );
          }
          if (path === "readiness") {
            return <Route key={path} path={path} element={<ReadinessPage />} />;
          }
          if (path === "performance") {
            return <Route key={path} path={path} element={<PerformancePage />} />;
          }
          if (path === "autofill") {
            return <Route key={path} path={path} element={<AutofillPage />} />;
          }
          if (path === "job-workflow") {
            return <Route key={path} path={path} element={<JobWorkflowPage />} />;
          }
          if (path === "interview-recorder") {
            return <Route key={path} path={path} element={<InterviewRecorderPage />} />;
          }
          if (path === "privacy") {
            return <Route key={path} path={path} element={<PrivacyPage />} />;
          }
          if (path === "help") {
            return <Route key={path} path={path} element={<HelpPage />} />;
          }
          return <Route key={path} path={path} element={<DashboardRoutePage path={path} titleKey={titleKey} />} />;
        })}
      </Route>
    </Route>
  );
}
