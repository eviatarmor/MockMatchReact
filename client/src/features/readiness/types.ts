export interface ReadinessArea {
  readonly id: string
  readonly labelKey: string
  readonly score: number
  readonly color: string
}

export interface NextUpItem {
  readonly id: string
  readonly title: string
  readonly subtitle: string
  readonly iconName: string
}

export interface SessionHistoryRow {
  readonly id: string
  readonly date: string
  readonly role: string
  readonly track: string
  readonly score: number
  readonly delta: number
}
