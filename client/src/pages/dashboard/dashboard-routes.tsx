import { Route } from "react-router-dom"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { DashboardRoutePage } from "@/pages/dashboard/dashboard-placeholder-page"

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
] as const

export function dashboardRoutes() {
  return (
    <Route element={<DashboardLayout />}>
      {DASHBOARD_ROUTES.map(({ path, titleKey }) => (
        <Route key={path} path={path} element={<DashboardRoutePage titleKey={titleKey} />} />
      ))}
    </Route>
  )
}
