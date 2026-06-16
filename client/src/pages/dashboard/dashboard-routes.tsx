import { Route } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { DashboardRoutePage } from "@/pages/dashboard/dashboard-placeholder-page";
import { ResumeLabPage } from "@/pages/dashboard/resume-lab-page";
import { CoverLettersPage } from "@/pages/dashboard/cover-letters-page";
import { JobTrackerPage } from "@/pages/dashboard/job-tracker-page";
import { AccountSettingsPage } from "@/pages/dashboard/account-settings-page";
import { PrivacyPage } from "@/pages/dashboard/privacy-page";

const DASHBOARD_ROUTES = [
  { path: "resume-lab", titleKey: "navItems.resumeLab" },
  { path: "cover-letters", titleKey: "navItems.coverLetters" },
  { path: "job-tracker", titleKey: "navItems.jobTracker" },
  { path: "job-workflow", titleKey: "navItems.jobWorkflow" },
  { path: "simulations", titleKey: "navItems.simulations" },
  { path: "assessments", titleKey: "navItems.assessments" },
  { path: "question-bank", titleKey: "navItems.questionBank" },
  { path: "readiness", titleKey: "navItems.readiness" },
  { path: "performance", titleKey: "navItems.performance" },
  { path: "autofill", titleKey: "navItems.autofill" },
  { path: "account-settings", titleKey: "userMenu.accountSettings" },
  { path: "privacy", titleKey: "userMenu.privacy" },
] as const;

export function dashboardRoutes() {
  return (
    <Route element={<DashboardLayout />}>
      {DASHBOARD_ROUTES.map(({ path, titleKey }) => {
        if (path === "resume-lab") {
          return <Route key={path} path={path} element={<ResumeLabPage />} />;
        }
        if (path === "cover-letters") {
          return <Route key={path} path={path} element={<CoverLettersPage />} />;
        }
        if (path === "job-tracker") {
          return <Route key={path} path={path} element={<JobTrackerPage />} />;
        }
        if (path === "account-settings") {
          return <Route key={path} path={path} element={<AccountSettingsPage />} />;
        }
        if (path === "privacy") {
          return <Route key={path} path={path} element={<PrivacyPage />} />;
        }
        return <Route key={path} path={path} element={<DashboardRoutePage path={path} titleKey={titleKey} />} />;
      })}
    </Route>
  );
}
