import { useState } from "react"
import { Badge } from "@mockmatch/ui/badge"
import { Button } from "@mockmatch/ui/button"
import { Separator } from "@mockmatch/ui/separator"
import { Switch } from "@mockmatch/ui/switch"
import { cn } from "@mockmatch/ui/utils"
import { useSitePrefs } from "./site-prefs-context"

export type SiteNoticeProps = {
  readonly className?: string
}

/**
 * Bottom preference notice for public sites.
 * Shown whenever the visitor has not decided — independent of GA setup.
 */
export function SiteNotice({ className }: SiteNoticeProps) {
  const {
    ready,
    hasDecided,
    labels,
    privacyHref,
    acceptAll,
    acceptEssentialOnly,
    saveCustom,
    prefs,
  } = useSitePrefs()

  const [customizeOpen, setCustomizeOpen] = useState(false)
  const [analytics, setAnalytics] = useState(prefs?.analytics ?? false)
  const [performance, setPerformance] = useState(prefs?.performance ?? false)

  // Only hide after a stored decision. Missing measurementId must not hide this.
  if (!ready || hasDecided) {
    return null
  }

  function handleOpenCustomize() {
    setAnalytics(false)
    setPerformance(false)
    setCustomizeOpen(true)
  }

  function handleSaveCustom() {
    saveCustom({ analytics, performance })
  }

  return (
    <div
      role="region"
      aria-label={labels.title}
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))]",
        className
      )}
    >
      <div
        className={cn(
          "pointer-events-auto w-full max-w-xl rounded-xl border border-border/60 bg-card p-4 shadow-xl shadow-black/10 ring-1 ring-foreground/10",
          "dark:shadow-black/40"
        )}
      >
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-medium text-foreground">
              {labels.title}
            </h2>
            <p className="text-sm text-muted-foreground">
              {labels.description}
              {privacyHref && labels.privacyLinkLabel ? (
                <>
                  {" "}
                  <a
                    href={privacyHref}
                    className="font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    {labels.privacyLinkLabel}
                  </a>
                </>
              ) : null}
            </p>
          </div>

          {customizeOpen ? (
            <div className="flex flex-col gap-3 rounded-lg border border-border/60 bg-muted/30 p-3">
              <CategoryRow
                label={labels.essentialLabel}
                description={labels.essentialDescription}
                badge={labels.essentialBadge}
                checked
                disabled
              />
              <Separator />
              <CategoryRow
                label={labels.analyticsLabel}
                description={labels.analyticsDescription}
                checked={analytics}
                onCheckedChange={setAnalytics}
              />
              <Separator />
              <CategoryRow
                label={labels.performanceLabel}
                description={labels.performanceDescription}
                checked={performance}
                onCheckedChange={setPerformance}
              />
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
            {!customizeOpen ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="cursor-pointer sm:mr-auto"
                onClick={handleOpenCustomize}
              >
                {labels.customize}
              </Button>
            ) : null}

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              {customizeOpen ? (
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  className="cursor-pointer"
                  onClick={handleSaveCustom}
                >
                  {labels.savePreferences}
                </Button>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="cursor-pointer"
                    onClick={acceptEssentialOnly}
                  >
                    {labels.essentialOnly}
                  </Button>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    className="cursor-pointer"
                    onClick={acceptAll}
                  >
                    {labels.acceptAll}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CategoryRow({
  label,
  description,
  badge,
  checked,
  disabled,
  onCheckedChange,
}: {
  readonly label: string
  readonly description: string
  readonly badge?: string
  readonly checked: boolean
  readonly disabled?: boolean
  readonly onCheckedChange?: (value: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex flex-col gap-0.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-foreground">{label}</span>
          {badge ? <Badge variant="secondary">{badge}</Badge> : null}
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
        aria-label={label}
        className="shrink-0"
      />
    </div>
  )
}
