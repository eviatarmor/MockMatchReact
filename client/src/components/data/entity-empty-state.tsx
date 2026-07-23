import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"

interface EntityEmptyStateAction {
  readonly label: string
  readonly onClick: () => void
  readonly pending?: boolean
  readonly icon?: LucideIcon
  /** Default: primary (create CTAs). Use outline for clear/retry. */
  readonly variant?: "default" | "outline"
}

interface EntityEmptyStateProps {
  readonly icon: LucideIcon
  readonly title: string
  readonly description?: string
  readonly action?: EntityEmptyStateAction
  readonly children?: ReactNode
}

/**
 * Dashed empty card for list/table surfaces (resumes, cover letters, discover, …).
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
    <div className="flex w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-12 text-center">
      <Icon className="size-8 text-muted-foreground" aria-hidden />
      <div className="flex max-w-md flex-col gap-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? (
        <Button
          type="button"
          variant={action.variant ?? "default"}
          size="sm"
          className="cursor-pointer gap-1.5"
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
