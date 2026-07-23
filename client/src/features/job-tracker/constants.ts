import type {
  EmploymentType,
  MatchTier,
  PostedWithinDays,
  TrackedJob,
  TrackingStatus,
} from "./types"

export const MATCH_TIER_TEXT_CLASS: Record<MatchTier, string> = {
  strong: "text-emerald-600",
  good: "text-blue-600",
  fair: "text-amber-600",
}

export const SALARY_FILTER_OPTIONS: number[] = [0, 60_000, 80_000, 100_000, 120_000, 150_000, 180_000, 200_000]

export const EMPLOYMENT_TYPE_OPTIONS: EmploymentType[] = [
  "fullTime",
  "partTime",
  "contract",
  "internship",
]

export const POSTED_WITHIN_OPTIONS: PostedWithinDays[] = [0, 1, 7, 30]

export const TRACKING_STATUS_ORDER: TrackingStatus[] = ["saved", "applied", "interviewing", "offer"]

export const TRACKING_STATUS_TRENDS: Record<TrackingStatus, number> = {
  saved: 12,
  applied: 18,
  interviewing: -5,
  offer: 50,
}

export const MOCK_TRACKED_JOBS: TrackedJob[] = [
  {
    id: "t1",
    title: "Sr. UX Designer",
    company: "Hooli",
    location: "Remote",
    avatarText: "H",
    avatarColorClass: "bg-amber-600 text-white",
    status: "interviewing",
    nextStep: "Onsite loop — Thu 2pm",
    nextStepDate: "in 2 days",
    matchScore: 86,
    matchTier: "good",
    salaryRange: "$165K – $185K",
    seniority: "senior",
    postedAt: "Just now",
    progressSteps: 4,
    progressCompleted: 2,
    activeStepIndex: 2,
    statusUpdatedAt: "Applied 8d ago",
  },
  {
    id: "t2",
    title: "Design Manager",
    company: "Massive",
    location: "Boston · Hybrid",
    avatarText: "M",
    avatarColorClass: "bg-neutral-700 text-white",
    status: "interviewing",
    nextStep: "Portfolio review — prep deck",
    nextStepDate: "tomorrow",
    matchScore: 83,
    matchTier: "good",
    salaryRange: "$175K – $200K",
    seniority: "lead",
    postedAt: "3d ago",
    progressSteps: 4,
    progressCompleted: 2,
    activeStepIndex: 2,
    statusUpdatedAt: "Applied 11d ago",
  },
  {
    id: "t3",
    title: "Product Designer",
    company: "Initech",
    location: "Austin",
    avatarText: "I",
    avatarColorClass: "bg-violet-600 text-white",
    status: "applied",
    nextStep: "Follow up with recruiter",
    nextStepDate: "in 4 days",
    matchScore: 79,
    matchTier: "fair",
    salaryRange: "$150K – $175K",
    seniority: "senior",
    postedAt: "5d ago",
    progressSteps: 4,
    progressCompleted: 1,
    activeStepIndex: 1,
    statusUpdatedAt: "Applied 5d ago",
  },
  {
    id: "t4",
    title: "Lead Product Designer",
    company: "Soylent",
    location: "Remote (US)",
    avatarText: "S",
    avatarColorClass: "bg-emerald-600 text-white",
    status: "saved",
    nextStep: "Tailor resume & apply",
    nextStepDate: "no date",
    matchScore: 74,
    matchTier: "fair",
    salaryRange: "$180K – $210K",
    seniority: "lead",
    postedAt: "1w ago",
    progressSteps: 4,
    progressCompleted: 0,
    activeStepIndex: null,
    statusUpdatedAt: "Saved just now",
  },
]
