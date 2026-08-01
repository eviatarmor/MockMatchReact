import type { KeyboardEvent, MouseEvent, ReactNode } from "react"
import {
  CircleCheck,
  Coins,
  Info,
  Sparkles,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"
import { formatRelativeTime } from "@/lib/format-relative-time"
import type { AppNotification, NotificationKind } from "./types"

const KIND_ICON: Record<NotificationKind, LucideIcon> = {
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  product: Sparkles,
  credits: Coins,
}

const KIND_WELL: Record<NotificationKind, string> = {
  info: "bg-primary/12 text-primary",
  success: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400",
  warning: "bg-amber-500/12 text-amber-600 dark:text-amber-400",
  product: "bg-primary/12 text-primary",
  credits: "bg-primary/12 text-primary",
}

/** Trusted HTML from i18n / API — styles for rich notification bodies. */
const HTML_PROSE =
  "[&_b]:font-semibold [&_b]:text-foreground [&_strong]:font-semibold [&_strong]:text-foreground " +
  "[&_em]:italic [&_i]:italic " +
  "[&_a]:font-medium [&_a]:text-primary [&_a]:underline-offset-2 hover:[&_a]:underline " +
  "[&_img]:mt-2 [&_img]:max-h-28 [&_img]:w-full [&_img]:rounded-lg [&_img]:object-cover " +
  "[&_p+p]:mt-1 " +
  "[&_ul]:mt-1 [&_ul]:list-disc [&_ul]:pl-4 " +
  "[&_ol]:mt-1 [&_ol]:list-decimal [&_ol]:pl-4 " +
  "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.85em]"

interface NotificationItemProps {
  readonly notification: AppNotification
  readonly unread: boolean
  readonly onActivate: (id: string) => void
  /** Future: Accept / Deny / custom actions under the body */
  readonly actions?: ReactNode
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false
  return Boolean(
    target.closest(
      "a, button, [role='button'], input, select, textarea, label"
    )
  )
}

export function NotificationItem({
  notification,
  unread,
  onActivate,
  actions,
}: NotificationItemProps) {
  const { t } = useTranslation("common")
  const navigate = useNavigate()
  const Icon = KIND_ICON[notification.kind]
  const titleHtml = t(`notifications.items.${notification.itemKey}.title`)
  const bodyHtml = t(`notifications.items.${notification.itemKey}.body`)
  const time = formatRelativeTime(notification.createdAt)

  function activate() {
    onActivate(notification.id)
    if (notification.href) {
      navigate(notification.href)
    }
  }

  function handleClick(event: MouseEvent<HTMLDivElement>) {
    // Nested links/buttons (accept/deny later) own the click
    if (isInteractiveTarget(event.target)) return
    activate()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Enter" && event.key !== " ") return
    if (isInteractiveTarget(event.target)) return
    event.preventDefault()
    activate()
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        "group flex w-full cursor-pointer gap-3 rounded-lg px-2.5 py-2.5 text-left transition-colors",
        "hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        unread && "bg-primary/[0.04]"
      )}
    >
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ring-foreground/10",
          KIND_WELL[notification.kind]
        )}
      >
        <Icon className="size-4" aria-hidden />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div
            className={cn(
              "text-sm leading-snug text-foreground",
              HTML_PROSE,
              unread ? "font-semibold" : "font-medium"
            )}
            dangerouslySetInnerHTML={{ __html: titleHtml }}
          />
          <span className="shrink-0 pt-0.5 text-2xs tabular-nums text-muted-foreground">
            {time}
          </span>
        </div>
        <div
          className={cn(
            "mt-0.5 text-xs leading-relaxed text-muted-foreground",
            HTML_PROSE
          )}
          dangerouslySetInnerHTML={{ __html: bodyHtml }}
        />
        {actions ? (
          <div
            className="mt-2 flex flex-wrap items-center gap-1.5"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            {actions}
          </div>
        ) : null}
      </div>
    </div>
  )
}
