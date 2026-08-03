import type { ReactNode } from "react"

export type McqVariant = "single" | "multi" | "order"

export type McqQuestion = {
  readonly id: string
  readonly title: string
  readonly stem: string
  readonly options: readonly string[]
  readonly variant?: McqVariant
  /** Free-form difficulty key for host badge rendering. */
  readonly difficulty?: string
}

export type McqItemResult = {
  readonly correct: boolean
  readonly variant: McqVariant
  readonly correctIndex: number | null
  readonly correctIndices: number[] | null
  readonly correctOrder: number[] | null
  readonly explanation: string | null
}

export type McqItemState = {
  /** single */
  selectedIndex?: number
  /** multi */
  selectedIndices?: number[]
  /** order — display order as original option indices */
  orderedIndices?: number[]
  result?: McqItemResult
}

export type McqCheckPayload =
  | { id: string; variant: "single"; selectedIndex: number }
  | { id: string; variant: "multi"; selectedIndices: number[] }
  | { id: string; variant: "order"; orderedIndices: number[] }

export type McqShellLabels = {
  readonly optionsLabel: string
  readonly variant: {
    readonly single: string
    readonly multi: string
    readonly order: string
  }
  readonly hints: {
    readonly multi: string
    readonly order: string
  }
  readonly header: {
    readonly back: string
  }
  readonly menubar: {
    readonly session: string
  }
  readonly rail: {
    readonly title: string
    readonly item: (n: number) => string
  }
  readonly questionOf: (current: number, total: number) => string
  readonly progress: {
    readonly step: (current: number, total: number) => string
    readonly done: (correct: number, total: number) => string
  }
  readonly score: {
    readonly short: (correct: number, answered: number) => string
  }
  readonly actions: {
    readonly check: string
    readonly checking: string
    readonly next: string
    readonly prev: string
    readonly finish: string
    readonly restart: string
    readonly bank: string
    readonly drag: string
  }
  readonly result: {
    readonly correct: string
    readonly incorrect: string
  }
  readonly summary: {
    readonly title: string
    readonly score: (correct: number, total: number) => string
  }
  readonly errors: {
    readonly submitFailed: string
  }
}

export type McqChromeProps = {
  readonly title: string
  /** e.g. format badge next to title */
  readonly formatBadge?: ReactNode
  readonly onBack: () => void
  readonly onBank: () => void
}

export type McqSessionApi = {
  readonly index: number
  readonly finished: boolean
  readonly itemState: Record<string, McqItemState>
  readonly answeredCount: number
  readonly correctCount: number
  readonly canCheck: boolean
  readonly current: McqQuestion | undefined
  readonly currentState: McqItemState | undefined
  readonly revealed: boolean
  readonly currentVariant: McqVariant
  readonly selectSingle: (value: string | null) => void
  readonly toggleMulti: (optIndex: number, checked: boolean) => void
  readonly reorder: (next: number[]) => void
  readonly goNext: () => void
  readonly goPrev: () => void
  readonly jumpTo: (i: number) => void
  readonly restart: () => void
  readonly applyResult: (
    id: string,
    result: McqItemResult,
    selection?: {
      selectedIndex?: number
      selectedIndices?: number[]
      orderedIndices?: number[]
    }
  ) => void
  readonly resetSession: (questionsKey?: string) => void
}
