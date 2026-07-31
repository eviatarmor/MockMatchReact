import type { ReactNode } from "react"
import { RobotLoader } from "@mockmatch/ui/robot-loader"

interface EntityListStatesProps {
  readonly isError: boolean
  readonly isLoading: boolean
  readonly isEmpty: boolean
  readonly errorMessage: string
  readonly loadingMessage: string
  readonly emptyState: ReactNode
  readonly children: ReactNode
}

/**
 * Renders error / loading / empty / content for paginated entity lists.
 * Keeps lab pages free of nested conditionals.
 */
export function EntityListStates({
  isError,
  isLoading,
  isEmpty,
  errorMessage,
  loadingMessage,
  emptyState,
  children,
}: EntityListStatesProps) {
  if (isError) {
    return (
      <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-6 text-center text-sm text-destructive">
        {errorMessage}
      </p>
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
        <RobotLoader size="md" label={loadingMessage} />
        <p>{loadingMessage}</p>
      </div>
    )
  }

  if (isEmpty) return <>{emptyState}</>

  return <>{children}</>
}
