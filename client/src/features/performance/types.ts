export interface PerformanceStat {
  readonly id: string
  readonly labelKey: string
  readonly value: string
  readonly subValueKey: string
  readonly deltaKey: string
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
  readonly titleKey: string
  readonly subtitleKey: string
}

export interface FocusAreaItem {
  readonly id: string
  readonly titleKey: string
  readonly subtitleKey: string
}
