import { AlertCircle, CheckCircle2 } from "lucide-react"
import { Spinner } from "@mockmatch/ui/spinner"
import { cn } from "@mockmatch/ui/utils"
import { AppLogo } from "../components/app-logo"
import { useExtension } from "../state/extension-store"
import type { ChipState } from "../types"

const LABEL: Record<ChipState, string> = {
  idle: "MockMatch",
  ready: "Fill application",
  filling: "Filling…",
  review: "Review fields",
  error: "Retry",
}

export function ChipApp({ standalone = false }: { standalone?: boolean }) {
  const { chipState, form, fillPhase, reviewFields, startFill, signedIn } =
    useExtension()

  const needsReview = reviewFields.filter((f) => f.needsReview).length
  const filled = reviewFields.filter((f) => f.value).length

  const subtitle =
    chipState === "review"
      ? `${filled} filled${needsReview ? ` · ${needsReview} to check` : ""}`
      : chipState === "ready" && form.status === "detected"
        ? form.company
        : chipState === "idle" && !signedIn
          ? "Sign in"
          : chipState === "idle"
            ? "No form"
            : null

  return (
    <div
      className={cn(
        standalone &&
          "flex min-h-screen items-end justify-end bg-neutral-200 p-6 dark:bg-neutral-900",
      )}
    >
      <div className="flex flex-col items-end gap-2">
        {standalone ? (
          <p className="mb-2 max-w-xs text-right text-xs text-muted-foreground">
            On-page chip preview · state: {chipState}
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => {
            if (chipState === "ready") startFill()
          }}
          className={cn(
            "group flex cursor-pointer items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium shadow-md transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            chipState === "ready" &&
              "border-primary/30 bg-primary text-primary-foreground hover:bg-primary/90",
            chipState === "filling" && "border-border bg-card text-foreground",
            chipState === "review" &&
              "border-border bg-card text-foreground ring-1 ring-primary/20",
            chipState === "error" &&
              "border-destructive/30 bg-destructive/10 text-destructive",
            chipState === "idle" &&
              "border-border/80 bg-card text-muted-foreground opacity-90 hover:opacity-100",
          )}
        >
          <span
            className={cn(
              "flex size-6 items-center justify-center overflow-hidden rounded-full",
              chipState === "ready"
                ? "bg-primary-foreground/15"
                : "bg-background",
            )}
          >
            {chipState === "filling" ? (
              <Spinner className="size-3.5 text-primary" />
            ) : chipState === "review" ? (
              <CheckCircle2 className="size-3.5 text-primary" />
            ) : chipState === "error" ? (
              <AlertCircle className="size-3.5" />
            ) : (
              <AppLogo className="size-6" />
            )}
          </span>
          <span className="flex flex-col items-start leading-tight">
            <span>{LABEL[chipState]}</span>
            {subtitle ? (
              <span
                className={cn(
                  "text-2xs font-normal",
                  chipState === "ready"
                    ? "text-primary-foreground/80"
                    : "text-muted-foreground",
                )}
              >
                {subtitle}
              </span>
            ) : null}
          </span>
        </button>
        {standalone && fillPhase === "review" ? (
          <p className="text-2xs text-muted-foreground">
            Expand review lives in the side panel
          </p>
        ) : null}
      </div>
    </div>
  )
}
