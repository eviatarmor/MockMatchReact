import {
  FileText,
  Mail,
  Compass,
  ClipboardList,
  Workflow,
  MonitorPlay,
  ClipboardCheck,
  HelpCircle,
  Gauge,
  TrendingUp,
  Wand2,
  AudioWaveform,
  Settings,
  CreditCard,
  ShieldCheck,
  LogOut,
} from "lucide-react"
import type { NavItem } from "@/components/dashboard/nav-main"
import type { DashboardUser, UserMenuAction } from "@/components/dashboard/types"

export const NAV_DATA: NavItem[] = [
  { label: "navGroups.applications", isSection: true },
  { title: "navItems.resumeLab", icon: FileText, href: "/resume-lab" },
  { title: "navItems.coverLetters", icon: Mail, href: "/cover-letters" },
  { title: "navItems.discover", icon: Compass, href: "/discover" },
  { title: "navItems.applications", icon: ClipboardList, href: "/applications" },

  { label: "navGroups.practice", isSection: true },
  { title: "navItems.jobWorkflow", icon: Workflow, href: "/job-workflow" },
  { title: "navItems.simulations", icon: MonitorPlay, href: "/simulations" },
  { title: "navItems.assessments", icon: ClipboardCheck, href: "/assessments" },
  { title: "navItems.questionBank", icon: HelpCircle, href: "/question-bank" },

  { label: "navGroups.insights", isSection: true },
  { title: "navItems.readiness", icon: Gauge, href: "/readiness" },
  { title: "navItems.performance", icon: TrendingUp, href: "/performance" },

  { label: "navGroups.automation", isSection: true },
  { title: "navItems.autofill", icon: Wand2, href: "/autofill" },
  { title: "navItems.interviewRecorder", icon: AudioWaveform, href: "/interview-recorder" },
]

export const MOCK_USER: DashboardUser = {
  name: "Jordan Avery",
  email: "jordan.avery@example.com",
}

export const USER_MENU_ACTIONS: UserMenuAction[] = [
  { labelKey: "userMenu.accountSettings", icon: Settings },
  { labelKey: "userMenu.billing", icon: CreditCard },
  { labelKey: "userMenu.privacy", icon: ShieldCheck },
]

export const USER_MENU_LOGOUT: UserMenuAction = {
  labelKey: "userMenu.logout",
  icon: LogOut,
  destructive: true,
}
