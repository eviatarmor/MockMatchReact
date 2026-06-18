import type { AutofillStat, ActivityRow } from "./types"

export const AUTOFILL_STATS: readonly AutofillStat[] = [
  { id: "filled",   value: "38",   subValue: "applications", labelKey: "autofill.stats.filled",   iconName: "Send" },
  { id: "time",     value: "9.5h", subValue: "this week",    labelKey: "autofill.stats.time",     iconName: "Timer" },
  { id: "fields",   value: "42",   subValue: "across forms", labelKey: "autofill.stats.fields",   iconName: "AlignJustify" },
  { id: "success",  value: "96%",  subValue: "",             labelKey: "autofill.stats.success",  iconName: "CheckCircle2" },
]

export const MOCK_ACTIVITY: readonly ActivityRow[] = [
  { id: "a1", company: "Linear",  role: "Senior Product Designer", site: "Ashby",      date: "Today",     fieldsFilled: 18, status: "submitted"   },
  { id: "a2", company: "Ramp",    role: "Product Designer",        site: "Greenhouse", date: "Today",     fieldsFilled: 22, status: "needsReview" },
  { id: "a3", company: "Vercel",  role: "Staff Designer",          site: "Lever",      date: "Yesterday", fieldsFilled: 16, status: "submitted"   },
  { id: "a4", company: "Notion",  role: "Design Lead",             site: "LinkedIn",   date: "Yesterday", fieldsFilled: 9,  status: "submitted"   },
  { id: "a5", company: "Figma",   role: "Product Designer",        site: "Greenhouse", date: "Jun 14",    fieldsFilled: 20, status: "draft"       },
  { id: "a6", company: "Stripe",  role: "Product Designer",        site: "Ashby",      date: "Jun 13",    fieldsFilled: 24, status: "submitted"   },
  { id: "a7", company: "Airbnb",  role: "Senior Designer",         site: "Workday",    date: "Jun 12",    fieldsFilled: 31, status: "needsReview" },
]
