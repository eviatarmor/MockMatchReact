export type ActivityStatus = "submitted" | "needsReview" | "draft"

export interface AutofillStat {
  readonly id: string
  readonly value: string
  readonly subValue: string
  readonly labelKey: string
  readonly iconName: string
}

export interface ActivityRow {
  readonly id: string
  readonly company: string
  readonly role: string
  readonly site: string
  readonly date: string
  readonly fieldsFilled: number
  readonly status: ActivityStatus
}
