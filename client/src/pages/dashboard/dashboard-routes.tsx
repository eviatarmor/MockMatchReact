import { Route } from "react-router-dom";
import { RequireAuth } from "@/components/auth/require-auth";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { DashboardRoutePage } from "@/pages/dashboard/dashboard-placeholder-page";
import { ResumeLabPage } from "@/pages/dashboard/resume-lab-page";
import { ResumeEditorPage } from "@/pages/dashboard/resume-editor-page";
import { ResumeTemplatesPage } from "@/pages/dashboard/resume-templates-page";
import { CoverLettersPage } from "@/pages/dashboard/cover-letters-page";
import { CoverLetterEditorPage } from "@/pages/dashboard/cover-letter-editor-page";
import { CoverLetterTemplatesPage } from "@/pages/dashboard/cover-letter-templates-page";
import { DiscoverPage } from "@/pages/dashboard/discover-page";
import { ApplicationsPage } from "@/pages/dashboard/applications-page";
import { ApplicationDetailPage } from "@/pages/dashboard/application-detail-page";
import { AccountSettingsPage } from "@/pages/dashboard/account-settings-page";
import { BillingPage } from "@/pages/dashboard/billing-page";
import { PrivacyPage } from "@/pages/dashboard/privacy-page"
import { SimulationsPage } from "@/pages/dashboard/simulations-page"
import { AssessmentsPage } from "@/pages/dashboard/assessments-page"
import { QuestionBankPage } from "@/pages/dashboard/question-bank-page"
import { ReadinessPage } from "@/pages/dashboard/readiness-page"
import { PerformancePage } from "@/pages/dashboard/performance-page"
import { AutofillPage } from "@/pages/dashboard/autofill-page"
import { JobWorkflowPage } from "@/pages/dashboard/job-workflow-page";
import { InterviewRecorderPage } from "@/pages/dashboard/interview-recorder-page";

const DASHBOARD_ROUTES = [
  { path: "resume-lab", titleKey: "navItems.resumeLab" },
  { path: "cover-letters", titleKey: "navItems.coverLetters" },
  { path: "discover", titleKey: "navItems.discover" },
  { path: "applications", titleKey: "navItems.applications" },
  { path: "job-workflow", titleKey: "navItems.jobWorkflow" },
  { path: "simulations", titleKey: "navItems.simulations" },
  { path: "assessments", titleKey: "navItems.assessments" },
  { path: "question-bank", titleKey: "navItems.questionBank" },
  { path: "readiness", titleKey: "navItems.readiness" },
  { path: "performance", titleKey: "navItems.performance" },
  { path: "autofill", titleKey: "navItems.autofill" },
  { path: "interview-recorder", titleKey: "navItems.interviewRecorder" },
  { path: "account-settings", titleKey: "userMenu.accountSettings" },
  { path: "billing", titleKey: "userMenu.billing" },
  { path: "privacy", titleKey: "userMenu.privacy" },
] as const;

export function dashboardRoutes() {
  return (
    <Route element={<RequireAuth />}>
      <Route element={<DashboardLayout />}>
        <Route path="applications/:jobId" element={<ApplicationDetailPage />} />
        <Route path="cover-letters/templates" element={<CoverLetterTemplatesPage />} />
        <Route path="cover-letters/:letterId" element={<CoverLetterEditorPage />} />
        <Route path="resume-lab/templates" element={<ResumeTemplatesPage />} />
        <Route path="resumes/:resumeId" element={<ResumeEditorPage />} />
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
          if (path === "assessments") {
            return <Route key={path} path={path} element={<AssessmentsPage />} />;
          }
          if (path === "question-bank") {
            return <Route key={path} path={path} element={<QuestionBankPage />} />;
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
          return <Route key={path} path={path} element={<DashboardRoutePage path={path} titleKey={titleKey} />} />;
        })}
      </Route>
    </Route>
  );
}
