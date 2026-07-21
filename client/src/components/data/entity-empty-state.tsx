import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"

interface EntityEmptyStateAction {
  readonly label: string
  readonly onClick: () => void
  readonly pending?: boolean
  readonly icon?: LucideIcon
}

interface EntityEmptyStateProps {
  readonly icon: LucideIcon
  readonly title: string
  readonly description?: string
  readonly action?: EntityEmptyStateAction
  readonly children?: ReactNode
}

/**
 * Bordered empty card for list/table surfaces (resumes, cover letters, …).
 * Prefer this over an empty table body when there is nothing to show.
 */
export function EntityEmptyState({
  icon: Icon,
  title,
  description,
  action,
  children,
}: EntityEmptyStateProps) {
  const ActionIcon = action?.icon

  return (
    <div className="flex w-full flex-col items-center justify-center gap-3 rounded-xl border bg-card px-6 py-12 text-center shadow-sm">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <Icon className="size-6" aria-hidden />
      </div>
      <div className="flex max-w-sm flex-col gap-1">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? (
        <Button
          type="button"
          className="mt-1 h-8 cursor-pointer gap-1.5"
          disabled={action.pending}
          onClick={action.onClick}
        >
          {ActionIcon ? <ActionIcon className="size-4" /> : null}
          {action.label}
        </Button>
      ) : null}
      {children}
    </div>
  )
}
