import {
  FileText,
  Mail,
  Compass,
  ClipboardList,
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
  LayoutGrid,
  Dumbbell,
  BarChart3,
  Bot,
} from "lucide-react"
import type { NavItem, NavSection, DashboardUser, UserMenuAction } from "@/components/dashboard/types"

// Grouped nav: each section owns an icon (shown in the far-left icon rail) and
// its items (shown in the label column when that section is active).
export const NAV_SECTIONS: NavSection[] = [
  {
    id: "applications",
    labelKey: "navGroups.applications",
    icon: LayoutGrid,
    items: [
      { title: "navItems.resumeLab", icon: FileText, href: "/resume-lab" },
      { title: "navItems.coverLetters", icon: Mail, href: "/cover-letters" },
      { title: "navItems.discover", icon: Compass, href: "/discover" },
      { title: "navItems.applications", icon: ClipboardList, href: "/applications" },
    ],
  },
  {
    id: "practice",
    labelKey: "navGroups.practice",
    icon: Dumbbell,
    items: [
      { title: "navItems.simulations", icon: MonitorPlay, href: "/simulations" },
      { title: "navItems.assessments", icon: ClipboardCheck, href: "/assessments" },
      { title: "navItems.questionBank", icon: HelpCircle, href: "/question-bank" },
    ],
  },
  {
    id: "insights",
    labelKey: "navGroups.insights",
    icon: BarChart3,
    items: [
      { title: "navItems.readiness", icon: Gauge, href: "/readiness" },
      { title: "navItems.performance", icon: TrendingUp, href: "/performance" },
    ],
  },
  {
    id: "automation",
    labelKey: "navGroups.automation",
    icon: Bot,
    items: [
      { title: "navItems.autofill", icon: Wand2, href: "/autofill" },
      { title: "navItems.interviewRecorder", icon: AudioWaveform, href: "/interview-recorder" },
    ],
  },
]

// Flat list retained for the navbar breadcrumb lookup.
export const NAV_DATA: NavItem[] = NAV_SECTIONS.flatMap((section) => [
  { label: section.labelKey, isSection: true },
  ...section.items,
])

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
