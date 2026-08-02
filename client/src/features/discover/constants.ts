import type {
  EmploymentType,
  PostedWithinDays,
  TrackedJob,
  TrackingStatus,
} from "./types"

export const SALARY_FILTER_OPTIONS: number[] = [0, 60_000, 80_000, 100_000, 120_000, 150_000, 180_000, 200_000]

export const EMPLOYMENT_TYPE_OPTIONS: EmploymentType[] = [
  "fullTime",
  "partTime",
  "contract",
  "internship",
]

export const POSTED_WITHIN_OPTIONS: PostedWithinDays[] = [0, 1, 7, 30]

/** Progressive pipeline stages (excludes terminal declined). */
export const TRACKING_PIPELINE_ORDER = [
  "saved",
  "applied",
  "interviewing",
  "offer",
] as const satisfies readonly TrackingStatus[]

/** Full kanban board columns, including declined. */
export const TRACKING_STATUS_ORDER: TrackingStatus[] = [
  ...TRACKING_PIPELINE_ORDER,
  "declined",
]

export const TRACKING_STATUS_TRENDS: Record<TrackingStatus, number> = {
  saved: 12,
  applied: 18,
  interviewing: -5,
  offer: 50,
  declined: -20,
}

/** Legacy mock list — empty; applications live in Postgres via trackedJobs API. */
export const MOCK_TRACKED_JOBS: TrackedJob[] = []
