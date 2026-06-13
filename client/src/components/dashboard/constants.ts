import {
  FileText,
  Mail,
  Briefcase,
  Workflow,
  MonitorPlay,
  ClipboardCheck,
  HelpCircle,
  Gauge,
  TrendingUp,
  Wand2,
} from "lucide-react"
import type { NavItem } from "@/components/dashboard/nav-main"

export const NAV_DATA: NavItem[] = [
  { label: "navGroups.applications", isSection: true },
  { title: "navItems.resumeLab", icon: FileText, href: "/app/resume-lab" },
  { title: "navItems.coverLetters", icon: Mail, href: "/app/cover-letters" },
  { title: "navItems.jobTracker", icon: Briefcase, href: "/app/job-tracker" },

  { label: "navGroups.practice", isSection: true },
  { title: "navItems.jobWorkflow", icon: Workflow, href: "/app/job-workflow" },
  { title: "navItems.simulations", icon: MonitorPlay, href: "/app/simulations" },
  { title: "navItems.assessments", icon: ClipboardCheck, href: "/app/assessments" },
  { title: "navItems.questionBank", icon: HelpCircle, href: "/app/question-bank" },

  { label: "navGroups.insights", isSection: true },
  { title: "navItems.readiness", icon: Gauge, href: "/app/readiness" },
  { title: "navItems.performance", icon: TrendingUp, href: "/app/performance" },

  { label: "navGroups.automation", isSection: true },
  { title: "navItems.autofill", icon: Wand2, href: "/app/autofill" },
]
