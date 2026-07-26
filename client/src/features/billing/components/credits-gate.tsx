import type { ReactNode } from "react"
import { TopUpCreditsDialog } from "@/features/billing/components/top-up-credits-dialog"

interface CreditsGateProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  /**
   * When true, children render. When false (and `when` is true),
   * the top-up credits dialog replaces children.
   */
  readonly allowed: boolean
  /**
   * Extra condition that must hold for the gate to apply.
   * When false, children always render (gate skipped).
   * Example: only gate document owners → `when={isOwner}`.
   * @default true
   */
  readonly when?: boolean
  readonly children: ReactNode
}

/**
 * Paid-feature gate: wraps UI that needs credits.
 * Locked (`when && !allowed`) → `TopUpCreditsDialog`.
 * Otherwise → children.
 */
export function CreditsGate({
  open,
  onOpenChange,
  allowed,
  when = true,
  children,
}: CreditsGateProps) {
  if (when && !allowed) {
    return <TopUpCreditsDialog open={open} onOpenChange={onOpenChange} />
  }

  return children
}
