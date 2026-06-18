export interface PerformanceStat {
  readonly id: string
  readonly labelKey: string
  readonly value: string
  readonly subValue: string
  readonly delta: string
  readonly deltaPositive: boolean
  readonly iconName: string
}

export interface ScoreTrendPoint {
  readonly week: string
  readonly score: number
}

export interface DomainScore {
  readonly id: string
  readonly labelKey: string
  readonly score: number
  readonly delta: number
  readonly color: string
}

export interface StrengthItem {
  readonly id: string
  readonly title: string
  readonly subtitle: string
}

export interface FocusAreaItem {
  readonly id: string
  readonly title: string
  readonly subtitle: string
}
