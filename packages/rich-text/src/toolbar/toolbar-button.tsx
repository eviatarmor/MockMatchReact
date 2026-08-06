import { cn } from "@mockmatch/ui/utils"

export function ToolbarButton({
  label,
  active,
  onClick,
  children,
  disabled,
}: {
  readonly label: string
  readonly active?: boolean
  readonly disabled?: boolean
  readonly onClick: () => void
  readonly children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-md transition-colors",
        "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900",
        "dark:text-neutral-200 dark:hover:bg-white/10 dark:hover:text-white",
        "disabled:pointer-events-none disabled:opacity-40",
        active &&
          "bg-neutral-100 text-neutral-900 dark:bg-white/15 dark:text-white"
      )}
    >
      {children}
    </button>
  )
}
